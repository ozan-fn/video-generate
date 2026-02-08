package lib

import (
	"fmt"
	"sync"

	"github.com/go-rod/rod"
)

type Session struct {
	ID    int
	Email string
	mu    sync.RWMutex
	Job   map[string]*rod.Page
}

func (s *Session) GetAllJob() map[string]*rod.Page {
	return s.Job
}

func (s *Session) AddJob(jobID string, page *rod.Page) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.Job[jobID]; exists {
		return fmt.Errorf("job already exists")
	}

	s.Job[jobID] = page
	return nil
}

func (s *Session) GetJob(jobID string) (*rod.Page, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	page, ok := s.Job[jobID]
	return page, ok
}

func (s *Session) RemoveJob(jobID string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if page, ok := s.Job[jobID]; ok {
		page.Close() // jangan lupa
		delete(s.Job, jobID)
	}
}
