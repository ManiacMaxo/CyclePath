package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ManiacMaxo/cyclepath/internal/api"
	"github.com/ManiacMaxo/cyclepath/internal/config"
	"github.com/ManiacMaxo/cyclepath/internal/ent"
	"github.com/ManiacMaxo/cyclepath/internal/service"
	_ "github.com/lib/pq"
	"github.com/neo4j/neo4j-go-driver/v6/neo4j"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to load config")
	}

	entClient, err := ent.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to open database")
	}
	defer entClient.Close()

	if err := entClient.Schema.Create(ctx); err != nil {
		log.Fatal().Err(err).Msg("failed to create schema")
	}

	neo4jDriver, err := neo4j.NewDriver(cfg.Neo4jURI, neo4j.NoAuth())
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to neo4j")
	}
	defer func() {
		if err := neo4jDriver.Close(context.Background()); err != nil {
			log.Error().Err(err).Msg("failed to close neo4j driver")
		}
	}()

	gs := service.NewGraph(neo4jDriver)
	authSvc := service.NewAuth(entClient, []byte(cfg.AccessSecret), []byte(cfg.RefreshSecret))

	searchSvc, err := service.NewSearch(cfg.MapsKey)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to create search service")
	}
	defer searchSvc.Close()

	pollutionSvc := service.NewPollution(cfg.AirQualityKey)
	ratingSvc := service.NewRating(neo4jDriver, entClient)

	server := api.New(cfg.Bind, gs, authSvc, searchSvc, pollutionSvc, ratingSvc, []byte(cfg.AccessSecret))
	go func() {
		if err := server.ListenAndServe(); err != nil {
			log.Fatal().Err(err).Msg("server failed")
		}
	}()

	log.Info().Str("bind", cfg.Bind).Msg("server started")
	<-ctx.Done()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	server.Shutdown(shutdownCtx)
}
