package api

import (
	"context"
	"net/http"

	"github.com/go-chi/jwtauth/v5"
	"github.com/rs/zerolog/hlog"
)

type contextKey string

const userIDKey contextKey = "userID"

var tokenAuth = jwtauth.New("HS256", nil, nil)

func InitAuth(secret []byte) {
	tokenAuth = jwtauth.New("HS256", secret, nil)
}

func (s *Server) authMiddleware(next http.Handler) http.Handler {
	verifier := jwtauth.Verifier(tokenAuth)
	authenticator := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log := hlog.FromRequest(r)

		token, claims, err := jwtauth.FromContext(r.Context())
		if err != nil || token == nil {
			log.Warn().Msg("unauthorized: invalid or missing token")
			writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid or missing token")
			return
		}

		id, ok := claims["id"].(float64)
		if !ok {
			log.Warn().Msg("unauthorized: missing user id in token claims")
			writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid or missing token")
			return
		}

		ctx := context.WithValue(r.Context(), userIDKey, int64(id))
		next.ServeHTTP(w, r.WithContext(ctx))
	})

	return verifier(authenticator)
}

func userIDFromContext(ctx context.Context) (int64, bool) {
	userID, ok := ctx.Value(userIDKey).(int64)
	if !ok {
		return 0, false
	}

	return userID, true
}
