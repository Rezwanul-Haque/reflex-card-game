package leaderboard

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type Handler struct {
	service *Service
}

func NewHandler(s *Service) *Handler {
	return &Handler{service: s}
}

func (h *Handler) RegisterRoutes(g *echo.Group) {
	g.GET("/leaderboard", h.GetLeaderboard)
}

func (h *Handler) GetLeaderboard(c echo.Context) error {
	entries, err := h.service.GetRecentResults(10)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to fetch leaderboard"})
	}
	if entries == nil {
		entries = []Entry{}
	}
	return c.JSON(http.StatusOK, entries)
}
