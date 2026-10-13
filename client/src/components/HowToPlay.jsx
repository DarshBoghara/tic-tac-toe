/**
 * HowToPlay — collapsible instructions section.
 */
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function HowToPlay() {
  const [open, setOpen] = useState(false);

  const steps = [
    { emoji: '✏️', text: 'Enter your display name.' },
    { emoji: '🏠', text: 'Click "Create Room" to generate a unique 6-character code.' },
    { emoji: '📨', text: 'Share the code with a friend.' },
    { emoji: '🔗', text: 'They click "Join Room" and enter the code.' },
    { emoji: '🚀', text: 'The host starts the match.' },
    { emoji: '♟️', text: 'Take turns placing X and O. First to get 3 in a row wins!' },
    { emoji: '🏆', text: 'Best of 3 rounds decides the overall winner.' },
  ];

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 px-4
          text-slate-400 hover:text-slate-300 text-sm font-medium
          bg-slate-900/40 hover:bg-slate-800/40 rounded-xl
          border border-white/5 transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-slate-400/20"
      >
        <span>How to Play</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="mt-2 bg-slate-900/40 border border-white/5 rounded-xl p-4 fade-in">
          <ol className="space-y-2">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                <span className="text-base flex-shrink-0">{step.emoji}</span>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
