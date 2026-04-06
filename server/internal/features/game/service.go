package game

import (
	"log"
	"math/rand"
	"sync"
	"time"

	"github.com/rezwanul-haque/reflex-card-game/server/internal/core"
	"github.com/rezwanul-haque/reflex-card-game/server/internal/features/leaderboard"
	"github.com/rezwanul-haque/reflex-card-game/server/internal/infra"
)

type GameRoom struct {
	Game        *Game
	Connections map[string]*infra.Connection
	StopChan    chan struct{}
}

type WaitingRoom struct {
	PlayerName string
}

type GameService struct {
	mu          sync.RWMutex
	rooms       map[string]*GameRoom
	waiting     map[string]*WaitingRoom
	cfg         *core.Config
	leaderboard *leaderboard.Service
}

func NewGameService(cfg *core.Config, lb *leaderboard.Service) *GameService {
	return &GameService{
		rooms:       make(map[string]*GameRoom),
		waiting:     make(map[string]*WaitingRoom),
		cfg:         cfg,
		leaderboard: lb,
	}
}

func (s *GameService) AddWaiting(roomID, playerName string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.waiting[roomID] = &WaitingRoom{PlayerName: playerName}
}

func (s *GameService) RemoveWaiting(roomID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.waiting, roomID)
}

type ActiveRoom struct {
	RoomID  string   `json:"room_id"`
	Players []string `json:"players"`
	Status  string   `json:"status"`
}

func (s *GameService) GetActiveRooms() []ActiveRoom {
	s.mu.RLock()
	defer s.mu.RUnlock()

	rooms := make([]ActiveRoom, 0, len(s.waiting)+len(s.rooms))

	// Waiting rooms (1 player, not yet started)
	for id, wr := range s.waiting {
		rooms = append(rooms, ActiveRoom{
			RoomID:  id,
			Players: []string{wr.PlayerName},
			Status:  "waiting",
		})
	}

	// Active game rooms
	for id, gr := range s.rooms {
		players := make([]string, len(gr.Game.Players))
		copy(players, gr.Game.Players[:])
		rooms = append(rooms, ActiveRoom{
			RoomID:  id,
			Players: players,
			Status:  "playing",
		})
	}

	return rooms
}

func (s *GameService) CreateGame(roomID, player1, player2 string, conns map[string]*infra.Connection) {
	g := NewGame(roomID, player1, player2, s.cfg.RoundsToWin, Rank(s.cfg.TriggerRank))
	gameRoom := &GameRoom{
		Game:        g,
		Connections: conns,
		StopChan:    make(chan struct{}),
	}

	s.mu.Lock()
	s.rooms[roomID] = gameRoom
	s.mu.Unlock()

	// Notify players
	for _, playerName := range g.Players {
		conn := conns[playerName]
		opponent := g.GetOpponent(playerName)
		playerNum := 1
		if playerName == player2 {
			playerNum = 2
		}
		conn.SendJSON(infra.GameStartMsg{
			Type:         "game_start",
			Opponent:     opponent,
			PlayerNumber: playerNum,
			TriggerRank:  s.cfg.TriggerRank,
		})
	}

	go s.runGameLoop(roomID)
}

func (s *GameService) GetGameRoom(roomID string) *GameRoom {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.rooms[roomID]
}

func (s *GameService) HandleClick(roomID, player string, cardNumber int) {
	s.mu.RLock()
	gameRoom := s.rooms[roomID]
	s.mu.RUnlock()

	if gameRoom == nil {
		return
	}

	g := gameRoom.Game
	g.Lock()
	defer g.Unlock()

	result := g.HandleClick(player, cardNumber)
	if result != nil {
		s.broadcastRoundResult(gameRoom, result)
	}
}

func (s *GameService) HandleDisconnect(roomID, player string) {
	s.mu.Lock()
	gameRoom := s.rooms[roomID]
	s.mu.Unlock()

	if gameRoom == nil {
		return
	}

	// Stop game loop
	select {
	case <-gameRoom.StopChan:
	default:
		close(gameRoom.StopChan)
	}

	// Notify opponent
	g := gameRoom.Game
	opponent := g.GetOpponent(player)
	if conn, ok := gameRoom.Connections[opponent]; ok {
		conn.SendJSON(infra.PlayerLeftMsg{
			Type:   "player_left",
			Player: player,
		})
		conn.SendJSON(infra.GameOverMsg{
			Type:   "game_over",
			Winner: opponent,
			Scores: g.Scores,
		})
	}

	// Record to leaderboard if a real match was played (at least 1 round scored)
	if s.leaderboard != nil && (g.Scores[player]+g.Scores[opponent]) > 0 {
		s.leaderboard.RecordGameResult(opponent, player, g.Scores)
	}

	s.mu.Lock()
	delete(s.rooms, roomID)
	s.mu.Unlock()
}

func (s *GameService) runGameLoop(roomID string) {
	s.mu.RLock()
	gameRoom := s.rooms[roomID]
	s.mu.RUnlock()

	if gameRoom == nil {
		return
	}

	// Initial delay before first card
	select {
	case <-time.After(2 * time.Second):
	case <-gameRoom.StopChan:
		return
	}

	for {
		select {
		case <-gameRoom.StopChan:
			return
		default:
		}

		g := gameRoom.Game
		g.Lock()

		if g.State == GameStateFinished {
			g.Unlock()
			return
		}

		card, cardNum, ok := g.FlipCard()
		g.Unlock()

		if !ok {
			return
		}

		// Broadcast card flip
		s.broadcast(gameRoom, infra.CardFlipMsg{
			Type:       "card_flip",
			Card:       card,
			CardNumber: cardNum,
		})

		if card.IsTrigger(Rank(s.cfg.TriggerRank)) {
			// Wait for clicks with timeout
			select {
			case <-time.After(s.cfg.AceClickTimeout):
			case <-gameRoom.StopChan:
				return
			}

			// Resolve if only one player clicked
			g.Lock()
			result := g.ResolveAceTimeout()
			if result != nil {
				g.Unlock()
				s.broadcastRoundResult(gameRoom, result)
			} else if !anyClicked(g) {
				g.Unlock()
			} else {
				g.Unlock()
			}
		} else {
			// Non-ace card: wait for potential early click or timeout
			delay := s.cfg.CardFlipMinDelay + time.Duration(rand.Int63n(int64(s.cfg.CardFlipMaxDelay-s.cfg.CardFlipMinDelay)))
			select {
			case <-time.After(delay):
			case <-gameRoom.StopChan:
				return
			}
		}

		// Check if round ended (from a click during the wait)
		g.Lock()
		if g.State == GameStateRoundEnd {
			over, winner := g.IsGameOver()
			if over {
				loser := g.GetOpponent(winner)
				g.Unlock()
				s.broadcast(gameRoom, infra.GameOverMsg{
					Type:   "game_over",
					Winner: winner,
					Scores: g.Scores,
				})
				if s.leaderboard != nil {
					s.leaderboard.RecordGameResult(winner, loser, g.Scores)
				}
				s.cleanup(roomID)
				return
			}
			g.PrepareNextRound()
			g.Unlock()

			// Pause between rounds
			select {
			case <-time.After(s.cfg.RoundEndDelay):
			case <-gameRoom.StopChan:
				return
			}
		} else {
			g.Unlock()
		}
	}
}

func anyClicked(g *Game) bool {
	for _, p := range g.Players {
		if g.HasClicked[p] {
			return true
		}
	}
	return false
}

func (s *GameService) broadcastRoundResult(gameRoom *GameRoom, result *RoundResult) {
	s.broadcast(gameRoom, infra.RoundResultMsg{
		Type:          "round_result",
		Winner:        result.Winner,
		Loser:         result.Loser,
		Reason:        result.Reason,
		Scores:        gameRoom.Game.Scores,
		ReactionTimes: result.ReactionTimes,
	})
}

func (s *GameService) broadcast(gameRoom *GameRoom, msg any) {
	for _, conn := range gameRoom.Connections {
		if err := conn.SendJSON(msg); err != nil {
			log.Printf("error broadcasting to %s: %v", conn.PlayerName, err)
		}
	}
}

func (s *GameService) cleanup(roomID string) {
	s.mu.Lock()
	gameRoom := s.rooms[roomID]
	if gameRoom != nil {
		select {
		case <-gameRoom.StopChan:
		default:
			close(gameRoom.StopChan)
		}
		delete(s.rooms, roomID)
	}
	s.mu.Unlock()
}
