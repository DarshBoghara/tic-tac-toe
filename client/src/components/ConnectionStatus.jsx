/**
 * ConnectionStatus — shows current socket connection state.
 */
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useGameStore } from '../hooks/useGameStore';

export default function ConnectionStatus({ compact = false }) {
  const { connectionStatus } = useGameStore();

  const configs = {
    connected: {
      icon: <Wifi className="w-3.5 h-3.5" />,
      label: 'Online',
      color: 'text-green-400',
      dot: 'bg-green-400',
    },
    disconnected: {
      icon: <WifiOff className="w-3.5 h-3.5" />,
      label: 'Offline',
      color: 'text-red-400',
      dot: 'bg-red-400',
    },
    error: {
      icon: <WifiOff className="w-3.5 h-3.5" />,
      label: 'Error',
      color: 'text-red-400',
      dot: 'bg-red-400',
    },
    reconnecting: {
      icon: <Loader2 className="w-3.5 h-3.5 spin-slow" />,
      label: 'Reconnecting',
      color: 'text-amber-400',
      dot: 'bg-amber-400',
    },
  };

  const cfg = configs[connectionStatus] || configs.disconnected;

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 text-xs ${cfg.color}`} title={cfg.label}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${connectionStatus === 'connected' ? 'pulse-dot' : ''}`} />
        {!compact && cfg.label}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
      {cfg.icon}
      <span className="hidden sm:inline">{cfg.label}</span>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${connectionStatus === 'connected' ? 'pulse-dot' : ''}`} />
    </div>
  );
}
