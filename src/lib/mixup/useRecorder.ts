import { useEffect, useRef, useState } from 'react';

/** Browser microphone recorder with a live input level (0-1) and elapsed time. */
export function useRecorder(maxSeconds = 120) {
  const [recording, setRecording] = useState(false);
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const cleanup = useRef<null | (() => void)>(null);
  const resolve = useRef<null | ((b: Blob | null) => void)>(null);

  const supported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

  const start = async (): Promise<Blob | null> => {
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    } catch (e: any) {
      setError('Microphone unavailable: ' + (e?.message ?? 'permission denied'));
      return null;
    }
    const rec = new MediaRecorder(stream);
    const parts: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const an = ctx.createAnalyser(); an.fftSize = 1024;
    ctx.createMediaStreamSource(stream).connect(an);
    const buf = new Float32Array(an.fftSize);
    const t0 = Date.now();
    let raf = 0;
    const tick = () => {
      an.getFloatTimeDomainData(buf);
      let rms = 0; for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
      setLevel(Math.min(1, Math.sqrt(rms / buf.length) * 6));
      const secs = (Date.now() - t0) / 1000;
      setElapsed(secs);
      if (secs >= maxSeconds) { stop(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const done = new Promise<Blob | null>((res) => (resolve.current = res));
    rec.onstop = () => {
      cancelAnimationFrame(raf);
      stream.getTracks().forEach((t) => t.stop());
      ctx.close();
      setRecording(false); setLevel(0);
      resolve.current?.(parts.length ? new Blob(parts, { type: rec.mimeType || 'audio/webm' }) : null);
      resolve.current = null;
    };
    cleanup.current = () => rec.state !== 'inactive' && rec.stop();
    rec.start(250);
    setElapsed(0); setRecording(true);
    return done;
  };

  const stop = () => { cleanup.current?.(); cleanup.current = null; };
  useEffect(() => () => stop(), []);

  return { supported, recording, level, elapsed, error, start, stop };
}
