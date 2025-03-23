package routes

import (
	"user-athentication-golang/controllers"
	controller "user-athentication-golang/controllers"
	"user-athentication-golang/middleware"

	"github.com/gin-gonic/gin"
)

func UserRoutes(incomingRoutes *gin.Engine) {
	incomingRoutes.Use(middleware.Authentication())

	incomingRoutes.GET("/users/me", controller.GetCurrentUser())
	incomingRoutes.GET("/auth/verify", controller.VerifyAdmin())
	incomingRoutes.GET("/auth/data", controller.GetCurrentUserData())

	incomingRoutes.GET("/users", controller.GetUsers())
	incomingRoutes.GET("/users/:user_id", controller.GetUser())
	incomingRoutes.POST("/users", controller.CreateUser())
	incomingRoutes.PUT("/users/:user_id", controller.UpdateUser())
	incomingRoutes.DELETE("/users/:user_id", controller.DeleteUser())
	incomingRoutes.GET("/users/username", controller.GetUsernameByID())

	incomingRoutes.GET("/products", controller.GetProducts())
	incomingRoutes.GET("/products/:product_id", controller.GetProduct())
	incomingRoutes.POST("/products", controller.CreateProduct())
	incomingRoutes.PUT("/products/:product_id", controller.UpdateProduct())
	incomingRoutes.DELETE("/products/:product_id", controller.DeleteProduct())
	incomingRoutes.POST("/products/remove/:product_id", controller.RemoveProduct())

	incomingRoutes.GET("/addresses", controller.GetAddresses())
	incomingRoutes.GET("/addresses/:address_id", controller.GetAddress())
	incomingRoutes.POST("/addresses", controller.CreateAddress())
	incomingRoutes.PUT("/addresses/:address_id", controller.UpdateAddress())
	incomingRoutes.DELETE("/addresses/:address_id", controller.DeleteAddress())
	incomingRoutes.POST("/addresses/remove/:address_id", controller.RemoveAddress())

	incomingRoutes.GET("/payments", controller.GetPayments())
	incomingRoutes.GET("/payments/:payment_id", controller.GetPayment())
	incomingRoutes.POST("/payments", controller.CreatePayment())
	incomingRoutes.PUT("/payments/:payment_id", controller.UpdatePayment())
	incomingRoutes.DELETE("/payments/:payment_id", controller.DeletePayment())

	incomingRoutes.GET("/withdrawals", controller.GetWithdrawals())
	incomingRoutes.GET("/withdrawals/:withdrawal_id", controller.GetWithdrawal())
	incomingRoutes.POST("/withdrawals", controller.CreateWithdrawal())
	incomingRoutes.PUT("/withdrawals/:withdrawal_id", controller.UpdateWithdrawal())
	incomingRoutes.DELETE("/withdrawals/:withdrawal_id", controller.DeleteWithdrawal())

	incomingRoutes.GET("/transactions", controller.GetTransactions())
	incomingRoutes.GET("/transactions/:transaction_id", controller.GetTransaction())
	incomingRoutes.POST("/transactions", controller.CreateTransaction())
	incomingRoutes.PUT("/transactions/:transaction_id", controller.UpdateTransaction())
	incomingRoutes.DELETE("/transactions/:transaction_id", controller.DeleteTransaction())

	incomingRoutes.POST("/upload", controllers.UploadFile())
	incomingRoutes.GET("/files", controller.GetFiles())
	incomingRoutes.GET("/files/:file_id", controllers.GetFile())
	incomingRoutes.DELETE("/files/:file_id", controller.DeleteFile())

	incomingRoutes.PUT("/users/:user_id/password", controllers.UpdatePassword())

	incomingRoutes.POST("/pay", controllers.CreateStripePayment())

}
