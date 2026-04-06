# Reflex Card Game

A real-time two-player reflex card game. Cards appear one by one — when an Ace appears, the first player to slap wins the round. 
Click too early on a non-Ace and you lose.

## Live Demo

> https://reflex-card-game.onrender.com/

## Architecture

```
Browser A ──WebSocket──┐
                       ├── Go Echo Server (vertical slices)
Browser B ──WebSocket──┘       │
                               ├── /api/rooms        (REST — room management)
                               ├── /api/rooms/active  (REST — live room listing)
                               ├── /api/leaderboard   (REST — recent match results)
                               ├── /ws                (WebSocket — real-time game)
                               ├── /health            (health check)
                               ├── SQLite (leaderboard persistence)
                               └── serves React static files (production)
```

### Backend — Vertical Slice + Clean Architecture

Each feature is a self-contained vertical slice with clean architecture layers:

```
server/internal/
├── core/               # Config, middleware
├── features/
│   ├── health/         # Health check endpoint
│   ├── room/           # Room creation, joining, status
│   │   ├── entity.go       # Domain entity + repository interface
│   │   ├── repository.go   # In-memory implementation
│   │   ├── service.go      # Business logic
│   │   └── handler.go      # HTTP handlers
│   ├── game/           # Game engine, WebSocket handler
│   │   ├── card.go         # Card/Deck domain
│   │   ├── engine.go       # Game state machine
│   │   ├── service.go      # Game loop + active rooms + leaderboard hooks
│   │   └── handler.go      # WebSocket handler
│   └── leaderboard/    # Match history
│       ├── entity.go       # Entry domain model
│       ├── repository.go   # Repository interface (impl in infra/db)
│       ├── service.go      # Business logic
│       └── handler.go      # REST endpoint
├── infra/              # Infrastructure adapters
│   ├── ws.go               # WebSocket connection wrapper, message types
│   └── db/                 # Database layer
│       ├── sqlite.go           # Connection setup (Open, WAL mode)
│       ├── migrations.go       # Schema migrations
│       └── leaderboard_repo.go # SQLite implementation of leaderboard.Repository
└── tests/
    ├── unit/           # Unit tests
    └── e2e/            # WebSocket integration tests
```

### Frontend — Vertical Slice

```
client/src/
├── features/
│   ├── room/           # Home page, lobby, TanStack Query API hooks
│   └── game/           # Game screen, card component, WebSocket hook
├── infra/              # HTTP client
└── shared/             # Cross-feature shared code
```

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Go + Echo | Low latency, goroutines for concurrent game rooms, single binary deployment |
| Frontend | React + TypeScript + Vite | Component-based UI, type safety, fast dev/build |
| API calls | TanStack Query | Caching, loading/error states, mutations for room CRUD |
| Real-time | WebSocket (gorilla/websocket) | Bidirectional, low-latency game events |
| Database | SQLite (modernc.org/sqlite) | Leaderboard persistence, pure Go (no CGO), zero config |
| Styling | Tailwind CSS | Rapid UI development |
| Animations | Framer Motion | Card flip animations |
| Infra | Docker + docker-compose | Reproducible dev and prod environments |

## Key Design Decisions

1. **Server-authoritative game logic** — All card timing, click validation, and scoring happens on the server. Clients only render state and send click events. Prevents cheating.

2. **Vertical slice architecture** — Features (room, game) are self-contained slices. Each slice owns its handler, service, domain, and repository. No cross-slice coupling.

3. **Clean architecture within slices** — Domain entities have zero framework dependencies. Business logic is testable without HTTP/WebSocket concerns.

4. **SQLite leaderboard** — Match results persist across restarts via SQLite (pure Go driver, no CGO). The lobby shows the last 10 matches and currently active rooms in real-time.

5. **Single binary deployment** — Go serves both the API/WebSocket and the built React static files. One container, one port.

6. **TanStack Query for REST, raw WebSocket for real-time** — TanStack Query handles room CRUD with caching and loading states. WebSocket handles latency-critical game events.

## Tradeoffs

- **Network latency** — A player with lower latency has a slight advantage. Latency compensation would add significant complexity for minimal gain at this scale.
- **Leaderboard only** — SQLite persists match results but active games are still in-memory. Server restart loses in-progress games.
- **No authentication** — Players are identified by name only. Would add JWT/session tokens for production.
- **Single server** — No horizontal scaling. Would need a shared state store (Redis) for multi-instance deployment.

## Game Rules

1. Two players join the same room via a shared room code
2. Cards appear sequentially with random timing (1.5–3s intervals)
3. When an **Ace** appears, the first player to click **SLAP!** wins the round
4. Clicking on a **non-Ace** card loses the round (penalty for early click)
5. First player to win **3 rounds** wins the game

## Run Locally

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- (Optional, for running without Docker) [Go 1.25+](https://go.dev/dl/), [Node.js 24+](https://nodejs.org/)

### Option 1: Docker (recommended)

```bash
# Clone the repo
git clone https://github.com/rezwanul-haque/reflex-card-game.git
cd reflex-card-game

# Start dev environment (hot reload for both server and client)
make dev

# Open two browser tabs at http://localhost:5173
# Create a game in one tab, copy the room code, join from the other tab

# Stop
make dev-down
```

### Option 2: Without Docker

**Terminal 1 — Backend:**

```bash
cd server
go mod tidy
go run .
# Server starts on http://localhost:8080
```

**Terminal 2 — Frontend:**

```bash
cd client
npm install
npm run dev
# Client starts on http://localhost:5173
```

Open two browser tabs at http://localhost:5173 and play.

### Production build

```bash
make up           # Build and start single production container
                  # App available at http://localhost:8080
make down         # Stop
```

### Tests

```bash
make test                       # Run all Go tests
cd server && go test ./... -v   # Verbose output
```

## Deploy

### Render (easiest)

1. Push to GitHub
2. Connect repo on [Render](https://render.com)
3. It auto-detects `render.yaml` — deploy

### Fly.io (better performance)

```bash
fly launch        # First time — creates app
fly deploy        # Subsequent deploys
```

## Project Commands

| Command | Description |
|---------|-------------|
| `make dev` | Dev mode with hot reload |
| `make dev-down` | Stop dev containers |
| `make up` | Production build + run |
| `make down` | Stop production |
| `make build` | Build production image |
| `make test` | Run Go unit + e2e tests |
| `make clean` | Remove all containers + images |
