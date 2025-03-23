package controllers

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"

	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/stripe/stripe-go/v72"
	"github.com/stripe/stripe-go/v72/checkout/session"

	"user-athentication-golang/database"

	helper "user-athentication-golang/helpers"
	"user-athentication-golang/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var paymentCollection *mongo.Collection = database.OpenCollection(database.Client, "payment")
var paymentValidate = validator.New()

func GetPayments() gin.HandlerFunc {
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
				{"payment_items", bson.D{{"$slice", []interface{}{"$data", startIndex, recordPerPage}}}},
			}}}

		result, err := paymentCollection.Aggregate(ctx, mongo.Pipeline{
			matchStage, sortStage, groupStage, projectStage})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occurred while listing payment items"})
			return
		}

		var allpayments []bson.M
		if err = result.All(ctx, &allpayments); err != nil {
			log.Fatal(err)
		}

		if len(allpayments) == 0 {
			c.JSON(http.StatusOK, gin.H{
				"total_count":   0,
				"payment_items": []bson.M{},
			})
			return
		}

		c.JSON(http.StatusOK, allpayments[0])
	}
}

func GetPayment() gin.HandlerFunc {
	return func(c *gin.Context) {
		paymentId := c.Param("payment_id")
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var payment models.Payment
		err := paymentCollection.FindOne(ctx, bson.M{"payment_id": paymentId}).Decode(&payment)
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
			if *payment.User_id != userId.(string) {
				c.JSON(http.StatusForbidden, gin.H{"error": "you are not authorized to view this payment"})
				return
			}
		}

		c.JSON(http.StatusOK, payment)
	}
}

func CreatePayment() gin.HandlerFunc {
	return func(c *gin.Context) {
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var payment models.Payment

		if err := c.BindJSON(&payment); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		validationErr := paymentValidate.Struct(payment)
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
			payment.User_id = &userIdStr
		} else {
			var user models.User
			err := userCollection.FindOne(context.TODO(), bson.M{"username": payment.User_id}).Decode(&user)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "user not found"})
				return
			}
			if user.Username == nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "user not found"})
				return
			}
			userID := user.ID.Hex()
			payment.User_id = &userID
		}

		if payment.Status == nil {
			status := 1
			payment.Status = &status
		}

		payment.Created_at, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
		payment.Updated_at, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
		payment.ID = primitive.NewObjectID()
		payment.Payment_id = payment.ID.Hex()

		_, insertErr := paymentCollection.InsertOne(ctx, payment)
		if insertErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create payment"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"payment_id": payment.Payment_id})
	}
}

func UpdatePayment() gin.HandlerFunc {
	return func(c *gin.Context) {
		paymentId := c.Param("payment_id")
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var existingPayment models.Payment
		err := paymentCollection.FindOne(ctx, bson.M{"payment_id": paymentId}).Decode(&existingPayment)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occurred while fetching payment"})
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
			if *existingPayment.User_id != userId.(string) || (existingPayment.Status != nil && *existingPayment.Status != 1) {
				c.JSON(http.StatusForbidden, gin.H{"error": "you are not authorized to update this payment"})
				return
			}
		}

		var updateData models.Payment
		if err := c.BindJSON(&updateData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		update := bson.M{}

		if userType != "ADMIN" {
			updateData.User_id = nil
		}

		if updateData.Status != nil {
			update["status"] = updateData.Status
		}
		if updateData.Amount != nil {
			update["amount"] = updateData.Amount
		}
		if updateData.Method != nil {
			update["method"] = updateData.Method
		}

		update["updated_at"] = time.Now().Format(time.RFC3339)

		result, err := paymentCollection.UpdateOne(
			ctx,
			bson.M{"payment_id": paymentId},
			bson.M{"$set": update},
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update payment"})
			return
		}

		if result.MatchedCount == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
			return
		}

		c.JSON(http.StatusOK, result.ModifiedCount)
	}
}

func DeletePayment() gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := helper.CheckUserType(c, "ADMIN"); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		paymentId := c.Param("payment_id")
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)

		result, err := paymentCollection.DeleteOne(ctx, bson.M{"payment_id": paymentId})
		defer cancel()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete payment"})
			return
		}

		c.JSON(http.StatusOK, result)
	}
}

func CreateStripePayment() gin.HandlerFunc {
	return func(c *gin.Context) {
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var paymentRequest struct {
			Amount      float64 `json:"amount" validate:"required"`
			Currency    string  `json:"currency"`
			Description string  `json:"description"`
			Method      string  `json:"method"`
		}

		if err := c.BindJSON(&paymentRequest); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if paymentRequest.Amount <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "amount must be greater than 0"})
			return
		}

		if paymentRequest.Currency == "" {
			paymentRequest.Currency = "usd"
		}

		userId, exists := c.Get("uid")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user id not found in context"})
			return
		}

		var payment models.Payment
		payment.Amount = &paymentRequest.Amount
		payment.Method = &paymentRequest.Method

		status := 1
		payment.Status = &status

		userIdStr := userId.(string)
		payment.User_id = &userIdStr

		payment.Created_at, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
		payment.Updated_at, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
		payment.ID = primitive.NewObjectID()
		payment.Payment_id = payment.ID.Hex()

		_, insertErr := paymentCollection.InsertOne(ctx, payment)
		if insertErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create payment record"})
			return
		}

		stripeSecretKey := os.Getenv("STRIPE_SECRET_KEY")
		if stripeSecretKey == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Stripe secret key not configured"})
			return
		}

		stripe.Key = stripeSecretKey

		frontedURL := os.Getenv("FRONTEND_URL")
		transactionParam := c.Query("transaction")

		successURL := fmt.Sprintf("%s/member/transactions/buy/%s?payment=%s&payment_status=success", frontedURL, transactionParam, payment.Payment_id)
		cancelURL := fmt.Sprintf("%s/member/transactions/buy/%s?payment=%s&payment_status=cancel", frontedURL, transactionParam, payment.Payment_id)

		params := &stripe.CheckoutSessionParams{
			PaymentMethodTypes: stripe.StringSlice([]string{
				"card",
				// "promptpay",
			}),
			LineItems: []*stripe.CheckoutSessionLineItemParams{
				{
					PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
						Currency: stripe.String(paymentRequest.Currency),
						ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
							Name: stripe.String(paymentRequest.Description),
						},
						UnitAmount: stripe.Int64(int64(paymentRequest.Amount * 100)),
					},
					Quantity: stripe.Int64(1),
				},
			},
			Mode:              stripe.String("payment"),
			SuccessURL:        stripe.String(successURL),
			CancelURL:         stripe.String(cancelURL),
			ClientReferenceID: stripe.String(payment.Payment_id),
		}

		session, err := session.New(params)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"payment_id":   payment.Payment_id,
			"checkout_url": session.URL,
		})
	}
}
