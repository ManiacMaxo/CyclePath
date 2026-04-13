package config

import (
	"fmt"

	"github.com/caarlos0/env/v11"
)

type Config struct {
	Bind          string `env:"BIND" envDefault:":8080"`
	Neo4jURI      string `env:"NEO4J_URI" envDefault:"bolt://localhost:7687"`
	AccessSecret  string `env:"ACCESS_TOKEN_SECRET"`
	RefreshSecret string `env:"REFRESH_TOKEN_SECRET"`
	MapsKey       string `env:"MAPS_KEY"`
	AirQualityKey string `env:"AIR_QUALITY_KEY"`
	DatabaseURL   string `env:"DATABASE_URL" envDefault:"postgres://cyclepath:super_strong_password@localhost:5432/cyclepath?sslmode=disable"`
}

func Load() (*Config, error) {
	cfg := &Config{}

	if err := env.Parse(cfg); err != nil {
		return nil, fmt.Errorf("failed to parse env vars: %w", err)
	}

	if cfg.AccessSecret == "" {
		return nil, fmt.Errorf("ACCESS_TOKEN_SECRET env var is required")
	}
	if cfg.RefreshSecret == "" {
		return nil, fmt.Errorf("REFRESH_TOKEN_SECRET env var is required")
	}

	return cfg, nil
}
