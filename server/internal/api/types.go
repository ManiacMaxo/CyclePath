package api

type ErrorResponse struct {
	StatusCode int    `json:"statusCode"`
	Message    string `json:"message"`
	Error      string `json:"error,omitempty"`
}

type AuthSignUpRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthSignInRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthTokenResponse struct {
	Token string `json:"token"`
}

type AuthRefreshTokenCookie struct {
	RefreshToken string `json:"refresh-token"`
}

type AuthJWTClaims struct {
	ID int64 `json:"id"`
}

type SearchQueryRequest struct {
	Query    string `query:"query"`
	Location string `query:"location"`
	Locale   string `query:"locale"`
}

type SearchLocation struct {
	Lat     float64 `json:"lat"`
	Lng     float64 `json:"lng"`
	Name    string  `json:"name"`
	Address string  `json:"address"`
}

type RoutesGetQueryRequest struct {
	StartNodeLat  float64 `query:"startNodeLat"`
	StartNodeLong float64 `query:"startNodeLong"`
	EndNodeLat    float64 `query:"endNodeLat"`
	EndNodeLong   float64 `query:"endNodeLong"`
}

type RouteNode struct {
	ID   uint64  `json:"id"`
	Lat  float64 `json:"lat"`
	Long float64 `json:"long"`
}

type RouteSegment struct {
	Start  RouteNode `json:"start"`
	End    RouteNode `json:"end"`
	Cost   float32   `json:"cost"`
	Rating float32   `json:"rating"`
}

type RoutesGetResponse struct {
	Best     []RouteSegment `json:"best"`
	Shortest []RouteSegment `json:"shortest"`
}

type RoutesRateRequest struct {
	NodeOneID int64   `json:"nodeOneId"`
	NodeTwoID int64   `json:"nodeTwoId"`
	Rating    float64 `json:"rating"`
}

type AirPollutionRequest struct {
	StartLat float64 `json:"startLat"`
	StartLon float64 `json:"startLon"`
	EndLat   float64 `json:"endLat"`
	EndLon   float64 `json:"endLon"`
}

type AirPollutionResponse struct {
	MeasurementTime string  `json:"measurementTime"`
	PollutionIndex  float64 `json:"pollutionIndex"`
}

type DebugGraphNode struct {
	ID   uint64  `json:"id"`
	Lat  float64 `json:"lat"`
	Long float64 `json:"long"`
}

type DebugGraphEdge struct {
	StartNodeID uint64  `json:"start_node_id"`
	EndNodeID   uint64  `json:"end_node_id"`
	Rating      float32 `json:"rating"`
}

type DebugGraphResponse struct {
	Nodes []DebugGraphNode `json:"nodes"`
	Edges []DebugGraphEdge `json:"edges"`
}
