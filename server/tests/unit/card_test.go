package unit_test

import (
	"testing"

	"github.com/rezwanul-haque/reflex-card-game/server/internal/features/game"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewDeck(t *testing.T) {
	deck := game.NewDeck()
	assert.Equal(t, 52, len(deck.Cards))
	assert.Equal(t, 0, deck.Index)
}

func TestNewDeckHasAllCards(t *testing.T) {
	deck := game.NewDeck()
	suits := map[game.Suit]int{}
	ranks := map[game.Rank]int{}

	for _, card := range deck.Cards {
		suits[card.Suit]++
		ranks[card.Rank]++
	}

	assert.Equal(t, 13, suits[game.SuitHearts])
	assert.Equal(t, 13, suits[game.SuitDiamonds])
	assert.Equal(t, 13, suits[game.SuitClubs])
	assert.Equal(t, 13, suits[game.SuitSpades])

	assert.Equal(t, 4, ranks[game.RankAce])
	assert.Equal(t, 4, ranks[game.RankKing])
}

func TestDeckShuffle(t *testing.T) {
	deck1 := game.NewDeck()
	deck2 := game.NewDeck()
	deck2.Shuffle()

	// With 52 cards, odds of identical order after shuffle are astronomically low
	different := false
	for i := range deck1.Cards {
		if deck1.Cards[i] != deck2.Cards[i] {
			different = true
			break
		}
	}
	assert.True(t, different, "shuffled deck should differ from original")
}

func TestDeckNext(t *testing.T) {
	deck := game.NewDeck()
	card, ok := deck.Next()
	require.True(t, ok)
	assert.NotEmpty(t, card.Suit)
	assert.NotEmpty(t, card.Rank)
	assert.Equal(t, 1, deck.Index)
	assert.Equal(t, 51, deck.Remaining())
}

func TestDeckExhaustion(t *testing.T) {
	deck := game.NewDeck()
	for i := 0; i < 52; i++ {
		_, ok := deck.Next()
		assert.True(t, ok)
	}
	_, ok := deck.Next()
	assert.False(t, ok)
	assert.Equal(t, 0, deck.Remaining())
}

func TestDeckReset(t *testing.T) {
	deck := game.NewDeck()
	for i := 0; i < 10; i++ {
		deck.Next()
	}
	deck.Reset()
	assert.Equal(t, 0, deck.Index)
	assert.Equal(t, 52, deck.Remaining())
}

func TestCardIsTrigger(t *testing.T) {
	ace := game.Card{Suit: game.SuitHearts, Rank: game.RankAce}
	assert.True(t, ace.IsTrigger(game.RankAce))
	assert.False(t, ace.IsTrigger(game.RankKing))

	king := game.Card{Suit: game.SuitSpades, Rank: game.RankKing}
	assert.True(t, king.IsTrigger(game.RankKing))
	assert.False(t, king.IsTrigger(game.RankAce))

	two := game.Card{Suit: game.SuitClubs, Rank: game.Rank2}
	assert.False(t, two.IsTrigger(game.RankAce))
}
