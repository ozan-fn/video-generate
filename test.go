//go:build ignore

package main

import (
	"fmt"
	"time"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
)

func main() {
	email := "ozan6825@gmail.com"
	password := "your-password"

	l := launcher.New().
		Bin("C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe").
		Headless(false).
		Set("no-sandbox").
		Set("disable-setuid-sandbox").
		Set("disable-dev-shm-usage").
		Set("disable-blink-features", "AutomationControlled").
		Set("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0")

	url := l.MustLaunch()
	defer l.Cleanup()

	browser := rod.New().ControlURL(url).MustConnect()
	defer browser.MustClose()

	// Buat incognito context
	incognito := browser.MustIncognito()
	defer incognito.MustClose()

	// Gunakan page dari incognito context
	page := incognito.MustPage("https://gemini.google.com")

	// Sign in
	fmt.Println("=== Sign In (Incognito Mode) ===")
	page.Timeout(30 * time.Second).MustElement(`a[aria-label="Sign in"]`).MustWaitVisible().MustClick()

	// Email
	fmt.Println("\n=== Email ===")
	emailInput := page.Timeout(30 * time.Second).MustElement(`input[type="email"]`).MustWaitVisible()
	emailInput.MustInput(email)

	// Click next dan tunggu email input hilang
	fmt.Println("Clicking Next and waiting for page transition...")
	page.Timeout(15 * time.Second).MustElement(`#identifierNext`).MustWaitVisible().MustClick()

	// Wait sampai email input HILANG
	emailInput.MustWaitInvisible()
	fmt.Println("✓ Email input disappeared - page transitioned")

	// Password
	fmt.Println("\n=== Password ===")
	passwordInput := page.Timeout(30 * time.Second).MustElement(`input[type="password"]`).MustWaitVisible()
	passwordInput.MustInput(password)

	page.Timeout(15 * time.Second).MustElement(`#passwordNext`).MustWaitVisible().MustClick()

	fmt.Println("\n✓ Done!")
}
