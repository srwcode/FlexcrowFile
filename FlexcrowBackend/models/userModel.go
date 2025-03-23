package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID            primitive.ObjectID `bson:"_id"`
	User_id       string             `json:"user_id"`
	Username      *string            `json:"username" validate:"required,min=5,max=50"`
	Email         *string            `json:"email" validate:"email,required"`
	Password      *string            `json:"password" validate:"required,min=6"`
	User_type     *string            `json:"user_type" validate:"required,eq=ADMIN|eq=USER"`
	Status        *int               `json:"status" validate:"required,eq=1|eq=2"`
	First_name    *string            `json:"first_name" validate:"required,min=2,max=100"`
	Last_name     *string            `json:"last_name" validate:"required,min=2,max=100"`
	Phone         *string            `json:"phone" validate:"required"`
	Balance       *float64           `json:"balance"`
	Image_id      *string            `json:"image_id"`
	Address_id    *string            `json:"address_id"`
	Token         *string            `json:"token"`
	Refresh_token *string            `json:"refresh_token"`
	Created_at    time.Time          `json:"created_at"`
	Updated_at    time.Time          `json:"updated_at"`
}
