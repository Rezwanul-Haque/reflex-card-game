package unit_test

import (
	"testing"

	"github.com/rezwanul-haque/reflex-card-game/server/internal/features/game"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewGame(t *testing.T) {
	g := game.NewGame("room1", "Alice", "Bob", 3, game.RankAce)

	assert.Equal(t, "room1", g.RoomID)
	assert.Equal(t, [2]string{"Alice", "Bob"}, g.Players)
	assert.Equal(t, 0, g.Scores["Alice"])
	assert.Equal(t, 0, g.Scores["Bob"])
	assert.Equal(t, game.GameStatePlaying, g.State)
	assert.Equal(t, 3, g.RoundsToWin)
}

func TestFlipCard(t *testing.T) {
	g := game.NewGame("room1", "Alice", "Bob", 3, game.RankAce)

	card, num, ok := g.FlipCard()
	require.True(t, ok)
	assert.NotNil(t, card)
	assert.Equal(t, 1, num)
	assert.Equal(t, card, g.CurrentCard)
}

func TestHandleClickOnNonAce(t *testing.T) {
	g := game.NewGame("room1", "Alice", "Bob", 3, game.RankAce)

	// Force a non-ace card
	nonAce := game.Card{Suit: game.SuitHearts, Rank: game.Rank7}
	g.CurrentCard = &nonAce
	g.CardNumber = 1

	result := g.HandleClick("Alice", 1)
	require.NotNil(t, result)
	assert.Equal(t, "Bob", result.Winner)
	assert.Equal(t, "Alice", result.Loser)
	assert.Equal(t, "early_click", result.Reason)
	assert.Equal(t, 1, g.Scores["Bob"])
	assert.Equal(t, game.GameStateRoundEnd, g.State)
}

func TestHandleClickOnAceFirstPlayer(t *testing.T) {
	g := game.NewGame("room1", "Alice", "Bob", 3, game.RankAce)

	ace := game.Card{Suit: game.SuitSpades, Rank: game.RankAce}
	g.CurrentCard = &ace
	g.CardNumber = 1

	// First player clicks on Ace — result is nil (waiting for opponent or timeout)
	result := g.HandleClick("Alice", 1)
	assert.Nil(t, result)
	assert.True(t, g.HasClicked["Alice"])
}

func TestHandleClickOnAceBothPlayers(t *testing.T) {
	g := game.NewGame("room1", "Alice", "Bob", 3, game.RankAce)

	ace := game.Card{Suit: game.SuitSpades, Rank: game.RankAce}
	g.CurrentCard = &ace
	g.CardNumber = 1

	// Alice clicks first
	g.HandleClick("Alice", 1)

	// Bob clicks second — Alice should win (clicked earlier)
	result := g.HandleClick("Bob", 1)
	require.NotNil(t, result)
	assert.Equal(t, "Alice", result.Winner)
	assert.Equal(t, "Bob", result.Loser)
	assert.Equal(t, "trigger_click", result.Reason)
	assert.Equal(t, 1, g.Scores["Alice"])
}

func TestHandleDoubleClick(t *testing.T) {
	g := game.NewGame("room1", "Alice", "Bob", 3, game.RankAce)

	nonAce := game.Card{Suit: game.SuitHearts, Rank: game.Rank7}
	g.CurrentCard = &nonAce
	g.CardNumber = 1

	// First click loses the round
	result := g.HandleClick("Alice", 1)
	require.NotNil(t, result)

	// Second click should be ignored (already clicked)
	result2 := g.HandleClick("Alice", 1)
	assert.Nil(t, result2)
}

func TestResolveAceTimeoutOneClicker(t *testing.T) {
	g := game.NewGame("room1", "Alice", "Bob", 3, game.RankAce)

	ace := game.Card{Suit: game.SuitSpades, Rank: game.RankAce}
	g.CurrentCard = &ace
	g.CardNumber = 1

	// Only Alice clicks
	g.HandleClick("Alice", 1)

	// Timeout resolves
	result := g.ResolveAceTimeout()
	require.NotNil(t, result)
	assert.Equal(t, "Alice", result.Winner)
	assert.Equal(t, "Bob", result.Loser)
	assert.Equal(t, "trigger_click", result.Reason)
}

func TestResolveAceTimeoutNoClickers(t *testing.T) {
	g := game.NewGame("room1", "Alice", "Bob", 3, game.RankAce)

	ace := game.Card{Suit: game.SuitSpades, Rank: game.RankAce}
	g.CurrentCard = &ace
	g.CardNumber = 1

	// Nobody clicks
	result := g.ResolveAceTimeout()
	assert.Nil(t, result)
}

func TestIsGameOver(t *testing.T) {
	g := game.NewGame("room1", "Alice", "Bob", 3, game.RankAce)

	// Not over yet
	over, _ := g.IsGameOver()
	assert.False(t, over)

	// Alice wins 3 rounds
	g.Scores["Alice"] = 3
	over, winner := g.IsGameOver()
	assert.True(t, over)
	assert.Equal(t, "Alice", winner)
	assert.Equal(t, game.GameStateFinished, g.State)
}

func TestGetOpponent(t *testing.T) {
	g := game.NewGame("room1", "Alice", "Bob", 3, game.RankAce)
	assert.Equal(t, "Bob", g.GetOpponent("Alice"))
	assert.Equal(t, "Alice", g.GetOpponent("Bob"))
}

func TestPrepareNextRound(t *testing.T) {
	g := game.NewGame("room1", "Alice", "Bob", 3, game.RankAce)
	g.State = game.GameStateRoundEnd
	g.CurrentCard = &game.Card{Suit: game.SuitHearts, Rank: game.Rank7}
	g.HasClicked["Alice"] = true

	g.PrepareNextRound()
	assert.Equal(t, game.GameStatePlaying, g.State)
	assert.Nil(t, g.CurrentCard)
	assert.False(t, g.HasClicked["Alice"])
}

func TestHandleClickOnNilCard(t *testing.T) {
	g := game.NewGame("room1", "Alice", "Bob", 3, game.RankAce)
	g.CurrentCard = nil

	result := g.HandleClick("Alice", 1)
	assert.Nil(t, result)
}

func TestHandleClickStaleCardNumber(t *testing.T) {
	g := game.NewGame("room1", "Alice", "Bob", 3, game.RankAce)

	nonAce := game.Card{Suit: game.SuitHearts, Rank: game.Rank7}
	g.CurrentCard = &nonAce
	g.CardNumber = 5

	// Click with old card number — should be ignored
	result := g.HandleClick("Alice", 3)
	assert.Nil(t, result)

	// Click with correct card number — should work
	result = g.HandleClick("Alice", 5)
	require.NotNil(t, result)
	assert.Equal(t, "early_click", result.Reason)
}

func TestHandleClickWhenNotPlaying(t *testing.T) {
	g := game.NewGame("room1", "Alice", "Bob", 3, game.RankAce)
	g.State = game.GameStateRoundEnd
	g.CurrentCard = &game.Card{Suit: game.SuitHearts, Rank: game.RankAce}

	result := g.HandleClick("Alice", 1)
	assert.Nil(t, result)
}
