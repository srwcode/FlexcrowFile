package controllers

import (
	"context"
	"log"
	"strconv"

	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"

	"user-athentication-golang/database"

	helper "user-athentication-golang/helpers"
	"user-athentication-golang/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var productCollection *mongo.Collection = database.OpenCollection(database.Client, "product")
var productValidate = validator.New()

func GetProducts() gin.HandlerFunc {
	return func(c *gin.Context) {
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

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

		userId, exists := c.Get("uid")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user id not found in context"})
			return
		}

		userType, exists := c.Get("user_type")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user type not found in context"})
			return
		}

		var matchStage bson.D
		if userType == "ADMIN" {
			queryUserId := c.Query("user_id")
			if queryUserId != "" {
				matchStage = bson.D{{"$match", bson.D{{"user_id", queryUserId}}}}
			} else {
				matchStage = bson.D{{"$match", bson.D{{}}}}
			}
		} else {
			matchStage = bson.D{{"$match", bson.D{
				{"user_id", userId},
				{"status", 1},
			}}}
		}

		sortStage := bson.D{{"$sort", bson.D{{"created_at", -1}}}}
		groupStage := bson.D{{"$group", bson.D{{"_id", bson.D{{"_id", "null"}}}, {"total_count", bson.D{{"$sum", 1}}}, {"data", bson.D{{"$push", "$$ROOT"}}}}}}
		projectStage := bson.D{
			{"$project", bson.D{
				{"_id", 0},
				{"total_count", 1},
				{"product_items", bson.D{{"$slice", []interface{}{"$data", startIndex, recordPerPage}}}},
			}}}

		result, err := productCollection.Aggregate(ctx, mongo.Pipeline{
			matchStage, sortStage, groupStage, projectStage})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occurred while listing product items"})
			return
		}

		var allproducts []bson.M
		if err = result.All(ctx, &allproducts); err != nil {
			log.Fatal(err)
		}

		if len(allproducts) == 0 {
			c.JSON(http.StatusOK, gin.H{
				"total_count":   0,
				"product_items": []bson.M{},
			})
			return
		}

		c.JSON(http.StatusOK, allproducts[0])
	}
}

func GetProduct() gin.HandlerFunc {
	return func(c *gin.Context) {
		productId := c.Param("product_id")
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var product models.Product
		err := productCollection.FindOne(ctx, bson.M{"product_id": productId}).Decode(&product)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		userId, exists := c.Get("uid")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user id not found in context"})
			return
		}

		userType, exists := c.Get("user_type")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user type not found in context"})
			return
		}

		transactionParam := c.Query("transaction")

		if userType != "ADMIN" {
			if (*product.User_id != userId.(string) && transactionParam != "true") || (product.Status != nil && *product.Status != 1) {
				c.JSON(http.StatusForbidden, gin.H{"error": "you are not authorized to view this product"})
				return
			}
		}

		c.JSON(http.StatusOK, product)
	}
}

func CreateProduct() gin.HandlerFunc {
	return func(c *gin.Context) {
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var product models.Product

		if err := c.BindJSON(&product); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		validationErr := productValidate.Struct(product)
		if validationErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": validationErr.Error()})
			return
		}

		userType, exists := c.Get("user_type")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user type not found in context"})
			return
		}

		userId, exists := c.Get("uid")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user id not found in context"})
			return
		}

		if userType != "ADMIN" {
			userIdStr := userId.(string)
			product.User_id = &userIdStr
		} else {
			var user models.User
			err := userCollection.FindOne(context.TODO(), bson.M{"username": product.User_id}).Decode(&user)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "user not found"})
				return
			}
			if user.Username == nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "user not found"})
				return
			}
			userID := user.ID.Hex()
			product.User_id = &userID
		}

		if product.Status == nil {
			status := 1
			product.Status = &status
		}

		product.Created_at, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
		product.Updated_at, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
		product.ID = primitive.NewObjectID()
		product.Product_id = product.ID.Hex()

		resultInsertionNumber, insertErr := productCollection.InsertOne(ctx, product)
		if insertErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create product"})
			return
		}

		c.JSON(http.StatusOK, resultInsertionNumber)
	}
}

func UpdateProduct() gin.HandlerFunc {
	return func(c *gin.Context) {
		productId := c.Param("product_id")
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var existingProduct models.Product
		err := productCollection.FindOne(ctx, bson.M{"product_id": productId}).Decode(&existingProduct)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occurred while fetching product"})
			return
		}

		userType, exists := c.Get("user_type")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user type not found in context"})
			return
		}

		userId, exists := c.Get("uid")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user id not found in context"})
			return
		}

		if userType != "ADMIN" {
			if *existingProduct.User_id != userId.(string) || (existingProduct.Status != nil && *existingProduct.Status != 1) {
				c.JSON(http.StatusForbidden, gin.H{"error": "you are not authorized to update this product"})
				return
			}
		}

		var updateData models.Product
		if err := c.BindJSON(&updateData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		update := bson.M{}

		if userType != "ADMIN" {
			updateData.User_id = nil
			updateData.Status = nil
		}

		if updateData.Name != nil {
			update["name"] = updateData.Name
		}
		if updateData.Status != nil {
			update["status"] = updateData.Status
		}
		if updateData.Type != nil {
			update["type"] = updateData.Type
		}
		if updateData.Description != nil {
			update["description"] = updateData.Description
		}
		if updateData.Price != nil {
			update["price"] = updateData.Price
		}
		if updateData.Image_id != nil {
			update["image_id"] = updateData.Image_id
		}
		if updateData.Video_id != nil {
			update["video_id"] = updateData.Video_id
		}

		update["updated_at"] = time.Now().Format(time.RFC3339)

		result, err := productCollection.UpdateOne(
			ctx,
			bson.M{"product_id": productId},
			bson.M{"$set": update},
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update product"})
			return
		}

		if result.MatchedCount == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
			return
		}

		c.JSON(http.StatusOK, result.ModifiedCount)
	}
}

func DeleteProduct() gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := helper.CheckUserType(c, "ADMIN"); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		productId := c.Param("product_id")
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		result, err := productCollection.DeleteOne(ctx, bson.M{"product_id": productId})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete product"})
			return
		}

		c.JSON(http.StatusOK, result)
	}
}

func RemoveProduct() gin.HandlerFunc {
	return func(c *gin.Context) {
		productId := c.Param("product_id")
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var existingProduct models.Product
		err := productCollection.FindOne(ctx, bson.M{"product_id": productId}).Decode(&existingProduct)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occurred while fetching product"})
			return
		}

		userType, exists := c.Get("user_type")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user type not found in context"})
			return
		}

		userId, exists := c.Get("uid")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user id not found in context"})
			return
		}

		if userType != "ADMIN" {
			if *existingProduct.User_id != userId.(string) || (existingProduct.Status != nil && *existingProduct.Status != 1) {
				c.JSON(http.StatusForbidden, gin.H{"error": "you are not authorized to remove this product"})
				return
			}
		}

		status := 2
		update := bson.M{
			"status":     status,
			"updated_at": time.Now().Format(time.RFC3339),
		}

		result, err := productCollection.UpdateOne(
			ctx,
			bson.M{"product_id": productId},
			bson.M{"$set": update},
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to remove product"})
			return
		}

		if result.MatchedCount == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "product not found"})
			return
		}

		c.JSON(http.StatusOK, result.ModifiedCount)
	}
}
