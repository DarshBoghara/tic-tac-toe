/**
 * Tests for server-authoritative game logic.
 * Run with: npm test (from /server directory)
 */

const {
  createInitialGameState,
  checkWinner,
  isBoardFull,
  applyMove,
  resetRound,
  WINNING_COMBINATIONS,
} = require('../src/game/gameLogic');

describe('createInitialGameState', () => {
  test('returns a valid initial state', () => {
    const state = createInitialGameState();
    expect(state.board).toHaveLength(9);
    expect(state.board.every((c) => c === null)).toBe(true);
    expect(state.currentTurn).toBe('X');
    expect(state.status).toBe('waiting');
    expect(state.winner).toBeNull();
    expect(state.winningCells).toEqual([]);
    expect(state.scores).toEqual({ X: 0, O: 0 });
    expect(state.roundNumber).toBe(1);
  });
});

describe('checkWinner', () => {
  test('detects horizontal wins', () => {
    // Top row
    const board = ['X', 'X', 'X', null, null, null, null, null, null];
    const { winner, winningCells } = checkWinner(board);
    expect(winner).toBe('X');
    expect(winningCells).toEqual([0, 1, 2]);
  });

  test('detects middle row win', () => {
    const board = [null, null, null, 'O', 'O', 'O', null, null, null];
    const { winner } = checkWinner(board);
    expect(winner).toBe('O');
  });

  test('detects vertical wins', () => {
    const board = ['X', null, null, 'X', null, null, 'X', null, null];
    const { winner, winningCells } = checkWinner(board);
    expect(winner).toBe('X');
    expect(winningCells).toEqual([0, 3, 6]);
  });

  test('detects diagonal win (top-left to bottom-right)', () => {
    const board = ['O', null, null, null, 'O', null, null, null, 'O'];
    const { winner, winningCells } = checkWinner(board);
    expect(winner).toBe('O');
    expect(winningCells).toEqual([0, 4, 8]);
  });

  test('detects diagonal win (top-right to bottom-left)', () => {
    const board = [null, null, 'X', null, 'X', null, 'X', null, null];
    const { winner, winningCells } = checkWinner(board);
    expect(winner).toBe('X');
    expect(winningCells).toEqual([2, 4, 6]);
  });

  test('returns null winner on empty board', () => {
    const { winner } = checkWinner(Array(9).fill(null));
    expect(winner).toBeNull();
  });

  test('returns null on a draw board', () => {
    // X O X / O X O / O X O — draw
    const board = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O'];
    const { winner } = checkWinner(board);
    expect(winner).toBeNull();
  });
});

describe('isBoardFull', () => {
  test('returns true for full board', () => {
    const board = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O'];
    expect(isBoardFull(board)).toBe(true);
  });

  test('returns false for partial board', () => {
    const board = ['X', null, null, null, null, null, null, null, null];
    expect(isBoardFull(board)).toBe(false);
  });

  test('returns false for empty board', () => {
    expect(isBoardFull(Array(9).fill(null))).toBe(false);
  });
});

describe('applyMove', () => {
  function activeState() {
    const s = createInitialGameState();
    s.status = 'active';
    return s;
  }

  test('X can make a valid move', () => {
    const state = activeState();
    const result = applyMove(state, 0, 'X');
    expect(result.success).toBe(true);
    expect(result.newState.board[0]).toBe('X');
    expect(result.newState.currentTurn).toBe('O');
  });

  test('O can make a valid move after X', () => {
    let state = activeState();
    state = applyMove(state, 0, 'X').newState;
    const result = applyMove(state, 4, 'O');
    expect(result.success).toBe(true);
    expect(result.newState.board[4]).toBe('O');
    expect(result.newState.currentTurn).toBe('X');
  });

  test('rejects out-of-turn move', () => {
    const state = activeState(); // currentTurn = X
    const result = applyMove(state, 0, 'O');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not your turn/i);
  });

  test('rejects occupied cell', () => {
    let state = activeState();
    state = applyMove(state, 0, 'X').newState;
    const result = applyMove(state, 0, 'O');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already occupied/i);
  });

  test('rejects invalid cell index — negative', () => {
    const state = activeState();
    const result = applyMove(state, -1, 'X');
    expect(result.success).toBe(false);
  });

  test('rejects invalid cell index — too large', () => {
    const state = activeState();
    const result = applyMove(state, 9, 'X');
    expect(result.success).toBe(false);
  });

  test('rejects non-integer cell index', () => {
    const state = activeState();
    const result = applyMove(state, 2.5, 'X');
    expect(result.success).toBe(false);
  });

  test('rejects invalid symbol', () => {
    const state = activeState();
    const result = applyMove(state, 0, 'Z');
    expect(result.success).toBe(false);
  });

  test('rejects move when game is waiting', () => {
    const state = createInitialGameState(); // status = 'waiting'
    const result = applyMove(state, 0, 'X');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not active/i);
  });

  test('rejects move after game is finished', () => {
    let state = activeState();
    // X wins top row
    state = applyMove(state, 0, 'X').newState;
    state = applyMove(state, 3, 'O').newState;
    state = applyMove(state, 1, 'X').newState;
    state = applyMove(state, 4, 'O').newState;
    state = applyMove(state, 2, 'X').newState;
    expect(state.status).toBe('finished');
    expect(state.winner).toBe('X');

    // Try another move
    const result = applyMove(state, 5, 'O');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not active/i);
  });

  test('detects X winning horizontally and increments score', () => {
    let state = activeState();
    state = applyMove(state, 0, 'X').newState;
    state = applyMove(state, 3, 'O').newState;
    state = applyMove(state, 1, 'X').newState;
    state = applyMove(state, 4, 'O').newState;
    const result = applyMove(state, 2, 'X');
    expect(result.success).toBe(true);
    expect(result.newState.winner).toBe('X');
    expect(result.newState.winningCells).toEqual([0, 1, 2]);
    expect(result.newState.scores.X).toBe(1);
    expect(result.newState.scores.O).toBe(0);
  });

  test('detects O winning vertically', () => {
    let state = activeState();
    state = applyMove(state, 0, 'X').newState; // X
    state = applyMove(state, 1, 'O').newState; // O
    state = applyMove(state, 2, 'X').newState; // X
    state = applyMove(state, 4, 'O').newState; // O
    state = applyMove(state, 8, 'X').newState; // X
    const result = applyMove(state, 7, 'O');   // O wins col 1 (1,4,7)
    expect(result.success).toBe(true);
    expect(result.newState.winner).toBe('O');
    expect(result.newState.scores.O).toBe(1);
  });

  test('detects draw correctly', () => {
    // X O X / O O X / X X O — draw
    let state = activeState();
    const moves = [
      [0, 'X'], [1, 'O'], [2, 'X'],
      [4, 'O'], [3, 'X'], [5, 'O'],  // wait — need alternating turns
    ];
    // Play a known draw sequence
    // X O X / O X O / O X X — wait, must alternate correctly
    // Using a draw game: positions 0(X) 1(O) 2(X) 4(O) 3(X) 5(O) 8(X) 6(O) 7(X)
    state = applyMove(state, 0, 'X').newState;
    state = applyMove(state, 1, 'O').newState;
    state = applyMove(state, 2, 'X').newState;
    state = applyMove(state, 4, 'O').newState;
    state = applyMove(state, 3, 'X').newState;
    state = applyMove(state, 5, 'O').newState;
    state = applyMove(state, 8, 'X').newState;
    state = applyMove(state, 6, 'O').newState;
    const result = applyMove(state, 7, 'X');
    expect(result.success).toBe(true);
    expect(result.newState.winner).toBe('draw');
    expect(result.newState.scores.X).toBe(0); // draw doesn't update scores
    expect(result.newState.scores.O).toBe(0);
  });
});

describe('resetRound', () => {
  test('resets board but preserves scores and increments round', () => {
    let state = createInitialGameState();
    state.status = 'active';
    state = applyMove(state, 0, 'X').newState;
    state = applyMove(state, 3, 'O').newState;
    state = applyMove(state, 1, 'X').newState;
    state = applyMove(state, 4, 'O').newState;
    state = applyMove(state, 2, 'X').newState; // X wins

    const reset = resetRound(state);
    expect(reset.board.every((c) => c === null)).toBe(true);
    expect(reset.currentTurn).toBe('X');
    expect(reset.status).toBe('active');
    expect(reset.winner).toBeNull();
    expect(reset.winningCells).toEqual([]);
    expect(reset.scores.X).toBe(1); // score preserved
    expect(reset.roundNumber).toBe(2);
  });
});

describe('WINNING_COMBINATIONS', () => {
  test('contains exactly 8 combinations', () => {
    expect(WINNING_COMBINATIONS).toHaveLength(8);
  });

  test('all combinations are valid 3-element arrays with indices 0-8', () => {
    for (const combo of WINNING_COMBINATIONS) {
      expect(combo).toHaveLength(3);
      for (const idx of combo) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThanOrEqual(8);
      }
    }
  });
});
