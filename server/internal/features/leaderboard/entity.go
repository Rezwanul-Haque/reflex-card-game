package leaderboard

import "time"

type Entry struct {
	ID          int64     `json:"id"`
	Winner      string    `json:"winner"`
	Loser       string    `json:"loser"`
	WinnerScore int       `json:"winner_score"`
	LoserScore  int       `json:"loser_score"`
	PlayedAt    time.Time `json:"played_at"`
}
