package db

import "database/sql"

// Migrate runs all schema migrations. Each migration is idempotent.
func Migrate(conn *sql.DB) error {
	migrations := []string{
		`CREATE TABLE IF NOT EXISTS leaderboard (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			winner TEXT NOT NULL,
			loser TEXT NOT NULL,
			winner_score INTEGER NOT NULL,
			loser_score INTEGER NOT NULL,
			played_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
	}

	for _, m := range migrations {
		if _, err := conn.Exec(m); err != nil {
			return err
		}
	}
	return nil
}
