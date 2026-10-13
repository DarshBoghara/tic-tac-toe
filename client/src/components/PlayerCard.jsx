/**
 * PlayerCard — shows a player's name, symbol, and connection status.
 */
import { User, Loader2 } from 'lucide-react';

export default function PlayerCard({ player, symbol, isMe, label }) {
  const isX = symbol === 'X';

  return (
    <div className={`glass-card rounded-xl p-3 sm:p-4 text-center border
      ${isX ? 'border-cyan-500/20' : 'border-violet-500/20'}`}>
      <div className={`text-2xl font-black mb-1
        ${isX ? 'text-cyan-400 text-glow-cyan' : 'text-violet-400 text-glow-violet'}`}>
        {symbol}
      </div>
      {player ? (
        <>
          <div className="flex items-center justify-center gap-1.5">
            <User className={`w-3 h-3 ${isX ? 'text-cyan-400' : 'text-violet-400'}`} />
            <span className="text-white text-sm font-semibold truncate max-w-[80px]">{player.name}</span>
          </div>
          {isMe && (
            <span className="text-xs text-slate-500 mt-0.5 block">(You)</span>
          )}
          <div className="flex items-center justify-center gap-1 mt-1">
            <span className={`w-1.5 h-1.5 rounded-full ${player.connected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className={`text-xs ${player.connected ? 'text-green-400' : 'text-red-400'}`}>
              {player.connected ? 'Ready' : 'Disconnected'}
            </span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <Loader2 className="w-4 h-4 text-slate-500 spin-slow" />
          <span className="text-xs text-slate-500">{label}</span>
        </div>
      )}
    </div>
  );
}
