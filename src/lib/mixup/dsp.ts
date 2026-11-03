import { detectPitch } from '../matcher';

export const WORK_RATE = 44100;

export type Clip = { samples: Float32Array; sampleRate: number; duration: number };

/** Decode any browser-supported audio file to mono at WORK_RATE, keeping at most `maxSeconds`. */
export async function decodeToMono(blob: Blob, maxSeconds = 120): Promise<Clip> {
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  const ctx: AudioContext = new Ctx();
  try {
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
    const secs = Math.min(decoded.duration, maxSeconds);
    const off = new OfflineAudioContext(1, Math.max(1, Math.ceil(secs * WORK_RATE)), WORK_RATE);
    const src = off.createBufferSource();
    src.buffer = decoded; src.connect(off.destination); src.start();
    const rendered = await off.startRendering();
    const samples = rendered.getChannelData(0);
    return { samples, sampleRate: WORK_RATE, duration: samples.length / WORK_RATE };
  } finally { ctx.close(); }
}

/** Median sung pitch in Hz across a clip (voiced frames only), or -1 if none found. */
export function medianPitch(clip: Clip): number {
  const step = 4; // decimate to ~11 kHz: plenty for vocal fundamentals, 16x cheaper
  const rate = clip.sampleRate / step;
  const n = Math.floor(clip.samples.length / step);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = clip.samples[i * step];
  const frame = 1024, hop = 768, found: number[] = [];
  for (let s = 0; s + frame < n; s += hop) {
    const f = detectPitch(x.subarray(s, s + frame), rate);
    if (f > 70 && f < 1000) found.push(f);
  }
  if (found.length < 5) return -1;
  found.sort((a, b) => a - b);
  return found[Math.floor(found.length / 2)];
}

/** Semitones to move `from` into the range of `to`, rounded and clamped to ±12. */
export function semitonesBetween(from: number, to: number): number {
  if (from <= 0 || to <= 0) return 0;
  return Math.max(-12, Math.min(12, Math.round(12 * Math.log2(to / from))));
}

/** Granular (overlap-add) pitch shift that keeps the original duration. */
export function pitchShift(x: Float32Array, semitones: number, onProgress?: (p: number) => void): Float32Array {
  if (!semitones) return x.slice();
  const ratio = Math.pow(2, semitones / 12);
  const N = 2048, H = N / 4, half = N / 2;
  const win = new Float32Array(N);
  for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N);
  const out = new Float32Array(x.length);
  const norm = new Float32Array(x.length);
  const grains = Math.ceil(x.length / H);
  for (let g = 0; g < grains; g++) {
    const start = g * H;
    for (let i = 0; i < N; i++) {
      const o = start + i;
      if (o >= x.length) break;
      const pos = start + half + (i - half) * ratio;
      const k = Math.floor(pos);
      if (k < 0 || k + 1 >= x.length) continue;
      const frac = pos - k;
      out[o] += win[i] * (x[k] * (1 - frac) + x[k + 1] * frac);
      norm[o] += win[i];
    }
    if (onProgress && g % 200 === 0) onProgress(g / grains);
  }
  for (let i = 0; i < out.length; i++) if (norm[i] > 1e-3) out[i] /= norm[i];
  return out;
}

/** Peak-normalise to -1 dBFS. */
export function normalize(x: Float32Array): Float32Array {
  let peak = 0;
  for (let i = 0; i < x.length; i++) peak = Math.max(peak, Math.abs(x[i]));
  if (peak < 1e-4) return x;
  const g = 0.89 / peak;
  for (let i = 0; i < x.length; i++) x[i] *= g;
  return x;
}
