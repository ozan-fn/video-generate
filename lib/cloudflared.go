package lib

import (
	"embed"
	"log"
	"os"
	"os/exec"
)

//go:embed cloudflared-linux-amd64
var cloudflaredBinary embed.FS

func StartCloudflared() error {
	log.Println("Starting Cloudflared tunnel for localhost:3000...")

	cmd := exec.Command(
		"./lib/cloudflared-linux-amd64", "tunnel", "run", "--token", "eyJhIjoiMDlmMjc5ZTc4ODVmMDJjOGFlYzhmZjY2MDAwMjk3NzIiLCJ0IjoiMGNmOGFmNjQtMWRmNi00MWQwLWEwNjQtOWYyMDZmMzM1YjgzIiwicyI6Ik5tTTNNbVE1WlRJdE5tTTROaTAwTlRReExUaGxNVE10TWpSalpEQTBaR0kwWVRRMCJ9",
	)

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	return cmd.Run()
}
