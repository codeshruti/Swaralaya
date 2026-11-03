import React from 'react';
import { View, Text } from 'react-native';
import { Screen, H1, H2, Body, Card, Chip, SwaraStrip, Button } from '../components/ui';
import { janyas, MOODS } from '../data/ragas';
import { colors, font } from '../theme';

export default function Home({ navigation }: any) {
  const day = Math.floor(Date.now() / 86400000);
  const raga = janyas[day % janyas.length];
  return (
    <Screen>
      <Text style={{ color: colors.saffron, letterSpacing: 4, fontSize: 12, fontWeight: '700' }}>SWARALAYA</Text>
      <H1>Where every note finds its rhythm</H1>
      <Body>Explore ragas, meet the composers, and sing a phrase to discover what you are hearing.</Body>
      <H2>Raga of the day</H2>
      <Card onPress={() => navigation.navigate('RagaDetail', { id: raga.id })} style={{ borderColor: colors.gold }}>
        <Text style={{ fontFamily: font.display, color: colors.text, fontSize: 26 }}>{raga.name}</Text>
        <Body>{raga.kind === 'melakarta' ? `Melakarta #${raga.number}` : 'Janya raga'} · {raga.time}</Body>
        <SwaraStrip notes={raga.notes} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>{raga.moods.map((m) => <Chip key={m} label={m} />)}</View>
      </Card>
      <H2>Browse by mood</H2>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {MOODS.map((m) => <Chip key={m} label={m} onPress={() => navigation.navigate('Ragas', { mood: m })} />)}
      </View>
      <H2>Practise</H2>
      <Card>
        <Body>Drone with a tanpura and sing arohanam and avarohanam with live feedback on every swara.</Body>
        <View style={{ height: 12 }} />
        <Button variant="ghost" title="Open swara practice" onPress={() => navigation.navigate('Practice')} />
      </Card>
      <H2>Sing to discover</H2>
      <Card>
        <Body>Hum or sing a short phrase and Swaralaya will suggest the likely raga, matching songs and similar pieces.</Body>
        <View style={{ height: 12 }} />
        <Button title="Start listening" onPress={() => navigation.navigate('Listen')} />
      </Card>
    </Screen>
  );
}
