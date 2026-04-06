package core

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	Port          string
	AllowedOrigin string

	// Game timing
	AceClickTimeout  time.Duration
	CardFlipMinDelay time.Duration
	CardFlipMaxDelay time.Duration
	RoundEndDelay    time.Duration
	RoundsToWin      int
	TriggerRank      string
}

func LoadConfig() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	origin := os.Getenv("ALLOWED_ORIGIN")

	triggerRank := os.Getenv("TRIGGER_RANK")
	validRanks := map[string]bool{
		"A": true, "2": true, "3": true, "4": true, "5": true,
		"6": true, "7": true, "8": true, "9": true, "10": true,
		"J": true, "Q": true, "K": true,
	}
	if !validRanks[triggerRank] {
		triggerRank = "A"
	}

	return &Config{
		Port:             port,
		AllowedOrigin:    origin,
		AceClickTimeout:  durationEnv("ACE_CLICK_TIMEOUT_MS", 3000),
		CardFlipMinDelay: durationEnv("CARD_FLIP_MIN_DELAY_MS", 1500),
		CardFlipMaxDelay: durationEnv("CARD_FLIP_MAX_DELAY_MS", 3000),
		RoundEndDelay:    durationEnv("ROUND_END_DELAY_MS", 2000),
		RoundsToWin:      intEnv("ROUNDS_TO_WIN", 3),
		TriggerRank:      triggerRank,
	}
}

func durationEnv(key string, defaultMs int) time.Duration {
	if v := os.Getenv(key); v != "" {
		if ms, err := strconv.Atoi(v); err == nil {
			return time.Duration(ms) * time.Millisecond
		}
	}
	return time.Duration(defaultMs) * time.Millisecond
}

func intEnv(key string, defaultVal int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return defaultVal
}
