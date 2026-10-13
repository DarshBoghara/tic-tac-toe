/**
 * Room Waiting Page — shown after creating a room, while waiting for opponent.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Share2, X, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGameStore } from '../hooks/useGameStore';
import { useGame } from '../hooks/useGame';
import ConnectionStatus from '../components/ConnectionStatus';
import PlayerCard from '../components/PlayerCard';

export default function RoomPage() {
  const navigate = useNavigate();
  const { room, mySymbol, roomCode, sessionToken } = useGameStore();
  const { startGame, leaveGame } = useGame();

  const bothPresent = room?.players?.X && room?.players?.O;

  // Redirect to landing if no session
  useEffect(() => {
    if (!roomCode) navigate('/');
  }, [roomCode, navigate]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(roomCode);
      toast.success('Room code copied!');
    } catch {
      toast.error('Could not copy. Code: ' + roomCode);
    }
  }

  async function shareInvite() {
    const url = `${window.location.origin}?join=${roomCode}`;
    const text = `Join my Tic-Tac-Toe Battle game! Room code: ${roomCode}\n${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Tic-Tac-Toe Battle', text, url });
      } catch {
        await navigator.clipboard.writeText(text);
        toast.success('Invite copied to clipboard!');
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        toast.success('Invite copied to clipboard!');
      } catch {
        toast.error('Could not share. Room code: ' + roomCode);
      }
    }
  }

  async function handleLeave() {
    if (confirm('Are you sure you want to cancel this room?')) {
      await leaveGame();
    }
  }

  if (!room) return null;

  const xPlayer = room.players?.X;
  const oPlayer = room.players?.O;

  return (
    <div className="min-h-dvh flex flex-col bg-slate-950">
      <header className="p-4 flex items-center justify-between border-b border-white/5">
        <h1 className="text-lg font-bold gradient-text">Tic-Tac-Toe Battle</h1>
        <ConnectionStatus />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md slide-up">

          {/* Room Code Card */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 mb-4">
            <div className="text-center mb-6">
              <p className="text-slate-400 text-sm mb-2">Your Room Code</p>
              <div className="text-4xl font-mono font-black tracking-widest text-cyan-400 text-glow-cyan mb-4">
                {roomCode}
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={copyCode}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600
                    text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                >
                  <Copy className="w-4 h-4" />
                  Copy Code
                </button>
                <button
                  onClick={shareInvite}
                  className="flex items-center gap-2 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/40
                    text-violet-300 hover:text-violet-200 px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
                >
                  <Share2 className="w-4 h-4" />
                  Share Invite
                </button>
              </div>
            </div>

            {/* Players */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <PlayerCard
                player={xPlayer}
                symbol="X"
                isMe={mySymbol === 'X'}
                label="Player X"
              />
              <PlayerCard
                player={oPlayer}
                symbol="O"
                isMe={mySymbol === 'O'}
                label={oPlayer ? 'Player O' : 'Waiting...'}
              />
            </div>

            {/* Status */}
            {!bothPresent ? (
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="w-5 h-5 spin-slow text-cyan-400" />
                  <span>Waiting for your opponent to join...</span>
                </div>
                <p className="text-slate-500 text-sm mt-2">
                  Share the room code with a friend
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-green-400 mb-4">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">Both players connected!</span>
                </div>
                {mySymbol === 'X' && (
                  <button
                    onClick={startGame}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400
                      text-white font-bold py-4 rounded-xl transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-green-400/50 glow-green active:scale-[0.98]"
                  >
                    Start Match! 🚀
                  </button>
                )}
                {mySymbol === 'O' && (
                  <p className="text-slate-400 text-sm py-2">
                    Waiting for the host to start the match...
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Leave button */}
          <button
            onClick={handleLeave}
            className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-red-400
              py-3 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400/30 rounded-lg"
          >
            <X className="w-4 h-4" />
            Cancel Room
          </button>
        </div>
      </main>
    </div>
  );
}
