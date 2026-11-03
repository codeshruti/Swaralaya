import { encodeWav } from './wav';
import { decodeToMono, medianPitch, normalize, pitchShift, semitonesBetween } from './dsp';

export type EngineId = 'seedvc' | 'keymatch';
export type Progress = { stage: string; fraction?: number };
export type MixInput = { song: Blob; voice: Blob; semitones: number | 'auto'; quality: 'fast' | 'best' };
export type MixResult = { audio: Blob; engine: EngineId; note?: string; appliedShift?: number };

export type Engine = {
  id: EngineId;
  name: string;
  tagline: string;
  clonesVoice: boolean;
  maxSongSeconds: number;
  run: (input: MixInput, onProgress: (p: Progress) => void, signal: AbortSignal) => Promise<MixResult>;
};

/** Hugging Face Space running Seed-VC. Override with EXPO_PUBLIC_MIXUP_SPACE (e.g. your own duplicated, paid-GPU Space). */
export const SPACE_URL = (process.env.EXPO_PUBLIC_MIXUP_SPACE || 'https://plachta-seed-vc.hf.space').replace(/\/$/, '');
const SPACE_FN = process.env.EXPO_PUBLIC_MIXUP_SPACE_FN || 'convert_voice_v1_wrapper';

type FileData = { path: string; url?: string; orig_name?: string; meta: { _type: 'gradio.FileData' } };

async function gradioPrefix(signal: AbortSignal): Promise<string> {
  // Gradio 5 serves its API under /gradio_api, Gradio 4 at the root.
  try {
    const r = await fetch(`${SPACE_URL}/gradio_api/info`, { signal });
    if (r.ok) return `${SPACE_URL}/gradio_api`;
  } catch (e) { if (signal.aborted) throw e; }
  return SPACE_URL;
}

async function upload(prefix: string, blob: Blob, name: string, signal: AbortSignal): Promise<FileData> {
  const form = new FormData();
  form.append('files', blob, name);
  const r = await fetch(`${prefix}/upload`, { method: 'POST', body: form, signal });
  if (!r.ok) throw new Error(`Upload to the voice engine failed (${r.status}).`);
  const [path] = (await r.json()) as string[];
  return { path, orig_name: name, meta: { _type: 'gradio.FileData' } };
}

/** Read a Gradio /call SSE stream until `complete` or `error`. */
async function readEvents(res: Response, onEvent: (event: string, data: string) => void) {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = '', event = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trimEnd();
      buf = buf.slice(nl + 1);
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) onEvent(event, line.slice(5).trim());
    }
  }
}

const seedvc: Engine = {
  id: 'seedvc',
  name: 'AI voice clone (Seed-VC)',
  tagline: 'Re-sings the song in the voice from your sample. Runs on a shared AI server, so it can take a few minutes.',
  clonesVoice: true,
  maxSongSeconds: 60,
  async run({ song, voice, semitones, quality }, onProgress, signal) {
    onProgress({ stage: 'Preparing audio' });
    const [songClip, voiceClip] = await Promise.all([decodeToMono(song, this.maxSongSeconds), decodeToMono(voice, 25)]);
    const prefix = await gradioPrefix(signal);
    onProgress({ stage: 'Uploading to the voice engine' });
    const [src, ref] = await Promise.all([
      upload(prefix, encodeWav(songClip.samples, songClip.sampleRate, 'Source for Swaralaya Mix up'), 'song.wav', signal),
      upload(prefix, encodeWav(voiceClip.samples, voiceClip.sampleRate, 'Reference for Swaralaya Mix up'), 'voice.wav', signal),
    ]);
    const auto = semitones === 'auto';
    const data = [src, ref, quality === 'best' ? 30 : 10, 1.0, 0.7, true, auto, auto ? 0 : semitones];
    const start = await fetch(`${prefix}/call/${SPACE_FN}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }), signal,
    });
    if (!start.ok) throw new Error(`The voice engine refused the request (${start.status}).`);
    const { event_id } = await start.json();
    onProgress({ stage: 'Waiting in the queue' });
    const stream = await fetch(`${prefix}/call/${SPACE_FN}/${event_id}`, { signal });
    if (!stream.ok || !stream.body) throw new Error(`Lost contact with the voice engine (${stream.status}).`);
    let full: FileData | null = null, failure: string | null = null, chunks = 0;
    await readEvents(stream, (event, raw) => {
      if (event === 'generating') { chunks++; onProgress({ stage: `Converting voice (segment ${chunks})` }); }
      if (event === 'complete') {
        try { const out = JSON.parse(raw); full = out?.[1] ?? out?.[0] ?? null; } catch { /* handled below */ }
      }
      if (event === 'error') failure = raw && raw !== 'null' ? raw : 'The voice engine is busy or out of GPU time. Try again in a few minutes.';
    });
    if (failure) throw new Error(failure);
    const result = full as FileData | null;
    if (!result) throw new Error('The voice engine finished without returning audio.');
    onProgress({ stage: 'Downloading result' });
    const url = result.url || `${prefix}/file=${result.path}`;
    const audioRes = await fetch(url, { signal });
    if (!audioRes.ok) throw new Error(`Could not download the result (${audioRes.status}).`);
    // Re-encode so the file we hand back always carries the AI-generated tag.
    const clip = await decodeToMono(await audioRes.blob(), 600);
    return { audio: encodeWav(normalize(clip.samples), clip.sampleRate), engine: 'seedvc' };
  },
};

const keymatch: Engine = {
  id: 'keymatch',
  name: 'Instant key match (on device)',
  tagline: 'Moves the song into the range of the voice sample, right in your browser. Fast and private, but it does not change whose voice it is.',
  clonesVoice: false,
  maxSongSeconds: 600,
  async run({ song, voice, semitones }, onProgress, signal) {
    onProgress({ stage: 'Decoding audio' });
    const [songClip, voiceClip] = await Promise.all([decodeToMono(song, this.maxSongSeconds), decodeToMono(voice, 30)]);
    let shift = 0;
    if (semitones === 'auto') {
      onProgress({ stage: 'Measuring both voices' });
      shift = semitonesBetween(medianPitch(songClip), medianPitch(voiceClip));
    } else shift = semitones;
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    onProgress({ stage: `Shifting ${shift > 0 ? '+' : ''}${shift} semitones`, fraction: 0 });
    await new Promise((r) => setTimeout(r, 30)); // let the UI paint before the heavy loop
    const out = normalize(pitchShift(songClip.samples, shift, (f) => onProgress({ stage: `Shifting ${shift > 0 ? '+' : ''}${shift} semitones`, fraction: f })));
    return { audio: encodeWav(out, songClip.sampleRate, 'Processed with Swaralaya Mix up (key match)'), engine: 'keymatch', appliedShift: shift };
  },
};

export const ENGINES: Engine[] = [seedvc, keymatch];
