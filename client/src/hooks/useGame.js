/**
 * useGame — central game state hook.
 * Manages socket events, game state, room state, and reconnection.
 */
import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSocket, connectSocket, emitWithAck } from '../services/socket';
import { useGameStore } from './useGameStore';
import { playMoveSound, playWinSound, playDrawSound } from '../services/sounds';
import confetti from 'canvas-confetti';

export function useGame() {
  const navigate = useNavigate();
  const {
    setRoom,
    setMySymbol,
    setSessionToken,
    setRoomCode,
    setConnectionStatus,
    setOpponentStatus,
    setRematchStatus,
    reset,
    room,
    mySymbol,
    sessionToken,
    roomCode,
  } = useGameStore();

  const roomCodeRef = useRef(roomCode);
  const sessionTokenRef = useRef(sessionToken);
  const mySymbolRef = useRef(mySymbol);

  // Keep refs in sync for use in socket callbacks
  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);
  useEffect(() => { sessionTokenRef.current = sessionToken; }, [sessionToken]);
  useEffect(() => { mySymbolRef.current = mySymbol; }, [mySymbol]);

  // ─── Socket event listeners ────────────────────────────────────────────────
  useEffect(() => {
    const socket = connectSocket();

    const onConnect = () => {
      setConnectionStatus('connected');

      // Attempt reconnection if we have a stored session
      const token = sessionTokenRef.current;
      if (token) {
        socket.emit('reconnect_player', { sessionToken: token }, (res) => {
          if (res?.success) {
            setRoom(res.room);
            setMySymbol(res.symbol);
            setRoomCode(res.roomCode);
            setConnectionStatus('connected');
            toast.success('Reconnected to game!');
          }
        });
      }
    };

    const onDisconnect = (reason) => {
      setConnectionStatus('disconnected');
      if (reason !== 'io client disconnect') {
        toast.error('Lost connection to server. Reconnecting...', { id: 'disconnect' });
      }
    };

    const onConnectError = () => {
      setConnectionStatus('error');
    };

    const onReconnect = () => {
      setConnectionStatus('connected');
      toast.dismiss('disconnect');
    };

    const onPlayerJoined = ({ room }) => {
      setRoom(room);
      const opponent = mySymbolRef.current === 'X' ? room.players.O : room.players.X;
      if (opponent) {
        toast.success(`${opponent.name} joined the room!`);
      }
    };

    const onGameStarted = ({ room }) => {
      setRoom(room);
      navigate('/game');
    };

    const onMoveMade = ({ room }) => {
      setRoom(room);
      // Determine whose move it was (previous turn)
      const prevTurn = room.gameState.currentTurn === 'X' ? 'O' : 'X';
      playMoveSound(prevTurn);
    };

    const onGameOver = ({ winner, room }) => {
      setRoom(room);
      if (winner === 'draw') {
        playDrawSound();
        toast('It\'s a draw! 🤝', { icon: '🤝', duration: 3000 });
      } else if (winner === mySymbolRef.current) {
        playWinSound();
        // Confetti celebration
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#8b5cf6', '#ffffff'],
        });
        toast.success('You won! 🎉', { duration: 4000 });
      } else {
        toast.error('You lost. Better luck next time!', { duration: 3000 });
      }
    };

    const onRoundRestarted = ({ room }) => {
      setRoom(room);
      setRematchStatus([]);
      toast('New round started!', { icon: '🔄' });
    };

    const onRematchStatus = ({ requestedBy }) => {
      setRematchStatus(requestedBy);
      if (requestedBy.length === 1) {
        const sym = requestedBy[0];
        if (sym !== mySymbolRef.current) {
          toast('Opponent wants a rematch!', { icon: '🔁', duration: 5000 });
        }
      }
    };

    const onOpponentDisconnected = ({ message }) => {
      setOpponentStatus('disconnected');
      toast.error(message, { id: 'opp-disconnect', duration: 30000 });
    };

    const onOpponentReconnected = ({ room }) => {
      setRoom(room);
      setOpponentStatus('connected');
      toast.dismiss('opp-disconnect');
      toast.success('Opponent reconnected!');
    };

    const onPlayerLeft = ({ message }) => {
      setOpponentStatus('left');
      toast.error(message || 'Opponent left the game.', { duration: 5000 });
      setRematchStatus([]);
    };

    const onOpponentLeft = ({ message }) => {
      setOpponentStatus('left');
      toast.error(message || 'Opponent left the game.', { duration: 5000 });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('reconnect', onReconnect);
    socket.on('player_joined', onPlayerJoined);
    socket.on('game_started', onGameStarted);
    socket.on('move_made', onMoveMade);
    socket.on('game_over', onGameOver);
    socket.on('round_restarted', onRoundRestarted);
    socket.on('rematch_status', onRematchStatus);
    socket.on('opponent_disconnected', onOpponentDisconnected);
    socket.on('opponent_reconnected', onOpponentReconnected);
    socket.on('player_left', onPlayerLeft);
    socket.on('opponent_left', onOpponentLeft);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('reconnect', onReconnect);
      socket.off('player_joined', onPlayerJoined);
      socket.off('game_started', onGameStarted);
      socket.off('move_made', onMoveMade);
      socket.off('game_over', onGameOver);
      socket.off('round_restarted', onRoundRestarted);
      socket.off('rematch_status', onRematchStatus);
      socket.off('opponent_disconnected', onOpponentDisconnected);
      socket.off('opponent_reconnected', onOpponentReconnected);
      socket.off('player_left', onPlayerLeft);
      socket.off('opponent_left', onOpponentLeft);
    };
  }, [navigate, setRoom, setMySymbol, setSessionToken, setRoomCode, setConnectionStatus, setOpponentStatus, setRematchStatus]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  const createRoom = useCallback(async (playerName) => {
    try {
      const res = await emitWithAck('create_room', { playerName });
      setRoom(res.room);
      setMySymbol(res.symbol);
      setSessionToken(res.sessionToken);
      setRoomCode(res.roomCode);
      return res;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, [setRoom, setMySymbol, setSessionToken, setRoomCode]);

  const joinRoom = useCallback(async (playerName, code) => {
    try {
      const res = await emitWithAck('join_room', { playerName, roomCode: code });
      setRoom(res.room);
      setMySymbol(res.symbol);
      setSessionToken(res.sessionToken);
      setRoomCode(res.roomCode);
      return res;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }, [setRoom, setMySymbol, setSessionToken, setRoomCode]);

  const startGame = useCallback(async () => {
    try {
      await emitWithAck('start_game', {
        roomCode: roomCodeRef.current,
        sessionToken: sessionTokenRef.current,
      });
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  const makeMove = useCallback(async (cellIndex) => {
    try {
      await emitWithAck('make_move', {
        roomCode: roomCodeRef.current,
        cellIndex,
        sessionToken: sessionTokenRef.current,
      });
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  const requestRematch = useCallback(async () => {
    try {
      await emitWithAck('rematch_request', {
        roomCode: roomCodeRef.current,
        sessionToken: sessionTokenRef.current,
      });
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  const restartRound = useCallback(async () => {
    try {
      await emitWithAck('restart_round', {
        roomCode: roomCodeRef.current,
        sessionToken: sessionTokenRef.current,
      });
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  const leaveGame = useCallback(async () => {
    try {
      await emitWithAck('return_to_lobby', {
        roomCode: roomCodeRef.current,
        sessionToken: sessionTokenRef.current,
      });
    } catch {
      // Ignore errors on leave
    } finally {
      reset();
      navigate('/');
    }
  }, [reset, navigate]);

  return {
    createRoom,
    joinRoom,
    startGame,
    makeMove,
    requestRematch,
    restartRound,
    leaveGame,
  };
}
