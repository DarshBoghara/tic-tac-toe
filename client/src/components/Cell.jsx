/**
 * Cell — individual board cell with X/O symbol and animations.
 */

const SYMBOL_STYLES = {
  X: 'text-cyan-400 text-glow-cyan',
  O: 'text-violet-400 text-glow-violet',
};

export default function Cell({ index, value, onClick, isMyTurn, isWinning, isClickable, symbol }) {
  function handleClick() {
    if (isClickable) onClick(index);
  }

  function handleKeyDown(e) {
    if ((e.key === 'Enter' || e.key === ' ') && isClickable) {
      e.preventDefault();
      onClick(index);
    }
  }

  return (
    <div
      role="gridcell"
      aria-label={`Cell ${index + 1}: ${value || 'empty'}${isClickable ? ', click to play' : ''}`}
      tabIndex={isClickable ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        relative flex items-center justify-center
        bg-slate-900/80 border rounded-xl sm:rounded-2xl
        aspect-square text-4xl sm:text-5xl font-black
        transition-all duration-200 select-none
        focus:outline-none focus:ring-2 focus:ring-cyan-400/60
        ${isWinning
          ? 'border-cyan-500/70 cell-winning bg-cyan-950/40'
          : 'border-slate-700/60'
        }
        ${isClickable
          ? 'cursor-pointer hover:bg-slate-800/80 hover:border-slate-500 active:scale-95'
          : 'cursor-default'
        }
        ${!value && isMyTurn && !value ? 'hover:opacity-80' : ''}
      `}
    >
      {/* Ghost preview on hover */}
      {!value && isClickable && (
        <span className={`opacity-0 hover:opacity-20 transition-opacity duration-200 ${SYMBOL_STYLES[symbol]}`}>
          {symbol}
        </span>
      )}

      {/* Actual value */}
      {value && (
        <span className={`cell-appear ${SYMBOL_STYLES[value]}`}>
          {value}
        </span>
      )}
    </div>
  );
}
