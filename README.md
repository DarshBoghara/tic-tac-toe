# Tic-Tac-Toe Battle 🎮

> Real-time online multiplayer Tic-Tac-Toe. Challenge a friend. Make every move count.

[![Node.js](https://img.shields.io/badge/Node.js-22+-green?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-black?logo=socket.io)](https://socket.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

---

## 📸 Screenshots

> _Screenshots will be added after deployment. The game features a dark premium UI with cyan/violet color scheme._

| Landing Page | Waiting Room | Game Board | Result Screen |
|---|---|---|---|
| _(screenshot)_ | _(screenshot)_ | _(screenshot)_ | _(screenshot)_ |

---

## ✨ Features

- 🌐 **Real-time multiplayer** — two players on different devices, different networks
- 🔐 **Server-authoritative game logic** — no client-side cheating possible
- 🏠 **Private rooms** — 6-character room codes, shareable via Web Share API
- 🔄 **Reconnection handling** — 30-second grace period, state restored on reconnect
- 🏆 **Best-of-3 match mode** — persistent score tracking across rounds
- 🎉 **Confetti & sounds** — celebration effects on win (sounds toggle)
- 📱 **Fully responsive** — works on mobile, tablet, and desktop
- ♿ **Accessible** — keyboard navigation, ARIA labels, focus indicators
- 🎨 **Premium dark UI** — navy background, cyan X, violet O, subtle glows
- 🛡️ **Rate limiting** — server-side protection against abuse
- 🩺 **Health endpoint** — `/health` for monitoring

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4 |
| **Multiplayer** | Socket.IO 4 (client + server) |
| **Backend** | Node.js 22, Express 4 |
| **State** | React Context + useReducer |
| **Routing** | React Router v7 |
| **Icons** | Lucide React |
| **Notifications** | react-hot-toast |
| **Animations** | canvas-confetti, CSS transitions |
| **Testing** | Jest 29 |
| **Frontend Deploy** | Vercel |
| **Backend Deploy** | Render (WebSocket support) |

---

## 🏗️ Architecture

```
Browser A (Player X)              Browser B (Player O)
      │                                   │
      │ Socket.IO (WSS)                   │ Socket.IO (WSS)
      │                                   │
      ▼                                   ▼
┌─────────────────────────────────────────────────────┐
│              Node.js + Express Server               │
│                                                     │
│  ┌──────────────┐    ┌────────────────────────────┐ │
│  │  Socket.IO   │    │       Game Logic           │ │
│  │  Handlers    │───▶│  • applyMove (server auth) │ │
│  │              │    │  • checkWinner             │ │
│  └──────────────┘    │  • resetRound              │ │
│         │            └────────────────────────────┘ │
│  ┌──────▼─────────────────────────────────────────┐ │
│  │              Room Manager                      │ │
│  │  • In-memory Map<roomCode, Room>               │ │
│  │  • Session tokens for reconnection             │ │
│  │  • Disconnect grace period (30s)               │ │
│  │  • Automatic room cleanup (2h TTL)             │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Key Design Decisions:**
- **Server-authoritative:** The server validates every move. The client only sends intent (`cellIndex`), never the result.
- **Session tokens:** On reconnect, the player sends their UUID session token (stored in React state). The server matches this to their room slot, updating their socket ID without resetting game state.
- **In-memory storage:** Rooms are stored in a `Map`. If the server restarts, rooms are lost. For multi-instance production, add Redis + `@socket.io/redis-adapter`.

---

## 📁 Project Structure

```
tic-tac-toe-battle/
├── client/                       # React frontend
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Board.jsx         # 3×3 game board
│   │   │   ├── Cell.jsx          # Individual cell with animations
│   │   │   ├── ScoreBoard.jsx    # Player scores and round number
│   │   │   ├── TurnIndicator.jsx # Whose turn it is
│   │   │   ├── GameResultOverlay.jsx  # Win/draw result modal
│   │   │   ├── JoinRoomModal.jsx # Room code entry modal
│   │   │   ├── ConnectionStatus.jsx   # Socket connection indicator
│   │   │   ├── OpponentStatus.jsx     # Opponent disconnect banner
│   │   │   ├── PlayerCard.jsx    # Player name/symbol card
│   │   │   └── HowToPlay.jsx     # Collapsible instructions
│   │   ├── hooks/
│   │   │   ├── useGame.js        # Main game hook (socket events + actions)
│   │   │   └── useGameStore.jsx  # React Context state store
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx   # Home screen
│   │   │   ├── RoomPage.jsx      # Waiting room
│   │   │   └── GamePage.jsx      # Active game screen
│   │   ├── services/
│   │   │   ├── socket.js         # Socket.IO singleton client
│   │   │   └── sounds.js         # Web Audio API sound effects
│   │   ├── styles/
│   │   │   └── globals.css       # Tailwind + custom animations
│   │   ├── App.jsx               # Router + providers
│   │   └── main.jsx              # Entry point
│   ├── .env                      # Local env (gitignored)
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                       # Node.js backend
│   ├── src/
│   │   ├── game/
│   │   │   ├── gameLogic.js      # Move validation, win/draw detection
│   │   │   └── roomManager.js    # Room lifecycle, session tokens
│   │   ├── sockets/
│   │   │   └── socketHandlers.js # All Socket.IO event handlers
│   │   └── index.js              # Express + Socket.IO server
│   ├── __tests__/
│   │   ├── gameLogic.test.js     # 27 game logic tests
│   │   └── roomManager.test.js   # 12 room manager tests
│   ├── .env                      # Local env (gitignored)
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── package.json                  # Root convenience scripts
└── README.md
```

---

## 🚀 Installation & Local Development

### Prerequisites

- **Node.js 18+** — [Download](https://nodejs.org)
- **npm 9+** — included with Node.js
- **Git** — [Download](https://git-scm.com)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/tic-tac-toe-battle.git
cd tic-tac-toe-battle
```

### 2. Install server dependencies

```bash
cd server
npm install
```

### 3. Configure server environment

```bash
# Windows PowerShell
Copy-Item .env.example .env

# macOS/Linux
cp .env.example .env
```

The default `.env` for local development:
```
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### 4. Install client dependencies

```bash
cd ../client
npm install
```

### 5. Configure client environment

```bash
# Windows PowerShell
Copy-Item .env.example .env

# macOS/Linux
cp .env.example .env
```

The default `.env` for local development:
```
VITE_SERVER_URL=http://localhost:5000
```

### 6. Start the backend server

Open a terminal and run:
```bash
cd server
npm run dev
```

You should see:
```
[server] Starting in development mode
[server] Allowed origin: http://localhost:5173
[server] Listening on port 5000
```

Verify: http://localhost:5000/health

### 7. Start the frontend (new terminal)

```bash
cd client
npm run dev
```

You should see:
```
  VITE v8.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

### 8. Play the game locally

1. Open **http://localhost:5173** in **two browser windows** (or tabs)
2. In Window 1: enter a name → **Create Room** → note the 6-character code
3. In Window 2: enter a different name → **Join Room** → enter the code
4. In Window 1: click **Start Match!**
5. Play! Moves update instantly in both windows.

---

## 🔌 Environment Variables

### Server (`server/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Server listen port |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `NODE_ENV` | `development` | Environment mode |

### Client (`client/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_SERVER_URL` | `http://localhost:5000` | Backend server URL |

> ⚠️ **Never commit `.env` files with production secrets to Git.**

---

## 🎮 Game Rules

1. The game is played on a 3×3 grid.
2. Player X always goes first.
3. Players take turns marking an empty cell.
4. The first player to get **3 marks in a row** (horizontal, vertical, or diagonal) wins the round.
5. If all 9 cells are filled with no winner, the round is a **draw**.
6. The **best of 3 rounds** wins the match.
7. Scores persist across rounds until a player returns to lobby.

### Winning Combinations (8 total)

```
Rows:        Columns:     Diagonals:
X X X        X . .        X . .
. . .        X . .        . X .
. . .        X . .        . . X

. . .        . X .        . . X
X X X        . X .        . X .
. . .        . X .        X . .

. . .        . . X
. . .        . . X
X X X        . . X
```

---

## 🧪 Testing

### Run all server tests

```bash
cd server
npm test
```

**39 tests across 2 suites:**

| Suite | Tests |
|---|---|
| `gameLogic.test.js` | Valid X/O moves, out-of-turn rejection, occupied cell rejection, invalid index rejection, game-not-active rejection, horizontal/vertical/diagonal wins, draw detection, score tracking, round reset |
| `roomManager.test.js` | Create room, join room, third-player rejection, same-socket self-join prevention, room not found, socket lookup, stats, cleanup |

### Watch mode

```bash
npm run test:watch
```

### Manual integration test

1. Start both servers
2. Open two browser windows
3. Create a room in Window 1
4. Join from Window 2
5. Try making a move when it's not your turn — should be rejected
6. Try clicking an occupied cell — should be rejected
7. Win the round — confetti should appear
8. Close one window — opponent disconnect banner should appear
9. Reopen the window — reconnection should restore state

---

## 📡 Socket.IO Events

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `create_room` | `{ playerName }` | Create a new room |
| `join_room` | `{ playerName, roomCode }` | Join an existing room |
| `reconnect_player` | `{ sessionToken }` | Restore session after disconnect |
| `start_game` | `{ roomCode, sessionToken }` | Host starts the match |
| `make_move` | `{ roomCode, cellIndex, sessionToken }` | Place X or O on the board |
| `restart_round` | `{ roomCode, sessionToken }` | Start a new round (host only) |
| `rematch_request` | `{ roomCode, sessionToken }` | Request a rematch |
| `return_to_lobby` | `{ roomCode, sessionToken }` | Leave the room |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `player_joined` | `{ room }` | Opponent joined the room |
| `game_started` | `{ room }` | Match has begun |
| `move_made` | `{ cellIndex, symbol, room }` | Move was accepted and applied |
| `game_over` | `{ winner, winningCells, scores, room }` | Round ended |
| `round_restarted` | `{ room }` | New round started |
| `rematch_status` | `{ requestedBy }` | Rematch request update |
| `opponent_disconnected` | `{ symbol, message, gracePeriodMs }` | Opponent lost connection |
| `opponent_reconnected` | `{ symbol, room }` | Opponent reconnected |
| `player_left` | `{ symbol, message }` | Opponent left permanently |
| `opponent_left` | `{ message }` | You left (echo to remaining player) |

---

## 🔒 Security

- **Server-authoritative moves:** All validation (turn, cell, bounds, game status) runs server-side.
- **Session tokens:** UUIDs issued by the server, used to verify reconnecting players.
- **CORS:** Restricted to the configured `CLIENT_ORIGIN`. Update for production.
- **Rate limiting:** Room creation capped at 5/min, join attempts at 10/min per socket. HTTP requests at 60/min.
- **Input validation:** Player names (max 20 chars, alphanumeric), room codes (6 chars), cell indices (0–8 integer).
- **No secrets in URLs:** Session tokens are only exchanged via Socket.IO, never in query strings.
- **Room limits:** Maximum 500 concurrent rooms, 2h TTL for abandoned rooms.

---

## 🚢 Deployment

### Backend → Render

1. **Push to GitHub:**
   ```bash
   cd tic-tac-toe-battle
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/tic-tac-toe-battle.git
   git push -u origin main
   ```

2. **Create a Render Web Service:**
   - Go to [render.com](https://render.com) → New → Web Service
   - Connect your GitHub repository
   - Set **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node

3. **Add environment variables in Render dashboard:**
   ```
   PORT=5000
   CLIENT_ORIGIN=https://YOUR-FRONTEND.vercel.app
   NODE_ENV=production
   ```

4. **Deploy** → note your public URL (e.g., `https://tictactoe-battle.onrender.com`)

5. **Verify:** `https://tictactoe-battle.onrender.com/health`

> ⚠️ **Note:** Render free-tier instances spin down after 15 minutes of inactivity. The first request after sleep takes ~30s. Upgrade to a paid plan for always-on deployments.

### Frontend → Vercel

1. **Import project at [vercel.com](https://vercel.com):**
   - New Project → Import Git Repository
   - Set **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

2. **Add environment variable:**
   ```
   VITE_SERVER_URL=https://tictactoe-battle.onrender.com
   ```

3. **Deploy** → note your Vercel URL

4. **Update backend CORS:**
   - In Render dashboard, update `CLIENT_ORIGIN` to your Vercel URL
   - Redeploy or restart the service

5. **Test end-to-end:**
   - Open your Vercel URL on two different devices or networks
   - Create a room, join, play a full game

---

## 🔧 Troubleshooting

| Problem | Solution |
|---|---|
| "Could not connect to server" | Check `VITE_SERVER_URL` points to your live backend. Verify `/health` responds. |
| CORS errors in browser console | Make sure `CLIENT_ORIGIN` on the backend matches your frontend origin exactly (no trailing slash). |
| Socket.IO falls back to polling | Normal behavior. WebSocket upgrade happens automatically. Check for proxy restrictions. |
| Room not found after refresh | Session tokens are in-memory. If the server restarted, rooms are gone. |
| Render 502 errors | The free-tier instance may be sleeping. Wait 30s and retry. |
| Build fails with TypeScript errors | The project uses plain JS. Check `tsconfig.json` settings if TypeScript is misconfigured. |
| Can't hear sounds | Sounds are disabled by default. Toggle the sound icon in the game header. |
| Third player joins room | This is blocked by the server. The join will be rejected with "Room is full." |

---

## ⚠️ Current Limitations

1. **In-memory storage** — Rooms are lost when the server restarts. Production multi-instance deployments require Redis.
2. **No persistent accounts** — Players cannot track stats across sessions.
3. **No matchmaking** — Players must manually share room codes.
4. **Render free-tier cold starts** — 30-second delay after inactivity.
5. **No game replay** — Move history is not recorded.
6. **Best-of-3 only** — Match length is fixed at the moment.

---

## 🔮 Future Improvements

- [ ] Persistent storage with Redis or PostgreSQL
- [ ] User accounts and win/loss statistics
- [ ] Public matchmaking queue
- [ ] Custom board sizes (4×4, 5×5)
- [ ] Spectator mode
- [ ] Move timer / time pressure mode
- [ ] Game replay with move history
- [ ] Emoji reactions
- [ ] Tournament bracket mode
- [ ] PWA / offline support

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.
