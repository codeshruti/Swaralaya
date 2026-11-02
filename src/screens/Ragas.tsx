import React, { useState } from 'react';
import { View, TextInput, Text } from 'react-native';
import { Screen, H1, H2, Body, Card, Chip, SwaraStrip, Button } from '../components/ui';
import { allRagas, melakartas, janyas, childrenOf, parentOf, ragaById, compareRagas, MOODS, CHAKRAS, Raga } from '../data/ragas';
import { songsByRaga, composerById } from '../data/composers';
import { colors, font } from '../theme';

export function Ragas({ navigation, route }: any) {
  const [q, setQ] = useState('');
  const [mood, setMood] = useState<string | null>(route?.params?.mood ?? null);
  const [kind, setKind] = useState<'all' | 'melakarta' | 'janya'>('all');
  React.useEffect(() => { if (route?.params?.mood) setMood(route.params.mood); }, [route?.params?.mood]);
  const list = allRagas.filter((r) =>
    (kind === 'all' || r.kind === kind) && (!mood || r.moods.includes(mood)) &&
    r.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <Screen>
      <H1>Ragas</H1>
      <TextInput value={q} onChangeText={setQ} placeholder="Search ragas" placeholderTextColor={colors.muted}
        style={{ backgroundColor: colors.surface, color: colors.text, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border, marginVertical: 10 }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {(['all', 'melakarta', 'janya'] as const).map((k) => <Chip key={k} label={k === 'all' ? 'All' : k === 'melakarta' ? 'Parent (melakarta)' : 'Janya'} active={kind === k} onPress={() => setKind(k)} />)}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {MOODS.map((m) => <Chip key={m} label={m} active={mood === m} onPress={() => setMood(mood === m ? null : m)} />)}
      </View>
      <View style={{ marginVertical: 8 }}><Button variant="ghost" title="Compare two ragas" onPress={() => navigation.navigate('Compare', {})} /></View>
      <Body style={{ marginBottom: 8 }}>{list.length} ragas</Body>
      {list.map((r) => (
        <Card key={r.id} onPress={() => navigation.navigate('RagaDetail', { id: r.id })}>
          <Text style={{ fontFamily: font.display, fontSize: 20, color: colors.text }}>{r.name}</Text>
          <Body>{r.kind === 'melakarta' ? `Melakarta #${r.number} · ${CHAKRAS[Math.floor((r.number! - 1) / 6)]} chakra` : `Janya of ${parentOf(r)?.name}`}</Body>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>{r.moods.map((m) => <Chip key={m} label={m} />)}</View>
        </Card>
      ))}
    </Screen>
  );
}

export function RagaDetail({ route, navigation }: any) {
  const r = ragaById(route.params.id)!;
  const parent = parentOf(r);
  const kids = r.kind === 'melakarta' ? childrenOf(r.number!) : [];
  const songs = songsByRaga(r.name);
  return (
    <Screen>
      <H1>{r.name}</H1>
      <Body>{r.kind === 'melakarta' ? `Melakarta #${r.number} · ${CHAKRAS[Math.floor((r.number! - 1) / 6)]} chakra` : 'Janya raga'} · Best at {r.time.toLowerCase()}</Body>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>{r.moods.map((m) => <Chip key={m} label={m} />)}</View>
      <Body style={{ marginTop: 8 }}>{r.description}</Body>
      <H2>Scale</H2>
      <SwaraStrip notes={r.notes} />
      <Card><Body>Arohanam: <Text style={{ color: colors.text }}>{r.arohana}</Text></Body><Body>Avarohanam: <Text style={{ color: colors.text }}>{r.avarohana}</Text></Body></Card>
      {parent && (<><H2>Parent raga</H2><Card onPress={() => navigation.push('RagaDetail', { id: parent.id })}><Text style={{ color: colors.text, fontSize: 18 }}>{parent.name} · #{parent.number}</Text></Card></>)}
      {kids.length > 0 && (<><H2>Janya (child) ragas</H2>{kids.map((k) => <Card key={k.id} onPress={() => navigation.push('RagaDetail', { id: k.id })}><Text style={{ color: colors.text, fontSize: 18 }}>{k.name}</Text></Card>)}</>)}
      {songs.length > 0 && (<><H2>Songs in this raga</H2>{songs.map((x) => <Card key={x.id} onPress={() => navigation.navigate('SongDetail', { id: x.id })}><Text style={{ color: colors.text, fontSize: 18 }}>{x.title}</Text><Body>{composerById(x.composer)?.name}</Body></Card>)}</>)}
      <View style={{ height: 8 }} />
      <Button variant="ghost" title="Compare with another raga" onPress={() => navigation.navigate('Compare', { a: r.id })} />
    </Screen>
  );
}

export function Compare({ route }: any) {
  const [a, setA] = useState<Raga | undefined>(route.params?.a ? ragaById(route.params.a) : undefined);
  const [b, setB] = useState<Raga | undefined>();
  const [q, setQ] = useState('');
  const matches = q ? allRagas.filter((r) => r.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];
  const cmp = a && b ? compareRagas(a, b) : null;
  const pick = (r: Raga) => { if (!a) setA(r); else if (!b) setB(r); else { setA(r); setB(undefined); } setQ(''); };
  return (
    <Screen>
      <H1>Compare ragas</H1>
      <Body>Pick two ragas to see which notes they share and where they differ.</Body>
      <TextInput value={q} onChangeText={setQ} placeholder={!a ? 'Choose the first raga' : !b ? 'Choose the second raga' : 'Search to start over'} placeholderTextColor={colors.muted}
        style={{ backgroundColor: colors.surface, color: colors.text, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border, marginVertical: 12 }} />
      {matches.map((r) => <Card key={r.id} onPress={() => pick(r)}><Text style={{ color: colors.text }}>{r.name}</Text></Card>)}
      {a && <Card><Text style={{ color: colors.gold, fontSize: 20 }}>{a.name}</Text><SwaraStrip notes={a.notes} /></Card>}
      {b && <Card><Text style={{ color: colors.teal, fontSize: 20 }}>{b.name}</Text><SwaraStrip notes={b.notes} highlight={colors.teal} /></Card>}
      {cmp && a && b && (
        <Card style={{ borderColor: colors.gold }}>
          <Text style={{ color: colors.text, fontSize: 18, fontFamily: font.display }}>{Math.round(cmp.similarity * 100)}% of notes in common</Text>
          <Body>{cmp.onlyA.length ? `Only ${a.name}: ${cmp.onlyA.length} note(s)` : `${a.name} has no unique notes`}. {cmp.onlyB.length ? `Only ${b.name}: ${cmp.onlyB.length} note(s)` : `${b.name} has no unique notes`}.</Body>
          <Body style={{ marginTop: 8 }}>Mood: {a.moods.join(', ')} vs {b.moods.join(', ')}. Time: {a.time} vs {b.time}.</Body>
          <Body style={{ marginTop: 8 }}>{a.name}: {a.arohana}{'\n'}{b.name}: {b.arohana}</Body>
        </Card>
      )}
    </Screen>
  );
}
void melakartas; void janyas;
