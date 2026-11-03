import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { detectPitch } from './matcher';

export type PitchFrame = { freq: number; midi: number; t: number };
export const micSupported = Platform.OS === 'web' && typeof navigator !== 'undefined' && !!(navigator as any).mediaDevices?.getUserMedia;

/** Real-time pitch tracking from the microphone (web). `frame` updates ~20x/second, `voiced` is false in silence. */
export function usePitch(onFrame?: (f: PitchFrame) => void) {
  const [frame, setFrame] = useState<PitchFrame | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stopRef = useRef<null | (() => void)>(null);
  const cb = useRef(onFrame); cb.current = onFrame;

  const stop = useCallback(() => { stopRef.current?.(); stopRef.current = null; setActive(false); setFrame(null); }, []);
  const start = useCallback(async () => {
    if (!micSupported) { setError('Live microphone analysis needs a web browser with microphone access.'); return; }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AC(); await ctx.resume();
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser(); an.fftSize = 2048; src.connect(an);
      const buf = new Float32Array(an.fftSize);
      let last = 0; const recent: number[] = [];
      const id = setInterval(() => {
        an.getFloatTimeDomainData(buf);
        const f = detectPitch(buf, ctx.sampleRate);
        if (f > 0) {
          const midi = 69 + 12 * Math.log2(f / 440);
          // median smoothing over last 3 frames to ignore octave glitches
          recent.push(midi); if (recent.length > 3) recent.shift();
          const m = [...recent].sort((a, b) => a - b)[Math.floor(recent.length / 2)];
          const fr = { freq: 440 * Math.pow(2, (m - 69) / 12), midi: m, t: Date.now() };
          last = fr.t; setFrame(fr); cb.current?.(fr);
        } else if (Date.now() - last > 250) { recent.length = 0; setFrame(null); }
      }, 50);
      stopRef.current = () => { clearInterval(id); stream.getTracks().forEach((t) => t.stop()); ctx.close(); };
      setActive(true);
    } catch (e: any) { setError('Microphone unavailable: ' + (e?.message ?? 'permission denied')); }
  }, []);
  useEffect(() => () => stopRef.current?.(), []);
  return { frame, active, error, start, stop };
}

/** Convert a midi value to {pitch class relative to Sa, cents offset from nearest semitone}. */
export function relativeToSa(midi: number, saHz: number) {
  const saMidi = 69 + 12 * Math.log2(saHz / 440);
  const semis = midi - saMidi;
  const nearest = Math.round(semis);
  return { pc: ((nearest % 12) + 12) % 12, octave: Math.floor(nearest / 12), cents: Math.round((semis - nearest) * 100), semis };
}
