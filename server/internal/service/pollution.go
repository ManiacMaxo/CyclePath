package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"golang.org/x/sync/errgroup"
)

type PollutionService struct {
	apiKey string
	client *http.Client
}

type PollutionRequest struct {
	StartLat float64 `json:"startLat"`
	StartLon float64 `json:"startLon"`
	EndLat   float64 `json:"endLat"`
	EndLon   float64 `json:"endLon"`
}

type PollutionResponse struct {
	MeasurementTime string  `json:"measurementTime"`
	PollutionIndex  float64 `json:"pollutionIndex"`
}

type pollutionSample struct {
	measurementTime string
	pm10            float64
}

func NewPollution(apiKey string) *PollutionService {
	return &PollutionService{
		apiKey: apiKey,
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

func (ps *PollutionService) AirPollution(ctx context.Context, reqs []PollutionRequest) ([]PollutionResponse, error) {
	results := make([]*PollutionResponse, len(reqs))
	group, groupCtx := errgroup.WithContext(ctx)

	for i, req := range reqs {
		i := i
		req := req

		group.Go(func() error {
			start, err := ps.fetchPollutionSample(groupCtx, req.StartLat, req.StartLon)
			if err != nil {
				if groupCtx.Err() != nil {
					return groupCtx.Err()
				}
				return nil
			}

			end, err := ps.fetchPollutionSample(groupCtx, req.EndLat, req.EndLon)
			if err != nil {
				if groupCtx.Err() != nil {
					return groupCtx.Err()
				}
				return nil
			}

			measurementTime := max(start.measurementTime, end.measurementTime)

			results[i] = &PollutionResponse{
				MeasurementTime: measurementTime,
				PollutionIndex:  (start.pm10 + end.pm10) / 2,
			}

			return nil
		})
	}

	if err := group.Wait(); err != nil {
		return nil, fmt.Errorf("fetch pollution data: %w", err)
	}

	responses := make([]PollutionResponse, 0, len(results))
	for _, result := range results {
		if result != nil {
			responses = append(responses, *result)
		}
	}

	if len(reqs) > 0 && len(responses) == 0 {
		return nil, fmt.Errorf("waqi api returned no data")
	}

	return responses, nil
}

func (ps *PollutionService) fetchPollutionSample(ctx context.Context, lat, lon float64) (*pollutionSample, error) {
	url := fmt.Sprintf("https://api.waqi.info/feed/geo:%v;%v/?token=%s", lat, lon, ps.apiKey)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("build waqi request: %w", err)
	}

	resp, err := ps.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("call waqi api: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("waqi api returned status %d", resp.StatusCode)
	}

	var payload struct {
		Status string `json:"status"`
		Data   *struct {
			IAQI *struct {
				PM10 *struct {
					Value float64 `json:"v"`
				} `json:"pm10"`
			} `json:"iaqi"`
			Time *struct {
				Stamp string `json:"s"`
			} `json:"time"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("decode waqi response: %w", err)
	}

	if !strings.EqualFold(payload.Status, "ok") {
		return nil, fmt.Errorf("waqi api returned status %s", payload.Status)
	}
	if payload.Data == nil || payload.Data.IAQI == nil || payload.Data.IAQI.PM10 == nil || payload.Data.Time == nil || payload.Data.Time.Stamp == "" {
		return nil, fmt.Errorf("waqi api returned no data")
	}

	return &pollutionSample{
		measurementTime: payload.Data.Time.Stamp,
		pm10:            payload.Data.IAQI.PM10.Value,
	}, nil
}
