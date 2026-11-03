// Web Audio helpers: a synthesised tanpura and reference tones. No-ops where Web Audio is unavailable.
const AC: any = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
export const audioAvailable = !!AC;
let ctx: any = null;
const getCtx = () => { if (!ctx && AC) ctx = new AC(); if (ctx?.state === 'suspended') ctx.resume(); return ctx; };

function pluck(c: any, dest: any, freq: number, when: number, dur: number, vol: number) {
  [0, 4].forEach((det) => {
    const o = c.createOscillator(); const g = c.createGain(); const f = c.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = freq; o.detune.value = det;
    f.type = 'lowpass'; f.frequency.setValueAtTime(2600, when); f.frequency.exponentialRampToValueAtTime(500, when + dur);
    g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(vol, when + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(f); f.connect(g); g.connect(dest); o.start(when); o.stop(when + dur + 0.1);
  });
}

export class Tanpura {
  private timer: any = null; private master: any = null; private next = 0; running = false;
  /** sa in Hz (middle octave); strings: Pa(lower), Sa, Sa, Sa(lower) */
  start(sa: number, tuning: 'Pa' | 'Ma' = 'Pa') {
    const c = getCtx(); if (!c) return; this.stop();
    this.master = c.createGain(); this.master.gain.value = 0.22; this.master.connect(c.destination);
    const first = tuning === 'Pa' ? sa * 0.75 : sa * (2 / 3) * 1.0; // lower Pa (or Ma) string
    const strings = [first * (tuning === 'Pa' ? 1 : 1), sa, sa, sa / 2];
    this.next = c.currentTime + 0.1; let i = 0; this.running = true;
    const tick = () => {
      while (this.next < c.currentTime + 0.5) { pluck(c, this.master, strings[i % 4], this.next, 3.4, 0.5); this.next += 0.85; i++; if (i % 4 === 0) this.next += 0.25; }
    };
    tick(); this.timer = setInterval(tick, 200);
  }
  setVolume(v: number) { if (this.master) this.master.gain.value = v; }
  stop() { clearInterval(this.timer); this.timer = null; this.running = false; if (this.master) { try { this.master.disconnect(); } catch {} this.master = null; } }
}

export function playTone(freq: number, seconds = 0.9) {
  const c = getCtx(); if (!c) return;
  const o = c.createOscillator(); const g = c.createGain(); o.type = 'triangle'; o.frequency.value = freq;
  const t = c.currentTime; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + seconds + 0.05);
}
