package controller

import (
	"context"
	"zan6/lib"

	"github.com/chromedp/chromedp"
	"github.com/gofiber/fiber/v2"
)

var sessions = make(map[string]struct {
	Email string
	Ctx   context.Context
})

type Request struct {
	Email string `json:"email"`
	Passs string `json:"passs"`
}

// @Summary Login session
// @Description Create a new session
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

	browserCtx, _ := lib.GetBrowser()

	ctx, _ := chromedp.NewContext(browserCtx)

	sessions[req.Email] = struct {
		Email string
		Ctx   context.Context
	}{
		Email: req.Email,
		Ctx:   ctx,
	}

	err := chromedp.Run(ctx,
		chromedp.Navigate("https://gemini.google"),

		chromedp.Click(`a[aria-label="Sign in"]`, chromedp.ByQuery),

		chromedp.WaitVisible(`input[type="email"]`, chromedp.ByQuery),
		chromedp.SendKeys(`input[type="email"]`, req.Email+"\n", chromedp.ByQuery),

		chromedp.WaitVisible(`input[type="password"]`, chromedp.ByQuery),
		chromedp.SendKeys(`input[type="password"]`, req.Passs+"\n", chromedp.ByQuery),
	)

	if err != nil {
		return err
	}

	return c.SendString("OK")
}

type ResponseSession struct {
	Email      string `json:"email"`
	Screenshot []byte `json:"screenshot"`
}

// @Summary List sessions
// @Description Get list of active sessions
// @Tags session
// @Produce json
// @Success 200 {array} ResponseSession
// @Router /api/session [get]
func ListSessions(c *fiber.Ctx) error {
	var sessionList []struct {
		Email      string
		Screenshot []byte
	}
	for email := range sessions {
		var screenshot []byte
		_ = chromedp.Run(sessions[email].Ctx,
			chromedp.FullScreenshot(&screenshot, 75),
		)
		sessionList = append(sessionList, struct {
			Email      string
			Screenshot []byte
		}{
			Email:      email,
			Screenshot: screenshot,
		})
	}
	return c.JSON(sessionList)
}

// ClickRequest adalah body untuk ClickElement
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
	type ClickRequest struct {
		Email    string `json:"email"`
		Selector string `json:"selector"`
	}
	var req ClickRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	session, exists := sessions[req.Email]
	if !exists {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Session not found"})
	}

	err := chromedp.Run(session.Ctx,
		chromedp.Click(req.Selector, chromedp.ByQuery),
	)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendString("Clicked")
}

// @Summary Delete session
// @Description Delete an existing session
// @Tags session
// @Param email query string true "Email of the session to delete"
// @Success 200 {string} string "Session deleted"
// @Router /api/session [delete]
func DeleteSession(c *fiber.Ctx) error {
	email := c.Query("email")
	if email == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email is required"})
	}

	session, exists := sessions[email]
	if !exists {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Session not found"})
	}

	chromedp.Cancel(session.Ctx)
	delete(sessions, email)

	return c.JSON(fiber.Map{"message": "Session deleted"})
}
