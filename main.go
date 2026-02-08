package main

import (
	"log"

	"zan6/controller"

	"github.com/gofiber/fiber/v2"
)

func main() {
	app := fiber.New()

	app.Post("/api/session", controller.AddSession)
	app.Get("/api/session", controller.ListSessions)
	app.Post("/api/session/click", controller.ClickElement)
	app.Delete("/api/session", controller.DeleteSession)

	app.Get("/swagger.json", func(c *fiber.Ctx) error {
		return c.SendFile("./docs/swagger.json")
	})

	app.Get("/docs", func(c *fiber.Ctx) error {
		return c.SendFile("./public/scalar.html")
	})

	log.Fatal(app.Listen(":2048"))
}
