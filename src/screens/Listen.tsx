import React, { useMemo, useRef, useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { Screen, H1, H2, Body, Card, Button, Chip, SwaraStrip } from '../components/ui';
import { PitchMeter, PitchTrail, Bar } from '../components/Pitch';
import { NOTE_LABEL_FULL } from '../data/ragas';
import { histogram, identifyRaga, similarSongs } from '../lib/matcher';
import { micSupported, relativeToSa, usePitch } from '../lib/usePitch';
import { SA_OPTIONS, useSa } from '../lib/settings';
import { composerById } from '../data/composers';
import { colors, font } from '../theme';

const WINDOW = 240; // ~12 s of frames at 20 fps
const TRAIL = 60;

export default function Listen({ navigation }: any) {
  const [sa, setSaIdx] = useSa();
  const [classes, setClasses] = useState<number[]>([]);
  const [trail, setTrail] = useState<(number | null)[]>(Array(TRAIL).fill(null));
  const saRef = useRef(sa[1]); saRef.current = sa[1];
  const { frame, active, error, start, stop } = usePitch((f) => {
    const r = relativeToSa(f.midi, saRef.current);
    setClasses((c) => [...c.slice(-(WINDOW - 1)), r.pc]);
    setTrail((t) => [...t.slice(1), r.pc]);
  });
  const rel = frame ? relativeToSa(frame.midi, sa[1]) : null;
  const hist = useMemo(() => histogram(classes), [classes]);
  const matches = useMemo(() => (classes.length >= 25 ? identifyRaga(hist) : []), [hist, classes.length]);
  const top = matches[0];
  const heard = hist.map((v, i) => (v >= 0.04 ? i : -1)).filter((i) => i >= 0);
  const clear = () => { setClasses([]); setTrail(Array(TRAIL).fill(null)); };

  return (
    <Screen>
      <H1>Sing to discover</H1>
      <Body>Set your Sa, press start and sing or hum a phrase. Results update live as you sing, using your last 12 seconds.</Body>
      <H2>Your Sa</H2>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {SA_OPTIONS.map((o, i) => <Chip key={o[0]} label={o[0]} active={sa[0] === o[0]} onPress={() => { setSaIdx(i); clear(); }} />)}
      </View>
      <View style={{ marginVertical: 14 }}>
        {micSupported ? <Button title={active ? 'Stop listening' : 'Start listening'} onPress={active ? stop : start} />
          : <Card><Body>Live listening runs in a web browser with microphone access. On this device, tap the swaras below to try the matcher.</Body></Card>}
      </View>
      {error && <Body style={{ color: colors.danger }}>{error}</Body>}
      <Card>
        <PitchMeter pc={rel ? rel.pc : null} cents={rel ? rel.cents : 0} active={active} />
        <PitchTrail trail={trail} />
      </Card>
      <H2>Notes heard</H2>
      <SwaraStrip notes={heard} highlight={colors.saffron} />
      {!micSupported && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {NOTE_LABEL_FULL.map((l, i) => <Pressable key={i} onPress={() => setClasses((c) => [...c.slice(-(WINDOW - 1)), i, i, i])} style={{ padding: 10, margin: 3, borderRadius: 10, backgroundColor: colors.surface2 }}><Text style={{ color: colors.text }}>{l}</Text></Pressable>)}
        </View>
      )}
      <View style={{ marginTop: 8 }}><Button variant="ghost" title="Clear" onPress={clear} /></View>

      {top ? (
        <>
          <H2>Most likely raga</H2>
          <Card onPress={() => navigation.navigate('RagaDetail', { id: top.raga.id })} style={{ borderColor: colors.gold }}>
            <Text style={{ fontFamily: font.display, fontSize: 28, color: colors.text }}>{top.raga.name}</Text>
            <Body>{top.raga.moods.join(', ')} · {top.raga.arohana}</Body>
            <Bar value={top.score} />
          </Card>
          {matches.slice(1, 4).map((m) => (
            <Card key={m.raga.id} onPress={() => navigation.navigate('RagaDetail', { id: m.raga.id })}>
              <Text style={{ color: colors.text }}>{m.raga.name}</Text><Bar value={m.score} color={colors.teal} />
            </Card>
          ))}
          {top.songs.length > 0 && <H2>Songs in {top.raga.name}</H2>}
          {top.songs.map((s) => <Card key={s.id} onPress={() => navigation.navigate('SongDetail', { id: s.id })}><Text style={{ color: colors.text, fontSize: 18 }}>{s.title}</Text><Body>{composerById(s.composer)?.name} · {s.language}</Body></Card>)}
          {similarSongs(top.raga).length > 0 && <H2>Similar songs</H2>}
          {similarSongs(top.raga).map((s) => <Card key={s.id} onPress={() => navigation.navigate('SongDetail', { id: s.id })}><Text style={{ color: colors.text }}>{s.title}</Text><Body>{s.raga} · {s.language}</Body></Card>)}
          <Body>These are suggestions from the notes you sing, not an exact recording match.</Body>
        </>
      ) : (
        <Body style={{ marginTop: 16 }}>Keep singing: raga suggestions appear after a few seconds of notes.</Body>
      )}
    </Screen>
  );
}
