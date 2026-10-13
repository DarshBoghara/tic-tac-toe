/**
 * ScoreBoard — displays player names, symbols, scores, and current round.
 */
export default function ScoreBoard({ scores, xPlayer, oPlayer, mySymbol, roundNumber }) {
  return (
    <div className="w-full grid grid-cols-3 items-center gap-2">
      {/* X Player */}
      <div className={`glass-card rounded-xl p-3 text-center transition-all duration-200
        ${mySymbol === 'X' ? 'border-cyan-500/30 glow-cyan' : 'border-white/5'}`}>
        <div className="text-2xl font-black text-cyan-400 text-glow-cyan">X</div>
        <div className="text-white font-bold text-sm truncate mt-1">
          {xPlayer?.name || 'Player X'}
          {mySymbol === 'X' && <span className="text-xs text-cyan-400 ml-1">(You)</span>}
        </div>
        <div className="text-3xl font-extrabold text-white mt-1">{scores?.X ?? 0}</div>
      </div>

      {/* Center — round info */}
      <div className="text-center">
        <div className="text-slate-400 text-xs uppercase tracking-wider">Round</div>
        <div className="text-2xl font-extrabold text-white">{roundNumber}</div>
        <div className="text-slate-600 text-xs mt-1">Best of 3</div>
      </div>

      {/* O Player */}
      <div className={`glass-card rounded-xl p-3 text-center transition-all duration-200
        ${mySymbol === 'O' ? 'border-violet-500/30 glow-violet' : 'border-white/5'}`}>
        <div className="text-2xl font-black text-violet-400 text-glow-violet">O</div>
        <div className="text-white font-bold text-sm truncate mt-1">
          {oPlayer?.name || 'Player O'}
          {mySymbol === 'O' && <span className="text-xs text-violet-400 ml-1">(You)</span>}
        </div>
        <div className="text-3xl font-extrabold text-white mt-1">{scores?.O ?? 0}</div>
      </div>
    </div>
  );
}
