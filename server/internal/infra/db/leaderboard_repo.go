package db

import (
	"database/sql"
	"log"
	"time"

	"github.com/rezwanul-haque/reflex-card-game/server/internal/features/leaderboard"
)

// LeaderboardRepo is the SQLite-backed implementation of leaderboard.Repository.
type LeaderboardRepo struct {
	db      *sql.DB
	pruneCh chan struct{}
}

func NewLeaderboardRepo(db *sql.DB) *LeaderboardRepo {
	r := &LeaderboardRepo{
		db:      db,
		pruneCh: make(chan struct{}, 1),
	}
	go r.pruneLoop(10)
	return r
}

func (r *LeaderboardRepo) pruneLoop(keep int) {
	for range r.pruneCh {
		if _, err := r.db.Exec(
			`DELETE FROM leaderboard WHERE id NOT IN (SELECT id FROM leaderboard ORDER BY played_at DESC LIMIT ?)`,
			keep,
		); err != nil {
			log.Printf("error pruning leaderboard: %v", err)
		}
	}
}

func (r *LeaderboardRepo) RecordResult(entry *leaderboard.Entry) error {
	_, err := r.db.Exec(
		`INSERT INTO leaderboard (winner, loser, winner_score, loser_score, played_at) VALUES (?, ?, ?, ?, ?)`,
		entry.Winner, entry.Loser, entry.WinnerScore, entry.LoserScore,
		entry.PlayedAt.UTC().Format(time.RFC3339),
	)
	if err != nil {
		return err
	}

	// Signal prune goroutine (non-blocking)
	select {
	case r.pruneCh <- struct{}{}:
	default:
	}

	return nil
}

func (r *LeaderboardRepo) GetRecent(limit int) ([]leaderboard.Entry, error) {
	rows, err := r.db.Query(
		`SELECT id, winner, loser, winner_score, loser_score, played_at FROM leaderboard ORDER BY played_at DESC LIMIT ?`,
		limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []leaderboard.Entry
	for rows.Next() {
		var e leaderboard.Entry
		var playedAt string
		if err := rows.Scan(&e.ID, &e.Winner, &e.Loser, &e.WinnerScore, &e.LoserScore, &playedAt); err != nil {
			return nil, err
		}
		e.PlayedAt, _ = time.Parse(time.RFC3339, playedAt)
		entries = append(entries, e)
	}
	return entries, rows.Err()
}
