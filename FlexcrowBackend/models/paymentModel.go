package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Payment struct {
	ID         primitive.ObjectID `bson:"_id"`
	Payment_id string             `json:"payment_id"`
	User_id    *string            `json:"user_id"`
	Status     *int               `json:"status" validate:"required,eq=1|eq=2|eq=3"`
	Amount     *float64           `json:"amount" validate:"required"`
	Method     *string            `json:"method" validate:"required,max=100"`
	Created_at time.Time          `json:"created_at"`
	Updated_at time.Time          `json:"updated_at"`
}
