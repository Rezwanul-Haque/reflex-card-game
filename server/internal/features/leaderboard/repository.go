package leaderboard

// Repository defines the contract for leaderboard persistence.
// Implementations live in infra/db.
type Repository interface {
	RecordResult(entry *Entry) error
	GetRecent(limit int) ([]Entry, error)
}
