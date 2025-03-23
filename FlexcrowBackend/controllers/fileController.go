package controllers

import (
	"context"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"
	"user-athentication-golang/database"
	"user-athentication-golang/models"

	helper "user-athentication-golang/helpers"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var fileCollection *mongo.Collection = database.OpenCollection(database.Client, "file")

func UploadFile() gin.HandlerFunc {
	return func(c *gin.Context) {

		err := godotenv.Load(".env")

		if err != nil {
			log.Fatal("Error loading .env file")
		}

		CLOUDINARYURL := os.Getenv("CLOUDINARY_URL")

		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
			return
		}

		cld, err := cloudinary.NewFromURL(CLOUDINARYURL)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialize Cloudinary"})
			return
		}

		src, err := file.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file"})
			return
		}
		defer src.Close()

		uploadResult, err := cld.Upload.Upload(ctx, src, uploader.UploadParams{
			Folder: "flexcrow",
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload to Cloudinary"})
			return
		}

		fileRecord := models.File{
			ID:            primitive.NewObjectID(),
			File_id:       primitive.NewObjectID().Hex(),
			Original_name: file.Filename,
			Cloud_url:     uploadResult.SecureURL,
			Cloud_id:      uploadResult.PublicID,
			File_type:     file.Header.Get("Content-Type"),
			Size:          file.Size,
			Created_at:    time.Now(),
			Updated_at:    time.Now(),
		}

		_, err = fileCollection.InsertOne(ctx, fileRecord)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file record"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"file_id":   fileRecord.File_id,
			"cloud_url": fileRecord.Cloud_url,
		})
	}
}

func GetFiles() gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := helper.CheckUserType(c, "ADMIN"); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)

		recordPerPage, err := strconv.Atoi(c.Query("recordPerPage"))
		if err != nil || recordPerPage < 1 {
			recordPerPage = 10
		}

		page, err1 := strconv.Atoi(c.Query("page"))
		if err1 != nil || page < 1 {
			page = 1
		}

		startIndex := (page - 1) * recordPerPage
		startIndex, err = strconv.Atoi(c.Query("startIndex"))

		matchStage := bson.D{{"$match", bson.D{{}}}}
		sortStage := bson.D{{"$sort", bson.D{{"created_at", -1}}}}
		groupStage := bson.D{{"$group", bson.D{{"_id", bson.D{{"_id", "null"}}}, {"total_count", bson.D{{"$sum", 1}}}, {"data", bson.D{{"$push", "$$ROOT"}}}}}}
		projectStage := bson.D{
			{"$project", bson.D{
				{"_id", 0},
				{"total_count", 1},
				{"file_items", bson.D{{"$slice", []interface{}{"$data", startIndex, recordPerPage}}}},
			}}}

		result, err := fileCollection.Aggregate(ctx, mongo.Pipeline{
			matchStage, sortStage, groupStage, projectStage})
		defer cancel()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occured while listing file items"})
		}
		var allfiles []bson.M
		if err = result.All(ctx, &allfiles); err != nil {
			log.Fatal(err)
		}
		c.JSON(http.StatusOK, allfiles[0])

	}
}

func GetFile() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		fileId := c.Param("file_id")
		var file models.File

		err := fileCollection.FindOne(ctx, bson.M{"file_id": fileId}).Decode(&file)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, file)
	}
}

func DeleteFile() gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := helper.CheckUserType(c, "ADMIN"); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		fileId := c.Param("file_id")
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)

		result, err := fileCollection.DeleteOne(ctx, bson.M{"file_id": fileId})
		defer cancel()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete file"})
			return
		}

		c.JSON(http.StatusOK, result)
	}
}
