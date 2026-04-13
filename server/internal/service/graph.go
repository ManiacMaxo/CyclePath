package service

import (
	"context"
	"fmt"
	"math"

	"github.com/neo4j/neo4j-go-driver/v6/neo4j"
)

type GraphService struct {
	db neo4j.Driver
}

func NewGraph(db neo4j.Driver) *GraphService {
	return &GraphService{db: db}
}

const SHORTEST_PATH_QUERY = `MATCH
    (startNode:Node {node_id: $startNodeId}),
    (endNode:Node {node_id: $endNodeId})
CALL gds.shortestPath.dijkstra.stream('nodesGraph', {
    sourceNode: startNode,
    targetNode: endNode,
    relationshipWeightProperty: $criteria
})
YIELD nodeIds, costs, path
WITH nodeIds, costs, nodes(path) AS pathNodes
UNWIND range(0, size(nodeIds) - 2) AS i
OPTIONAL MATCH (a:Node {node_id: nodeIds[i]})-[r:Route]->(b:Node {node_id: nodeIds[i + 1]})
WITH i, nodeIds, costs, pathNodes, coalesce(avg(r.rating), 4.0) AS rating
RETURN
    nodeIds[i] AS startNodeId,
    pathNodes[i].location AS startLocation,
    nodeIds[i + 1] AS endNodeId,
    pathNodes[i + 1].location AS endLocation,
    toFloat(costs[i + 1] - costs[i]) AS cost,
    rating AS rating
ORDER BY i`

const FIND_NEAREST_NODE_QUERY = `MATCH (n:Node)
WHERE
    n.location IS NOT NULL
    AND point.withinBBox(
        n.location,
        point({latitude: $minLat, longitude: $minLng}),
        point({latitude: $maxLat, longitude: $maxLng})
    )
WITH
    n,
    point.distance(
        n.location,
        point({latitude: $lat, longitude: $lng})
    ) AS dist
RETURN n.node_id AS nodeId
ORDER BY dist ASC
LIMIT 1`

var nearestNodeSearchRadiiMeters = [...]float64{50, 100, 250, 500, 1000, 2000}

const metersPerDegreeLat = 111_320.0

type Node struct {
	Lat    float64 `json:"lat"`
	Lng    float64 `json:"lng"`
	NodeID uint64  `json:"id"`
}

type Segment struct {
	Start  Node    `json:"start"`
	End    Node    `json:"end"`
	Cost   float32 `json:"cost"`
	Rating float32 `json:"rating"`
}

func (gs *GraphService) ShortestPath(ctx context.Context, start, end uint64, criteria string) ([]Segment, error) {
	sess := gs.db.NewSession(ctx, neo4j.SessionConfig{})
	defer func() { _ = sess.Close(ctx) }()

	result, err := sess.Run(ctx, SHORTEST_PATH_QUERY, map[string]any{
		"startNodeId": start,
		"endNodeId":   end,
		"criteria":    criteria,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %w", err)
	}

	records, err := result.Collect(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to collect results: %w", err)
	}

	data := make([]Segment, 0, len(records))

	for _, rec := range records {
		segment, err := pathSegmentFromRecord(rec)
		if err != nil {
			return nil, fmt.Errorf("failed to parse path segment: %w", err)
		}

		data = append(data, *segment)
	}

	return data, nil
}

func pathSegmentFromRecord(rec *neo4j.Record) (*Segment, error) {
	startNodeIDRaw, ok := rec.Get("startNodeId")
	if !ok {
		return nil, fmt.Errorf("shortest path query did not return startNodeId")
	}
	startLocationRaw, ok := rec.Get("startLocation")
	if !ok {
		return nil, fmt.Errorf("shortest path query did not return startLocation")
	}
	endNodeIDRaw, ok := rec.Get("endNodeId")
	if !ok {
		return nil, fmt.Errorf("shortest path query did not return endNodeId")
	}
	endLocationRaw, ok := rec.Get("endLocation")
	if !ok {
		return nil, fmt.Errorf("shortest path query did not return endLocation")
	}
	costRaw, ok := rec.Get("cost")
	if !ok {
		return nil, fmt.Errorf("shortest path query did not return cost")
	}
	ratingRaw, ok := rec.Get("rating")
	if !ok {
		return nil, fmt.Errorf("shortest path query did not return rating")
	}

	startNodeID, err := toUint64(startNodeIDRaw)
	if err != nil {
		return nil, fmt.Errorf("invalid startNodeId: %w", err)
	}
	startLat, startLng, err := pointToLatLng(startLocationRaw)
	if err != nil {
		return nil, fmt.Errorf("invalid startLocation: %w", err)
	}

	endNodeID, err := toUint64(endNodeIDRaw)
	if err != nil {
		return nil, fmt.Errorf("invalid endNodeId: %w", err)
	}
	endLat, endLng, err := pointToLatLng(endLocationRaw)
	if err != nil {
		return nil, fmt.Errorf("invalid endLocation: %w", err)
	}

	cost, err := toFloat32(costRaw)
	if err != nil {
		return nil, fmt.Errorf("invalid cost: %w", err)
	}
	rating, err := toFloat32(ratingRaw)
	if err != nil {
		return nil, fmt.Errorf("invalid rating: %w", err)
	}

	return &Segment{
		Start:  Node{Lat: startLat, Lng: startLng, NodeID: startNodeID},
		End:    Node{Lat: endLat, Lng: endLng, NodeID: endNodeID},
		Cost:   cost,
		Rating: rating,
	}, nil
}

func pointToLatLng(value any) (lat, lng float64, err error) {
	switch p := value.(type) {
	case neo4j.Point2D:
		return p.Y, p.X, nil
	case neo4j.Point3D:
		return p.Y, p.X, nil
	default:
		return 0, 0, fmt.Errorf("unexpected point type %T", value)
	}
}

func toFloat32(value any) (float32, error) {
	switch v := value.(type) {
	case float32:
		return v, nil
	case float64:
		return float32(v), nil
	case int64:
		return float32(v), nil
	case int:
		return float32(v), nil
	case uint64:
		return float32(v), nil
	case uint:
		return float32(v), nil
	default:
		return 0, fmt.Errorf("unexpected numeric type %T", value)
	}
}

func toUint64(value any) (uint64, error) {
	switch v := value.(type) {
	case uint64:
		return v, nil
	case uint:
		return uint64(v), nil
	case int64:
		if v < 0 {
			return 0, fmt.Errorf("value cannot be negative: %d", v)
		}
		return uint64(v), nil
	case int:
		if v < 0 {
			return 0, fmt.Errorf("value cannot be negative: %d", v)
		}
		return uint64(v), nil
	default:
		return 0, fmt.Errorf("unexpected id type %T", value)
	}
}

func (gs *GraphService) FindNearestNode(ctx context.Context, lat, lng float64) (uint64, error) {
	sess := gs.db.NewSession(ctx, neo4j.SessionConfig{})
	defer func() { _ = sess.Close(ctx) }()

	for _, radiusMeters := range nearestNodeSearchRadiiMeters {
		minLat, maxLat, minLng, maxLng := calculateBoundingBox(lat, lng, radiusMeters)

		result, err := sess.Run(ctx, FIND_NEAREST_NODE_QUERY, map[string]any{
			"lat":    lat,
			"lng":    lng,
			"minLat": minLat,
			"maxLat": maxLat,
			"minLng": minLng,
			"maxLng": maxLng,
		})
		if err != nil {
			return 0, fmt.Errorf("failed to execute nearest-node query: %w", err)
		}

		records, err := result.Collect(ctx)
		if err != nil {
			return 0, fmt.Errorf("failed to fetch nearest node: %w", err)
		}
		if len(records) == 0 {
			continue
		}

		rawNodeID, ok := records[0].Get("nodeId")
		if !ok {
			return 0, fmt.Errorf("nearest-node query did not return nodeId")
		}

		switch v := rawNodeID.(type) {
		case int64:
			if v < 0 {
				return 0, fmt.Errorf("nodeId cannot be negative: %d", v)
			}
			return uint64(v), nil
		case uint64:
			return v, nil
		default:
			return 0, fmt.Errorf("unexpected nodeId type %T", rawNodeID)
		}
	}

	return 0, fmt.Errorf("no nearby node found within %.0fm", nearestNodeSearchRadiiMeters[len(nearestNodeSearchRadiiMeters)-1])
}

func calculateBoundingBox(lat, lng, radiusMeters float64) (minLat, maxLat, minLng, maxLng float64) {
	latDelta := radiusMeters / metersPerDegreeLat

	cosLat := math.Cos(lat * math.Pi / 180)
	if math.Abs(cosLat) < 1e-12 {
		cosLat = 1e-12
	}
	lngDelta := radiusMeters / (metersPerDegreeLat * math.Abs(cosLat))

	return lat - latDelta, lat + latDelta, lng - lngDelta, lng + lngDelta
}
