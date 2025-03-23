package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type File struct {
	ID            primitive.ObjectID `bson:"_id"`
	File_id       string             `json:"file_id"`
	Original_name string             `json:"original_name"`
	Cloud_url     string             `json:"cloud_url"`
	Cloud_id      string             `json:"cloud_id"`
	File_type     string             `json:"file_type"`
	Size          int64              `json:"size"`
	Created_at    time.Time          `json:"created_at"`
	Updated_at    time.Time          `json:"updated_at"`
}
