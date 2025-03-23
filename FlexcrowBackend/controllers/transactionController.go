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

var transactionCollection *mongo.Collection = database.OpenCollection(database.Client, "transaction")
var transactionValidate = validator.New()

func GetTransactions() gin.HandlerFunc {
	return func(c *gin.Context) {
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

		userId, exists := c.Get("uid")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user id not found in token"})
			return
		}

		userIdParam := c.Query("user_id")
		customerIdParam := c.Query("customer_id")

		var matchStage bson.D

		if userIdParam == "current" {
			matchStage = bson.D{{"$match", bson.D{{"user_id", userId}}}}
		} else if userIdParam != "" {
			if err := helper.CheckUserType(c, "ADMIN"); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			matchStage = bson.D{{"$match", bson.D{{"user_id", userIdParam}}}}
		} else if customerIdParam == "current" {
			matchStage = bson.D{{"$match", bson.D{{"customer_id", userId}}}}
		} else if customerIdParam != "" {
			if err := helper.CheckUserType(c, "ADMIN"); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			matchStage = bson.D{{"$match", bson.D{{"customer_id", customerIdParam}}}}
		} else {
			if err := helper.CheckUserType(c, "ADMIN"); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			matchStage = bson.D{{"$match", bson.D{{}}}}
		}

		sortStage := bson.D{{"$sort", bson.D{{"created_at", -1}}}}
		groupStage := bson.D{{"$group", bson.D{{"_id", bson.D{{"_id", "null"}}}, {"total_count", bson.D{{"$sum", 1}}}, {"data", bson.D{{"$push", "$$ROOT"}}}}}}
		projectStage := bson.D{
			{"$project", bson.D{
				{"_id", 0},
				{"total_count", 1},
				{"transaction_items", bson.D{{"$slice", []interface{}{"$data", startIndex, recordPerPage}}}},
			}}}

		result, err := transactionCollection.Aggregate(ctx, mongo.Pipeline{
			matchStage, sortStage, groupStage, projectStage})
		defer cancel()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occured while listing transaction items"})
		}
		var alltransactions []bson.M
		if err = result.All(ctx, &alltransactions); err != nil {
			log.Fatal(err)
		}

		if len(alltransactions) == 0 {
			c.JSON(http.StatusOK, gin.H{
				"total_count":       0,
				"transaction_items": []bson.M{},
			})
			return
		}

		c.JSON(http.StatusOK, alltransactions[0])

	}
}

func GetTransaction() gin.HandlerFunc {
	return func(c *gin.Context) {
		transactionId := c.Param("transaction_id")
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		userId, exists := c.Get("uid")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user id not found in token"})
			return
		}

		var transaction models.Transaction
		err := transactionCollection.FindOne(ctx, bson.M{"transaction_id": transactionId}).Decode(&transaction)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				c.JSON(http.StatusNotFound, gin.H{"error": "transaction not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occurred while fetching transaction"})
			return
		}

		userIdParam := c.Query("user_id")
		customerIdParam := c.Query("customer_id")
		userIdStr := userId.(string)

		if userIdParam == "current" && *transaction.User_id == userIdStr {
			c.JSON(http.StatusOK, transaction)
			return
		} else if customerIdParam == "current" && *transaction.Customer_id == userIdStr {
			c.JSON(http.StatusOK, transaction)
			return
		} else {
			if err := helper.CheckUserType(c, "ADMIN"); err == nil {
				c.JSON(http.StatusOK, transaction)
				return
			}
		}

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	}
}

func CreateTransaction() gin.HandlerFunc {
	return func(c *gin.Context) {
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var transaction models.Transaction

		if err := c.BindJSON(&transaction); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		validationErr := transactionValidate.Struct(transaction)
		if validationErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": validationErr.Error()})
			return
		}

		if transaction.User_id != nil && *transaction.User_id != "" {
			var user models.User
			err := userCollection.FindOne(context.TODO(), bson.M{"username": transaction.User_id}).Decode(&user)
			defer cancel()
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "user_error"})
				return
			}
			if user.Username == nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "user_error"})
				return
			}
		}

		var customer models.User
		errCustomer := userCollection.FindOne(context.TODO(), bson.M{"username": transaction.Customer_id}).Decode(&customer)
		defer cancel()
		if errCustomer != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "customer_error"})
			return
		}
		if customer.Username == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "customer_error"})
			return
		}

		var product models.Product
		errProduct := productCollection.FindOne(context.TODO(), bson.M{"product_id": transaction.Product_id}).Decode(&product)
		defer cancel()
		if errProduct != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "product_error"})
			return
		}
		if product.Product_id == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "product_error"})
			return
		}

		if transaction.Address_id != nil && *transaction.Address_id != "" {
			var address models.Address
			errAddress := addressCollection.FindOne(context.TODO(), bson.M{"address_id": transaction.Address_id}).Decode(&address)
			defer cancel()
			if errAddress != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "address_error"})
				return
			}
			if address.Address_id == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "address_error"})
				return
			}
		}

		if transaction.Payment_id != nil && *transaction.Payment_id != "" {
			var payment models.Payment
			errPayment := paymentCollection.FindOne(context.TODO(), bson.M{"payment_id": transaction.Payment_id}).Decode(&payment)
			defer cancel()
			if errPayment != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "payment_error"})
				return
			}
			if payment.Payment_id == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "payment_error"})
				return
			}
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
			transaction.User_id = &userIdStr
		} else {
			var user models.User
			err := userCollection.FindOne(context.TODO(), bson.M{"username": transaction.User_id}).Decode(&user)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "user not found"})
				return
			}
			if user.Username == nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "user not found"})
				return
			}
			userID := user.ID.Hex()
			transaction.User_id = &userID
		}

		if transaction.Status == nil {
			status := 1
			transaction.Status = &status
		}

		customerID := customer.ID.Hex()
		transaction.Customer_id = &customerID
		transaction.Created_at, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
		transaction.Updated_at, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
		transaction.ID = primitive.NewObjectID()
		transaction.Transaction_id = transaction.ID.Hex()

		resultInsertionNumber, insertErr := transactionCollection.InsertOne(ctx, transaction)
		if insertErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create transaction"})
			return
		}

		c.JSON(http.StatusOK, resultInsertionNumber)
	}
}

func UpdateTransaction() gin.HandlerFunc {
	return func(c *gin.Context) {
		transactionId := c.Param("transaction_id")
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var existingTransaction models.Transaction
		err := transactionCollection.FindOne(ctx, bson.M{"transaction_id": transactionId}).Decode(&existingTransaction)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				c.JSON(http.StatusNotFound, gin.H{"error": "transaction not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occurred while fetching transaction"})
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
			if *existingTransaction.User_id != userId.(string) && *existingTransaction.Customer_id != userId.(string) {
				c.JSON(http.StatusForbidden, gin.H{"error": "you are not authorized to update this transaction"})
				return
			}
		}

		var updateData models.Transaction
		if err := c.BindJSON(&updateData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if updateData.Product_id != nil && *updateData.Product_id != "" {
			var product models.Product
			errProduct := productCollection.FindOne(context.TODO(), bson.M{"product_id": updateData.Product_id}).Decode(&product)
			defer cancel()
			if errProduct != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "product_error"})
				return
			}
			if product.Product_id == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "product_error"})
				return
			}
		}

		if updateData.Address_id != nil && *updateData.Address_id != "" {
			var address models.Address
			errAddress := addressCollection.FindOne(context.TODO(), bson.M{"address_id": updateData.Address_id}).Decode(&address)
			defer cancel()
			if errAddress != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "address_error"})
				return
			}
			if address.Address_id == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "address_error"})
				return
			}
		}

		if updateData.Payment_id != nil && *updateData.Payment_id != "" {
			var payment models.Payment
			errPayment := paymentCollection.FindOne(context.TODO(), bson.M{"payment_id": updateData.Payment_id}).Decode(&payment)
			defer cancel()
			if errPayment != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "payment_error"})
				return
			}
			if payment.Payment_id == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "payment_error"})
				return
			}
		}

		update := bson.M{}

		if updateData.Status != nil {
			update["status"] = updateData.Status
		}
		if updateData.Type != nil {
			update["type"] = updateData.Type
		}
		if updateData.Product_id != nil {
			update["product_id"] = updateData.Product_id
		}
		if updateData.Product_number != nil {
			update["product_number"] = updateData.Product_number
		}
		if updateData.Address_id != nil {
			update["address_id"] = updateData.Address_id
		}
		if updateData.Payment_id != nil {
			update["payment_id"] = updateData.Payment_id
		}
		if updateData.Shipping != nil {
			update["shipping"] = updateData.Shipping
		}
		if updateData.Shipping_price != nil {
			update["shipping_price"] = updateData.Shipping_price
		}
		if updateData.Shipping_number != nil {
			update["shipping_number"] = updateData.Shipping_number
		}
		if updateData.Shipping_details != nil {
			update["shipping_details"] = updateData.Shipping_details
		}
		if updateData.Shipping_image_id != nil {
			update["shipping_image_id"] = updateData.Shipping_image_id
		}
		if updateData.Delivered_at != nil {
			update["delivered_at"] = updateData.Delivered_at
		} else {
			update["delivered_at"] = nil
		}
		if updateData.Delivered_details != nil {
			update["delivered_details"] = updateData.Delivered_details
		}
		if updateData.Fee != nil {
			update["fee"] = updateData.Fee
		}
		if updateData.Fee_type != nil {
			update["fee_type"] = updateData.Fee_type
		}

		update["updated_at"] = time.Now().Format(time.RFC3339)

		result, err := transactionCollection.UpdateOne(
			ctx,
			bson.M{"transaction_id": transactionId},
			bson.M{"$set": update},
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update transaction"})
			return
		}

		if result.MatchedCount == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "transaction not found"})
			return
		}

		c.JSON(http.StatusOK, result.ModifiedCount)
	}
}

func DeleteTransaction() gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := helper.CheckUserType(c, "ADMIN"); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		transactionId := c.Param("transaction_id")
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)

		result, err := transactionCollection.DeleteOne(ctx, bson.M{"transaction_id": transactionId})
		defer cancel()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete transaction"})
			return
		}

		c.JSON(http.StatusOK, result)
	}
}
