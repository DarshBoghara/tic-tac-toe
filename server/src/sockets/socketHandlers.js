/**
 * Socket.IO event handlers for Tic-Tac-Toe Battle.
 * All game decisions are made server-side.
 */

const {
  createRoom,
  joinRoom,
  startGame,
  getRoom,
  resolveSession,
  updateSocketId,
  markDisconnected,
  removeRoom,
  findRoomBySocket,
  DISCONNECT_GRACE_MS,
} = require('../game/roomManager');

const { applyMove, resetRound } = require('../game/gameLogic');

// Simple rate limiting per socket for sensitive events
const rateLimits = new Map(); // socketId -> { createRoom: timestamps[], joinRoom: timestamps[] }

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_CREATE = 5;
const RATE_LIMIT_MAX_JOIN = 10;

function checkRateLimit(socketId, action, max) {
  if (!rateLimits.has(socketId)) {
    rateLimits.set(socketId, { createRoom: [], joinRoom: [] });
  }
  const limits = rateLimits.get(socketId);
  const now = Date.now();
  limits[action] = (limits[action] || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (limits[action].length >= max) return false;
  limits[action].push(now);
  return true;
}

/**
 * Sanitize and validate a display name.
 * @param {*} name
 * @returns {{ valid: boolean, name?: string, error?: string }}
 */
function validateName(name) {
  if (typeof name !== 'string') return { valid: false, error: 'Name must be a string.' };
  const trimmed = name.trim();
  if (trimmed.length < 1) return { valid: false, error: 'Name cannot be empty.' };
  if (trimmed.length > 20) return { valid: false, error: 'Name must be 20 characters or fewer.' };
  // Allow letters, numbers, spaces, underscores, hyphens
  if (!/^[\w\s-]+$/.test(trimmed)) return { valid: false, error: 'Name contains invalid characters.' };
  return { valid: true, name: trimmed };
}

/**
 * Sanitize and validate a room code.
 * @param {*} code
 * @returns {{ valid: boolean, code?: string, error?: string }}
 */
function validateRoomCode(code) {
  if (typeof code !== 'string') return { valid: false, error: 'Room code must be a string.' };
  const upper = code.trim().toUpperCase();
  if (upper.length !== 6) return { valid: false, error: 'Room code must be 6 characters.' };
  if (!/^[A-Z0-9]+$/.test(upper)) return { valid: false, error: 'Room code contains invalid characters.' };
  return { valid: true, code: upper };
}

/**
 * Build the safe room state snapshot to send to clients.
 * Never sends session tokens or internal timers.
 */
function buildRoomSnapshot(room) {
  return {
    code: room.code,
    status: room.status,
    players: {
      X: room.players.X
        ? { name: room.players.X.name, connected: room.players.X.connected }
        : null,
      O: room.players.O
        ? { name: room.players.O.name, connected: room.players.O.connected }
        : null,
    },
    gameState: {
      board: room.gameState.board,
      currentTurn: room.gameState.currentTurn,
      status: room.gameState.status,
      winner: room.gameState.winner,
      winningCells: room.gameState.winningCells,
      scores: room.gameState.scores,
      roundNumber: room.gameState.roundNumber,
    },
  };
}

/**
 * Register all Socket.IO event handlers.
 * @param {import('socket.io').Server} io
 */
function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    // ─── CREATE ROOM ──────────────────────────────────────────────────────────
    socket.on('create_room', (payload, callback) => {
      try {
        if (!checkRateLimit(socket.id, 'createRoom', RATE_LIMIT_MAX_CREATE)) {
          return callback?.({ success: false, error: 'Too many room creation attempts. Please wait.' });
        }

        const nameResult = validateName(payload?.playerName);
        if (!nameResult.valid) {
          return callback?.({ success: false, error: nameResult.error });
        }

        const { roomCode, sessionToken, room } = createRoom(nameResult.name, socket.id);
        socket.join(roomCode);

        console.log(`[room] created: ${roomCode} by ${nameResult.name} (${socket.id})`);

        callback?.({
          success: true,
          roomCode,
          sessionToken,
          symbol: 'X',
          room: buildRoomSnapshot(room),
        });
      } catch (err) {
        console.error('[create_room] error:', err.message);
        callback?.({ success: false, error: err.message });
      }
    });

    // ─── JOIN ROOM ────────────────────────────────────────────────────────────
    socket.on('join_room', (payload, callback) => {
      try {
        if (!checkRateLimit(socket.id, 'joinRoom', RATE_LIMIT_MAX_JOIN)) {
          return callback?.({ success: false, error: 'Too many join attempts. Please wait.' });
        }

        const nameResult = validateName(payload?.playerName);
        if (!nameResult.valid) {
          return callback?.({ success: false, error: nameResult.error });
        }

        const codeResult = validateRoomCode(payload?.roomCode);
        if (!codeResult.valid) {
          return callback?.({ success: false, error: codeResult.error });
        }

        const { sessionToken, room } = joinRoom(codeResult.code, nameResult.name, socket.id);
        socket.join(codeResult.code);

        console.log(`[room] joined: ${codeResult.code} by ${nameResult.name} (${socket.id})`);

        // Notify the joining player
        callback?.({
          success: true,
          roomCode: codeResult.code,
          sessionToken,
          symbol: 'O',
          room: buildRoomSnapshot(room),
        });

        // Notify the existing player (X) that opponent joined
        socket.to(codeResult.code).emit('player_joined', {
          room: buildRoomSnapshot(room),
        });
      } catch (err) {
        console.error('[join_room] error:', err.message);
        callback?.({ success: false, error: err.message });
      }
    });

    // ─── RECONNECT ────────────────────────────────────────────────────────────
    socket.on('reconnect_player', (payload, callback) => {
      try {
        const { sessionToken } = payload || {};
        if (typeof sessionToken !== 'string') {
          return callback?.({ success: false, error: 'Invalid session token.' });
        }

        const session = resolveSession(sessionToken);
        if (!session) {
          return callback?.({ success: false, error: 'Session expired or not found.' });
        }

        const { roomCode, symbol } = session;
        const room = getRoom(roomCode);
        if (!room) {
          return callback?.({ success: false, error: 'Room no longer exists.' });
        }

        updateSocketId(roomCode, symbol, socket.id);
        socket.join(roomCode);

        console.log(`[room] reconnected: ${roomCode} symbol=${symbol} (${socket.id})`);

        callback?.({
          success: true,
          roomCode,
          symbol,
          room: buildRoomSnapshot(room),
        });

        // Notify opponent of reconnection
        socket.to(roomCode).emit('opponent_reconnected', {
          symbol,
          room: buildRoomSnapshot(room),
        });
      } catch (err) {
        console.error('[reconnect_player] error:', err.message);
        callback?.({ success: false, error: err.message });
      }
    });

    // ─── START GAME ───────────────────────────────────────────────────────────
    socket.on('start_game', (payload, callback) => {
      try {
        const { roomCode, sessionToken } = payload || {};
        const session = resolveSession(sessionToken);
        if (!session || session.roomCode !== roomCode) {
          return callback?.({ success: false, error: 'Unauthorized.' });
        }

        const room = startGame(roomCode);

        io.to(roomCode).emit('game_started', { room: buildRoomSnapshot(room) });
        callback?.({ success: true });
      } catch (err) {
        console.error('[start_game] error:', err.message);
        callback?.({ success: false, error: err.message });
      }
    });

    // ─── MAKE MOVE ────────────────────────────────────────────────────────────
    socket.on('make_move', (payload, callback) => {
      try {
        const { roomCode, cellIndex, sessionToken } = payload || {};

        // Resolve session
        const session = resolveSession(sessionToken);
        if (!session) {
          return callback?.({ success: false, error: 'Invalid session. Please rejoin.' });
        }
        if (session.roomCode !== roomCode) {
          return callback?.({ success: false, error: 'You are not a member of this room.' });
        }

        const room = getRoom(roomCode);
        if (!room) {
          return callback?.({ success: false, error: 'Room not found.' });
        }

        const { symbol } = session;

        // Apply move (server-authoritative validation inside applyMove)
        const result = applyMove(room.gameState, cellIndex, symbol);
        if (!result.success) {
          return callback?.({ success: false, error: result.error });
        }

        room.gameState = result.newState;

        // Broadcast updated state to both players
        io.to(roomCode).emit('move_made', {
          cellIndex,
          symbol,
          room: buildRoomSnapshot(room),
        });

        // If game finished, emit game_over
        if (result.newState.status === 'finished') {
          io.to(roomCode).emit('game_over', {
            winner: result.newState.winner,
            winningCells: result.newState.winningCells,
            scores: result.newState.scores,
            room: buildRoomSnapshot(room),
          });
        }

        callback?.({ success: true });
      } catch (err) {
        console.error('[make_move] error:', err.message);
        callback?.({ success: false, error: 'Server error processing move.' });
      }
    });

    // ─── RESTART ROUND ────────────────────────────────────────────────────────
    socket.on('restart_round', (payload, callback) => {
      try {
        const { roomCode, sessionToken } = payload || {};
        const session = resolveSession(sessionToken);
        if (!session || session.roomCode !== roomCode) {
          return callback?.({ success: false, error: 'Unauthorized.' });
        }

        const room = getRoom(roomCode);
        if (!room) return callback?.({ success: false, error: 'Room not found.' });
        if (!room.players.X || !room.players.O) {
          return callback?.({ success: false, error: 'Cannot restart — opponent not present.' });
        }

        room.gameState = resetRound(room.gameState);
        room.status = 'active';
        room.rematchRequests = new Set();

        io.to(roomCode).emit('round_restarted', { room: buildRoomSnapshot(room) });
        callback?.({ success: true });
      } catch (err) {
        console.error('[restart_round] error:', err.message);
        callback?.({ success: false, error: err.message });
      }
    });

    // ─── REMATCH REQUEST ──────────────────────────────────────────────────────
    socket.on('rematch_request', (payload, callback) => {
      try {
        const { roomCode, sessionToken } = payload || {};
        const session = resolveSession(sessionToken);
        if (!session || session.roomCode !== roomCode) {
          return callback?.({ success: false, error: 'Unauthorized.' });
        }

        const room = getRoom(roomCode);
        if (!room) return callback?.({ success: false, error: 'Room not found.' });

        room.rematchRequests.add(session.symbol);

        // Notify both players of current rematch status
        io.to(roomCode).emit('rematch_status', {
          requestedBy: [...room.rematchRequests],
        });

        // If both players agreed, start a new round
        if (room.rematchRequests.has('X') && room.rematchRequests.has('O')) {
          room.gameState = resetRound(room.gameState);
          room.status = 'active';
          room.rematchRequests = new Set();
          io.to(roomCode).emit('round_restarted', { room: buildRoomSnapshot(room) });
        }

        callback?.({ success: true });
      } catch (err) {
        console.error('[rematch_request] error:', err.message);
        callback?.({ success: false, error: err.message });
      }
    });

    // ─── RETURN TO LOBBY ──────────────────────────────────────────────────────
    socket.on('return_to_lobby', (payload, callback) => {
      try {
        const { roomCode, sessionToken } = payload || {};
        const session = resolveSession(sessionToken);
        if (!session || session.roomCode !== roomCode) {
          return callback?.({ success: false, error: 'Unauthorized.' });
        }

        socket.to(roomCode).emit('opponent_left', {
          message: 'Your opponent has left the game.',
        });

        removeRoom(roomCode);
        socket.leave(roomCode);

        callback?.({ success: true });
      } catch (err) {
        console.error('[return_to_lobby] error:', err.message);
        callback?.({ success: false, error: err.message });
      }
    });

    // ─── DISCONNECT ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[socket] disconnected: ${socket.id}`);
      rateLimits.delete(socket.id);

      const found = findRoomBySocket(socket.id);
      if (!found) return;

      const { room, symbol } = found;
      const roomCode = room.code;

      markDisconnected(roomCode, symbol, (code, sym) => {
        // Grace period expired — notify opponent and clean up
        const r = getRoom(code);
        if (!r) return;

        console.log(`[room] grace period expired for ${sym} in room ${code}`);
        io.to(code).emit('player_left', {
          symbol: sym,
          message: `${r.players[sym]?.name || 'Player'} disconnected and did not reconnect.`,
        });
        removeRoom(code);
      });

      // Notify opponent immediately about temporary disconnect
      socket.to(roomCode).emit('opponent_disconnected', {
        symbol,
        message: `${room.players[symbol]?.name || 'Player'} lost connection. Waiting ${Math.round(DISCONNECT_GRACE_MS / 1000)}s for reconnection...`,
        gracePeriodMs: DISCONNECT_GRACE_MS,
      });
    });
  });
}

module.exports = { registerSocketHandlers };
