import React from 'react';
import { Linking } from 'react-native';
import { Screen, H1, Body, Card, Button } from '../components/ui';

/** Native placeholder: Mix up needs browser audio APIs, so on iOS/Android we point people to the web app. */
export default function MixUp() {
  return (
    <Screen>
      <H1>Mix up</H1>
      <Body>Hear a song in someone else's voice with AI. Mix up runs in the Swaralaya web app for now, where you can record, upload and download audio.</Body>
      <Card style={{ marginTop: 16 }}>
        <Body>Open Swaralaya in your phone's browser to use Mix up.</Body>
        <Button title="Open the web app" onPress={() => Linking.openURL('https://codeshruti.github.io/Swaralaya/')} />
      </Card>
    </Screen>
  );
}
