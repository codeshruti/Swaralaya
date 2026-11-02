import { allRagas, Raga } from '../data/ragas';
import { songs, Song, songsByRaga } from '../data/composers';

export type Match = { raga: Raga; score: number; songs: Song[] };

/** Fold a detected pitch (Hz) into a pitch class 0-11 relative to tonic `sa` (Hz). */
export function pitchClass(freq: number, sa: number): number {
  const semis = 12 * Math.log2(freq / sa);
  return ((Math.round(semis) % 12) + 12) % 12;
}

/** Build a normalised 12-bin histogram from pitch-class samples. */
export function histogram(classes: number[]): number[] {
  const h = new Array(12).fill(0);
  classes.forEach((c) => (h[c] += 1));
  const total = classes.length || 1;
  return h.map((x) => x / total);
}

/** Score every raga by how well the sung notes sit inside its scale (and how much of the scale is used). */
export function identifyRaga(hist: number[], limit = 5): Match[] {
  const MIN = 0.04; // a pitch class counts as "sung" above 4% of the phrase
  const sung = new Set(hist.map((v, i) => (v >= MIN ? i : -1)).filter((i) => i >= 0));
  const results = allRagas
    .filter((r) => r.kind === 'janya' || r.kind === 'melakarta')
    .map((r) => {
      const scale = new Set(r.notes);
      let inScale = 0, outScale = 0;
      hist.forEach((v, i) => (scale.has(i) ? (inScale += v) : (outScale += v)));
      const coverage = [...scale].filter((n) => sung.has(n)).length / scale.size;
      const score = Math.max(0, inScale - outScale * 2) * 0.7 + coverage * 0.3;
      return { raga: r, score, songs: songsByRaga(r.name) };
    });
  return results.sort((a, b) => b.score - a.score || a.raga.notes.length - b.raga.notes.length).slice(0, limit);
}

export function similarSongs(raga: Raga, exclude?: string, limit = 4): Song[] {
  const same = songsByRaga(raga.name);
  const kin = songs.filter((s) => {
    const r = allRagas.find((x) => x.name.toLowerCase() === s.raga.toLowerCase());
    return r && r.id !== raga.id && (r.parent === raga.parent || r.number === raga.parent || r.parent === raga.number) && !!(r.parent ?? r.number);
  });
  return [...same, ...kin].filter((s) => s.id !== exclude).slice(0, limit);
}

/** Autocorrelation pitch detector. Returns Hz or -1 if no clear pitch. */
export function detectPitch(buf: Float32Array, sampleRate: number): number {
  let rms = 0;
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / buf.length);
  if (rms < 0.01) return -1;
  const minLag = Math.floor(sampleRate / 800), maxLag = Math.floor(sampleRate / 70);
  let best = -1, bestCorr = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let c = 0;
    for (let i = 0; i < buf.length - lag; i++) c += buf[i] * buf[i + lag];
    if (c > bestCorr) { bestCorr = c; best = lag; }
  }
  return best > 0 && bestCorr > 0.3 * rms * rms * buf.length ? sampleRate / best : -1;
}
