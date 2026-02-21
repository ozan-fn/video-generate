package pippit

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

// CreatePippitJob godoc
// @Summary Create Pippit job
// @Tags Pippit
// @Accept multipart/form-data
// @Param image formData file true "Image file"
// @Param prompt formData string true "Prompt text"
// @Success 201 {object} map[string]string
// @Router /api/pippit [post]
func createPippitJob(c fiber.Ctx) error {
	// Parse multipart form
	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid form data"})
	}

	prompt := form.Value["prompt"]
	if len(prompt) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Prompt is required"})
	}

	files := form.File["image"]
	if len(files) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Image file required"})
	}

	// Generate job ID
	jobID := uuid.New().String()

	// Create cache folder for this job
	cacheDir := "./.cache/" + jobID
	if err := os.MkdirAll(cacheDir, 0755); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create cache folder"})
	}

	// Save uploaded files
	for _, file := range files {
		filePath := filepath.Join(cacheDir, file.Filename)
		if err := c.SaveFile(file, filePath); err != nil {
			os.RemoveAll(cacheDir)
			return c.Status(500).JSON(fiber.Map{"error": "Failed to save file"})
		}
	}

	// Create job and add to queue
	job := &PippitJob{
		ID:        jobID,
		Prompt:    prompt[0],
		Status:    "pending",
		CreatedAt: time.Now(),
	}

	jobMutex.Lock()
	jobs[jobID] = job
	jobMutex.Unlock()

	// Send to worker queue
	jobQueue <- job

	return c.Status(201).JSON(fiber.Map{"job_id": jobID})
}

// ListPippitJobs godoc
// @Summary List all Pippit jobs
// @Tags Pippit
// @Success 200 {array} PippitJob
// @Router /api/pippit [get]
func listPippitJobs(c fiber.Ctx) error {
	jobMutex.RLock()
	defer jobMutex.RUnlock()

	var jobList []*PippitJob
	for _, job := range jobs {
		jobList = append(jobList, job)
	}

	if len(jobList) == 0 {
		return c.JSON([]PippitJob{})
	}

	return c.JSON(jobList)
}

// GetPippitJob godoc
// @Summary Get Pippit job status
// @Tags Pippit
// @Param id path string true "Job ID"
// @Success 200 {object} PippitJob
// @Router /api/pippit/{id} [get]
func getPippitJob(c fiber.Ctx) error {
	jobID := c.Params("id")

	jobMutex.RLock()
	job, exists := jobs[jobID]
	jobMutex.RUnlock()

	if !exists {
		return c.Status(404).JSON(fiber.Map{"error": "Job not found"})
	}

	return c.JSON(job)
}

// GetPippitScreenshot godoc
// @Summary Get Pippit job screenshot
// @Tags Pippit
// @Param id path string true "Job ID"
// @Success 200 {file} image/png
// @Router /api/pippit/{id}/screenshot [get]
func getPippitScreenshot(c fiber.Ctx) error {
	jobID := c.Params("id")

	jobMutex.RLock()
	job, exists := jobs[jobID]
	jobMutex.RUnlock()

	if !exists {
		return c.Status(404).JSON(fiber.Map{"error": "Job not found"})
	}

	if len(job.ScreenshotData) == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Screenshot not available"})
	}

	c.Set("Content-Type", "image/png")
	return c.Send(job.ScreenshotData)
}

// ListPippitVideos godoc
// @Summary List all Pippit videos
// @Tags Pippit
// @Success 200 {array} map[string]string
// @Router /api/pippit/video [get]
func listPippitVideos(c fiber.Ctx) error {
	storageDir := "./storage"

	// Create storage folder if not exists
	if err := os.MkdirAll(storageDir, 0755); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create storage folder"})
	}

	files, err := os.ReadDir(storageDir)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to read storage directory"})
	}

	var videos []fiber.Map
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".mp4") {
			info, _ := file.Info()
			videos = append(videos, fiber.Map{
				"filename": file.Name(),
				"size":     info.Size(),
				"modified": info.ModTime(),
				"url":      fmt.Sprintf("/api/pippit/video/%s", file.Name()),
			})
		}
	}

	return c.JSON(videos)
}

// GetPippitVideo godoc
// @Summary Download Pippit video
// @Tags Pippit
// @Param filename path string true "Video filename"
// @Success 200 {file} video/mp4
// @Router /api/pippit/video/{filename} [get]
func getPippitVideo(c fiber.Ctx) error {
	filename := c.Params("filename")

	// Security check - only allow .mp4 files
	if !strings.HasSuffix(filename, ".mp4") {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid file format"})
	}

	filePath := filepath.Join("./storage", filename)

	// Check if file exists
	if _, err := os.Stat(filePath); err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Video not found"})
	}

	c.Set("Content-Type", "video/mp4")
	return c.SendFile(filePath)
}

// RegisterRoutes registers the routes for the Pippit feature.
func RegisterRoutes(app *fiber.App) {
	app.Post("/api/pippit", createPippitJob)
	app.Get("/api/pippit", listPippitJobs)
	app.Get("/api/pippit/:id", getPippitJob)
	app.Get("/api/pippit/:id/screenshot", getPippitScreenshot)
	app.Get("/api/pippit/video", listPippitVideos)
	app.Get("/api/pippit/video/:filename", getPippitVideo)
}
