package main

import (
	"log"
	"os"

	"zan6/controller"
	"zan6/database"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env
	godotenv.Load()

	// Connect to MongoDB
	if err := database.Connect(); err != nil {
		log.Fatal("Failed to connect to MongoDB:", err)
	}
	defer database.Disconnect()

	app := fiber.New()

	// Register session routes
	controller.RegisterRoutes(app)

	app.Get("/swagger.json", func(c *fiber.Ctx) error {
		return c.SendFile("./docs/swagger.json")
	})

	app.Get("/docs", func(c *fiber.Ctx) error {
		return c.SendFile("./public/scalar.html")
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "2048"
	}
	log.Fatal(app.Listen(":" + port))
}
