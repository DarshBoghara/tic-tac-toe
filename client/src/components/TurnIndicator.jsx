/**
 * TurnIndicator — shows whose turn it is.
 */
export default function TurnIndicator({ currentTurn, mySymbol, isMyTurn, status }) {
  if (status === 'finished') return null;
  if (status === 'waiting') {
    return (
      <div className="text-slate-400 text-sm text-center py-2">
        Waiting for game to start...
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center gap-2 py-2 px-4 rounded-full text-sm font-semibold
      transition-all duration-300
      ${isMyTurn
        ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300'
        : 'bg-slate-800/60 border border-slate-700 text-slate-400'
      }`}>
      <span className={`w-2 h-2 rounded-full pulse-dot
        ${isMyTurn ? 'bg-cyan-400' : 'bg-slate-500'}`} />
      {isMyTurn
        ? 'Your turn!'
        : `${currentTurn === 'X' ? 'X' : 'O'}'s turn...`
      }
    </div>
  );
}
