/**
 * GameResultOverlay — shown when a game round ends (win or draw).
 */
import { Trophy, Minus, RotateCcw, LogOut } from 'lucide-react';
import { useGameStore } from '../hooks/useGameStore';

export default function GameResultOverlay({
  winner,
  winningCells,
  scores,
  mySymbol,
  xPlayer,
  oPlayer,
  onRematch,
  onLeave,
}) {
  const { rematchRequests } = useGameStore();

  const iWon = winner === mySymbol;
  const isDraw = winner === 'draw';

  const winnerName = winner === 'X' ? xPlayer?.name : oPlayer?.name;
  const myRematchRequested = rematchRequests.includes(mySymbol);
  const opponentRematchRequested = rematchRequests.includes(mySymbol === 'X' ? 'O' : 'X');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Game result"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="glass-card rounded-2xl p-6 sm:p-8 w-full max-w-sm text-center slide-up shadow-2xl border border-white/10">
        {/* Icon */}
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4
          ${isDraw
            ? 'bg-slate-700/50 border border-slate-600'
            : iWon
              ? 'bg-cyan-500/20 border border-cyan-500/40 glow-cyan'
              : 'bg-violet-500/20 border border-violet-500/40'
          }`}>
          {isDraw ? (
            <Minus className="w-8 h-8 text-slate-400" />
          ) : (
            <Trophy className={`w-8 h-8 ${iWon ? 'text-cyan-400' : 'text-violet-400'}`} />
          )}
        </div>

        {/* Result Title */}
        <h2 className="text-3xl font-extrabold mb-2">
          {isDraw ? (
            <span className="text-slate-300">It's a Draw!</span>
          ) : iWon ? (
            <span className="gradient-text">You Win! 🎉</span>
          ) : (
            <span className="text-slate-300">You Lose</span>
          )}
        </h2>

        {!isDraw && (
          <p className="text-slate-400 mb-4">
            {iWon ? 'Great move!' : `${winnerName} wins this round.`}
          </p>
        )}
        {isDraw && (
          <p className="text-slate-400 mb-4">No winner this round.</p>
        )}

        {/* Scores */}
        <div className="flex justify-center gap-8 mb-6 py-3 bg-slate-900/50 rounded-xl">
          <div className="text-center">
            <div className="text-2xl font-extrabold text-cyan-400">{scores?.X ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">{xPlayer?.name || 'X'}</div>
          </div>
          <div className="text-slate-600 text-xl font-bold self-center">—</div>
          <div className="text-center">
            <div className="text-2xl font-extrabold text-violet-400">{scores?.O ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">{oPlayer?.name || 'O'}</div>
          </div>
        </div>

        {/* Rematch status */}
        {opponentRematchRequested && !myRematchRequested && (
          <p className="text-sm text-amber-400 mb-3 fade-in">
            🔁 Opponent wants a rematch!
          </p>
        )}
        {myRematchRequested && !opponentRematchRequested && (
          <p className="text-sm text-slate-400 mb-3">
            Waiting for opponent to accept rematch...
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onRematch}
            disabled={myRematchRequested}
            className="flex items-center justify-center gap-2 w-full
              bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500
              disabled:opacity-40 disabled:cursor-not-allowed
              text-white font-bold py-4 rounded-xl transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-cyan-400/50 active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            {myRematchRequested ? 'Rematch Requested...' : 'Play Again'}
          </button>

          <button
            onClick={onLeave}
            className="flex items-center justify-center gap-2 w-full
              bg-slate-800/60 hover:bg-red-900/20 border border-slate-700 hover:border-red-500/40
              text-slate-400 hover:text-red-400
              py-3 rounded-xl text-sm font-medium transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-red-400/30"
          >
            <LogOut className="w-4 h-4" />
            Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
