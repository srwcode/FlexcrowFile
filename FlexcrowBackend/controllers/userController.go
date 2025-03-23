package controllers

import (
	"context"
	"fmt"
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
	"golang.org/x/crypto/bcrypt"
)

var userCollection *mongo.Collection = database.OpenCollection(database.Client, "user")
var validate = validator.New()

func HashPassword(password string) string {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	if err != nil {
		log.Panic(err)
	}

	return string(bytes)
}

func VerifyPassword(userPassword string, providedPassword string) (bool, string) {
	err := bcrypt.CompareHashAndPassword([]byte(providedPassword), []byte(userPassword))
	check := true
	msg := ""

	if err != nil {
		msg = fmt.Sprintf("login or passowrd is incorrect 555")
		check = false
	}

	return check, msg
}

func SignUp() gin.HandlerFunc {
	return func(c *gin.Context) {
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		var user models.User

		if err := c.BindJSON(&user); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		defaultStatus := 1
		user.Status = &defaultStatus

		validationErr := validate.Struct(user)
		if validationErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": validationErr.Error()})
			return
		}

		count, err := userCollection.CountDocuments(ctx, bson.M{"email": user.Email})
		defer cancel()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occurred while checking email"})
			return
		}
		if count > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "email_error"})
			return
		}

		usernameCount, err := userCollection.CountDocuments(ctx, bson.M{"username": user.Username})
		defer cancel()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occurred while checking username"})
			return
		}
		if usernameCount > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "username_error"})
			return
		}

		password := HashPassword(*user.Password)
		user.Password = &password
		user.Created_at, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
		user.Updated_at, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
		user.ID = primitive.NewObjectID()
		user.User_id = user.ID.Hex()
		token, refreshToken, _ := helper.GenerateAllTokens(*user.Email, *user.First_name, *user.Last_name, *user.User_type, *&user.User_id)
		user.Token = &token
		user.Refresh_token = &refreshToken

		resultInsertionNumber, insertErr := userCollection.InsertOne(ctx, user)
		if insertErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
			return
		}

		c.JSON(http.StatusOK, resultInsertionNumber)

	}
}

func Login() gin.HandlerFunc {
	return func(c *gin.Context) {
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		var user models.User
		var foundUser models.User

		if err := c.BindJSON(&user); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err := userCollection.FindOne(ctx, bson.M{"email": user.Email}).Decode(&foundUser)
		defer cancel()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "login or passowrd is incorrect 555"})
			return
		}

		passwordIsValid, msg := VerifyPassword(*user.Password, *foundUser.Password)
		defer cancel()
		if passwordIsValid != true {
			c.JSON(http.StatusInternalServerError, gin.H{"error": msg})
			return
		}

		if foundUser.Email == nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
			return
		}
		token, refreshToken, _ := helper.GenerateAllTokens(*foundUser.Email, *foundUser.First_name, *foundUser.Last_name, *foundUser.User_type, foundUser.User_id)

		helper.UpdateAllTokens(token, refreshToken, foundUser.User_id)
		err = userCollection.FindOne(ctx, bson.M{"user_id": foundUser.User_id}).Decode(&foundUser)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, foundUser)

	}
}

func GetUsers() gin.HandlerFunc {
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
				{"user_items", bson.D{{"$slice", []interface{}{"$data", startIndex, recordPerPage}}}},
			}}}

		result, err := userCollection.Aggregate(ctx, mongo.Pipeline{
			matchStage, sortStage, groupStage, projectStage})
		defer cancel()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occured while listing user items"})
		}
		var allusers []bson.M
		if err = result.All(ctx, &allusers); err != nil {
			log.Fatal(err)
		}
		c.JSON(http.StatusOK, allusers[0])

	}
}

func GetUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		userId := c.Param("user_id")

		if err := helper.MatchUserTypeToUid(c, userId); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)

		var user models.User

		err := userCollection.FindOne(ctx, bson.M{"user_id": userId}).Decode(&user)
		defer cancel()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, user)

	}
}

func GetCurrentUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		userId := c.GetString("uid")

		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)

		var user models.User

		err := userCollection.FindOne(ctx, bson.M{"user_id": userId}).Decode(&user)
		defer cancel()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, user)
	}
}

func CreateUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := helper.CheckUserType(c, "ADMIN"); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		var user models.User

		if err := c.BindJSON(&user); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		validationErr := validate.Struct(user)
		if validationErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": validationErr.Error()})
			return
		}

		count, err := userCollection.CountDocuments(ctx, bson.M{"email": user.Email})
		defer cancel()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occurred while checking email"})
			return
		}
		if count > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "email_error"})
			return
		}

		usernameCount, err := userCollection.CountDocuments(ctx, bson.M{"username": user.Username})
		defer cancel()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occurred while checking username"})
			return
		}
		if usernameCount > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "username_error"})
			return
		}

		password := HashPassword(*user.Password)
		user.Password = &password

		user.Created_at, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
		user.Updated_at, _ = time.Parse(time.RFC3339, time.Now().Format(time.RFC3339))
		user.ID = primitive.NewObjectID()
		user.User_id = user.ID.Hex()

		resultInsertionNumber, insertErr := userCollection.InsertOne(ctx, user)
		if insertErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
			return
		}

		c.JSON(http.StatusOK, resultInsertionNumber)
	}
}

func UpdateUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		userId := c.Param("user_id")
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var existingUser models.User
		err := userCollection.FindOne(ctx, bson.M{"user_id": userId}).Decode(&existingUser)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occurred while fetching user"})
			return
		}

		userType, exists := c.Get("user_type")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user type not found in context"})
			return
		}

		contextUserId, exists := c.Get("uid")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user id not found in context"})
			return
		}

		userIdStr, ok := contextUserId.(string)
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user id in context is not a valid string"})
			return
		}

		transactionParam := c.Query("transaction")

		if userType != "ADMIN" {
			if (existingUser.User_id != userIdStr && transactionParam != "true") || (existingUser.Status != nil && *existingUser.Status != 1) {
				c.JSON(http.StatusForbidden, gin.H{"error": "you are not authorized to update this user"})
				return
			}
		}

		var updateData models.User
		if err := c.BindJSON(&updateData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if updateData.Email != nil && *updateData.Email != *existingUser.Email {
			count, err := userCollection.CountDocuments(ctx, bson.M{
				"email":   updateData.Email,
				"user_id": bson.M{"$ne": userId},
			})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "error occurred while checking email"})
				return
			}
			if count > 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "email_error"})
				return
			}
		}

		if updateData.Username != nil && *updateData.Username != *existingUser.Username {
			count, err := userCollection.CountDocuments(ctx, bson.M{
				"username": updateData.Username,
				"user_id":  bson.M{"$ne": userId},
			})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "error occurred while checking username"})
				return
			}
			if count > 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "username_error"})
				return
			}
		}

		update := bson.M{}

		if updateData.Username != nil {
			update["username"] = updateData.Username
		}
		if updateData.Email != nil {
			update["email"] = updateData.Email
		}
		if updateData.First_name != nil {
			update["first_name"] = updateData.First_name
		}
		if updateData.Last_name != nil {
			update["last_name"] = updateData.Last_name
		}
		if updateData.Phone != nil {
			update["phone"] = updateData.Phone
		}
		if updateData.User_type != nil {
			update["user_type"] = updateData.User_type
		}
		if updateData.Status != nil {
			update["status"] = updateData.Status
		}
		if updateData.Balance != nil {
			update["balance"] = updateData.Balance
		}
		if updateData.Image_id != nil {
			update["image_id"] = updateData.Image_id
		}
		if updateData.Address_id != nil {
			update["address_id"] = updateData.Address_id
		}

		if updateData.Password != nil && *updateData.Password != "" {
			hashedPassword := HashPassword(*updateData.Password)
			update["password"] = &hashedPassword
		}

		update["updated_at"] = time.Now().Format(time.RFC3339)

		result, err := userCollection.UpdateOne(
			ctx,
			bson.M{"user_id": userId},
			bson.M{"$set": update},
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user"})
			return
		}

		if result.MatchedCount == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}

		c.JSON(http.StatusOK, result.ModifiedCount)
	}
}

func DeleteUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := helper.CheckUserType(c, "ADMIN"); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		userId := c.Param("user_id")
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)

		result, err := userCollection.DeleteOne(ctx, bson.M{"user_id": userId})
		defer cancel()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete user"})
			return
		}

		c.JSON(http.StatusOK, result)
	}
}

func VerifyAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		userType := c.GetString("user_type")
		c.JSON(http.StatusOK, gin.H{"user_type": userType})
	}
}

func GetUsernameByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.Query("user_id")

		var user models.User
		err := userCollection.FindOne(context.TODO(), bson.M{"user_id": userID}).Decode(&user)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching user"})
			return
		}

		if user.Username == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Username not found"})
			return
		}

		userData := gin.H{
			"user_id":    user.User_id,
			"username":   user.Username,
			"email":      user.Email,
			"first_name": user.First_name,
			"last_name":  user.Last_name,
			"user_type":  user.User_type,
			"phone":      user.Phone,
			"balance":    user.Balance,
			"image_id":   user.Image_id,
		}

		c.JSON(http.StatusOK, userData)
	}
}

func GetCurrentUserData() gin.HandlerFunc {
	return func(c *gin.Context) {

		userId := c.GetString("uid")
		if userId == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var user models.User

		err := userCollection.FindOne(ctx, bson.M{"user_id": userId}).Decode(&user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occurred while fetching user data"})
			return
		}

		userData := gin.H{
			"user_id":    user.User_id,
			"username":   user.Username,
			"email":      user.Email,
			"first_name": user.First_name,
			"last_name":  user.Last_name,
			"user_type":  user.User_type,
			"status":     user.Status,
			"balance":    user.Balance,
			"image_id":   user.Image_id,
			"address_id": user.Address_id,
			"phone":      user.Phone,
		}

		c.JSON(http.StatusOK, userData)
	}
}

func UpdatePassword() gin.HandlerFunc {
	return func(c *gin.Context) {
		userId := c.Param("user_id")
		var ctx, cancel = context.WithTimeout(context.Background(), 100*time.Second)
		defer cancel()

		var existingUser models.User
		err := userCollection.FindOne(ctx, bson.M{"user_id": userId}).Decode(&existingUser)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error occurred while fetching user"})
			return
		}

		contextUserId, exists := c.Get("uid")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user id not found in context"})
			return
		}

		userIdStr, ok := contextUserId.(string)
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "user id in context is not a valid string"})
			return
		}

		userType, _ := c.Get("user_type")
		if userType != "ADMIN" && existingUser.User_id != userIdStr {
			c.JSON(http.StatusForbidden, gin.H{"error": "you are not authorized to update this user's password"})
			return
		}

		type PasswordUpdate struct {
			CurrentPassword string `json:"current_password" binding:"required"`
			NewPassword     string `json:"new_password" binding:"required,min=6"`
		}

		var passwordData PasswordUpdate
		if err := c.BindJSON(&passwordData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if existingUser.Password == nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "user password data is corrupted"})
			return
		}

		passwordIsValid, _ := VerifyPassword(passwordData.CurrentPassword, *existingUser.Password)
		if !passwordIsValid {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_password"})
			return
		}

		hashedPassword := HashPassword(passwordData.NewPassword)

		result, err := userCollection.UpdateOne(
			ctx,
			bson.M{"user_id": userId},
			bson.M{"$set": bson.M{
				"password":   hashedPassword,
				"updated_at": time.Now().Format(time.RFC3339),
			}},
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update password"})
			return
		}

		if result.MatchedCount == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
	}
}
