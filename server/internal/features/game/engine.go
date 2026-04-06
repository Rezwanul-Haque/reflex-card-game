package game

import (
	"sync"
	"time"
)

type GameState string

const (
	GameStateWaiting  GameState = "waiting"
	GameStatePlaying  GameState = "playing"
	GameStateRoundEnd GameState = "round_end"
	GameStateFinished GameState = "finished"
)

type RoundResult struct {
	Winner        string         `json:"winner"`
	Loser         string         `json:"loser,omitempty"`
	Reason        string         `json:"reason"`
	ReactionTimes map[string]int `json:"reaction_times"`
}

type Game struct {
	mu           sync.Mutex
	RoomID       string
	Players      [2]string
	Scores       map[string]int
	State        GameState
	Deck         *Deck
	CurrentCard  *Card
	CardNumber   int
	RoundsToWin  int
	ClickTimes   map[string]int64
	HasClicked   map[string]bool
	CardFlipTime int64
	TriggerRank  Rank
}

func NewGame(roomID string, player1, player2 string, roundsToWin int, triggerRank Rank) *Game {
	deck := NewDeck()
	deck.Shuffle()

	return &Game{
		RoomID:      roomID,
		Players:     [2]string{player1, player2},
		Scores:      map[string]int{player1: 0, player2: 0},
		State:       GameStatePlaying,
		Deck:        deck,
		RoundsToWin: roundsToWin,
		TriggerRank: triggerRank,
		ClickTimes:  make(map[string]int64),
		HasClicked:  make(map[string]bool),
	}
}

func (g *Game) Lock() {
	g.mu.Lock()
}

func (g *Game) Unlock() {
	g.mu.Unlock()
}

func (g *Game) FlipCard() (*Card, int, bool) {
	card, ok := g.Deck.Next()
	if !ok {
		g.Deck.Reset()
		card, ok = g.Deck.Next()
		if !ok {
			return nil, 0, false
		}
	}
	g.CurrentCard = &card
	g.CardNumber++
	g.CardFlipTime = nanoNow()
	g.ClickTimes = make(map[string]int64)
	g.HasClicked = make(map[string]bool)
	return &card, g.CardNumber, true
}

func (g *Game) HandleClick(player string, cardNumber int) *RoundResult {
	if g.State != GameStatePlaying || g.CurrentCard == nil {
		return nil
	}

	// Reject clicks for a different card (stale click from previous round)
	if cardNumber != g.CardNumber {
		return nil
	}

	if g.HasClicked[player] {
		return nil
	}

	g.HasClicked[player] = true
	g.ClickTimes[player] = nanoNow()

	if !g.CurrentCard.IsTrigger(g.TriggerRank) {
		// Clicked on non-Ace — this player loses the round
		opponent := g.GetOpponent(player)
		g.Scores[opponent]++
		g.State = GameStateRoundEnd
		return &RoundResult{
			Winner:        opponent,
			Loser:         player,
			Reason:        "early_click",
			ReactionTimes: g.reactionTimes(),
		}
	}

	// Clicked on Ace — check if both clicked
	opponent := g.GetOpponent(player)
	if g.HasClicked[opponent] {
		// Both clicked on Ace — earliest wins
		rt := g.reactionTimes()
		if g.ClickTimes[player] < g.ClickTimes[opponent] {
			g.Scores[player]++
			g.State = GameStateRoundEnd
			return &RoundResult{
				Winner:        player,
				Loser:         opponent,
				Reason:        "trigger_click",
				ReactionTimes: rt,
			}
		}
		g.Scores[opponent]++
		g.State = GameStateRoundEnd
		return &RoundResult{
			Winner:        opponent,
			Loser:         player,
			Reason:        "trigger_click",
			ReactionTimes: rt,
		}
	}

	// Only this player clicked on Ace so far — wait briefly for opponent
	return nil
}

// ResolveAceTimeout is called after a short timeout when an Ace is showing.
// If only one player has clicked, they win the round.
func (g *Game) ResolveAceTimeout() *RoundResult {
	if g.State != GameStatePlaying || g.CurrentCard == nil || !g.CurrentCard.IsTrigger(g.TriggerRank) {
		return nil
	}

	var clicker string
	for _, p := range g.Players {
		if g.HasClicked[p] {
			if clicker != "" {
				return nil // both clicked, already resolved
			}
			clicker = p
		}
	}

	if clicker == "" {
		return nil // nobody clicked
	}

	opponent := g.GetOpponent(clicker)
	g.Scores[clicker]++
	g.State = GameStateRoundEnd
	return &RoundResult{
		Winner:        clicker,
		Loser:         opponent,
		Reason:        "trigger_click",
		ReactionTimes: g.reactionTimes(),
	}
}

func (g *Game) GetOpponent(player string) string {
	if g.Players[0] == player {
		return g.Players[1]
	}
	return g.Players[0]
}

func (g *Game) IsGameOver() (bool, string) {
	for player, score := range g.Scores {
		if score >= g.RoundsToWin {
			g.State = GameStateFinished
			return true, player
		}
	}
	return false, ""
}

func (g *Game) PrepareNextRound() {
	g.State = GameStatePlaying
	g.CurrentCard = nil
	g.ClickTimes = make(map[string]int64)
	g.HasClicked = make(map[string]bool)
}

func nanoNow() int64 {
	return time.Now().UnixNano()
}

// reactionTimes returns reaction times in milliseconds for players who clicked.
func (g *Game) reactionTimes() map[string]int {
	rt := make(map[string]int)
	for player, clickTime := range g.ClickTimes {
		ms := int((clickTime - g.CardFlipTime) / 1_000_000)
		if ms < 0 {
			ms = 0
		}
		rt[player] = ms
	}
	return rt
}
