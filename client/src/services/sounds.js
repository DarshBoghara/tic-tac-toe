/**
 * Sound manager — Web Audio API based.
 * Sounds are disabled by default until user interaction.
 */

function getAudioContextClass() {
  if (typeof window === 'undefined') return null;
  return window.AudioContext || window.webkitAudioContext || null;
}

let audioCtx = null;
let soundEnabled = false;

export function isSoundEnabled() {
  return soundEnabled;
}

export function setSoundEnabled(val) {
  soundEnabled = val;
  if (val && !audioCtx) {
    try {
      const AC = getAudioContextClass();
      if (AC) audioCtx = new AC();
    } catch (e) {
      console.warn('Web Audio API not supported.');
    }
  }
}

function getCtx() {
  if (!audioCtx) {
    try {
      const AC = getAudioContextClass();
      if (AC) audioCtx = new AC();
    } catch (e) {
      return null;
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(frequency, duration, type = 'sine', gain = 0.15) {
  if (!soundEnabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    // Silently fail
  }
}

export function playMoveSound(symbol) {
  if (symbol === 'X') {
    playTone(440, 0.1, 'square', 0.1);
  } else {
    playTone(330, 0.1, 'sine', 0.12);
  }
}

export function playWinSound() {
  if (!soundEnabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  // Play a short victory arpeggio
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    const t = ctx.currentTime + i * 0.12;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    } catch (e) {}
  });
}

export function playDrawSound() {
  playTone(220, 0.3, 'sawtooth', 0.08);
}

export function playErrorSound() {
  playTone(180, 0.15, 'square', 0.1);
}
