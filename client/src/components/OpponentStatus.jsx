/**
 * OpponentStatus — banner shown when opponent disconnects.
 */
import { WifiOff, UserX } from 'lucide-react';
import { useGameStore } from '../hooks/useGameStore';

export default function OpponentStatus() {
  const { opponentStatus } = useGameStore();

  if (opponentStatus === 'connected') return null;

  if (opponentStatus === 'disconnected') {
    return (
      <div className="w-full flex items-center gap-3 bg-amber-900/30 border border-amber-500/40
        rounded-xl px-4 py-3 text-amber-300 text-sm fade-in">
        <WifiOff className="w-4 h-4 flex-shrink-0" />
        <span>Opponent disconnected. Waiting for reconnection...</span>
      </div>
    );
  }

  if (opponentStatus === 'left') {
    return (
      <div className="w-full flex items-center gap-3 bg-red-900/30 border border-red-500/40
        rounded-xl px-4 py-3 text-red-300 text-sm fade-in">
        <UserX className="w-4 h-4 flex-shrink-0" />
        <span>Opponent has left the game.</span>
      </div>
    );
  }

  return null;
}
