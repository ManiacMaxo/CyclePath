package service

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	places "cloud.google.com/go/maps/places/apiv1"
	"cloud.google.com/go/maps/places/apiv1/placespb"
	"github.com/googleapis/gax-go/v2"
	"google.golang.org/api/option"
	"google.golang.org/genproto/googleapis/type/latlng"
)

var searchLocationPattern = regexp.MustCompile(`^\d+\.?\d*,\d+\.?\d*$`)

type SearchService struct {
	client *places.Client
}

type Location struct {
	Lat     float64 `json:"lat"`
	Lng     float64 `json:"lng"`
	Name    string  `json:"name"`
	Address string  `json:"address"`
}

func NewSearch(apiKey string) (*SearchService, error) {
	client, err := places.NewClient(context.Background(), option.WithAPIKey(apiKey))
	if err != nil {
		return nil, fmt.Errorf("create places client: %w", err)
	}
	return &SearchService{client: client}, nil
}

func (ss *SearchService) Close() error {
	return ss.client.Close()
}

func (ss *SearchService) SearchPlaces(ctx context.Context, query, location, locale string) ([]Location, error) {
	query = strings.TrimSpace(query)
	location = strings.TrimSpace(location)
	locale = strings.TrimSpace(locale)

	if locale == "" {
		locale = "en"
	}
	if query == "" {
		return nil, fmt.Errorf("query cannot be empty")
	}
	if location == "" {
		return nil, fmt.Errorf("location cannot be empty")
	}
	if !searchLocationPattern.MatchString(location) {
		return nil, fmt.Errorf("location must match lat,lng format")
	}

	parts := strings.SplitN(location, ",", 2)
	if len(parts) != 2 {
		return nil, fmt.Errorf("location must match lat,lng format")
	}
	lat, err := parseFloat(parts[0])
	if err != nil {
		return nil, fmt.Errorf("invalid latitude in location: %w", err)
	}
	lng, err := parseFloat(parts[1])
	if err != nil {
		return nil, fmt.Errorf("invalid longitude in location: %w", err)
	}

	ctx = gax.InsertMetadataIntoOutgoingContext(ctx, "x-goog-fieldmask", "displayName,shortFormattedAddress,location")

	resp, err := ss.client.SearchText(ctx, &placespb.SearchTextRequest{
		TextQuery:      query,
		LanguageCode:   locale,
		MaxResultCount: 20,
		LocationBias: &placespb.SearchTextRequest_LocationBias{
			Type: &placespb.SearchTextRequest_LocationBias_Circle{
				Circle: &placespb.Circle{
					Center: &latlng.LatLng{Latitude: lat, Longitude: lng},
					Radius: 50000,
				},
			},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("search places: %w", err)
	}

	locations := make([]Location, 0, len(resp.Places))
	for _, place := range resp.Places {
		if place.Location == nil || place.DisplayName == nil {
			continue
		}
		locations = append(locations, Location{
			Lat:     place.Location.Latitude,
			Lng:     place.Location.Longitude,
			Name:    place.DisplayName.Text,
			Address: place.ShortFormattedAddress,
		})
	}

	return locations, nil
}

func parseFloat(s string) (float64, error) {
	var f float64
	_, err := fmt.Sscanf(s, "%f", &f)
	return f, err
}
