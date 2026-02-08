package lib

import (
	"archive/tar"
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"syscall"

	"github.com/andybalholm/brotli"
	"github.com/chromedp/chromedp"
)

const (
	DownloadURL = "https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar"
	CacheDir    = ".cache"
	ChromeBin   = "chromium"
)

var (
	ctx  context.Context
	once sync.Once
)

func GetBrowser() (context.Context, context.CancelFunc) {
	if ctx != nil {
		return ctx, nil
	}

	// once.Do(func() {
	chromePath := BrowserPath()

	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.ExecPath(chromePath),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-setuid-sandbox", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("headless", false),
		chromedp.Flag("disable-blink-features", "AutomationControlled"),
		chromedp.UserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"),
	)

	var cancel context.CancelFunc
	allocCtx, _ := chromedp.NewExecAllocator(context.Background(), opts...)
	ctx, cancel = chromedp.NewContext(allocCtx)

	// start browser
	if err := chromedp.Run(ctx); err != nil {
		panic(err)
	}

	ch := make(chan os.Signal, 1)
	signal.Notify(ch, os.Interrupt, syscall.SIGTERM)

	// close browser on SIGTERM
	go func() {
		<-ch
		cancel()
		fmt.Println("Menutup browser...")
		os.Exit(0)
	}()

	// })

	return ctx, cancel
}

// BrowserPath memastikan biner Chromium tersedia.
// - Windows: return nil (pakai Chrome bawaan sistem).
// - Linux: unduh & ekstrak Sparticuz Chromium ke .cache/chromium, lalu return path-nya.
func BrowserPath() string {
	if runtime.GOOS == "windows" {
		fmt.Println("🪟 Windows detected. Using system Chrome...")
		return "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
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
