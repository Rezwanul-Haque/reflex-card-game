package e2e_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
	"github.com/rezwanul-haque/reflex-card-game/server/internal/core"
	"github.com/rezwanul-haque/reflex-card-game/server/internal/features/game"
	"github.com/rezwanul-haque/reflex-card-game/server/internal/features/room"
	"github.com/rezwanul-haque/reflex-card-game/server/internal/infra"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestServer() (*echo.Echo, *room.RoomService, *game.GameService) {
	e := echo.New()
	repo := room.NewMemoryRoomRepository()
	roomSvc := room.NewRoomService(repo)
	cfg := core.LoadConfig()
	gameSvc := game.NewGameService(cfg, nil)

	api := e.Group("/api")
	roomHandler := room.NewRoomHandler(roomSvc)
	roomHandler.RegisterRoutes(api)

	wsHandler := game.NewWSHandler(roomSvc, gameSvc)
	wsHandler.RegisterRoutes(e)

	return e, roomSvc, gameSvc
}

func connectWS(t *testing.T, server *httptest.Server, roomID, name string) *websocket.Conn {
	t.Helper()
	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws?room=" + roomID + "&name=" + name
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	require.NoError(t, err)
	return conn
}

func readMsg(t *testing.T, conn *websocket.Conn) map[string]any {
	t.Helper()
	conn.SetReadDeadline(time.Now().Add(5 * time.Second))
	_, data, err := conn.ReadMessage()
	require.NoError(t, err)
	var msg map[string]any
	require.NoError(t, json.Unmarshal(data, &msg))
	return msg
}

func TestTwoPlayersJoinAndGameStarts(t *testing.T) {
	e, roomSvc, _ := setupTestServer()
	server := httptest.NewServer(e)
	defer server.Close()

	// Create a room
	r, err := roomSvc.CreateRoom()
	require.NoError(t, err)

	// Player 1 connects
	conn1 := connectWS(t, server, r.ID, "Alice")
	defer conn1.Close()

	msg1 := readMsg(t, conn1)
	assert.Equal(t, "waiting", msg1["type"])

	// Player 2 connects
	conn2 := connectWS(t, server, r.ID, "Bob")
	defer conn2.Close()

	// Both should get game_start
	msg2 := readMsg(t, conn1)
	assert.Equal(t, "game_start", msg2["type"])
	assert.Equal(t, "Bob", msg2["opponent"])

	msg3 := readMsg(t, conn2)
	assert.Equal(t, "game_start", msg3["type"])
	assert.Equal(t, "Alice", msg3["opponent"])
}

func TestPlayerGetsCardFlips(t *testing.T) {
	e, roomSvc, _ := setupTestServer()
	server := httptest.NewServer(e)
	defer server.Close()

	r, _ := roomSvc.CreateRoom()

	conn1 := connectWS(t, server, r.ID, "Alice")
	defer conn1.Close()
	readMsg(t, conn1) // waiting

	conn2 := connectWS(t, server, r.ID, "Bob")
	defer conn2.Close()

	readMsg(t, conn1) // game_start
	readMsg(t, conn2) // game_start

	// Wait for first card flip (initial 2s delay + up to 3s)
	conn1.SetReadDeadline(time.Now().Add(10 * time.Second))
	_, data, err := conn1.ReadMessage()
	require.NoError(t, err)

	var msg map[string]any
	require.NoError(t, json.Unmarshal(data, &msg))
	assert.Equal(t, "card_flip", msg["type"])
	assert.NotNil(t, msg["card"])
}

func TestEarlyClickLosesRound(t *testing.T) {
	e, roomSvc, gameSvc := setupTestServer()
	server := httptest.NewServer(e)
	defer server.Close()

	r, _ := roomSvc.CreateRoom()

	conn1 := connectWS(t, server, r.ID, "Alice")
	defer conn1.Close()
	readMsg(t, conn1) // waiting

	conn2 := connectWS(t, server, r.ID, "Bob")
	defer conn2.Close()

	readMsg(t, conn1) // game_start
	readMsg(t, conn2) // game_start

	// Wait for a card flip
	conn1.SetReadDeadline(time.Now().Add(10 * time.Second))
	_, data, err := conn1.ReadMessage()
	require.NoError(t, err)

	var flipMsg map[string]any
	json.Unmarshal(data, &flipMsg)

	// Also read on conn2
	conn2.SetReadDeadline(time.Now().Add(10 * time.Second))
	conn2.ReadMessage()

	// Check if this card is NOT an Ace
	card := flipMsg["card"].(map[string]any)
	cardNum := int(flipMsg["card_number"].(float64))
	if card["rank"] != "A" {
		// Click on non-ace with correct card number — should lose
		clickMsg := infra.ClientMessage{Type: "click", CardNumber: cardNum}
		msgBytes, _ := json.Marshal(clickMsg)
		conn1.WriteMessage(websocket.TextMessage, msgBytes)

		// Read round result
		conn1.SetReadDeadline(time.Now().Add(5 * time.Second))
		_, resultData, err := conn1.ReadMessage()
		require.NoError(t, err)

		var result map[string]any
		json.Unmarshal(resultData, &result)
		assert.Equal(t, "round_result", result["type"])
		assert.Equal(t, "early_click", result["reason"])
		assert.Equal(t, "Bob", result["winner"])
	}

	_ = gameSvc // used indirectly
}

func TestWebSocketRejectsInvalidRoom(t *testing.T) {
	e, _, _ := setupTestServer()
	server := httptest.NewServer(e)
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws?room=nonexistent&name=Alice"
	_, resp, err := websocket.DefaultDialer.Dial(wsURL, nil)
	// Should get an error or non-101 status
	if err != nil {
		if resp != nil {
			assert.NotEqual(t, http.StatusSwitchingProtocols, resp.StatusCode)
		}
		return
	}
}
