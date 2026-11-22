import type { RarityTier } from '../types';

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  freq: number,
  durationSec: number,
  type: OscillatorType,
  gainPeak: number,
  delaySec = 0
) {
  const ctx = getContext();
  if (!ctx) return;

  const start = ctx.currentTime + delaySec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(start);
  osc.stop(start + durationSec + 0.02);
}

export function playTickSound(muted: boolean) {
  if (muted) return;
  playTone(760, 0.045, 'triangle', 0.035);
}

export function playStrikeSound(muted: boolean) {
  if (muted) return;
  playTone(175, 0.16, 'sawtooth', 0.06, 0);
  playTone(130, 0.24, 'triangle', 0.07, 0.09);
}

export function playValidSound(rarity: RarityTier, muted: boolean) {
  if (muted) return;
  switch (rarity) {
    case 'Mythic':
      playTone(523.25, 0.16, 'sine', 0.08, 0);
      playTone(659.25, 0.18, 'sine', 0.08, 0.07);
      playTone(783.99, 0.22, 'sine', 0.085, 0.14);
      playTone(1046.5, 0.36, 'triangle', 0.09, 0.21);
      break;
    case 'Deep Cut':
      playTone(440, 0.15, 'sine', 0.075, 0);
      playTone(554.37, 0.18, 'sine', 0.08, 0.07);
      playTone(659.25, 0.28, 'triangle', 0.08, 0.14);
      break;
    case 'All-Star':
      playTone(440, 0.14, 'sine', 0.07, 0);
      playTone(587.33, 0.22, 'sine', 0.075, 0.07);
      break;
    case 'Starter':
      playTone(392, 0.13, 'sine', 0.065, 0);
      playTone(493.88, 0.18, 'sine', 0.07, 0.065);
      break;
    case 'Rookie':
    default:
      playTone(392, 0.14, 'sine', 0.06, 0);
      break;
  }
}
