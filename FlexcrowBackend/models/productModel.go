package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Product struct {
	ID          primitive.ObjectID `bson:"_id"`
	Product_id  string             `json:"product_id"`
	User_id     *string            `json:"user_id"`
	Name        *string            `json:"name" validate:"required,min=2,max=100"`
	Status      *int               `json:"status" validate:"required,eq=1|eq=2"`
	Type        *int               `json:"type" validate:"required,eq=1|eq=2"`
	Description *string            `json:"description" validate:"max=1000"`
	Price       *float64           `json:"price" validate:"required"`
	Image_id    []*string          `json:"image_id"`
	Video_id    *string            `json:"video_id"`
	Created_at  time.Time          `json:"created_at"`
	Updated_at  time.Time          `json:"updated_at"`
}
