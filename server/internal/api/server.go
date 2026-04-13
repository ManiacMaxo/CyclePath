package api

import (
	"context"
	"net/http"
	"os"
	"time"

	"github.com/ManiacMaxo/cyclepath/docs"
	"github.com/ManiacMaxo/cyclepath/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/hlog"
)

type GraphService interface {
	FindNearestNode(ctx context.Context, lat, lng float64) (uint64, error)
	ShortestPath(ctx context.Context, start, end uint64, criteria string) ([]service.Segment, error)
}

type AuthService interface {
	SignUp(ctx context.Context, name, email, password string) (accessToken, refreshToken string, err error)
	SignIn(ctx context.Context, email, password string) (accessToken, refreshToken string, err error)
	RefreshToken(ctx context.Context, refreshToken string) (string, error)
	GenerateRefreshToken(userID int) (string, error)
}

type SearchService interface {
	SearchPlaces(ctx context.Context, query, location, locale string) ([]service.Location, error)
}

type PollutionService interface {
	AirPollution(ctx context.Context, reqs []service.PollutionRequest) ([]service.PollutionResponse, error)
}

type RatingService interface {
	RateRoute(ctx context.Context, nodeOneID, nodeTwoID, userID int64, rating float64) error
}

type Server struct {
	router       *chi.Mux
	gs           GraphService
	authSvc      AuthService
	searchSvc    SearchService
	pollutionSvc PollutionService
	ratingSvc    RatingService
}

// @title           CyclePath API
// @version         1.0
// @description     This is a sample server celler server.
func New(bind string, gs GraphService, authSvc AuthService, searchSvc SearchService, pollutionSvc PollutionService, ratingSvc RatingService, accessSecret []byte) http.Server {
	s := &Server{
		router:       chi.NewRouter(),
		gs:           gs,
		authSvc:      authSvc,
		searchSvc:    searchSvc,
		pollutionSvc: pollutionSvc,
		ratingSvc:    ratingSvc,
	}

	InitAuth(accessSecret)
	s.setup()

	return http.Server{
		Addr:    bind,
		Handler: s.router,
	}
}

func (s *Server) setup() {
	logger := zerolog.New(zerolog.ConsoleWriter{Out: os.Stderr}).With().Timestamp().Logger()

	s.router.Use(middleware.RequestID)
	s.router.Use(middleware.RealIP)
	s.router.Use(hlog.NewHandler(logger))
	s.router.Use(hlog.RequestIDHandler("req_id", "Request-Id"))
	s.router.Use(hlog.RemoteAddrHandler("ip"))
	s.router.Use(hlog.UserAgentHandler("user_agent"))
	s.router.Use(hlog.RefererHandler("referer"))
	s.router.Use(hlog.AccessHandler(func(r *http.Request, status, size int, duration time.Duration) {
		c := chi.RouteContext(r.Context())

		hlog.FromRequest(r).Info().
			Str("method", r.Method).
			Str("url", r.URL.String()).
			Str("route", c.RoutePattern()).
			Int("status", status).
			Int("size", size).
			Dur("duration", duration).
			Msg("request")
	}))
	s.router.Use(middleware.Recoverer)

	s.router.Get("/live", s.live)
	s.router.Get("/ready", s.ready)

	s.router.Route("/api", func(r chi.Router) {
		r.Get("/docs", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "text/html")
			w.Write([]byte(SCALAR_HTML))
		})

		r.Get("/docs.json", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Write(docs.SwaggerJSON)
		})

		r.Post("/auth/sign-in", s.signIn)
		r.Post("/auth/sign-up", s.signUp)
		r.Post("/auth/refresh-token", s.refreshToken)

		r.Group(func(r chi.Router) {
			r.Use(s.authMiddleware)

			r.Get("/search", s.search)

			r.Get("/routes", s.getRoutes)
			r.Post("/routes/rate", s.rateRoute)
			r.Post("/routes/air-pollution", s.airPollution)
		})
	})
}

func (s *Server) live(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}

func (s *Server) ready(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}

const SCALAR_HTML = `<!doctype html>
<html>
  <head>
    <title>API Reference</title>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
    <script>
      Scalar.createApiReference('#app', {
        url: '/api/docs.json',
      })
    </script>
  </body>
</html>`
