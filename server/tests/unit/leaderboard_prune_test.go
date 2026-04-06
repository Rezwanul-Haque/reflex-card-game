package unit_test

import (
	"fmt"
	"path/filepath"
	"testing"
	"time"

	"github.com/rezwanul-haque/reflex-card-game/server/internal/features/leaderboard"
	"github.com/rezwanul-haque/reflex-card-game/server/internal/infra/db"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPruneKeepsOnly10(t *testing.T) {
	dir := t.TempDir()
	database, err := db.Open(filepath.Join(dir, "test.db"))
	require.NoError(t, err)
	require.NoError(t, db.Migrate(database))
	t.Cleanup(func() { database.Close() })

	repo := db.NewLeaderboardRepo(database)

	// Insert 12 entries through the repo
	for i := 1; i <= 12; i++ {
		err := repo.RecordResult(&leaderboard.Entry{
			Winner:      fmt.Sprintf("player_%d", i),
			Loser:       fmt.Sprintf("opponent_%d", i),
			WinnerScore: 3,
			LoserScore:  i % 3,
			PlayedAt:    time.Now().Add(time.Duration(i) * time.Second),
		})
		require.NoError(t, err)
	}

	// Wait for async prune
	time.Sleep(500 * time.Millisecond)

	var count int
	database.QueryRow("SELECT COUNT(*) FROM leaderboard").Scan(&count)
	assert.Equal(t, 10, count, "should keep only 10 rows")

	// Oldest should be player_3 (player_1 and player_2 pruned)
	var oldest string
	database.QueryRow("SELECT winner FROM leaderboard ORDER BY played_at ASC LIMIT 1").Scan(&oldest)
	assert.Equal(t, "player_3", oldest)

	// Insert one more — should evict player_3
	err = repo.RecordResult(&leaderboard.Entry{
		Winner: "player_13", Loser: "opponent_13",
		WinnerScore: 3, LoserScore: 0,
		PlayedAt: time.Now().Add(13 * time.Second),
	})
	require.NoError(t, err)
	time.Sleep(500 * time.Millisecond)

	database.QueryRow("SELECT COUNT(*) FROM leaderboard").Scan(&count)
	assert.Equal(t, 10, count, "still 10 after 13th insert")

	database.QueryRow("SELECT winner FROM leaderboard ORDER BY played_at ASC LIMIT 1").Scan(&oldest)
	assert.Equal(t, "player_4", oldest, "player_3 should be evicted")
}
