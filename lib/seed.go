//go:build ignore

package main

import (
	"fmt"
	"main/lib"

	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	if err := lib.InitDB(); err != nil {
		panic(err)
	}

	// Create test accounts
	for i := 1; i <= 50; i++ {
		email := fmt.Sprintf("%03d@1only.my.id", i)
		password := "Akhmad6825"
		lib.DB.Exec("INSERT INTO accounts (email, password) VALUES (?, ?) ON DUPLICATE KEY UPDATE password=?", email, password, password)
	}

}
