package pippit

import (
	"io"
	"main/lib"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/go-rod/rod/lib/input"
)

type PippitJob struct {
	ID             string    `json:"id"`
	Prompt         string    `json:"prompt"`
	Status         string    `json:"status"` // pending, processing, completed, failed
	VideoPath      string    `json:"video_path,omitempty"`
	ScreenshotData []byte    `json:"-"` // Not exposed in JSON
	Error          string    `json:"error,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

var (
	jobQueue = make(chan *PippitJob, 100)
	jobMutex sync.RWMutex
	jobs     = make(map[string]*PippitJob)
)

func init() {
	// Start worker goroutines
	for i := 0; i < 3; i++ {
		go jobWorker()
	}
}

func jobWorker() {
	for job := range jobQueue {
		processJob(job)
	}
}

func processJob(job *PippitJob) {
	// Update status to processing
	jobMutex.Lock()
	job.Status = "processing"
	jobMutex.Unlock()

	// Create storage folder if not exists
	if err := os.MkdirAll("./storage", 0755); err != nil {
		jobMutex.Lock()
		job.Status = "failed"
		job.Error = "Failed to create storage folder: " + err.Error()
		jobMutex.Unlock()
		return
	}

	// Get files from cache
	cacheDir := "./.cache/" + job.ID
	files, err := os.ReadDir(cacheDir)
	if err != nil {
		jobMutex.Lock()
		job.Status = "failed"
		job.Error = "Failed to read cache directory: " + err.Error()
		jobMutex.Unlock()
		return
	}

	var filePaths []string
	for _, file := range files {
		if !file.IsDir() {
			filePaths = append(filePaths, filepath.Join(cacheDir, file.Name()))
		}
	}

	if len(filePaths) == 0 {
		jobMutex.Lock()
		job.Status = "failed"
		job.Error = "No image files found"
		jobMutex.Unlock()
		return
	}

	// Get account with lowest count
	var account lib.Account
	if err := lib.DB.Order("count ASC").First(&account).Error; err != nil {
		jobMutex.Lock()
		job.Status = "failed"
		job.Error = "No account found: " + err.Error()
		jobMutex.Unlock()
		return
	}

	// Increment count
	account.Count++
	lib.DB.Save(&account)

	// Browser automation
	browser := lib.GetBrowser()
	browser = browser.MustIncognito()

	defer func() {
		// Clean up cache files
		os.RemoveAll(cacheDir)
		browser.MustClose()
	}()

	page := browser.MustPage("https://www.pippit.ai/agent-chat")
	page.MustWaitNavigation()()

	page.MustElementR("span", "Continue with email").MustWaitVisible().MustClick()

	page.MustElement(`input[type="text"]`).MustWaitVisible().MustInput(account.Email)
	page.MustElement(`input[type="password"]`).MustInput(account.Password)

	wait := page.MustWaitNavigation()
	page.MustElementR("span", "Continue").MustClick()
	wait()

	page.MustElement(".ag-ui-history-panel-create-button").MustWaitVisible().MustClick()

	setFiles := page.MustHandleFileDialog()
	page.MustElement(`div[class^="upload-media"]`).MustClick()
	page.MustElement(`.lv-dropdown-menu-inner > div:nth-child(2)`).MustWaitVisible().MustClick()
	setFiles(filePaths...)

	page.MustElement(".tiptap > p").MustClick().MustInput(job.Prompt)

	for _, e := range page.MustElements(`.lv-icon-spin-loading`) {
		e.MustWaitInvisible()
	}

	page.Keyboard.Press(input.Enter)
	page.Timeout(time.Second*1).MustElementR("span", "Confirm").MustWaitVisible().MustClick()

	// Capture screenshot before video
	screenshotData := page.MustScreenshotFullPage()

	url := page.Timeout(time.Minute * 15).MustElement(`video`).MustAttribute("src")
	resp, err := http.Get(*url)
	if err != nil {
		jobMutex.Lock()
		job.Status = "failed"
		job.Error = "Failed to fetch video: " + err.Error()
		jobMutex.Unlock()
		return
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)

	// Save video to storage
	videoPath := filepath.Join("./storage", job.ID+".mp4")
	if err := os.WriteFile(videoPath, bodyBytes, 0644); err != nil {
		jobMutex.Lock()
		job.Status = "failed"
		job.Error = "Failed to save video: " + err.Error()
		jobMutex.Unlock()
		return
	}

	// Update job status to completed
	jobMutex.Lock()
	job.Status = "completed"
	job.VideoPath = videoPath
	job.ScreenshotData = screenshotData
	job.Error = ""
	jobMutex.Unlock()
}
