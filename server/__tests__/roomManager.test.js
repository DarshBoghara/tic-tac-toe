/**
 * Tests for room manager.
 */

const {
  createRoom,
  joinRoom,
  getRoom,
  resolveSession,
  removeRoom,
  findRoomBySocket,
  getRoomStats,
} = require('../src/game/roomManager');

describe('createRoom', () => {
  afterEach(() => {
    // Clean up any rooms created in tests by removing them by socket lookup
  });

  test('creates a room with valid player name and socket ID', () => {
    const { roomCode, sessionToken, room } = createRoom('Alice', 'socket-1');
    expect(roomCode).toHaveLength(6);
    expect(sessionToken).toBeTruthy();
    expect(room.players.X.name).toBe('Alice');
    expect(room.players.X.socketId).toBe('socket-1');
    expect(room.players.O).toBeNull();
    expect(room.status).toBe('waiting');

    removeRoom(roomCode);
  });

  test('resolves session token to the correct room and symbol', () => {
    const { roomCode, sessionToken } = createRoom('Bob', 'socket-2');
    const session = resolveSession(sessionToken);
    expect(session.roomCode).toBe(roomCode);
    expect(session.symbol).toBe('X');
    removeRoom(roomCode);
  });
});

describe('joinRoom', () => {
  test('player O can join an existing room', () => {
    const { roomCode } = createRoom('Alice', 'socket-3');
    const { sessionToken, room } = joinRoom(roomCode, 'Bob', 'socket-4');
    expect(room.players.O.name).toBe('Bob');
    expect(room.players.O.socketId).toBe('socket-4');
    const session = resolveSession(sessionToken);
    expect(session.symbol).toBe('O');
    removeRoom(roomCode);
  });

  test('throws error when room does not exist', () => {
    expect(() => joinRoom('XXXXXX', 'Hacker', 'socket-5')).toThrow(/not found/i);
  });

  test('throws error when room is full', () => {
    const { roomCode } = createRoom('Alice', 'socket-6');
    joinRoom(roomCode, 'Bob', 'socket-7');
    expect(() => joinRoom(roomCode, 'Charlie', 'socket-8')).toThrow(/full/i);
    removeRoom(roomCode);
  });

  test('prevents same socket from joining their own room', () => {
    const { roomCode } = createRoom('Alice', 'socket-9');
    expect(() => joinRoom(roomCode, 'Alice', 'socket-9')).toThrow(/own room/i);
    removeRoom(roomCode);
  });
});

describe('findRoomBySocket', () => {
  test('finds the correct room for player X', () => {
    const { roomCode } = createRoom('Alice', 'socket-find-1');
    const result = findRoomBySocket('socket-find-1');
    expect(result).not.toBeNull();
    expect(result.room.code).toBe(roomCode);
    expect(result.symbol).toBe('X');
    removeRoom(roomCode);
  });

  test('finds the correct room for player O', () => {
    const { roomCode } = createRoom('Alice', 'socket-find-2');
    joinRoom(roomCode, 'Bob', 'socket-find-3');
    const result = findRoomBySocket('socket-find-3');
    expect(result).not.toBeNull();
    expect(result.symbol).toBe('O');
    removeRoom(roomCode);
  });

  test('returns null for unknown socket', () => {
    expect(findRoomBySocket('unknown-socket')).toBeNull();
  });
});

describe('getRoomStats', () => {
  test('returns room stats object', () => {
    const stats = getRoomStats();
    expect(stats).toHaveProperty('activeRooms');
    expect(stats).toHaveProperty('activeSessions');
    expect(stats).toHaveProperty('maxRooms');
    expect(typeof stats.activeRooms).toBe('number');
  });
});

describe('removeRoom', () => {
  test('removes a room and its sessions', () => {
    const { roomCode, sessionToken } = createRoom('Alice', 'socket-rm-1');
    joinRoom(roomCode, 'Bob', 'socket-rm-2');
    removeRoom(roomCode);

    expect(getRoom(roomCode)).toBeUndefined();
    expect(resolveSession(sessionToken)).toBeUndefined();
  });

  test('does not throw for non-existent room', () => {
    expect(() => removeRoom('ZZZZZZ')).not.toThrow();
  });
});
