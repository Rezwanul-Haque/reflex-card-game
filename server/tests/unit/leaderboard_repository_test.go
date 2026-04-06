package unit_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/rezwanul-haque/reflex-card-game/server/internal/features/leaderboard"
	"github.com/rezwanul-haque/reflex-card-game/server/internal/infra/db"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newTestRepo(t *testing.T) *db.LeaderboardRepo {
	t.Helper()
	dir := t.TempDir()
	database, err := db.Open(filepath.Join(dir, "test.db"))
	require.NoError(t, err)
	require.NoError(t, db.Migrate(database))
	t.Cleanup(func() { database.Close() })
	return db.NewLeaderboardRepo(database)
}

func TestRecordAndGetRecent(t *testing.T) {
	repo := newTestRepo(t)

	entry := &leaderboard.Entry{
		Winner:      "alice",
		Loser:       "bob",
		WinnerScore: 3,
		LoserScore:  1,
	}
	err := repo.RecordResult(entry)
	require.NoError(t, err)

	entries, err := repo.GetRecent(10)
	require.NoError(t, err)
	assert.Len(t, entries, 1)
	assert.Equal(t, "alice", entries[0].Winner)
	assert.Equal(t, "bob", entries[0].Loser)
	assert.Equal(t, 3, entries[0].WinnerScore)
	assert.Equal(t, 1, entries[0].LoserScore)
}

func TestGetRecentLimit(t *testing.T) {
	repo := newTestRepo(t)

	for i := 0; i < 15; i++ {
		err := repo.RecordResult(&leaderboard.Entry{
			Winner:      "player",
			Loser:       "opponent",
			WinnerScore: 3,
			LoserScore:  0,
		})
		require.NoError(t, err)
	}

	entries, err := repo.GetRecent(10)
	require.NoError(t, err)
	assert.Len(t, entries, 10)
}

func TestGetRecentEmpty(t *testing.T) {
	repo := newTestRepo(t)

	entries, err := repo.GetRecent(10)
	require.NoError(t, err)
	assert.Nil(t, entries)
}

func TestOpenCreatesDir(t *testing.T) {
	dir := t.TempDir()
	dbPath := filepath.Join(dir, "sub", "dir", "test.db")
	database, err := db.Open(dbPath)
	require.NoError(t, err)
	defer database.Close()

	_, err = os.Stat(filepath.Join(dir, "sub", "dir"))
	assert.NoError(t, err)
}
