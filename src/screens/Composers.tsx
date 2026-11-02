import React from 'react';
import { Text } from 'react-native';
import { Screen, H1, H2, Body, Card } from '../components/ui';
import { composers, composerById, songsByComposer, songs, songsByRaga } from '../data/composers';
import { ragaByName } from '../data/ragas';
import { similarSongs } from '../lib/matcher';
import { colors, font } from '../theme';

export function Composers({ navigation }: any) {
  return (
    <Screen>
      <H1>Composers</H1>
      <Body>The voices that shaped Carnatic music.</Body>
      <H2>The lineage</H2>
      {composers.map((c) => (
        <Card key={c.id} onPress={() => navigation.navigate('ComposerDetail', { id: c.id })}>
          <Text style={{ fontFamily: font.display, color: colors.text, fontSize: 22 }}>{c.name}</Text>
          <Text style={{ color: colors.saffron, marginBottom: 4 }}>{c.era}</Text>
          <Body>{c.signature} · {songsByComposer(c.id).length} songs</Body>
        </Card>
      ))}
    </Screen>
  );
}

export function ComposerDetail({ route, navigation }: any) {
  const c = composerById(route.params.id)!;
  return (
    <Screen>
      <H1>{c.name}</H1>
      <Text style={{ color: colors.saffron }}>{c.era} · {c.born} · {c.place}</Text>
      <Body style={{ marginTop: 10 }}>{c.bio}</Body>
      <H2>Songs</H2>
      {songsByComposer(c.id).map((s) => (
        <Card key={s.id} onPress={() => navigation.navigate('SongDetail', { id: s.id })}>
          <Text style={{ color: colors.text, fontSize: 18 }}>{s.title}</Text>
          <Body>{s.raga} · {s.tala} · {s.language}</Body>
        </Card>
      ))}
    </Screen>
  );
}

export function SongDetail({ route, navigation }: any) {
  const s = songs.find((x) => x.id === route.params.id)!;
  const raga = ragaByName(s.raga);
  const similar = raga ? similarSongs(raga, s.id) : [];
  void songsByRaga;
  return (
    <Screen>
      <H1>{s.title}</H1>
      <Body>{composerById(s.composer)?.name} · {s.tala} · {s.language}</Body>
      <H2>Opening line</H2>
      <Card><Text style={{ color: colors.text, fontFamily: font.display, fontSize: 20, lineHeight: 30 }}>{s.opening}</Text></Card>
      <Body>Full lyrics are not bundled yet. Only the opening line is shown.</Body>
      <H2>Meaning</H2><Body>{s.meaning}</Body>
      {raga && (<><H2>Raga</H2><Card onPress={() => navigation.navigate('RagaDetail', { id: raga.id })}><Text style={{ color: colors.text, fontSize: 18 }}>{raga.name}</Text><Body>{raga.moods.join(' · ')}</Body></Card></>)}
      {similar.length > 0 && (<><H2>Similar songs</H2>{similar.map((x) => <Card key={x.id} onPress={() => navigation.push('SongDetail', { id: x.id })}><Text style={{ color: colors.text }}>{x.title}</Text><Body>{x.raga}</Body></Card>)}</>)}
    </Screen>
  );
}
