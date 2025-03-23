package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Transaction struct {
	ID                primitive.ObjectID `bson:"_id"`
	Transaction_id    string             `json:"transaction_id"`
	User_id           *string            `json:"user_id"`
	Customer_id       *string            `json:"customer_id"`
	Status            *int               `json:"status" validate:"required,eq=1|eq=2|eq=3|eq=4|eq=5|eq=6"`
	Type              *int               `json:"type" validate:"required,eq=1|eq=2"`
	Product_id        *string            `json:"product_id"`
	Product_number    *int               `json:"product_number"`
	Address_id        *string            `json:"address_id"`
	Payment_id        *string            `json:"payment_id"`
	Shipping          *string            `json:"shipping"`
	Shipping_price    *float64           `json:"shipping_price"`
	Shipping_number   *string            `json:"shipping_number"`
	Shipping_details  *string            `json:"shipping_details"`
	Shipping_image_id *string            `json:"shipping_image_id"`
	Delivered_at      *time.Time         `json:"delivered_at"`
	Delivered_details *string            `json:"delivered_details"`
	Fee               *float64           `json:"fee"`
	Fee_type          *int               `json:"fee_type" validate:"eq=1|eq=2|eq=3"`
	Created_at        time.Time          `json:"created_at"`
	Updated_at        time.Time          `json:"updated_at"`
}
