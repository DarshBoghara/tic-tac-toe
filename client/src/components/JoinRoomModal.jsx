/**
 * JoinRoomModal — modal dialog for entering and joining a room by code.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Wifi } from 'lucide-react';
import toast from 'react-hot-toast';
import { connectSocket, emitWithAck } from '../services/socket';
import { useGameStore } from '../hooks/useGameStore';

export default function JoinRoomModal({ playerName, onClose }) {
  const navigate = useNavigate();
  const { setRoom, setMySymbol, setSessionToken, setRoomCode } = useGameStore();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  function handleCodeChange(e) {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(val);
    setError('');
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter a 6-character room code.');
      return;
    }

    setJoining(true);
    setError('');

    try {
      connectSocket();
      const res = await emitWithAck('join_room', { playerName, roomCode: code });
      setRoom(res.room);
      setMySymbol(res.symbol);
      setSessionToken(res.sessionToken);
      setRoomCode(res.roomCode);
      onClose();
      navigate('/room');
    } catch (err) {
      setError(err.message || 'Failed to join room.');
      toast.error(err.message || 'Failed to join room.');
    } finally {
      setJoining(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Join a room"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-card rounded-2xl p-6 w-full max-w-sm slide-up shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Join a Room</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-slate-400/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleJoin}>
          <div className="mb-4">
            <label htmlFor="roomCode" className="block text-sm font-medium text-slate-300 mb-2">
              Room Code
            </label>
            <input
              id="roomCode"
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="e.g. AB3X9K"
              maxLength={6}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              className={`w-full bg-slate-800/60 border rounded-xl px-4 py-3
                text-white placeholder-slate-500 font-mono text-lg tracking-widest text-center
                focus:outline-none focus:ring-2 transition-all duration-200
                ${error
                  ? 'border-red-500 focus:ring-red-500/40'
                  : 'border-slate-600 focus:ring-violet-500/40 focus:border-violet-500/60'
                }`}
            />
            {error && (
              <p className="mt-2 text-sm text-red-400">⚠ {error}</p>
            )}
          </div>

          <p className="text-slate-500 text-xs mb-4">
            Joining as: <span className="text-white font-medium">{playerName}</span>
          </p>

          <button
            type="submit"
            disabled={joining || code.length !== 6}
            className="w-full bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400
              text-white font-bold py-4 rounded-xl transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-violet-400/50
              disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {joining ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin-slow" />
                Joining...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Wifi className="w-4 h-4" />
                Join Room
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
