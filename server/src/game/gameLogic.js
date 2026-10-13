/**
 * Server-authoritative game logic for Tic-Tac-Toe Battle.
 * All win/draw detection and move validation runs here, never on the client.
 */

const WINNING_COMBINATIONS = [
  [0, 1, 2], // top row
  [3, 4, 5], // middle row
  [6, 7, 8], // bottom row
  [0, 3, 6], // left column
  [1, 4, 7], // middle column
  [2, 5, 8], // right column
  [0, 4, 8], // diagonal top-left to bottom-right
  [2, 4, 6], // diagonal top-right to bottom-left
];

/**
 * Create a fresh game state.
 * @returns {object} Initial game state
 */
function createInitialGameState() {
  return {
    board: Array(9).fill(null), // null | 'X' | 'O'
    currentTurn: 'X',           // X always goes first
    status: 'waiting',          // 'waiting' | 'active' | 'finished'
    winner: null,               // null | 'X' | 'O' | 'draw'
    winningCells: [],           // array of 3 cell indices
    scores: { X: 0, O: 0 },
    roundNumber: 1,
  };
}

/**
 * Check if a given board state has a winner.
 * @param {Array} board - 9-element array of null/'X'/'O'
 * @returns {{ winner: string|null, winningCells: number[] }}
 */
function checkWinner(board) {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], winningCells: [a, b, c] };
    }
  }
  return { winner: null, winningCells: [] };
}

/**
 * Check if the board is full (draw condition).
 * @param {Array} board
 * @returns {boolean}
 */
function isBoardFull(board) {
  return board.every((cell) => cell !== null);
}

/**
 * Apply a move to the game state (server-authoritative).
 * Returns { success, error, newState }
 *
 * @param {object} gameState - Current game state
 * @param {number} cellIndex - 0-8
 * @param {string} symbol - 'X' | 'O'
 * @returns {{ success: boolean, error?: string, newState?: object }}
 */
function applyMove(gameState, cellIndex, symbol) {
  // Validate cell index
  if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex > 8) {
    return { success: false, error: 'Invalid cell index.' };
  }

  // Validate symbol
  if (symbol !== 'X' && symbol !== 'O') {
    return { success: false, error: 'Invalid symbol.' };
  }

  // Check game is active
  if (gameState.status !== 'active') {
    return { success: false, error: 'Game is not active.' };
  }

  // Check it is this symbol's turn
  if (gameState.currentTurn !== symbol) {
    return { success: false, error: 'Not your turn.' };
  }

  // Check cell is empty
  if (gameState.board[cellIndex] !== null) {
    return { success: false, error: 'Cell is already occupied.' };
  }

  // Apply move
  const newBoard = [...gameState.board];
  newBoard[cellIndex] = symbol;

  // Check for winner
  const { winner, winningCells } = checkWinner(newBoard);

  let newStatus = 'active';
  let newWinner = null;
  let newWinningCells = [];
  const newScores = { ...gameState.scores };

  if (winner) {
    newStatus = 'finished';
    newWinner = winner;
    newWinningCells = winningCells;
    newScores[winner] = (newScores[winner] || 0) + 1;
  } else if (isBoardFull(newBoard)) {
    newStatus = 'finished';
    newWinner = 'draw';
  }

  const newState = {
    ...gameState,
    board: newBoard,
    currentTurn: symbol === 'X' ? 'O' : 'X',
    status: newStatus,
    winner: newWinner,
    winningCells: newWinningCells,
    scores: newScores,
  };

  return { success: true, newState };
}

/**
 * Reset board for a new round (keep scores and round number).
 * @param {object} gameState
 * @returns {object}
 */
function resetRound(gameState) {
  return {
    ...gameState,
    board: Array(9).fill(null),
    currentTurn: 'X',
    status: 'active',
    winner: null,
    winningCells: [],
    roundNumber: (gameState.roundNumber || 1) + 1,
  };
}

module.exports = {
  WINNING_COMBINATIONS,
  createInitialGameState,
  checkWinner,
  isBoardFull,
  applyMove,
  resetRound,
};
