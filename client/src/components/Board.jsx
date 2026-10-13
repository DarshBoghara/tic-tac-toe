/**
 * Board — the 3x3 Tic-Tac-Toe game board.
 */
import Cell from './Cell';

export default function Board({
  board,
  onCellClick,
  isMyTurn,
  mySymbol,
  winningCells,
  gameStatus,
}) {
  const isActive = gameStatus === 'active';

  return (
    <div
      role="grid"
      aria-label="Tic-Tac-Toe board"
      className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-[340px] sm:max-w-[380px] aspect-square"
    >
      {board.map((cell, index) => (
        <Cell
          key={index}
          index={index}
          value={cell}
          onClick={onCellClick}
          isMyTurn={isMyTurn}
          isWinning={winningCells.includes(index)}
          isClickable={isActive && isMyTurn && cell === null}
          symbol={mySymbol}
        />
      ))}
    </div>
  );
}
