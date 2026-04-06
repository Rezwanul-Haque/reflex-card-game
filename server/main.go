package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"time"

	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/rezwanul-haque/reflex-card-game/server/internal/core"
	"github.com/rezwanul-haque/reflex-card-game/server/internal/features/game"
	"github.com/rezwanul-haque/reflex-card-game/server/internal/features/health"
	"github.com/rezwanul-haque/reflex-card-game/server/internal/features/leaderboard"
	"github.com/rezwanul-haque/reflex-card-game/server/internal/features/room"
	"github.com/rezwanul-haque/reflex-card-game/server/internal/infra/db"
)

func main() {
	cfg := core.LoadConfig()

	e := echo.New()
	e.HideBanner = true

	// Middleware
	core.SetupMiddleware(e, cfg)

	// Database
	database, err := db.Open("./data/ace_reaction.db")
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	if err := db.Migrate(database); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	// Dependencies
	roomRepo := room.NewMemoryRoomRepository()
	roomSvc := room.NewRoomService(roomRepo)

	lbRepo := db.NewLeaderboardRepo(database)
	lbSvc := leaderboard.NewService(lbRepo)

	gameSvc := game.NewGameService(cfg, lbSvc)

	// Register routes
	api := e.Group("/api")
	roomHandler := room.NewRoomHandler(roomSvc)
	roomHandler.RegisterRoutes(api)

	lbHandler := leaderboard.NewHandler(lbSvc)
	lbHandler.RegisterRoutes(api)

	api.GET("/rooms/active", func(c echo.Context) error {
		return c.JSON(http.StatusOK, gameSvc.GetActiveRooms())
	})

	wsHandler := game.NewWSHandler(roomSvc, gameSvc)
	wsHandler.RegisterRoutes(e)

	health.RegisterRoutes(e)

	// Serve static frontend files in production
	if staticDir := os.Getenv("STATIC_DIR"); staticDir != "" {
		e.Static("/assets", staticDir+"/assets")
		e.File("/favicon.svg", staticDir+"/favicon.svg")
		// SPA fallback — serve index.html for all unmatched routes
		e.GET("/*", func(c echo.Context) error {
			return c.File(staticDir + "/index.html")
		})
		e.GET("/", func(c echo.Context) error {
			return c.File(staticDir + "/index.html")
		})
		log.Printf("Serving static files from %s", staticDir)
	}

	// Start server in goroutine
	go func() {
		log.Printf("Server starting on :%s", cfg.Port)
		if err := e.Start(":" + cfg.Port); err != nil {
			log.Printf("Server stopped: %v", err)
		}
	}()

	// Graceful shutdown
	gracefulShutdown(e)
}

func gracefulShutdown(e *echo.Echo) {
	ch := make(chan os.Signal, 1)
	signal.Notify(ch, os.Interrupt)
	<-ch

	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := e.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server shutdown gracefully")
}
