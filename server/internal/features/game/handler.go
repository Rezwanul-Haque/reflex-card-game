package game

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
	"github.com/rezwanul-haque/reflex-card-game/server/internal/features/room"
	"github.com/rezwanul-haque/reflex-card-game/server/internal/infra"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins in dev; restrict in production
	},
}

type WSHandler struct {
	roomService *room.RoomService
	gameService *GameService
	// Track waiting connections per room
	mu       sync.Mutex
	waitPool map[string]*infra.Connection
}

func NewWSHandler(rs *room.RoomService, gs *GameService) *WSHandler {
	return &WSHandler{
		roomService: rs,
		gameService: gs,
		waitPool:    make(map[string]*infra.Connection),
	}
}

func (h *WSHandler) RegisterRoutes(e *echo.Echo) {
	e.GET("/ws", h.HandleWebSocket)
}

func (h *WSHandler) HandleWebSocket(c echo.Context) error {
	roomID := c.QueryParam("room")
	playerName := c.QueryParam("name")

	if roomID == "" || playerName == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "room and name are required"})
	}

	// Validate room exists
	r, err := h.roomService.GetRoom(roomID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "room not found"})
	}

	// Join room
	_, err = h.roomService.JoinRoom(roomID, playerName)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	// Upgrade to WebSocket
	conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		log.Printf("websocket upgrade error: %v", err)
		return err
	}

	wsConn := infra.NewConnection(conn, playerName, roomID)
	defer func() {
		wsConn.Close()
		h.roomService.RemovePlayer(roomID, playerName)
		h.gameService.HandleDisconnect(roomID, playerName)
		h.mu.Lock()
		if waiting, ok := h.waitPool[roomID]; ok && waiting.PlayerName == playerName {
			delete(h.waitPool, roomID)
			h.gameService.RemoveWaiting(roomID)
		}
		h.mu.Unlock()
	}()

	h.mu.Lock()
	waiting, hasWaiting := h.waitPool[roomID]

	if !hasWaiting {
		// First player — wait for opponent
		h.waitPool[roomID] = wsConn
		h.mu.Unlock()

		h.gameService.AddWaiting(roomID, playerName)

		wsConn.SendJSON(infra.WaitingMsg{
			Type:   "waiting",
			RoomID: roomID,
		})

		// Read loop while waiting
		h.readLoop(wsConn, roomID)
		return nil
	}

	// Second player — start the game
	delete(h.waitPool, roomID)
	h.mu.Unlock()

	h.gameService.RemoveWaiting(roomID)

	_ = r // Room is validated

	conns := map[string]*infra.Connection{
		waiting.PlayerName: waiting,
		playerName:         wsConn,
	}

	h.gameService.CreateGame(roomID, waiting.PlayerName, playerName, conns)

	// Read loop for second player
	h.readLoop(wsConn, roomID)
	return nil
}

func (h *WSHandler) readLoop(conn *infra.Connection, roomID string) {
	for {
		var msg infra.ClientMessage
		err := conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("websocket error: %v", err)
			}
			return
		}

		switch msg.Type {
		case "click":
			h.gameService.HandleClick(roomID, conn.PlayerName, msg.CardNumber)
		}
	}
}
