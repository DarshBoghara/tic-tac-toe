/**
 * useGameStore — lightweight in-memory state store using React Context + useReducer.
 * We keep this simple (no Redux/Zustand) as the game state is not large.
 */
import { createContext, useContext, useReducer, useCallback } from 'react';

// ─── Initial State ────────────────────────────────────────────────────────────
const initialState = {
  // Room info
  roomCode: null,
  sessionToken: null,
  mySymbol: null, // 'X' | 'O'
  room: null,     // full room snapshot from server

  // Connection
  connectionStatus: 'disconnected', // 'connected' | 'disconnected' | 'error'
  opponentStatus: 'connected',      // 'connected' | 'disconnected' | 'left'

  // UI
  rematchRequests: [], // symbols that have requested rematch
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'SET_ROOM':
      return { ...state, room: action.payload };
    case 'SET_MY_SYMBOL':
      return { ...state, mySymbol: action.payload };
    case 'SET_SESSION_TOKEN':
      return { ...state, sessionToken: action.payload };
    case 'SET_ROOM_CODE':
      return { ...state, roomCode: action.payload };
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };
    case 'SET_OPPONENT_STATUS':
      return { ...state, opponentStatus: action.payload };
    case 'SET_REMATCH_STATUS':
      return { ...state, rematchRequests: action.payload };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const GameStoreContext = createContext(null);

export function GameStoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setRoom = useCallback((room) => dispatch({ type: 'SET_ROOM', payload: room }), []);
  const setMySymbol = useCallback((s) => dispatch({ type: 'SET_MY_SYMBOL', payload: s }), []);
  const setSessionToken = useCallback((t) => dispatch({ type: 'SET_SESSION_TOKEN', payload: t }), []);
  const setRoomCode = useCallback((c) => dispatch({ type: 'SET_ROOM_CODE', payload: c }), []);
  const setConnectionStatus = useCallback((s) => dispatch({ type: 'SET_CONNECTION_STATUS', payload: s }), []);
  const setOpponentStatus = useCallback((s) => dispatch({ type: 'SET_OPPONENT_STATUS', payload: s }), []);
  const setRematchStatus = useCallback((r) => dispatch({ type: 'SET_REMATCH_STATUS', payload: r }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return (
    <GameStoreContext.Provider value={{
      ...state,
      setRoom,
      setMySymbol,
      setSessionToken,
      setRoomCode,
      setConnectionStatus,
      setOpponentStatus,
      setRematchStatus,
      reset,
    }}>
      {children}
    </GameStoreContext.Provider>
  );
}

export function useGameStore() {
  const ctx = useContext(GameStoreContext);
  if (!ctx) throw new Error('useGameStore must be used inside GameStoreProvider');
  return ctx;
}
