//go:build ignore

package main

import (
	"encoding/json"
	"fmt"
	"main/lib"
	"net/http"
	"regexp"
	"time"

	"github.com/go-rod/rod/lib/input"
	"github.com/go-rod/rod/lib/proto"
)

type Email struct {
	ID        int    `json:"id"`
	Sender    string `json:"sender"`
	Subject   string `json:"subject"`
	Body      string `json:"body"`
	CreatedAt string `json:"created_at"`
}

func fetchEmails(url string) ([]Email, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var emails []Email
	if err := json.NewDecoder(resp.Body).Decode(&emails); err != nil {
		return nil, err
	}

	return emails, nil
}

func main() {
	browser := lib.GetBrowser()

	for i := 49; i <= 50; i++ {
		email := fmt.Sprintf("%03d@1only.my.id", i)
		fmt.Printf("Processing email: %s\n", email)

		page := browser.MustIncognito().MustPage("https://www.pippit.ai/login")
		page.MustWaitLoad()

		page.MustElementR("span", "Continue with email").MustWaitVisible().MustClick()
		page.MustElementR("span", "Sign up").MustWaitVisible().MustClick()

		page.MustElement(`input[type="text"]`).MustWaitVisible().MustInput(email)
		page.MustElement(`input[type="password"]`).MustInput("Akhmad6825")

		page.MustElementR("span", "Continue").MustClick()

		url := "https://polished-night-a4e5.ozan6825-09f.workers.dev/"

		// Fetch initial emails after signup
		initialEmails, err := fetchEmails(url)
		if err != nil {
			fmt.Printf("Error fetching initial emails for %s: %v\n", email, err)
			page.MustClose()
			continue
		}
		fmt.Printf("Initial emails count: %d\n", len(initialEmails))
		var lastID int
		if len(initialEmails) > 0 {
			lastID = initialEmails[0].ID // Assuming sorted descending
			fmt.Printf("Initial last ID: %d\n", lastID)
		}

		var code string

		for {
			emails, err := fetchEmails(url)
			if err != nil {
				fmt.Println("Error:", err)
				time.Sleep(1 * time.Second)
				continue
			}

			fmt.Printf("Fetched emails count: %d\n", len(emails))

			if len(emails) > 0 && emails[0].ID > lastID {
				newEmail := emails[0]
				fmt.Printf("New email detected: ID=%d, From=%s, Subject=%s\n", newEmail.ID, newEmail.Sender, newEmail.Subject)
				lastID = emails[0].ID

				re := regexp.MustCompile(`\d{6}`)
				matches := re.FindStringSubmatch(newEmail.Subject)
				if len(matches) > 0 {
					code = matches[0]
					break
				}
			} else {
				fmt.Println("No new emails")
			}

			time.Sleep(1 * time.Second)
		}

		for _, char := range code {
			page.Keyboard.Type(input.Key(char))
		}

		wait := page.WaitNavigation(proto.PageLifecycleEventNameLoad)
		page.MustElement(`input[placeholder="Year"]`).MustWaitVisible().MustInput("2000")
		page.Keyboard.Type(input.Key(input.Tab))
		page.Keyboard.Type(input.Key(input.Enter))
		page.Keyboard.Type(input.Key(input.ArrowDown))
		page.Keyboard.Type(input.Key(input.Enter))

		page.Keyboard.Type(input.Key(input.Tab))
		page.Keyboard.Type(input.Key(input.Enter))
		page.Keyboard.Type(input.Key(input.ArrowDown))
		page.Keyboard.Type(input.Key(input.Enter))
		wait()

		page.MustClose()
		fmt.Printf("Completed registration for %s\n", email)
	}

	browser.MustClose()
}
