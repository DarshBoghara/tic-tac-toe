/**
 * In-memory room manager for Tic-Tac-Toe Battle.
 *
 * NOTE: This stores rooms in process memory. All active rooms are lost when
 * the server restarts. For multi-instance deployments, replace this with a
 * shared store (e.g., Redis) and a compatible Socket.IO adapter.
 */

const { randomUUID } = require('crypto');
const { createInitialGameState } = require('./gameLogic');

// Map<roomCode, Room>
const rooms = new Map();

// Map<sessionToken, { roomCode, symbol }> — reconnection index
const sessions = new Map();

// Constants
const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit 0/O, 1/I for clarity
const MAX_ROOMS = 500;
const ROOM_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const DISCONNECT_GRACE_MS = 30_000; // 30 seconds

/**
 * Generate a random room code.
 * @returns {string}
 */
function generateRoomCode() {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

/**
 * Generate a unique room code, retrying on collision.
 * @returns {string}
 */
function generateUniqueRoomCode() {
  let attempts = 0;
  while (attempts < 20) {
    const code = generateRoomCode();
    if (!rooms.has(code)) return code;
    attempts++;
  }
  throw new Error('Could not generate unique room code. Server may be at capacity.');
}

/**
 * Create a new room.
 * @param {string} playerName
 * @param {string} socketId
 * @returns {{ roomCode, sessionToken, room }}
 */
function createRoom(playerName, socketId) {
  if (rooms.size >= MAX_ROOMS) {
    throw new Error('Server is at room capacity. Please try again later.');
  }

  const roomCode = generateUniqueRoomCode();
  const sessionToken = randomUUID();

  const room = {
    code: roomCode,
    createdAt: Date.now(),
    players: {
      X: {
        name: playerName,
        socketId,
        sessionToken,
        connected: true,
        disconnectTimer: null,
      },
      O: null,
    },
    gameState: createInitialGameState(),
    status: 'waiting', // 'waiting' | 'active' | 'finished'
    rematchRequests: new Set(),
  };

  rooms.set(roomCode, room);
  sessions.set(sessionToken, { roomCode, symbol: 'X' });

  return { roomCode, sessionToken, room };
}

/**
 * Join an existing room as player O.
 * @param {string} roomCode
 * @param {string} playerName
 * @param {string} socketId
 * @returns {{ sessionToken, room }}
 */
function joinRoom(roomCode, playerName, socketId) {
  const room = rooms.get(roomCode);

  if (!room) throw new Error('Room not found. Check the code and try again.');
  if (room.players.O !== null) throw new Error('Room is full. The game has already started.');
  if (room.players.X && room.players.X.socketId === socketId) {
    throw new Error('You cannot join your own room as the second player.');
  }

  const sessionToken = randomUUID();

  room.players.O = {
    name: playerName,
    socketId,
    sessionToken,
    connected: true,
    disconnectTimer: null,
  };

  room.status = 'waiting'; // still waiting — game starts when both confirm ready

  sessions.set(sessionToken, { roomCode, symbol: 'O' });

  return { sessionToken, room };
}

/**
 * Start the game in a room (both players present).
 * @param {string} roomCode
 */
function startGame(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) throw new Error('Room not found.');
  if (!room.players.X || !room.players.O) throw new Error('Not enough players.');
  room.gameState.status = 'active';
  room.status = 'active';
  return room;
}

/**
 * Get a room by code.
 * @param {string} roomCode
 * @returns {object|undefined}
 */
function getRoom(roomCode) {
  return rooms.get(roomCode);
}

/**
 * Resolve a session token to { roomCode, symbol }.
 * @param {string} token
 * @returns {object|undefined}
 */
function resolveSession(token) {
  return sessions.get(token);
}

/**
 * Update the socket ID for a player (on reconnect).
 * @param {string} roomCode
 * @param {string} symbol
 * @param {string} newSocketId
 */
function updateSocketId(roomCode, symbol, newSocketId) {
  const room = rooms.get(roomCode);
  if (room && room.players[symbol]) {
    room.players[symbol].socketId = newSocketId;
    room.players[symbol].connected = true;
    if (room.players[symbol].disconnectTimer) {
      clearTimeout(room.players[symbol].disconnectTimer);
      room.players[symbol].disconnectTimer = null;
    }
  }
}

/**
 * Mark a player as disconnected and start a grace-period timer.
 * @param {string} roomCode
 * @param {string} symbol
 * @param {Function} onExpire - Called when grace period expires
 */
function markDisconnected(roomCode, symbol, onExpire) {
  const room = rooms.get(roomCode);
  if (!room || !room.players[symbol]) return;

  room.players[symbol].connected = false;

  // Clear any existing timer
  if (room.players[symbol].disconnectTimer) {
    clearTimeout(room.players[symbol].disconnectTimer);
  }

  room.players[symbol].disconnectTimer = setTimeout(() => {
    onExpire(roomCode, symbol);
  }, DISCONNECT_GRACE_MS);
}

/**
 * Remove a room and clean up associated sessions.
 * @param {string} roomCode
 */
function removeRoom(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  // Clean up disconnect timers
  for (const sym of ['X', 'O']) {
    if (room.players[sym]?.disconnectTimer) {
      clearTimeout(room.players[sym].disconnectTimer);
    }
    if (room.players[sym]?.sessionToken) {
      sessions.delete(room.players[sym].sessionToken);
    }
  }

  rooms.delete(roomCode);
}

/**
 * Find the room a given socket belongs to.
 * Returns { room, symbol } or null.
 * @param {string} socketId
 * @returns {{ room: object, symbol: string }|null}
 */
function findRoomBySocket(socketId) {
  for (const room of rooms.values()) {
    for (const sym of ['X', 'O']) {
      if (room.players[sym]?.socketId === socketId) {
        return { room, symbol: sym };
      }
    }
  }
  return null;
}

/**
 * Periodically purge rooms that have been idle beyond TTL.
 */
function purgeExpiredRooms() {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (now - room.createdAt > ROOM_TTL_MS) {
      removeRoom(code);
    }
  }
}

// Run purge every 15 minutes
const purgeInterval = setInterval(purgeExpiredRooms, 15 * 60 * 1000);
purgeInterval.unref(); // Don't keep process alive solely for this

/**
 * Return room stats (for health endpoint).
 */
function getRoomStats() {
  return {
    activeRooms: rooms.size,
    activeSessions: sessions.size,
    maxRooms: MAX_ROOMS,
  };
}

module.exports = {
  createRoom,
  joinRoom,
  startGame,
  getRoom,
  resolveSession,
  updateSocketId,
  markDisconnected,
  removeRoom,
  findRoomBySocket,
  getRoomStats,
  DISCONNECT_GRACE_MS,
};
