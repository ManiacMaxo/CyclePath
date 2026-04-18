package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/ManiacMaxo/cyclepath/internal/service"
	"github.com/rs/zerolog/hlog"
)

// search godoc
// @Summary Search places
// @Description Searches for nearby places based on a text query and a location point.
// @Tags search
// @Produce json
// @Security BearerAuth
// @Param query query string true "Search text"
// @Param location query string true "Location as 'lat,lng'"
// @Param locale query string false "Locale/language code"
// @Success 200 {array} SearchLocation
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 501 {object} ErrorResponse
// @Router /api/search [get]
func (s *Server) search(w http.ResponseWriter, r *http.Request) {
	log := hlog.FromRequest(r)

	query := r.URL.Query().Get("query")
	location := r.URL.Query().Get("location")
	locale := r.URL.Query().Get("locale")

	if query == "" || location == "" {
		log.Warn().Msg("missing query or location params")
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", "query and location are required")
		return
	}

	locations, err := s.searchSvc.SearchPlaces(r.Context(), query, location, locale)
	if err != nil {
		log.Error().Err(err).Str("query", query).Msg("search places failed")
		writeError(w, http.StatusBadGateway, "BAD_GATEWAY", err.Error())
		return
	}

	resp := make([]SearchLocation, len(locations))
	for i, location := range locations {
		resp[i] = SearchLocation{
			Lat:     location.Lat,
			Lng:     location.Lng,
			Name:    location.Name,
			Address: location.Address,
		}
	}

	writeJSON(w, http.StatusOK, resp)
}

// getRoutes godoc
// @Summary Get route options
// @Description Returns route segments for recommended and shortest paths between two points.
// @Tags routes
// @Produce json
// @Security BearerAuth
// @Param startNodeLat query number true "Start latitude"
// @Param startNodeLong query number true "Start longitude"
// @Param endNodeLat query number true "End latitude"
// @Param endNodeLong query number true "End longitude"
// @Success 200 {object} RoutesGetResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 501 {object} ErrorResponse
// @Router /api/routes [get]
func (s *Server) getRoutes(w http.ResponseWriter, r *http.Request) {
	log := hlog.FromRequest(r)

	q := r.URL.Query()
	startLat, _ := strconv.ParseFloat(q.Get("startNodeLat"), 64)
	startNodeLong, _ := strconv.ParseFloat(q.Get("startNodeLong"), 64)
	endNodeLat, _ := strconv.ParseFloat(q.Get("endNodeLat"), 64)
	endNodeLong, _ := strconv.ParseFloat(q.Get("endNodeLong"), 64)

	start, err := s.gs.FindNearestNode(r.Context(), startLat, startNodeLong)
	if err != nil {
		log.Error().Err(err).Float64("lat", startLat).Float64("lng", startNodeLong).Msg("failed to find nearest start node")
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to find nearest node for start location")
		return
	}
	end, err := s.gs.FindNearestNode(r.Context(), endNodeLat, endNodeLong)
	if err != nil {
		log.Error().Err(err).Float64("lat", endNodeLat).Float64("lng", endNodeLong).Msg("failed to find nearest end node")
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to find nearest node for end location")
		return
	}

	shortest, err := s.gs.ShortestPath(r.Context(), start, end, "distance")
	if err != nil {
		log.Error().Err(err).Uint64("start", start).Uint64("end", end).Msg("failed to calculate shortest path")
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to calculate shortest path")
		return
	}
	best, err := s.gs.ShortestPath(r.Context(), start, end, "cost")
	if err != nil {
		log.Error().Err(err).Uint64("start", start).Uint64("end", end).Msg("failed to calculate best path")
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to calculate best path")
		return
	}

	resp := RoutesGetResponse{
		Best:     convertPath(best),
		Shortest: convertPath(shortest),
	}

	writeJSON(w, http.StatusOK, resp)
}

func (s *Server) debugGraph(w http.ResponseWriter, r *http.Request) {
	log := hlog.FromRequest(r)

	q := r.URL.Query()
	minLat, _ := strconv.ParseFloat(q.Get("minLat"), 64)
	maxLat, _ := strconv.ParseFloat(q.Get("maxLat"), 64)
	minLng, _ := strconv.ParseFloat(q.Get("minLng"), 64)
	maxLng, _ := strconv.ParseFloat(q.Get("maxLng"), 64)

	if minLat == 0 && maxLat == 0 && minLng == 0 && maxLng == 0 {
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", "bounding box params required: minLat, maxLat, minLng, maxLng")
		return
	}

	nodes, edges, err := s.gs.GetAllNodesEdges(r.Context(), minLat, maxLat, minLng, maxLng)
	if err != nil {
		log.Error().Err(err).Msg("failed to fetch debug graph")
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to fetch debug graph")
		return
	}

	respNodes := make([]DebugGraphNode, len(nodes))
	for i, node := range nodes {
		respNodes[i] = DebugGraphNode{
			ID:   node.NodeID,
			Lat:  node.Lat,
			Long: node.Lng,
		}
	}

	respEdges := make([]DebugGraphEdge, len(edges))
	for i, edge := range edges {
		respEdges[i] = DebugGraphEdge{
			StartNodeID: edge.StartNodeID,
			EndNodeID:   edge.EndNodeID,
			Rating:      edge.Rating,
		}
	}

	writeJSON(w, http.StatusOK, DebugGraphResponse{
		Nodes: respNodes,
		Edges: respEdges,
	})
}

func convertPath(path []service.Segment) []RouteSegment {
	segments := make([]RouteSegment, len(path))
	for i, s := range path {
		segments[i] = RouteSegment{
			Start: RouteNode{
				ID:   s.Start.NodeID,
				Lat:  s.Start.Lat,
				Long: s.Start.Lng,
			},
			End: RouteNode{
				ID:   s.End.NodeID,
				Lat:  s.End.Lat,
				Long: s.End.Lng,
			},
			Cost:   s.Cost,
			Rating: s.Rating,
		}
	}

	return segments
}

// rateRoute godoc
// @Summary Rate route segment
// @Description Submits a user rating for a route segment.
// @Tags routes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body RoutesRateRequest true "Route rating payload"
// @Success 204 "No Content"
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 501 {object} ErrorResponse
// @Router /api/routes/rate [post]
func (s *Server) rateRoute(w http.ResponseWriter, r *http.Request) {
	log := hlog.FromRequest(r)

	var req RoutesRateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Warn().Err(err).Msg("failed to decode rate request")
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}

	userID, ok := userIDFromContext(r.Context())
	if !ok {
		log.Warn().Msg("unauthorized rate attempt")
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized")
		return
	}

	if err := s.ratingSvc.RateRoute(r.Context(), req.NodeOneID, req.NodeTwoID, userID, req.Rating); err != nil {
		if errors.Is(err, service.ErrRouteNotFound) {
			log.Warn().Int64("nodeOne", req.NodeOneID).Int64("nodeTwo", req.NodeTwoID).Msg("route not found for rating")
			writeError(w, http.StatusNotFound, "NOT_FOUND", "route not found")
			return
		}

		log.Error().Err(err).Int64("nodeOne", req.NodeOneID).Int64("nodeTwo", req.NodeTwoID).Msg("rate route failed")
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// airPollution godoc
// @Summary Get air pollution metrics
// @Description Returns pollution index data for a list of route segments.
// @Tags routes
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body []AirPollutionRequest true "Air pollution request payload"
// @Success 200 {array} AirPollutionResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 501 {object} ErrorResponse
// @Router /api/routes/air-pollution [post]
func (s *Server) airPollution(w http.ResponseWriter, r *http.Request) {
	log := hlog.FromRequest(r)

	var reqs []service.PollutionRequest
	if err := json.NewDecoder(r.Body).Decode(&reqs); err != nil {
		log.Warn().Err(err).Msg("failed to decode air pollution request")
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}

	responses, err := s.pollutionSvc.AirPollution(r.Context(), reqs)
	if err != nil {
		log.Error().Err(err).Int("segments", len(reqs)).Msg("air pollution lookup failed")
		writeError(w, http.StatusBadGateway, "BAD_GATEWAY", err.Error())
		return
	}

	resp := make([]AirPollutionResponse, len(responses))
	for i, response := range responses {
		resp[i] = AirPollutionResponse{
			MeasurementTime: response.MeasurementTime,
			PollutionIndex:  response.PollutionIndex,
		}
	}

	writeJSON(w, http.StatusOK, resp)
}
