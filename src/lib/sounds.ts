'use client';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.12,
  detune: number = 0,
) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;
    osc.detune.value = detune;

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail if audio isn't available
  }
}

function playChord(notes: number[], duration: number, type: OscillatorType = 'sine', volume: number = 0.08) {
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, duration, type, volume), i * 30);
  });
}

// ─── Sound effects ──────────────────────────────────────────────────────────

/** Subtle click for button presses */
export function playClick() {
  playTone(800, 0.06, 'sine', 0.08);
}

/** Soft pop for navigation / tab switches */
export function playPop() {
  playTone(600, 0.08, 'sine', 0.1);
  setTimeout(() => playTone(900, 0.06, 'sine', 0.06), 40);
}

/** Upward chime for successful actions (transaction added, goal created) */
export function playSuccess() {
  playTone(523, 0.12, 'sine', 0.1);  // C5
  setTimeout(() => playTone(659, 0.12, 'sine', 0.1), 80);  // E5
  setTimeout(() => playTone(784, 0.15, 'sine', 0.08), 160); // G5
}

/** Gentle whoosh for message sent */
export function playSend() {
  playTone(400, 0.15, 'triangle', 0.06);
  setTimeout(() => playTone(600, 0.1, 'triangle', 0.04), 50);
}

/** Soft bubble for message received */
export function playReceive() {
  playTone(880, 0.08, 'sine', 0.07);
  setTimeout(() => playTone(660, 0.1, 'sine', 0.05), 60);
}

/** Downward tone for errors or deletions */
export function playError() {
  playTone(400, 0.12, 'triangle', 0.1);
  setTimeout(() => playTone(300, 0.15, 'triangle', 0.08), 80);
}

/** Warm notification ding */
export function playNotification() {
  playTone(880, 0.1, 'sine', 0.1);
  setTimeout(() => playTone(1100, 0.15, 'sine', 0.08), 100);
}

/** Panel open swoosh */
export function playOpen() {
  playTone(300, 0.12, 'sine', 0.06);
  setTimeout(() => playTone(500, 0.1, 'sine', 0.05), 50);
  setTimeout(() => playTone(700, 0.08, 'sine', 0.04), 100);
}

/** Panel close swoosh */
export function playClose() {
  playTone(700, 0.1, 'sine', 0.05);
  setTimeout(() => playTone(500, 0.08, 'sine', 0.04), 40);
  setTimeout(() => playTone(300, 0.1, 'sine', 0.03), 80);
}
