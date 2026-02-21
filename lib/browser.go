package lib

import (
	"archive/tar"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"

	"github.com/andybalholm/brotli"
	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
)

const (
	DownloadURL = "https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar"
	CacheDir    = ".cache"
	ChromeBin   = "chromium"
)

var (
	browser     *rod.Browser
	browserOnce sync.Once
)

func GetBrowser() *rod.Browser {
	browserOnce.Do(func() {
		browserPath := BrowserPath()

		l := launcher.New().
			Bin(browserPath).
			Headless(false).
			Set("no-sandbox").
			Set("disable-setuid-sandbox").
			Set("disable-dev-shm-usage").
			Set("single-process").
			Set("disable-blink-features", "AutomationControlled").
			Set("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0")

		browser = rod.New().ControlURL(l.MustLaunch()).MustConnect()
	})

	return browser
}

// BrowserPath memastikan biner Chromium tersedia.
// - Windows: return nil (pakai Chrome bawaan sistem).
// - Linux: unduh & ekstrak Sparticuz Chromium ke .cache/chromium, lalu return path-nya.
func BrowserPath() string {
	if runtime.GOOS == "windows" {
		fmt.Println("🪟 Windows detected. Using system Edge...")
		return "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
	}

	// Deteksi WSL
	if isWSL() {
		fmt.Println("🐧 WSL detected. Using system google-chrome...")
		return "google-chrome"
	}

	// pastikan folder cache ada
	if err := os.MkdirAll(CacheDir, 0755); err != nil {
		fmt.Println("⚠️ Gagal membuat cache dir:", err)
		return ""
	}

	chromeBin := filepath.Join(CacheDir, ChromeBin)
	tarPack := filepath.Join(CacheDir, "pack.tar")

	// kalau belum ada biner chromium, lakukan download & ekstraksi
	if _, err := os.Stat(chromeBin); os.IsNotExist(err) {
		fmt.Println("🐧 Linux detected. ⬇️ Downloading Chromium pack...")
		if err := downloadFile(DownloadURL, tarPack); err != nil {
			fmt.Println("⚠️ Gagal download:", err)
			return ""
		}

		fmt.Println("📦 Extracting Main Tar...")
		if err := extractTar(tarPack, CacheDir); err != nil {
			fmt.Println("⚠️ Gagal extract tar:", err)
			return ""
		}

		files := []string{"fonts.tar.br", "al2023.tar.br", "chromium.br", "swiftshader.tar.br"}
		for _, f := range files {
			src := filepath.Join(CacheDir, f)
			fmt.Printf("🔨 Processing %s...\n", f)

			if f == "chromium.br" {
				if err := decompressBrotliOnly(src, chromeBin); err != nil {
					fmt.Println("⚠️ Gagal decompress chromium:", err)
					return ""
				}
			} else if strings.HasSuffix(f, ".tar.br") {
				if err := extractTarBr(src, CacheDir); err != nil {
					fmt.Println("⚠️ Gagal extract tar.br:", err)
					return ""
				}
			}
			_ = os.Remove(src)
		}
		_ = os.Remove(tarPack)
		_ = os.Chmod(chromeBin, 0755)
		fmt.Println("✅ Linux Setup Complete!")
	}

	return chromeBin
}

func isWSL() bool {
	data, err := os.ReadFile("/proc/version")
	if err != nil {
		return false
	}
	lower := strings.ToLower(string(data))
	return strings.Contains(lower, "microsoft") || strings.Contains(lower, "wsl")
}

func downloadFile(url, dest string) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	out, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, resp.Body)
	return err
}

func extractTar(src, dest string) error {
	f, err := os.Open(src)
	if err != nil {
		return err
	}
	defer f.Close()
	tr := tar.NewReader(f)
	for {
		hdr, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
		target := filepath.Join(dest, hdr.Name)
		if hdr.Typeflag == tar.TypeReg {
			out, err := os.Create(target)
			if err != nil {
				return err
			}
			_, _ = io.Copy(out, tr)
			out.Close()
		}
	}
	return nil
}

func decompressBrotliOnly(src, dest string) error {
	f, err := os.Open(src)
	if err != nil {
		return err
	}
	defer f.Close()
	br := brotli.NewReader(f)
	out, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, br)
	return err
}

func extractTarBr(src, dest string) error {
	f, err := os.Open(src)
	if err != nil {
		return err
	}
	defer f.Close()
	br := brotli.NewReader(f)
	tr := tar.NewReader(br)
	for {
		hdr, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
		target := filepath.Join(dest, hdr.Name)
		switch hdr.Typeflag {
		case tar.TypeDir:
			_ = os.MkdirAll(target, 0755)
		case tar.TypeReg:
			_ = os.MkdirAll(filepath.Dir(target), 0755)
			out, err := os.Create(target)
			if err != nil {
				return err
			}
			_, _ = io.Copy(out, tr)
			out.Close()
		}
	}
	return nil
}
