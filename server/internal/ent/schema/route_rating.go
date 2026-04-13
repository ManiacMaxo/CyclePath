package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// RouteRating holds the schema definition for the RouteRating entity.
type RouteRating struct {
	ent.Schema
}

// Fields of the RouteRating.
func (RouteRating) Fields() []ent.Field {
	return []ent.Field{
		field.Int64("node_one_id"),
		field.Int64("node_two_id"),
		field.Int("user_id"),
		field.Float("rating"),
	}
}

// Edges of the RouteRating.
func (RouteRating) Edges() []ent.Edge {
	return nil
}

// Indexes of the RouteRating.
func (RouteRating) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("node_one_id", "node_two_id"),
		index.Fields("user_id"),
	}
}

func (RouteRating) Annotations() []schema.Annotation {
	return []schema.Annotation{
		entsql.Annotation{Table: "route_ratings"},
	}
}
