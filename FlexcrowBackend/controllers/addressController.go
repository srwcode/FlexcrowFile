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

var addressCollection *mongo.Collection = database.OpenCollection(database.Client, "address")
var addressValidate = validator.New()

func GetAddresses() gin.HandlerFunc {
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
				{"address_items", bson.D{{"$slice", []interface{}{"$data", startIndex, recordPerPage}}}},
			}}}

		result, err := addressCollection.Aggregate(ctx, mongo.Pipeline{
			matchStage, sortStage, groupStage, projectStage})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occurred while listing address items"})
			return
		}

		var alladdresses []bson.M
		if err = result.All(ctx, &alladdresses); err != nil {
			log.Fatal(err)
		}

		if len(alladdresses) == 0 {
			c.JSON(http.StatusOK, gin.H{
				"total_count":   0,
				"address_items": []bson.M{},
			})
			return
		}

		c.JSON(http.StatusOK, alladdresses[0])
	}
}

func GetAddress() gin.HandlerFunc {
	return func(c *gin.Context) {
		addressId := c.Param("address_id")
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var address models.Address
		err := addressCollection.FindOne(ctx, bson.M{"address_id": addressId}).Decode(&address)
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
			if (*address.User_id != userId.(string) && transactionParam != "true") || (address.Status != nil && *address.Status != 1) {
				c.JSON(http.StatusForbidden, gin.H{"error": "you are not authorized to view this address"})
				return
			}
		}

		c.JSON(http.StatusOK, address)
	}
}

func CreateAddress() gin.HandlerFunc {
	return func(c *gin.Context) {
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var address models.Address

		if err := c.BindJSON(&address); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		validationErr := addressValidate.Struct(address)
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
			address.User_id = &userIdStr
		} else {
			var user models.User
			err := userCollection.FindOne(context.TODO(), bson.M{"username": address.User_id}).Decode(&user)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "user not found"})
				return
			}
			if user.Username == nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "user not found"})
				return
			}
			userID := user.ID.Hex()
			address.User_id = &userID
		}

		if address.Status == nil {
			status := 1
			address.Status = &status
		}

		address.Created_at, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
		address.Updated_at, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
		address.ID = primitive.NewObjectID()
		address.Address_id = address.ID.Hex()

		resultInsertionNumber, insertErr := addressCollection.InsertOne(ctx, address)
		if insertErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create address"})
			return
		}

		c.JSON(http.StatusOK, resultInsertionNumber)
	}
}

func UpdateAddress() gin.HandlerFunc {
	return func(c *gin.Context) {
		addressId := c.Param("address_id")
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var existingAddress models.Address
		err := addressCollection.FindOne(ctx, bson.M{"address_id": addressId}).Decode(&existingAddress)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				c.JSON(http.StatusNotFound, gin.H{"error": "address not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occurred while fetching address"})
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
			if *existingAddress.User_id != userId.(string) || (existingAddress.Status != nil && *existingAddress.Status != 1) {
				c.JSON(http.StatusForbidden, gin.H{"error": "you are not authorized to update this address"})
				return
			}
		}

		var updateData models.Address
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
		if updateData.Status != nil && userType == "ADMIN" {
			update["status"] = updateData.Status
		}
		if updateData.Type != nil {
			update["type"] = updateData.Type
		}
		if updateData.Full_name != nil {
			update["full_name"] = updateData.Full_name
		}
		if updateData.Phone != nil {
			update["phone"] = updateData.Phone
		}
		if updateData.Address_1 != nil {
			update["address_1"] = updateData.Address_1
		}
		if updateData.Address_2 != nil {
			update["address_2"] = updateData.Address_2
		}
		if updateData.Subdistrict != nil {
			update["subdistrict"] = updateData.Subdistrict
		}
		if updateData.District != nil {
			update["district"] = updateData.District
		}
		if updateData.Province != nil {
			update["province"] = updateData.Province
		}
		if updateData.Country != nil {
			update["country"] = updateData.Country
		}
		if updateData.Postal_code != nil {
			update["postal_code"] = updateData.Postal_code
		}

		update["updated_at"] = time.Now().Format(time.RFC3339)

		result, err := addressCollection.UpdateOne(
			ctx,
			bson.M{"address_id": addressId},
			bson.M{"$set": update},
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update address"})
			return
		}

		if result.MatchedCount == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "address not found"})
			return
		}

		c.JSON(http.StatusOK, result.ModifiedCount)
	}
}

func DeleteAddress() gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := helper.CheckUserType(c, "ADMIN"); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		addressId := c.Param("address_id")
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		result, err := addressCollection.DeleteOne(ctx, bson.M{"address_id": addressId})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete address"})
			return
		}

		c.JSON(http.StatusOK, result)
	}
}

func RemoveAddress() gin.HandlerFunc {
	return func(c *gin.Context) {
		addressId := c.Param("address_id")
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var existingAddress models.Address
		err := addressCollection.FindOne(ctx, bson.M{"address_id": addressId}).Decode(&existingAddress)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				c.JSON(http.StatusNotFound, gin.H{"error": "address not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occurred while fetching address"})
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
			if *existingAddress.User_id != userId.(string) || (existingAddress.Status != nil && *existingAddress.Status != 1) {
				c.JSON(http.StatusForbidden, gin.H{"error": "you are not authorized to remove this address"})
				return
			}
		}

		status := 2
		update := bson.M{
			"status":     status,
			"updated_at": time.Now().Format(time.RFC3339),
		}

		result, err := addressCollection.UpdateOne(
			ctx,
			bson.M{"address_id": addressId},
			bson.M{"$set": update},
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to remove address"})
			return
		}

		if result.MatchedCount == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "address not found"})
			return
		}

		c.JSON(http.StatusOK, result.ModifiedCount)
	}
}
