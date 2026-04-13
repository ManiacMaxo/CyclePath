package api

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/ManiacMaxo/cyclepath/internal/service"
	"github.com/rs/zerolog/hlog"
)

// signIn godoc
// @Summary Sign in
// @Description Authenticates a user and returns an access token.
// @Tags auth
// @Accept json
// @Produce json
// @Param request body AuthSignInRequest true "Sign-in payload"
// @Success 201 {object} AuthTokenResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 501 {object} ErrorResponse
// @Router /api/auth/sign-in [post]
func (s *Server) signIn(w http.ResponseWriter, r *http.Request) {
	log := hlog.FromRequest(r)

	var req AuthSignInRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Warn().Err(err).Msg("failed to decode sign-in request")
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}

	accessToken, refreshToken, err := s.authSvc.SignIn(r.Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			log.Warn().Str("email", req.Email).Msg("invalid credentials")
			writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid credentials")
			return
		}

		log.Error().Err(err).Msg("sign-in failed")
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh-token",
		Value:    refreshToken,
		Path:     "/api/auth/refresh-token",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	})

	writeJSON(w, http.StatusCreated, AuthTokenResponse{Token: accessToken})
}

// signUp godoc
// @Summary Sign up
// @Description Creates a new user account and returns an access token.
// @Tags auth
// @Accept json
// @Produce json
// @Param request body AuthSignUpRequest true "Sign-up payload"
// @Success 201 {object} AuthTokenResponse
// @Failure 400 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 501 {object} ErrorResponse
// @Router /api/auth/sign-up [post]
func (s *Server) signUp(w http.ResponseWriter, r *http.Request) {
	log := hlog.FromRequest(r)

	var req AuthSignUpRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Warn().Err(err).Msg("failed to decode sign-up request")
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}

	accessToken, refreshToken, err := s.authSvc.SignUp(r.Context(), req.Name, req.Email, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrEmailAlreadyExists) {
			log.Warn().Str("email", req.Email).Msg("email already exists")
			writeError(w, http.StatusConflict, "CONFLICT", "email already exists")
			return
		}

		log.Error().Err(err).Msg("sign-up failed")
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh-token",
		Value:    refreshToken,
		Path:     "/api/auth/refresh-token",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	})

	writeJSON(w, http.StatusCreated, AuthTokenResponse{Token: accessToken})
}

// refreshToken godoc
// @Summary Refresh access token
// @Description Issues a new access token using refresh token authentication.
// @Tags auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 201 {object} AuthTokenResponse
// @Failure 401 {object} ErrorResponse
// @Failure 501 {object} ErrorResponse
// @Router /api/auth/refresh-token [post]
func (s *Server) refreshToken(w http.ResponseWriter, r *http.Request) {
	log := hlog.FromRequest(r)

	cookie, err := r.Cookie("refresh-token")
	if err != nil {
		log.Warn().Msg("missing refresh token cookie")
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "missing refresh token")
		return
	}

	accessToken, err := s.authSvc.RefreshToken(r.Context(), cookie.Value)
	if err != nil {
		if errors.Is(err, service.ErrInvalidToken) || errors.Is(err, service.ErrUserNotFound) {
			log.Warn().Msg("invalid or expired refresh token")
			writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid or expired refresh token")
			return
		}

		log.Error().Err(err).Msg("refresh token failed")
		writeError(w, http.StatusBadRequest, "BAD_REQUEST", err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, AuthTokenResponse{Token: accessToken})
}
