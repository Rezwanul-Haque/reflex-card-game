package leaderboard

import (
	"log"
	"time"
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) RecordGameResult(winner, loser string, scores map[string]int) {
	entry := &Entry{
		Winner:      winner,
		Loser:       loser,
		WinnerScore: scores[winner],
		LoserScore:  scores[loser],
		PlayedAt:    time.Now().UTC(),
	}
	if err := s.repo.RecordResult(entry); err != nil {
		log.Printf("error recording leaderboard entry: %v", err)
	}
}

func (s *Service) GetRecentResults(limit int) ([]Entry, error) {
	return s.repo.GetRecent(limit)
}
