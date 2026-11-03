import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Screen, H1, H2, Body, Card, Button, Chip, SwaraStrip } from '../components/ui';
import { PitchMeter, Bar } from '../components/Pitch';
import { janyas, melakartas, Raga, semitones } from '../data/ragas';
import { micSupported, relativeToSa, usePitch } from '../lib/usePitch';
import { SA_OPTIONS, useSa } from '../lib/settings';
import { Tanpura, audioAvailable, playTone } from '../lib/audio';
import { colors, font } from '../theme';

const SWARA_NAME = ['S', 'R1', 'R2', 'G2', 'G3', 'M1', 'M2', 'P', 'D1', 'D2', 'D3', 'N3'];
const CHOICES: Raga[] = [melakartas[14], melakartas[28], melakartas[7], ...janyas.slice(0, 8)];
const HOLD = 8; // frames (~0.4 s) within tolerance counts as a hit
const TOL = 35;

export default function Practice() {
  const [sa, setSaIdx] = useSa();
  const [raga, setRaga] = useState<Raga>(CHOICES[0]);
  const [dir, setDir] = useState<'aro' | 'ava'>('aro');
  const [drone, setDrone] = useState(false);
  const [step, setStep] = useState(0);
  const [hold, setHold] = useState(0);
  const tanpura = useRef(new Tanpura());
  const seq = useMemo(() => {
    const s = semitones(dir === 'aro' ? raga.arohana : raga.avarohana);
    return s.map((v, i, a) => (i === a.length - 1 && dir === 'aro' ? 12 : v));
  }, [raga, dir]);
  const target = seq[Math.min(step, seq.length - 1)];
  const done = step >= seq.length;
  const stateRef = useRef({ step, target, hold }); stateRef.current = { step, target, hold };

  const { frame, active, error, start, stop } = usePitch((f) => {
    const { step: st, target: tg, hold: h } = stateRef.current;
    if (st >= seq.length) return;
    const r = relativeToSa(f.midi, sa[1]);
    const semisMod = ((r.semis % 12) + 12) % 12;
    const want = tg === 12 ? 0 : tg;
    let diff = (semisMod - want) * 100; if (diff > 600) diff -= 1200; if (diff < -600) diff += 1200;
    if (Math.abs(diff) <= TOL) { if (h + 1 >= HOLD) { setStep(st + 1); setHold(0); } else setHold(h + 1); } else setHold(0);
  });
  useEffect(() => { setStep(0); setHold(0); }, [raga, dir, sa]);
  useEffect(() => { const t = tanpura.current; if (drone) t.start(sa[1]); else t.stop(); return () => t.stop(); }, [drone, sa]);
  const rel = frame ? relativeToSa(frame.midi, sa[1]) : null;
  const targetHz = sa[1] * Math.pow(2, target / 12);

  return (
    <Screen>
      <H1>Swara practice</H1>
      <Body>Choose a raga, start the tanpura, and sing the scale. Each swara lights up when you hold it in tune for about half a second.</Body>
      <H2>Your Sa</H2>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {SA_OPTIONS.map((o, i) => <Chip key={o[0]} label={o[0]} active={sa[0] === o[0]} onPress={() => setSaIdx(i)} />)}
      </View>
      <H2>Raga</H2>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {CHOICES.map((r) => <Chip key={r.id} label={r.name} active={raga.id === r.id} onPress={() => setRaga(r)} />)}
      </View>
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <Chip label="Arohanam" active={dir === 'aro'} onPress={() => setDir('aro')} />
        <Chip label="Avarohanam" active={dir === 'ava'} onPress={() => setDir('ava')} />
      </View>
      <SwaraStrip notes={raga.notes} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 }}>
        {seq.map((v, i) => (
          <View key={i} style={{ minWidth: 48, alignItems: 'center', margin: 3, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12, backgroundColor: i < step ? colors.teal : i === step ? colors.gold : colors.surface2 }}>
            <Text style={{ color: i <= step ? colors.bg : colors.muted, fontWeight: '700' }}>{v === 12 ? 'S↑' : SWARA_NAME[v]}</Text>
          </View>
        ))}
      </View>
      {done ? <Card style={{ borderColor: colors.teal }}><Text style={{ color: colors.text, fontFamily: font.display, fontSize: 22 }}>Beautiful: scale complete.</Text></Card> : <Bar value={hold / HOLD} color={colors.teal} />}
      <Card style={{ marginTop: 12 }}><PitchMeter pc={rel ? rel.pc : null} cents={rel ? rel.cents : 0} active={active} /></Card>
      <View style={{ gap: 10 }}>
        {audioAvailable && <Button variant="ghost" title={drone ? 'Stop tanpura' : 'Start tanpura'} onPress={() => setDrone((d) => !d)} />}
        {audioAvailable && !done && <Button variant="ghost" title="Play the target swara" onPress={() => playTone(targetHz)} />}
        {micSupported ? <Button title={active ? 'Stop' : 'Start practising'} onPress={active ? stop : start} /> : <Body>Pitch feedback needs a web browser with microphone access.</Body>}
        <Button variant="ghost" title="Restart" onPress={() => { setStep(0); setHold(0); }} />
      </View>
      {error && <Body style={{ color: colors.danger }}>{error}</Body>}
      <Body style={{ marginTop: 12 }}>Tip: wear headphones so the tanpura does not feed back into the mic.</Body>
    </Screen>
  );
}
