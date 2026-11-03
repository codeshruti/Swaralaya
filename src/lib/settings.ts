import { useEffect, useState } from 'react';

export const SA_OPTIONS: [string, number][] = [['C', 130.81], ['C#', 138.59], ['D', 146.83], ['D#', 155.56], ['E', 164.81], ['F', 174.61], ['F#', 185.0], ['G', 196.0], ['G#', 207.65], ['A', 220.0], ['A#', 233.08], ['B', 246.94]];
let saIndex = 1;
const listeners = new Set<(i: number) => void>();
try { const v = (globalThis as any).localStorage?.getItem('swaralaya.sa'); if (v) saIndex = Math.min(11, Math.max(0, parseInt(v, 10) || 1)); } catch {}

export function useSa(): [[string, number], (i: number) => void] {
  const [i, setI] = useState(saIndex);
  useEffect(() => { listeners.add(setI); return () => { listeners.delete(setI); }; }, []);
  const set = (n: number) => { saIndex = n; try { (globalThis as any).localStorage?.setItem('swaralaya.sa', String(n)); } catch {} listeners.forEach((l) => l(n)); };
  return [SA_OPTIONS[i], set];
}
