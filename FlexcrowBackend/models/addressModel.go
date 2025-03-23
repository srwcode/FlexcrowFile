package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Address struct {
	ID          primitive.ObjectID `bson:"_id"`
	Address_id  string             `json:"address_id"`
	User_id     *string            `json:"user_id"`
	Name        *string            `json:"name" validate:"required,min=2,max=100"`
	Status      *int               `json:"status" validate:"required,eq=1|eq=2"`
	Type        *int               `json:"type" validate:"required,eq=1|eq=2"`
	Full_name   *string            `json:"full_name" validate:"required,min=2,max=100"`
	Phone       *string            `json:"phone" validate:"required"`
	Address_1   *string            `json:"address_1" validate:"required,max=1000"`
	Address_2   *string            `json:"address_2" validate:"max=1000"`
	Subdistrict *string            `json:"subdistrict" validate:"required,max=100"`
	District    *string            `json:"district" validate:"required,max=100"`
	Province    *string            `json:"province" validate:"required,max=100"`
	Country     *string            `json:"country" validate:"required,max=100"`
	Postal_code *string            `json:"postal_code" validate:"required,max=100"`
	Created_at  time.Time          `json:"created_at"`
	Updated_at  time.Time          `json:"updated_at"`
}
