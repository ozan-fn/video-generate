package controller

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"log"
	"strings"
	"time"
	"zan6/database"
	"zan6/lib"
	"zan6/repository"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/proto"
	"github.com/gofiber/fiber/v2"
)

var (
	sessionRepo     *repository.SessionRepository
	browserSessions = make(map[string]*BrowserSession)
)

func getSessionRepo() *repository.SessionRepository {
	if sessionRepo == nil {
		sessionRepo = repository.NewSessionRepository()
	}
	return sessionRepo
}

func RegisterRoutes(app *fiber.App) {
	app.Post("/api/session", AddSession)
	app.Get("/api/session", ListSessions)
	app.Post("/api/session/click", ClickElement)
	app.Delete("/api/session", DeleteSession)
	app.Get("/api/session/check", CheckSession)
}

type BrowserSession struct {
	Email     string
	Incognito *rod.Browser
	Page      *rod.Page
}

type Request struct {
	Email string `json:"email"`
	Passs string `json:"passs"`
}

type ResponseSession struct {
	Email      string `json:"email"`
	Screenshot string `json:"screenshot"`
	URL        string `json:"url"`
	Title      string `json:"title"`
	Cookies    string `json:"cookies"`
}

// @Summary Login session
// @Description Create a new session and save cookies to MongoDB
// @Tags session
// @Accept json
// @Produce json
// @Param request body Request true "Login request"
// @Success 200 {object} map[string]string
// @Router /api/session [post]
func AddSession(c *fiber.Ctx) error {
	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if req.Email == "" || req.Passs == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email and password are required"})
	}

	browser := lib.GetBrowser()
	incognito := browser.MustIncognito()
	page := incognito.MustPage("https://gemini.google.com")

	// Login process
	err := rod.Try(func() {
		page.Timeout(30 * time.Second).MustElement(`a[aria-label="Sign in"]`).MustWaitVisible().MustClick()

		emailInput := page.Timeout(30 * time.Second).MustElement(`input[type="email"]`).MustWaitVisible()
		emailInput.MustInput(req.Email)
		page.Timeout(15 * time.Second).MustElement(`#identifierNext`).MustWaitVisible().MustClick()

		emailInput.MustWaitInvisible()

		passwordInput := page.Timeout(30 * time.Second).MustElement(`input[type="password"]`).MustWaitVisible()
		passwordInput.MustInput(req.Passs)
		page.Timeout(15 * time.Second).MustElement(`#passwordNext`).MustWaitVisible().MustClick()

		passwordInput.WaitInvisible()
	})

	if err != nil {
		incognito.MustClose()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	// Check if login was successful
	if strings.HasPrefix(page.MustInfo().URL, "https://gemini.google.com") {
		cookies := page.MustCookies()
		cookiesJSON, err := json.Marshal(cookies)
		if err != nil {
			log.Printf("Error marshaling cookies: %v", err)
		}

		database.DB.Collection("sessions").InsertOne(context.Background(),
			map[string]interface{}{
				"email":      req.Email,
				"cookies":    string(cookiesJSON),
				"created_at": time.Now(),
				"updated_at": time.Now(),
			},
		)

		incognito.MustClose()

		return c.JSON(fiber.Map{
			"status": "ok",
		})
	}

	// Store browser session in memory
	browserSessions[req.Email] = &BrowserSession{
		Email:     req.Email,
		Incognito: incognito,
		Page:      page,
	}

	return c.JSON(fiber.Map{
		"message": "Session created",
		"email":   req.Email,
	})
}

// @Summary List sessions
// @Description Get list of active sessions with cookies
// @Tags session
// @Produce json
// @Success 200 {array} ResponseSession
// @Router /api/session [get]
func ListSessions(c *fiber.Ctx) error {
	// Get sessions from MongoDB
	var sessionList []ResponseSession

	sessions, err := getSessionRepo().FindAllActive()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	for _, session := range sessions {
		sessionList = append(sessionList, ResponseSession{
			Email:   session.Email,
			Cookies: session.Cookies,
		})
	}

	for _, browserSession := range browserSessions {
		response := ResponseSession{
			Email:   browserSession.Email,
			Cookies: "",
		}

		rod.Try(func() {
			screenshot := browserSession.Page.MustScreenshot()
			response.Screenshot = base64.StdEncoding.EncodeToString(screenshot)
			response.URL = browserSession.Page.MustInfo().URL
			response.Title = browserSession.Page.MustInfo().Title
		})

		sessionList = append(sessionList, response)
	}

	return c.JSON(sessionList)
}

type ClickRequest struct {
	Email    string `json:"email"`
	Selector string `json:"selector"`
}

// @Summary Click element
// @Description Click an element in the session
// @Tags session
// @Accept json
// @Produce json
// @Param request body ClickRequest true "Click request"
// @Success 200 {string} string "Clicked"
// @Router /api/session/click [post]
func ClickElement(c *fiber.Ctx) error {
	var req ClickRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	session, exists := browserSessions[req.Email]
	if !exists {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Session not found"})
	}

	err := rod.Try(func() {
		session.Page.Timeout(10 * time.Second).MustElement(req.Selector).MustWaitVisible().MustClick()
	})

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Clicked"})
}

// @Summary Delete session
// @Description Delete session from MongoDB and close browser
// @Tags session
// @Param email query string true "Email"
// @Success 200 {object} map[string]string
// @Router /api/session [delete]
func DeleteSession(c *fiber.Ctx) error {
	email := c.Query("email")
	if email == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email is required"})
	}

	// Close browser session if exists
	if browserSession, exists := browserSessions[email]; exists {
		browserSession.Incognito.MustClose()
		delete(browserSessions, email)
	}

	// Delete from MongoDB
	err := getSessionRepo().Delete(email)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Session deleted"})
}

// @Summary Check session
// @Description Check if session is still valid
// @Tags session
// @Param email query string true "Email"
// @Success 200 {object} map[string]bool
// @Router /api/session/check [get]
func CheckSession(c *fiber.Ctx) error {
	email := c.Query("email")
	if email == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email is required"})
	}

	// Get session from database
	session, err := getSessionRepo().FindByEmail(email)
	if err != nil || session == nil {
		return c.JSON(fiber.Map{"exists": false})
	}

	// Create new browser and page
	browser := lib.GetBrowser()
	incognito := browser.MustIncognito()
	page := incognito.MustPage("about:blank")

	// Load cookies from database first

	var cookies []*proto.NetworkCookieParam
	err = json.Unmarshal([]byte(session.Cookies), &cookies)
	if err != nil {
		log.Fatal(err)
	}

	err = rod.Try(func() {
		page.SetCookies(cookies)
		page.Navigate("https://gemini.google.com")
		page.Timeout(10 * time.Second).MustElement(`a[aria-label^="Google Account: "], a[aria-label^="Akun Google: "]`).MustWaitVisible()
	})
	defer incognito.MustClose()

	if err != nil {
		return c.JSON(fiber.Map{"exists": false})
	}

	return c.JSON(fiber.Map{"exists": true})
}
