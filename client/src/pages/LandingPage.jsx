/**
 * Landing Page — entry point with create/join room options.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid3x3, Users, Wifi, ChevronRight, Gamepad2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { connectSocket, emitWithAck } from '../services/socket';
import { useGameStore } from '../hooks/useGameStore';
import JoinRoomModal from '../components/JoinRoomModal';
import HowToPlay from '../components/HowToPlay';
import ConnectionStatus from '../components/ConnectionStatus';

export default function LandingPage() {
  const navigate = useNavigate();
  const {
    setRoom, setMySymbol, setSessionToken, setRoomCode, connectionStatus,
  } = useGameStore();

  const [playerName, setPlayerName] = useState('');
  const [nameError, setNameError] = useState('');
  const [creating, setCreating] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  function validateName() {
    const trimmed = playerName.trim();
    if (!trimmed) {
      setNameError('Please enter your display name.');
      return null;
    }
    if (trimmed.length > 20) {
      setNameError('Name must be 20 characters or fewer.');
      return null;
    }
    if (!/^[\w\s-]+$/.test(trimmed)) {
      setNameError('Only letters, numbers, spaces, hyphens and underscores.');
      return null;
    }
    setNameError('');
    return trimmed;
  }

  async function handleCreateRoom() {
    const name = validateName();
    if (!name) return;
    setCreating(true);
    try {
      connectSocket();
      const res = await emitWithAck('create_room', { playerName: name });
      setRoom(res.room);
      setMySymbol(res.symbol);
      setSessionToken(res.sessionToken);
      setRoomCode(res.roomCode);
      navigate('/room');
    } catch (err) {
      toast.error(err.message || 'Failed to create room.');
    } finally {
      setCreating(false);
    }
  }

  function handleJoinRoom() {
    const name = validateName();
    if (!name) return;
    setShowJoin(true);
  }

  return (
    <div className="min-h-dvh flex flex-col bg-slate-950 relative overflow-hidden">
      {/* Background grid decoration */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(6,182,212,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Header */}
      <header className="relative z-10 p-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-6 h-6 text-cyan-400" />
          <span className="font-bold text-white tracking-wide">TicTacToe Battle</span>
        </div>
        <ConnectionStatus />
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md fade-in">

          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10 mb-6 glow-cyan">
              <Gamepad2 className="w-10 h-10 text-cyan-400" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 gradient-text leading-tight">
              Tic-Tac-Toe<br />Battle
            </h1>
            <p className="text-slate-400 text-lg">
              Challenge a friend. Make every move count.
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="w-2 h-2 rounded-full bg-green-400 pulse-dot" />
              <span className="text-green-400 text-sm font-medium">Online Multiplayer</span>
            </div>
          </div>

          {/* Card */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-2xl">
            {/* Name Input */}
            <div className="mb-6">
              <label htmlFor="playerName" className="block text-sm font-medium text-slate-300 mb-2">
                Your Display Name
              </label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => { setPlayerName(e.target.value); setNameError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                placeholder="Enter your name..."
                maxLength={20}
                className={`w-full bg-slate-800/60 border rounded-xl px-4 py-3 text-white placeholder-slate-500
                  focus:outline-none focus:ring-2 transition-all duration-200
                  ${nameError
                    ? 'border-red-500 focus:ring-red-500/40'
                    : 'border-slate-600 focus:ring-cyan-500/40 focus:border-cyan-500/60'
                  }`}
              />
              {nameError && (
                <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                  <span>⚠</span> {nameError}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleCreateRoom}
                disabled={creating}
                className="relative w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500
                  text-white font-bold py-4 px-6 rounded-xl transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-cyan-400/50
                  disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-lg hover:shadow-cyan-500/25 active:scale-[0.98] glow-cyan"
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin-slow" />
                    Creating Room...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Users className="w-5 h-5" />
                    Create Room
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </button>

              <button
                onClick={handleJoinRoom}
                className="w-full bg-slate-800/80 hover:bg-slate-700/80 border border-violet-500/40 hover:border-violet-400/60
                  text-violet-300 hover:text-violet-200 font-bold py-4 px-6 rounded-xl
                  transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400/50
                  active:scale-[0.98]"
              >
                <span className="flex items-center justify-center gap-2">
                  <Wifi className="w-5 h-5" />
                  Join Room
                </span>
              </button>
            </div>
          </div>

          {/* How to Play */}
          <HowToPlay />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-4 text-center text-slate-600 text-xs border-t border-white/5">
        Tic-Tac-Toe Battle — Real-time Online Multiplayer
      </footer>

      {/* Join Room Modal */}
      {showJoin && (
        <JoinRoomModal
          playerName={playerName.trim()}
          onClose={() => setShowJoin(false)}
        />
      )}
    </div>
  );
}
