import React, { useEffect, useRef, useState } from 'react';
import { Platform, Text, View, Pressable } from 'react-native';
import { Screen, H1, H2, Body, Card, Button, Chip, SwaraStrip } from '../components/ui';
import { NOTE_LABEL_FULL } from '../data/ragas';
import { detectPitch, histogram, identifyRaga, pitchClass, similarSongs, Match } from '../lib/matcher';
import { composerById } from '../data/composers';
import { colors, font } from '../theme';

const SA_OPTIONS: [string, number][] = [['C', 130.81], ['C#', 138.59], ['D', 146.83], ['D#', 155.56], ['E', 164.81], ['F', 174.61], ['F#', 185.0], ['G', 196.0], ['G#', 207.65], ['A', 220.0], ['A#', 233.08], ['B', 246.94]];

export default function Listen({ navigation }: any) {
  const [sa, setSa] = useState(SA_OPTIONS[1]);
  const [classes, setClasses] = useState<number[]>([]);
  const [recording, setRecording] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const stop = useRef<null | (() => void)>(null);
  const live = useRef<number[]>([]);
  const webMic = Platform.OS === 'web' && typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  const matches: Match[] = classes.length >= 8 ? identifyRaga(histogram(classes)) : [];

  const start = async () => {
    setErr(null); live.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } });
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser(); an.fftSize = 2048; src.connect(an);
      const buf = new Float32Array(an.fftSize);
      const id = setInterval(() => {
        an.getFloatTimeDomainData(buf);
        const f = detectPitch(buf, ctx.sampleRate);
        if (f > 0) { live.current.push(pitchClass(f, sa[1])); setClasses([...live.current]); }
      }, 80);
      stop.current = () => { clearInterval(id); stream.getTracks().forEach((t) => t.stop()); ctx.close(); };
      setRecording(true);
    } catch (e: any) { setErr('Microphone unavailable: ' + (e?.message ?? 'permission denied')); }
  };
  const end = () => { stop.current?.(); setRecording(false); };
  useEffect(() => () => stop.current?.(), []);

  const top = matches[0];
  return (
    <Screen>
      <H1>Sing to discover</H1>
      <Body>Pick your shruti (the pitch you call Sa), then sing a phrase of at least 5 seconds. Swaralaya matches the notes against its raga library.</Body>
      <H2>Your Sa</H2>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {SA_OPTIONS.map((o) => <Chip key={o[0]} label={o[0]} active={sa[0] === o[0]} onPress={() => { setSa(o); setClasses([]); }} />)}
      </View>
      <View style={{ marginVertical: 14 }}>
        {webMic ? (
          <Button title={recording ? 'Stop' : 'Start singing'} onPress={recording ? end : start} />
        ) : (
          <Card><Body>Live pitch detection currently runs in the web version. On this device, tap the swaras below as you sing or play them.</Body></Card>
        )}
      </View>
      {err && <Body style={{ color: colors.danger }}>{err}</Body>}
      <H2>Notes heard {recording ? '(listening…)' : ''}</H2>
      <SwaraStrip notes={Array.from(new Set(histogram(classes).map((v, i) => (v >= 0.04 ? i : -1)).filter((i) => i >= 0)))} highlight={colors.saffron} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
        {NOTE_LABEL_FULL.map((l, i) => <Pressable key={i} onPress={() => setClasses((c) => [...c, i])} style={{ padding: 10, margin: 3, borderRadius: 10, backgroundColor: colors.surface2 }}><Text style={{ color: colors.text }}>{l}</Text></Pressable>)}
      </View>
      <View style={{ marginTop: 8 }}><Button variant="ghost" title="Clear" onPress={() => setClasses([])} /></View>
      {top && (
        <>
          <H2>Most likely raga</H2>
          <Card onPress={() => navigation.navigate('RagaDetail', { id: top.raga.id })} style={{ borderColor: colors.gold }}>
            <Text style={{ fontFamily: font.display, fontSize: 28, color: colors.text }}>{top.raga.name}</Text>
            <Body>Match {Math.round(top.score * 100)}% · {top.raga.moods.join(', ')}</Body>
          </Card>
          {matches.slice(1, 4).map((m) => <Card key={m.raga.id} onPress={() => navigation.navigate('RagaDetail', { id: m.raga.id })}><Text style={{ color: colors.text }}>{m.raga.name} · {Math.round(m.score * 100)}%</Text></Card>)}
          {top.songs.length > 0 && <H2>Songs in {top.raga.name}</H2>}
          {top.songs.map((s) => <Card key={s.id} onPress={() => navigation.navigate('SongDetail', { id: s.id })}><Text style={{ color: colors.text, fontSize: 18 }}>{s.title}</Text><Body>{composerById(s.composer)?.name}</Body></Card>)}
          {similarSongs(top.raga).length > 0 && <H2>Similar songs</H2>}
          {similarSongs(top.raga).map((s) => <Card key={s.id} onPress={() => navigation.navigate('SongDetail', { id: s.id })}><Text style={{ color: colors.text }}>{s.title}</Text><Body>{s.raga}</Body></Card>)}
          <Body>Identification is based on the notes you sing, so it suggests ragas and related songs, not an exact recording.</Body>
        </>
      )}
    </Screen>
  );
}
