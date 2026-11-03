import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen, H1, H2, Body, Card, Button, Chip } from '../components/ui';
import { colors, font, radius } from '../theme';
import { songs, composerById, Song } from '../data/composers';
import { ENGINES, Engine, EngineId, MixResult, Progress } from '../lib/mixup/engines';
import { useRecorder } from '../lib/mixup/useRecorder';

type Take = { blob: Blob; label: string };
type SongTab = 'library' | 'record' | 'upload' | 'youtube';

const MAX_UPLOAD_MB = 40;

/* ---------- small building blocks ---------- */

function useObjectUrl(blob?: Blob | null) {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  return url;
}

function Player({ blob, label }: { blob: Blob; label?: string }) {
  const url = useObjectUrl(blob);
  if (!url) return null;
  return (
    <View style={{ marginTop: 8 }}>
      {label ? <Text style={s.small}>{label}</Text> : null}
      <audio controls src={url} style={{ width: '100%', marginTop: 4, colorScheme: 'dark' } as any} />
    </View>
  );
}

function StepHeader({ n, title, done }: { n: number; title: string; done?: boolean }) {
  return (
    <View style={s.stepHead}>
      <View style={[s.stepNum, done && { backgroundColor: colors.gold, borderColor: colors.gold }]}>
        <Text style={[s.stepNumText, done && { color: colors.bg }]}>{done ? '✓' : n}</Text>
      </View>
      <Text style={s.stepTitle}>{title}</Text>
    </View>
  );
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <View style={s.seg} accessibilityRole="tablist">
      {options.map(([v, l]) => (
        <Pressable key={v} onPress={() => onChange(v)} accessibilityRole="tab" accessibilityState={{ selected: value === v }}
          style={[s.segItem, value === v && s.segItemOn]}>
          <Text style={[s.segText, value === v && { color: colors.bg }]}>{l}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Check({ checked, onToggle, children }: { checked: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <Pressable onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked }} style={s.check}>
      <View style={[s.box, checked && { backgroundColor: colors.gold, borderColor: colors.gold }]}>
        {checked ? <Text style={{ color: colors.bg, fontWeight: '900', fontSize: 13 }}>✓</Text> : null}
      </View>
      <Text style={s.checkText}>{children}</Text>
    </Pressable>
  );
}

function FilePick({ title, onPick }: { title: string; onPick: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  return (
    <View>
      <input ref={ref} type="file" accept="audio/*,video/mp4,video/webm" style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          if (f.size > MAX_UPLOAD_MB * 1024 * 1024) { setErr(`That file is over ${MAX_UPLOAD_MB} MB. Trim it to the part you want first.`); return; }
          setErr(null); onPick(f);
        }} />
      <Button variant="ghost" title={title} onPress={() => ref.current?.click()} />
      {err ? <Text style={s.err}>{err}</Text> : null}
    </View>
  );
}

/** Live mic recorder with a level meter. */
function Recorder({ cta, max, onTake }: { cta: string; max: number; onTake: (b: Blob) => void }) {
  const r = useRecorder(max);
  if (!r.supported) return <Body>Recording is not supported in this browser. Upload a file instead.</Body>;
  const bars = 24;
  return (
    <View>
      <View style={s.meter}>
        {Array.from({ length: bars }).map((_, i) => {
          const on = r.recording && r.level * bars > i;
          return <View key={i} style={[s.bar, { height: 6 + ((i * 7) % 18) }, on && { backgroundColor: i > bars * 0.8 ? colors.rose : colors.gold }]} />;
        })}
        <Text style={s.timer}>{r.recording ? `${r.elapsed.toFixed(1)}s / ${max}s` : ''}</Text>
      </View>
      <Button title={r.recording ? '■  Stop recording' : `●  ${cta}`}
        onPress={async () => { if (r.recording) r.stop(); else { const b = await r.start(); if (b) onTake(b); } }} />
      {r.error ? <Text style={s.err}>{r.error}</Text> : null}
    </View>
  );
}

function youtubeId(url: string): string | null {
  const m = url.trim().match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  return m ? m[1] : null;
}

/* ---------- the page ---------- */

export default function MixUp() {
  // Step 1: song
  const [tab, setTab] = useState<SongTab>('library');
  const [query, setQuery] = useState('');
  const [lang, setLang] = useState<string>('All');
  const [picked, setPicked] = useState<Song | null>(null);
  const [song, setSong] = useState<Take | null>(null);
  const [yt, setYt] = useState('');
  // Step 2: voice
  const [voice, setVoice] = useState<Take | null>(null);
  const [voiceName, setVoiceName] = useState('');
  // Step 3: consent
  const [consentVoice, setConsentVoice] = useState(false);
  const [consentSong, setConsentSong] = useState(false);
  // Step 4: engine
  const [engineId, setEngineId] = useState<EngineId>('seedvc');
  const [shift, setShift] = useState<number | 'auto'>('auto');
  const [quality, setQuality] = useState<'fast' | 'best'>('fast');
  // Run
  const [progress, setProgress] = useState<Progress | null>(null);
  const [started, setStarted] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [result, setResult] = useState<(MixResult & { title: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const engine = ENGINES.find((e) => e.id === engineId) as Engine;
  const languages = useMemo(() => ['All', ...Array.from(new Set(songs.map((x) => x.language))).sort()], []);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return songs.filter((x) => (lang === 'All' || x.language === lang) &&
      (!q || [x.title, x.raga, x.language, composerById(x.composer)?.name ?? ''].some((f) => f.toLowerCase().includes(q))));
  }, [query, lang]);
  const ytId = youtubeId(yt);
  const busy = !!progress;
  const ready = !!song && !!voice && consentVoice && consentSong && !busy;

  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [busy]);
  useEffect(() => () => abort.current?.abort(), []);

  const songTitle = picked?.title ?? song?.label ?? 'song';
  const run = async () => {
    if (!song || !voice) return;
    setError(null); setResult(null); setStarted(Date.now()); setNow(Date.now());
    const ctrl = new AbortController(); abort.current = ctrl;
    setProgress({ stage: 'Starting' });
    try {
      const out = await engine.run({ song: song.blob, voice: voice.blob, semitones: shift, quality }, setProgress, ctrl.signal);
      setResult({ ...out, title: songTitle });
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        const msg = String(e?.message ?? e);
        setError(/Failed to fetch|NetworkError|Load failed/i.test(msg)
          ? 'Could not reach the AI voice server. It may be waking up or busy; try again in a minute, or use Instant key match.'
          : msg);
      }
    } finally { setProgress(null); abort.current = null; }
  };

  const fileBase = `${songTitle} in ${voiceName.trim() || 'new voice'}`.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-');
  const download = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(result.audio);
    a.download = `${fileBase}-${result.engine === 'seedvc' ? 'AI-generated' : 'key-matched'}.wav`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  return (
    <Screen>
      <View style={s.hero}>
        <View style={s.badge}><Text style={s.badgeText}>✦ AI LAB</Text></View>
        <H1>Mix up</H1>
        <Body>Hear a song in someone else's voice. Bring a song, add a short sample of the voice you want, and Swaralaya's AI re-sings it. Every result is clearly marked as AI-generated.</Body>
      </View>

      {/* STEP 1 */}
      <StepHeader n={1} title="Bring a song" done={!!song} />
      <Card>
        <Segmented value={tab} onChange={setTab}
          options={[['library', 'Library'], ['record', 'Record'], ['upload', 'Upload'], ['youtube', 'YouTube']]} />

        {tab === 'library' && (
          <View>
            <TextInput value={query} onChangeText={setQuery} placeholder="Search songs, ragas, composers"
              placeholderTextColor={colors.muted} style={s.input} accessibilityLabel="Search songs" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {languages.map((l) => <Chip key={l} label={l} active={lang === l} onPress={() => setLang(l)} />)}
            </View>
            <View style={s.songList}>
              {list.length === 0 && <Body>No songs match. Try another word.</Body>}
              {list.map((x) => (
                <Pressable key={x.id} onPress={() => setPicked(x)} accessibilityRole="button"
                  style={({ hovered }: any) => [s.songRow, picked?.id === x.id && s.songRowOn, hovered && { backgroundColor: colors.surface2 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.songTitle}>{x.title}</Text>
                    <Text style={s.small}>{composerById(x.composer)?.name} · {x.raga} · {x.language}</Text>
                  </View>
                  <Text style={{ color: picked?.id === x.id ? colors.gold : colors.muted, fontSize: 18 }}>{picked?.id === x.id ? '●' : '○'}</Text>
                </Pressable>
              ))}
            </View>
            {picked && (
              <View style={s.inset}>
                <Text style={s.small}>SING THE OPENING LINE, OR ADD A RECORDING OF {picked.title.toUpperCase()}</Text>
                <Text style={s.lyric}>“{picked.opening}”</Text>
                <Text style={s.small}>Raga {picked.raga} · Tala {picked.tala}</Text>
                <View style={{ height: 12 }} />
                <Recorder cta="Record it" max={60} onTake={(b) => setSong({ blob: b, label: picked.title })} />
                <View style={{ height: 8 }} />
                <FilePick title="Upload a recording of it" onPick={(f) => setSong({ blob: f, label: picked.title })} />
              </View>
            )}
          </View>
        )}

        {tab === 'record' && (
          <View>
            <Body style={{ marginBottom: 12 }}>Sing or play the song. Up to a minute works best with the AI voice clone. Use headphones if music is playing.</Body>
            <Recorder cta="Start recording" max={120} onTake={(b) => { setPicked(null); setSong({ blob: b, label: 'My recording' }); }} />
          </View>
        )}

        {tab === 'upload' && (
          <View>
            <Body style={{ marginBottom: 12 }}>MP3, WAV, M4A, OGG or a short video. Vocals with little accompaniment give the cleanest result.</Body>
            <FilePick title="Choose an audio file" onPick={(f) => { setPicked(null); setSong({ blob: f, label: f.name.replace(/\.[^.]+$/, '') }); }} />
          </View>
        )}

        {tab === 'youtube' && (
          <View>
            <TextInput value={yt} onChangeText={setYt} placeholder="https://www.youtube.com/watch?v=…" autoCapitalize="none"
              placeholderTextColor={colors.muted} style={s.input} accessibilityLabel="YouTube link" />
            {yt.length > 0 && !ytId && <Text style={s.err}>That does not look like a YouTube video link.</Text>}
            {ytId && (
              <View style={s.video}>
                <iframe title="YouTube reference" src={`https://www.youtube-nocookie.com/embed/${ytId}`} allow="encrypted-media; picture-in-picture"
                  allowFullScreen style={{ border: 0, width: '100%', height: '100%', borderRadius: 12 }} />
              </View>
            )}
            <View style={s.inset}>
              <Text style={s.noteTitle}>Why we can't take the audio straight from YouTube</Text>
              <Body>YouTube's terms don't allow downloading audio from videos, and most songs there are copyrighted. Play the video above and sing along with headphones on, then use your own recording, or upload a copy you have the rights to.</Body>
              <View style={{ height: 12 }} />
              <Recorder cta="Sing along and record" max={120} onTake={(b) => setSong({ blob: b, label: 'Sing-along recording' })} />
              <View style={{ height: 8 }} />
              <FilePick title="Upload my own copy" onPick={(f) => setSong({ blob: f, label: f.name.replace(/\.[^.]+$/, '') })} />
            </View>
          </View>
        )}

        {song && (
          <View style={s.ready}>
            <Text style={s.readyText}>✓ Song ready: {song.label}</Text>
            <Player blob={song.blob} />
            <Pressable onPress={() => setSong(null)}><Text style={s.link}>Remove</Text></Pressable>
          </View>
        )}
      </Card>

      {/* STEP 2 */}
      <StepHeader n={2} title="Whose voice?" done={!!voice} />
      <Card>
        <Body>Record or upload 10 to 25 seconds of the person speaking or singing clearly, with no music behind them. One voice only.</Body>
        <TextInput value={voiceName} onChangeText={setVoiceName} placeholder="Their name (used to label the result)"
          placeholderTextColor={colors.muted} style={[s.input, { marginTop: 12 }]} accessibilityLabel="Voice name" />
        <View style={s.inset}>
          <Text style={s.small}>IF THEY ARE WITH YOU, ASK THEM TO READ THIS ALOUD</Text>
          <Text style={s.lyric}>“I'm recording my voice for Swaralaya Mix up, and I'm happy for it to be used to sing this song.”</Text>
          <View style={{ height: 8 }} />
          <Recorder cta="Record voice sample" max={30} onTake={(b) => setVoice({ blob: b, label: 'Recorded sample' })} />
        </View>
        <View style={{ height: 8 }} />
        <FilePick title="Upload a voice sample" onPick={(f) => setVoice({ blob: f, label: f.name })} />
        {voice && (
          <View style={s.ready}>
            <Text style={s.readyText}>✓ Voice sample ready</Text>
            <Player blob={voice.blob} />
            <Pressable onPress={() => setVoice(null)}><Text style={s.link}>Remove</Text></Pressable>
          </View>
        )}
      </Card>

      {/* STEP 3 */}
      <StepHeader n={3} title="Permission" done={consentVoice && consentSong} />
      <Card>
        <Check checked={consentVoice} onToggle={() => setConsentVoice((v) => !v)}>
          This is my own voice, or the person whose voice this is has given me permission to use it this way.
        </Check>
        <Check checked={consentSong} onToggle={() => setConsentSong((v) => !v)}>
          I have the right to use this song audio, and I won't present the result as a real recording by this person.
        </Check>
        <Text style={[s.small, { marginTop: 4 }]}>Don't use Mix up to imitate someone without their consent, to deceive people, or to pass off AI audio as a real performance.</Text>
      </Card>

      {/* STEP 4 */}
      <StepHeader n={4} title="Mix it" done={!!result} />
      <Card>
        {ENGINES.map((e) => (
          <Pressable key={e.id} onPress={() => setEngineId(e.id)} accessibilityRole="radio" accessibilityState={{ checked: engineId === e.id }}
            style={[s.engine, engineId === e.id && s.engineOn]}>
            <View style={[s.radio, engineId === e.id && { borderColor: colors.gold }]}>{engineId === e.id && <View style={s.radioDot} />}</View>
            <View style={{ flex: 1 }}>
              <Text style={s.engineName}>{e.name}</Text>
              <Text style={s.small}>{e.tagline}</Text>
            </View>
          </Pressable>
        ))}

        <Text style={[s.label, { marginTop: 14 }]}>Key</Text>
        <View style={s.row}>
          <Chip label="Auto" active={shift === 'auto'} onPress={() => setShift('auto')} />
          <Pressable style={s.stepper} onPress={() => setShift((v) => Math.max(-12, (v === 'auto' ? 0 : v) - 1))} accessibilityLabel="Lower by a semitone"><Text style={s.stepperText}>−</Text></Pressable>
          <Text style={s.shiftVal}>{shift === 'auto' ? 'matched to voice' : `${shift > 0 ? '+' : ''}${shift} semitones`}</Text>
          <Pressable style={s.stepper} onPress={() => setShift((v) => Math.min(12, (v === 'auto' ? 0 : v) + 1))} accessibilityLabel="Raise by a semitone"><Text style={s.stepperText}>+</Text></Pressable>
        </View>
        {engine.clonesVoice && (
          <>
            <Text style={s.label}>Quality</Text>
            <View style={s.row}>
              <Chip label="Fast" active={quality === 'fast'} onPress={() => setQuality('fast')} />
              <Chip label="Best" active={quality === 'best'} onPress={() => setQuality('best')} />
            </View>
            <Text style={s.small}>The AI voice clone uses the first {engine.maxSongSeconds} seconds of the song and the first 25 seconds of the voice sample. Your audio is sent to a Hugging Face server to be processed.</Text>
          </>
        )}

        <View style={{ height: 16 }} />
        {!busy ? (
          <>
            <Button title={engine.clonesVoice ? '✦  Generate in their voice' : '✦  Match the key'} onPress={run} disabled={!ready} />
            {!ready && <Text style={[s.small, { textAlign: 'center', marginTop: 8 }]}>
              {!song ? 'Add a song in step 1.' : !voice ? 'Add a voice sample in step 2.' : 'Tick both permission boxes in step 3.'}
            </Text>}
          </>
        ) : (
          <View style={s.progress}>
            <View style={s.pulseRow}>
              {[0, 1, 2, 3, 4].map((i) => <View key={i} style={[s.pulse, { height: 10 + (((now / 120 + i * 3) | 0) % 5) * 6 }]} />)}
            </View>
            <Text style={s.progressStage}>{progress?.stage}…</Text>
            {progress?.fraction != null && (
              <View style={s.track}><View style={[s.fill, { width: `${Math.round(progress.fraction * 100)}%` }]} /></View>
            )}
            <Text style={s.small}>{Math.round((now - started) / 1000)}s elapsed{engine.clonesVoice ? ' · the free AI server can take a few minutes when busy' : ''}</Text>
            <View style={{ height: 10 }} />
            <Button variant="ghost" title="Cancel" onPress={() => abort.current?.abort()} />
          </View>
        )}
        {error && <View style={[s.inset, { borderColor: colors.danger }]}><Text style={s.err}>{error}</Text></View>}
      </Card>

      {result && (
        <Card style={{ borderColor: colors.gold }}>
          <View style={s.aiTag}><Text style={s.aiTagText}>{result.engine === 'seedvc' ? 'AI-GENERATED VOICE' : 'PROCESSED AUDIO · KEY MATCHED'}</Text></View>
          <Text style={s.resultTitle}>{result.title}</Text>
          <Body>{result.engine === 'seedvc'
            ? `in the voice of ${voiceName.trim() || 'your sample'}, made with AI. This is not a real recording of them.`
            : `moved ${result.appliedShift! > 0 ? 'up' : 'down'} ${Math.abs(result.appliedShift ?? 0)} semitones to suit ${voiceName.trim() || 'the sample'}'s range. Same singer, new key.`}
          </Body>
          <Player blob={result.audio} label="Result" />
          {song && <Player blob={song.blob} label="Original" />}
          <View style={{ height: 14 }} />
          <Button title="Download WAV" onPress={download} />
          <Text style={[s.small, { marginTop: 8 }]}>The file name and its metadata say it was made with AI. Please keep that label when you share it.</Text>
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { marginBottom: 8 },
  badge: { alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.rose, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 10 },
  badgeText: { color: colors.rose, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  stepHead: { flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 10 },
  stepNum: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  stepNumText: { color: colors.gold, fontWeight: '800' },
  stepTitle: { fontFamily: font.display, fontSize: 20, color: colors.text, fontWeight: '700' },
  seg: { flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: 999, padding: 4, marginBottom: 14 },
  segItem: { flexGrow: 1, flexBasis: 0, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 999, alignItems: 'center' },
  segItemOn: { backgroundColor: colors.gold },
  segText: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  input: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, color: colors.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 10 },
  songList: { maxHeight: 280, overflow: 'scroll' as any, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, marginTop: 4 },
  songRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  songRowOn: { backgroundColor: colors.surface2 },
  songTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  small: { color: colors.muted, fontSize: 12, lineHeight: 18, letterSpacing: 0.2 },
  label: { color: colors.text, fontWeight: '700', marginBottom: 8, marginTop: 6 },
  inset: { marginTop: 14, padding: 14, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  lyric: { fontFamily: font.display, color: colors.text, fontSize: 18, fontStyle: 'italic', marginVertical: 6, lineHeight: 26 },
  noteTitle: { color: colors.gold, fontWeight: '700', marginBottom: 6 },
  video: { width: '100%', aspectRatio: 16 / 9, marginBottom: 4, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  meter: { flexDirection: 'row', alignItems: 'flex-end', height: 30, marginBottom: 10, gap: 3 },
  bar: { width: 5, borderRadius: 3, backgroundColor: colors.border },
  timer: { color: colors.muted, marginLeft: 10, fontVariant: ['tabular-nums'], fontSize: 12 },
  ready: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  readyText: { color: colors.teal, fontWeight: '700' },
  link: { color: colors.muted, textDecorationLine: 'underline', marginTop: 8, fontSize: 13 },
  check: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.muted, marginRight: 12, marginTop: 1, alignItems: 'center', justifyContent: 'center' },
  checkText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 22 },
  engine: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  engineOn: { borderColor: colors.gold, backgroundColor: colors.surface2 },
  engineName: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.muted, marginRight: 12, marginTop: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 },
  stepper: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  stepperText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  shiftVal: { color: colors.text, marginHorizontal: 12, marginBottom: 8, minWidth: 120, textAlign: 'center' },
  progress: { alignItems: 'center', paddingVertical: 8 },
  pulseRow: { flexDirection: 'row', alignItems: 'flex-end', height: 36, gap: 5, marginBottom: 10 },
  pulse: { width: 6, borderRadius: 3, backgroundColor: colors.saffron },
  progressStage: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 8 },
  track: { width: '100%', height: 6, borderRadius: 3, backgroundColor: colors.surface2, overflow: 'hidden', marginBottom: 8 },
  fill: { height: 6, backgroundColor: colors.gold },
  err: { color: colors.danger, marginTop: 6, fontSize: 14, lineHeight: 20 },
  aiTag: { alignSelf: 'flex-start', backgroundColor: colors.rose, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 10 },
  aiTagText: { color: colors.bg, fontWeight: '900', fontSize: 11, letterSpacing: 1.2 },
  resultTitle: { fontFamily: font.display, color: colors.text, fontSize: 26, fontWeight: '700', marginBottom: 4 },
});
