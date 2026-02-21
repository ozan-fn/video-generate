package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"

	"main/docs"
	"main/features/hello"
	"main/features/pippit"
	"main/lib"

	"github.com/MarceloPetrucio/go-scalar-api-reference"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/compress"
	"github.com/gofiber/fiber/v3/middleware/static"
	"github.com/joho/godotenv"
)

//go:embed all:client/out
var staticFiles embed.FS

func main() {
	godotenv.Load()

	// Initialize database
	if err := lib.InitDB(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	go lib.StartCloudflared()

	app := fiber.New()

	app.Use(compress.New(compress.Config{Level: 2}))

	distFS, err := fs.Sub(staticFiles, "client/out")
	if err != nil {
		log.Fatalf("Failed to create sub filesystem: %v", err)
	}

	app.Use(static.New("", static.Config{
		FS: distFS,
	}))

	// Register API routes
	hello.RegisterRoutes(app)
	pippit.RegisterRoutes(app)
	//

	// @title           Simple API
	// @version         9999.9.9
	app.Get("/docs", func(c fiber.Ctx) error {
		htmlContent, err := scalar.ApiReferenceHTML(&scalar.Options{
			SpecContent: docs.SwaggerInfo.ReadDoc(),
			CustomOptions: scalar.CustomOptions{
				PageTitle: "Simple API",
			},
			DarkMode: true,
			Theme:    scalar.ThemeAlternate,
		})

		if err != nil {
			fmt.Printf("%v", err)
		}

		return c.Type("html").SendString(htmlContent)
	})

	app.Use(func(c fiber.Ctx) error {
		data, err := fs.ReadFile(distFS, "404/index.html")
		if err != nil {
			return c.Status(fiber.StatusNotFound).SendString("404 Not Found")
		}
		return c.Status(fiber.StatusNotFound).Type("html").Send(data)
	})

	log.Fatal(app.Listen(":3000"))
}
