package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/ManiacMaxo/cyclepath/internal/ent"
	"github.com/ManiacMaxo/cyclepath/internal/ent/routerating"
	"github.com/neo4j/neo4j-go-driver/v6/neo4j"
)

var (
	ErrRouteNotFound = errors.New("route not found")
)

type RatingService struct {
	db     neo4j.Driver
	client *ent.Client
}

func NewRating(db neo4j.Driver, client *ent.Client) *RatingService {
	return &RatingService{db: db, client: client}
}

const findRouteQuery = `MATCH (node1: Node{node_id: $nodeOneID})-[route: Route]-(node2: Node{node_id: $nodeTwoID})
RETURN id(route) AS routeID LIMIT 1`

const updateRouteRatingQuery = `MATCH (:Node)-[route: Route]-(:Node)
WHERE id(route) = $routeID
SET route.rating = $rating, route.cost = $rating * route.distance`

func (s *RatingService) RateRoute(ctx context.Context, nodeOneID, nodeTwoID, userID int64, rating float64) error {
	sess := s.db.NewSession(ctx, neo4j.SessionConfig{})
	defer func() { _ = sess.Close(ctx) }()

	result, err := sess.Run(ctx, findRouteQuery, map[string]any{
		"nodeOneID": nodeOneID,
		"nodeTwoID": nodeTwoID,
	})
	if err != nil {
		return fmt.Errorf("failed to find route: %w", err)
	}

	records, err := result.Collect(ctx)
	if err != nil {
		return fmt.Errorf("failed to collect route: %w", err)
	}
	if len(records) == 0 {
		return ErrRouteNotFound
	}

	routeValue, ok := records[0].Get("routeID")
	if !ok {
		return fmt.Errorf("route query did not return routeID")
	}

	routeID, ok := routeValue.(int64)
	if !ok {
		return fmt.Errorf("unexpected routeID type %T", routeValue)
	}

	if _, err := s.client.RouteRating.Create().
		SetNodeOneID(nodeOneID).
		SetNodeTwoID(nodeTwoID).
		SetUserID(int(userID)).
		SetRating(rating).
		Save(ctx); err != nil {
		return fmt.Errorf("failed to save route rating: %w", err)
	}

	avgRating, err := s.GetAvgRating(ctx, nodeOneID, nodeTwoID)
	if err != nil {
		return fmt.Errorf("failed to calculate average rating: %w", err)
	}
	if avgRating == 0 {
		avgRating = rating
	}

	if _, err := sess.Run(ctx, updateRouteRatingQuery, map[string]any{
		"routeID": routeID,
		"rating":  avgRating,
	}); err != nil {
		return fmt.Errorf("failed to update route rating: %w", err)
	}

	return nil
}

func (s *RatingService) GetAvgRating(ctx context.Context, nodeOneID, nodeTwoID int64) (float64, error) {
	ratings, err := s.client.RouteRating.Query().
		Where(
			routerating.Or(
				routerating.And(
					routerating.NodeOneID(nodeOneID),
					routerating.NodeTwoID(nodeTwoID),
				),
				routerating.And(
					routerating.NodeOneID(nodeTwoID),
					routerating.NodeTwoID(nodeOneID),
				),
			),
		).
		All(ctx)
	if err != nil {
		return 0, fmt.Errorf("failed to query route ratings: %w", err)
	}
	if len(ratings) == 0 {
		return 0, nil
	}

	var sum float64
	for _, routeRating := range ratings {
		sum += routeRating.Rating
	}

	return sum / float64(len(ratings)), nil
}
