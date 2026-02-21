package hello

import (
	"github.com/gofiber/fiber/v3"
)

// @Summary      Get Hello Message
// @Description  Returns a simple hello message from the API
// @Tags         hello
// @Router       /api/hello [get]
func RegisterRoutes(app *fiber.App) {
	app.Get("/api/hello", func(c fiber.Ctx) error {
		return c.Status(fiber.StatusOK).SendString("Hello from Go API!")
	})
}
