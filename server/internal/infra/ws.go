package infra

import (
	"encoding/json"
	"sync"

	"github.com/gorilla/websocket"
)

type Connection struct {
	Conn       *websocket.Conn
	PlayerName string
	RoomID     string
	mu         sync.Mutex
}

func NewConnection(conn *websocket.Conn, playerName, roomID string) *Connection {
	return &Connection{
		Conn:       conn,
		PlayerName: playerName,
		RoomID:     roomID,
	}
}

func (c *Connection) SendJSON(v any) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.Conn.WriteJSON(v)
}

func (c *Connection) ReadJSON(v any) error {
	return c.Conn.ReadJSON(v)
}

func (c *Connection) ReadMessage() (int, []byte, error) {
	return c.Conn.ReadMessage()
}

func (c *Connection) Close() error {
	return c.Conn.Close()
}

// Message types sent over WebSocket
type Message struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data,omitempty"`
}

type WaitingMsg struct {
	Type   string `json:"type"`
	RoomID string `json:"room_id"`
}

type GameStartMsg struct {
	Type         string `json:"type"`
	Opponent     string `json:"opponent"`
	PlayerNumber int    `json:"player_number"`
}

type CardFlipMsg struct {
	Type       string `json:"type"`
	Card       any    `json:"card"`
	CardNumber int    `json:"card_number"`
}

type RoundResultMsg struct {
	Type          string         `json:"type"`
	Winner        string         `json:"winner"`
	Loser         string         `json:"loser,omitempty"`
	Reason        string         `json:"reason"`
	Scores        map[string]int `json:"scores"`
	ReactionTimes map[string]int `json:"reaction_times,omitempty"`
}

type GameOverMsg struct {
	Type   string         `json:"type"`
	Winner string         `json:"winner"`
	Scores map[string]int `json:"scores"`
}

type PlayerLeftMsg struct {
	Type   string `json:"type"`
	Player string `json:"player"`
}

type ErrorMsg struct {
	Type    string `json:"type"`
	Message string `json:"message"`
}

type ClientMessage struct {
	Type       string `json:"type"`
	CardNumber int    `json:"card_number,omitempty"`
}
