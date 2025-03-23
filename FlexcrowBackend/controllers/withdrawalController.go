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

var withdrawalCollection *mongo.Collection = database.OpenCollection(database.Client, "withdrawal")
var withdrawalValidate = validator.New()

func GetWithdrawals() gin.HandlerFunc {
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
			matchStage = bson.D{{"$match", bson.D{{"user_id", userId}}}}
		}

		sortStage := bson.D{{"$sort", bson.D{{"created_at", -1}}}}
		groupStage := bson.D{{"$group", bson.D{{"_id", bson.D{{"_id", "null"}}}, {"total_count", bson.D{{"$sum", 1}}}, {"data", bson.D{{"$push", "$$ROOT"}}}}}}
		projectStage := bson.D{
			{"$project", bson.D{
				{"_id", 0},
				{"total_count", 1},
				{"withdrawal_items", bson.D{{"$slice", []interface{}{"$data", startIndex, recordPerPage}}}},
			}}}

		result, err := withdrawalCollection.Aggregate(ctx, mongo.Pipeline{
			matchStage, sortStage, groupStage, projectStage})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occurred while listing withdrawal items"})
			return
		}

		var allwithdrawals []bson.M
		if err = result.All(ctx, &allwithdrawals); err != nil {
			log.Fatal(err)
		}

		if len(allwithdrawals) == 0 {
			c.JSON(http.StatusOK, gin.H{
				"total_count":      0,
				"withdrawal_items": []bson.M{},
			})
			return
		}

		c.JSON(http.StatusOK, allwithdrawals[0])
	}
}

func GetWithdrawal() gin.HandlerFunc {
	return func(c *gin.Context) {
		withdrawalId := c.Param("withdrawal_id")
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var withdrawal models.Withdrawal
		err := withdrawalCollection.FindOne(ctx, bson.M{"withdrawal_id": withdrawalId}).Decode(&withdrawal)
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

		if userType != "ADMIN" {
			if *withdrawal.User_id != userId.(string) {
				c.JSON(http.StatusForbidden, gin.H{"error": "you are not authorized to view this withdrawal"})
				return
			}
		}

		c.JSON(http.StatusOK, withdrawal)
	}
}

func CreateWithdrawal() gin.HandlerFunc {
	return func(c *gin.Context) {
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var withdrawal models.Withdrawal

		if err := c.BindJSON(&withdrawal); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		validationErr := withdrawalValidate.Struct(withdrawal)
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

		var userIdStr string
		if userType != "ADMIN" {
			userIdStr = userId.(string)
			withdrawal.User_id = &userIdStr
		} else {
			var user models.User
			err := userCollection.FindOne(context.TODO(), bson.M{"username": withdrawal.User_id}).Decode(&user)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "user not found"})
				return
			}
			if user.Username == nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "user not found"})
				return
			}
			userIdStr = user.ID.Hex()
			withdrawal.User_id = &userIdStr
		}

		userObjectID, err := primitive.ObjectIDFromHex(userIdStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID format"})
			return
		}

		var user models.User
		err = userCollection.FindOne(ctx, bson.M{"_id": userObjectID}).Decode(&user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to find user"})
			return
		}

		if user.Balance == nil || *user.Balance < *withdrawal.Amount {
			c.JSON(http.StatusBadRequest, gin.H{"error": "insufficient balance for withdrawal"})
			return
		}

		if withdrawal.Status == nil {
			status := 1
			withdrawal.Status = &status
		}

		withdrawal.Created_at, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
		withdrawal.Updated_at, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
		withdrawal.ID = primitive.NewObjectID()
		withdrawal.Withdrawal_id = withdrawal.ID.Hex()

		resultInsertionNumber, insertErr := withdrawalCollection.InsertOne(ctx, withdrawal)
		if insertErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create withdrawal"})
			return
		}

		newBalance := *user.Balance - *withdrawal.Amount
		updateTime := time.Now()
		_, updateErr := userCollection.UpdateOne(
			ctx,
			bson.M{"_id": userObjectID},
			bson.M{"$set": bson.M{"balance": newBalance, "updated_at": updateTime}},
		)
		if updateErr != nil {
			log.Printf("Error updating user balance: %v", updateErr)
			c.JSON(http.StatusOK, gin.H{
				"message":       "withdrawal created but balance update failed",
				"withdrawal_id": withdrawal.Withdrawal_id,
			})
			return
		}

		c.JSON(http.StatusOK, resultInsertionNumber)
	}
}

func UpdateWithdrawal() gin.HandlerFunc {
	return func(c *gin.Context) {

		if err := helper.CheckUserType(c, "ADMIN"); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		withdrawalId := c.Param("withdrawal_id")
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var existingWithdrawal models.Withdrawal
		err := withdrawalCollection.FindOne(ctx, bson.M{"withdrawal_id": withdrawalId}).Decode(&existingWithdrawal)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				c.JSON(http.StatusNotFound, gin.H{"error": "withdrawal not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occurred while fetching withdrawal"})
			return
		}

		var updateData models.Withdrawal
		if err := c.BindJSON(&updateData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		update := bson.M{}

		if updateData.Status != nil {
			update["status"] = updateData.Status
		}
		if updateData.Amount != nil {
			update["amount"] = updateData.Amount
		}
		if updateData.Method != nil {
			update["method"] = updateData.Method
		}
		if updateData.Account != nil {
			update["account"] = updateData.Account
		}

		update["updated_at"] = time.Now().Format(time.RFC3339)

		result, err := withdrawalCollection.UpdateOne(
			ctx,
			bson.M{"withdrawal_id": withdrawalId},
			bson.M{"$set": update},
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update withdrawal"})
			return
		}

		if result.MatchedCount == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "withdrawal not found"})
			return
		}

		c.JSON(http.StatusOK, result.ModifiedCount)
	}
}

func DeleteWithdrawal() gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := helper.CheckUserType(c, "ADMIN"); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		withdrawalId := c.Param("withdrawal_id")
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)

		result, err := withdrawalCollection.DeleteOne(ctx, bson.M{"withdrawal_id": withdrawalId})
		defer cancel()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete withdrawal"})
			return
		}

		c.JSON(http.StatusOK, result)
	}
}
