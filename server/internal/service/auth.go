package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/ManiacMaxo/cyclepath/internal/ent"
	"github.com/ManiacMaxo/cyclepath/internal/ent/user"
	"github.com/lestrrat-go/jwx/v3/jwa"
	"github.com/lestrrat-go/jwx/v3/jwt"
	"golang.org/x/crypto/bcrypt"
)

const (
	accessTokenTTL  = 15 * time.Minute
	refreshTokenTTL = 7 * 24 * time.Hour
	bcryptCost      = 12
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrEmailAlreadyExists = errors.New("email already exists")
	ErrUserNotFound       = errors.New("user not found")
	ErrInvalidToken       = errors.New("invalid or expired token")
)

type AuthService struct {
	client        *ent.Client
	accessSecret  []byte
	refreshSecret []byte
}

func NewAuth(client *ent.Client, accessSecret, refreshSecret []byte) *AuthService {
	return &AuthService{
		client:        client,
		accessSecret:  accessSecret,
		refreshSecret: refreshSecret,
	}
}

func (s *AuthService) SignUp(ctx context.Context, name, email, password string) (accessToken, refreshToken string, err error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	if err != nil {
		return "", "", fmt.Errorf("hash password: %w", err)
	}

	createdUser, err := s.client.User.Create().
		SetName(name).
		SetEmail(email).
		SetPassword(string(hashedPassword)).
		Save(ctx)
	if err != nil {
		if ent.IsConstraintError(err) {
			return "", "", ErrEmailAlreadyExists
		}

		return "", "", fmt.Errorf("create user: %w", err)
	}

	access, err := s.generateAccessToken(createdUser.ID)
	if err != nil {
		return "", "", err
	}

	refresh, err := s.GenerateRefreshToken(createdUser.ID)
	if err != nil {
		return "", "", err
	}

	return access, refresh, nil
}

func (s *AuthService) SignIn(ctx context.Context, email, password string) (accessToken, refreshToken string, err error) {
	existingUser, err := s.client.User.Query().Where(user.Email(email)).Only(ctx)
	if err != nil {
		if ent.IsNotFound(err) {
			return "", "", ErrInvalidCredentials
		}

		return "", "", fmt.Errorf("find user by email: %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(existingUser.Password), []byte(password)); err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return "", "", ErrInvalidCredentials
		}

		return "", "", fmt.Errorf("compare password: %w", err)
	}

	access, err := s.generateAccessToken(existingUser.ID)
	if err != nil {
		return "", "", err
	}

	refresh, err := s.GenerateRefreshToken(existingUser.ID)
	if err != nil {
		return "", "", err
	}

	return access, refresh, nil
}

func (s *AuthService) GenerateRefreshToken(userID int) (string, error) {
	token, err := jwt.NewBuilder().
		Claim("id", userID).
		Expiration(time.Now().Add(refreshTokenTTL)).
		Build()
	if err != nil {
		return "", fmt.Errorf("build refresh token: %w", err)
	}

	signedToken, err := jwt.Sign(token, jwt.WithKey(jwa.HS256(), s.refreshSecret))
	if err != nil {
		return "", fmt.Errorf("sign refresh token: %w", err)
	}

	return string(signedToken), nil
}

func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (newAccessToken string, err error) {
	userID, err := s.parseRefreshToken(refreshToken)
	if err != nil {
		return "", err
	}

	_, err = s.client.User.Get(ctx, userID)
	if err != nil {
		if ent.IsNotFound(err) {
			return "", ErrUserNotFound
		}

		return "", fmt.Errorf("get user by id: %w", err)
	}

	return s.generateAccessToken(userID)
}

func (s *AuthService) generateAccessToken(userID int) (string, error) {
	token, err := jwt.NewBuilder().
		Claim("id", userID).
		Expiration(time.Now().Add(accessTokenTTL)).
		Build()
	if err != nil {
		return "", fmt.Errorf("build access token: %w", err)
	}

	signedToken, err := jwt.Sign(token, jwt.WithKey(jwa.HS256(), s.accessSecret))
	if err != nil {
		return "", fmt.Errorf("sign access token: %w", err)
	}

	return string(signedToken), nil
}

func (s *AuthService) parseRefreshToken(token string) (int, error) {
	parsedToken, err := jwt.Parse([]byte(token), jwt.WithKey(jwa.HS256(), s.refreshSecret), jwt.WithValidate(true))
	if err != nil {
		return 0, ErrInvalidToken
	}

	var userID int
	if err := parsedToken.Get("id", &userID); err != nil {
		return 0, ErrInvalidToken
	}

	expiresAt, ok := parsedToken.Expiration()
	if !ok || expiresAt.IsZero() || time.Until(expiresAt) > refreshTokenTTL {
		return 0, ErrInvalidToken
	}

	return userID, nil
}
