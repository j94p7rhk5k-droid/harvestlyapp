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
  startDelay: number = 0,
) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;

    const start = ctx.currentTime + startDelay;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + duration);
  } catch {
    // Silently fail if audio isn't available
  }
}

function playNoise(duration: number, volume: number = 0.03, startDelay: number = 0) {
  try {
    const ctx = getCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // High-frequency filtered noise (coin shimmer)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6000;

    const gain = ctx.createGain();
    const start = ctx.currentTime + startDelay;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start(start);
    source.stop(start + duration);
  } catch {}
}

// ─── Sound effects ──────────────────────────────────────────────────────────

/** Coin tap — subtle button click */
export function playClick() {
  playTone(2200, 0.04, 'sine', 0.08);
  playNoise(0.03, 0.02);
}

/** Cash register cha-ching for navigation */
export function playPop() {
  playTone(1800, 0.06, 'sine', 0.07);
  playTone(2400, 0.05, 'sine', 0.06, 0.04);
  playNoise(0.04, 0.015, 0.02);
}

/** Cha-ching! — coins dropping for successful transactions */
export function playSuccess() {
  // Bell strike
  playTone(1568, 0.15, 'sine', 0.1);     // G6
  playTone(2093, 0.12, 'sine', 0.08, 0.06); // C7
  playTone(2637, 0.2, 'sine', 0.07, 0.12);  // E7
  // Coin shimmer
  playNoise(0.15, 0.04, 0.08);
  // Cash register "ding"
  playTone(3520, 0.08, 'sine', 0.06, 0.15);
  playNoise(0.1, 0.03, 0.18);
}

/** Coin toss — message sent */
export function playSend() {
  playTone(1200, 0.08, 'triangle', 0.06);
  playTone(1600, 0.06, 'triangle', 0.05, 0.04);
  playNoise(0.04, 0.015, 0.03);
}

/** Coins landing — message received */
export function playReceive() {
  playTone(1400, 0.06, 'sine', 0.07);
  playTone(1800, 0.08, 'sine', 0.06, 0.05);
  playTone(1200, 0.06, 'sine', 0.04, 0.09);
  playNoise(0.06, 0.02, 0.04);
}

/** Coin drop — error */
export function playError() {
  playTone(800, 0.1, 'triangle', 0.08);
  playTone(500, 0.12, 'triangle', 0.07, 0.06);
  playTone(350, 0.15, 'triangle', 0.05, 0.12);
}

/** Vault opening — chat panel open */
export function playOpen() {
  playTone(440, 0.08, 'sine', 0.06);
  playTone(660, 0.08, 'sine', 0.06, 0.05);
  playTone(880, 0.1, 'sine', 0.05, 0.1);
  playTone(1320, 0.08, 'sine', 0.04, 0.15);
  playNoise(0.06, 0.015, 0.1);
}

/** Vault closing — chat panel close */
export function playClose() {
  playTone(1320, 0.06, 'sine', 0.04);
  playTone(880, 0.06, 'sine', 0.04, 0.04);
  playTone(660, 0.08, 'sine', 0.05, 0.08);
  playTone(440, 0.1, 'sine', 0.04, 0.12);
}

/** Bell chime — new notification */
export function playNotification() {
  playTone(1760, 0.1, 'sine', 0.09);       // A6
  playTone(2217, 0.08, 'sine', 0.07, 0.06); // C#7
  playNoise(0.05, 0.02, 0.08);
}

/** Big cha-ching — for bulk imports completing */
export function playBigSuccess() {
  // Triple bell
  playTone(1568, 0.12, 'sine', 0.1);
  playTone(2093, 0.12, 'sine', 0.09, 0.08);
  playTone(2637, 0.15, 'sine', 0.08, 0.16);
  // Coin cascade
  playNoise(0.2, 0.05, 0.1);
  playTone(3520, 0.06, 'sine', 0.06, 0.2);
  playTone(4186, 0.08, 'sine', 0.05, 0.25);
  playNoise(0.15, 0.04, 0.25);
  // Final ding
  playTone(2637, 0.3, 'sine', 0.06, 0.3);
}
