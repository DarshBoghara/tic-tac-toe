/**
 * Game Page — the main gameplay screen.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, RotateCcw, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGameStore } from '../hooks/useGameStore';
import { useGame } from '../hooks/useGame';
import Board from '../components/Board';
import ScoreBoard from '../components/ScoreBoard';
import TurnIndicator from '../components/TurnIndicator';
import GameResultOverlay from '../components/GameResultOverlay';
import ConnectionStatus from '../components/ConnectionStatus';
import OpponentStatus from '../components/OpponentStatus';

export default function GamePage() {
  const navigate = useNavigate();
  const { room, mySymbol, roomCode, connectionStatus } = useGameStore();
  const { makeMove, leaveGame, requestRematch, restartRound } = useGame();

  // Guard: redirect if no active game
  useEffect(() => {
    if (!roomCode || !room) navigate('/');
  }, [roomCode, room, navigate]);

  async function handleLeave() {
    if (window.confirm('Leave the game? This will end the match for both players.')) {
      await leaveGame();
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(roomCode);
      toast.success('Room code copied!');
    } catch {
      toast.error('Code: ' + roomCode);
    }
  }

  if (!room) return null;

  const gs = room.gameState;
  const xPlayer = room.players?.X;
  const oPlayer = room.players?.O;
  const gameFinished = gs?.status === 'finished';
  const isMyTurn = gs?.currentTurn === mySymbol && gs?.status === 'active';

  return (
    <div className="min-h-dvh flex flex-col bg-slate-950">
      {/* Header */}
      <header className="p-3 sm:p-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <h1 className="text-base sm:text-lg font-bold gradient-text">TicTacToe Battle</h1>
          <button
            onClick={copyCode}
            title="Copy room code"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-cyan-400
              bg-slate-800/50 px-2 py-1 rounded-lg transition-colors duration-200"
          >
            <Copy className="w-3 h-3" />
            {roomCode}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionStatus compact />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-3 sm:p-4 gap-4 max-w-lg mx-auto w-full">

        {/* Opponent Status Banner */}
        <OpponentStatus />

        {/* Scoreboard */}
        <ScoreBoard
          scores={gs?.scores || { X: 0, O: 0 }}
          xPlayer={xPlayer}
          oPlayer={oPlayer}
          mySymbol={mySymbol}
          roundNumber={gs?.roundNumber || 1}
        />

        {/* Turn Indicator */}
        <TurnIndicator
          currentTurn={gs?.currentTurn}
          mySymbol={mySymbol}
          isMyTurn={isMyTurn}
          status={gs?.status}
        />

        {/* Board */}
        <Board
          board={gs?.board || Array(9).fill(null)}
          onCellClick={makeMove}
          isMyTurn={isMyTurn}
          mySymbol={mySymbol}
          winningCells={gs?.winningCells || []}
          gameStatus={gs?.status}
        />

        {/* Action Buttons */}
        <div className="flex gap-3 w-full mt-1">
          <button
            onClick={handleLeave}
            className="flex items-center justify-center gap-2 flex-1 bg-slate-800/60 hover:bg-red-900/30
              border border-slate-700 hover:border-red-500/50
              text-slate-400 hover:text-red-400
              py-3 rounded-xl text-sm font-medium transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-red-400/30"
          >
            <LogOut className="w-4 h-4" />
            Leave
          </button>
          {gameFinished && mySymbol === 'X' && (
            <button
              onClick={restartRound}
              className="flex items-center justify-center gap-2 flex-1 bg-slate-800/60 hover:bg-slate-700/60
                border border-slate-700 hover:border-cyan-500/50
                text-slate-400 hover:text-cyan-400
                py-3 rounded-xl text-sm font-medium transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
            >
              <RotateCcw className="w-4 h-4" />
              New Round
            </button>
          )}
        </div>
      </main>

      {/* Game Result Overlay */}
      {gameFinished && (
        <GameResultOverlay
          winner={gs.winner}
          winningCells={gs.winningCells}
          scores={gs.scores}
          mySymbol={mySymbol}
          xPlayer={xPlayer}
          oPlayer={oPlayer}
          onRematch={requestRematch}
          onLeave={leaveGame}
        />
      )}
    </div>
  );
}
