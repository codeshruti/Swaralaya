import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font } from '../theme';
import { NOTE_LABEL_FULL } from '../data/ragas';

/** Big current-note readout with a cents needle (-50..+50). */
export function PitchMeter({ pc, cents, active }: { pc: number | null; cents: number; active: boolean }) {
  const pos = Math.max(0, Math.min(100, 50 + cents));
  const inTune = active && pc !== null && Math.abs(cents) <= 15;
  return (
    <View style={s.wrap} accessibilityLiveRegion="polite">
      <Text style={[s.note, { color: inTune ? colors.teal : colors.text }]}>{pc === null ? '–' : NOTE_LABEL_FULL[pc].split('/')[0]}</Text>
      <View style={s.bar}>
        <View style={s.center} />
        <View style={[s.needle, { left: `${pos}%`, backgroundColor: inTune ? colors.teal : colors.saffron, opacity: pc === null ? 0.2 : 1 }]} />
      </View>
      <Text style={s.cents}>{pc === null ? (active ? 'Listening…' : 'Mic off') : `${cents > 0 ? '+' : ''}${cents} cents`}</Text>
    </View>
  );
}

/** Scrolling trail of recent pitch classes (12 rows). */
export function PitchTrail({ trail }: { trail: (number | null)[] }) {
  return (
    <View style={s.trail}>
      {trail.map((pc, i) => (
        <View key={i} style={s.col}>
          {pc !== null && <View style={[s.dot, { bottom: `${(pc / 11) * 92}%`, opacity: 0.35 + 0.65 * (i / trail.length) }]} />}
        </View>
      ))}
    </View>
  );
}

export const Bar = ({ value, color = colors.gold }: { value: number; color?: string }) => (
  <View style={{ height: 8, backgroundColor: colors.surface2, borderRadius: 4, overflow: 'hidden', marginTop: 6 }}>
    <View style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, height: 8, backgroundColor: color }} />
  </View>
);

const s = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 12 },
  note: { fontFamily: font.display, fontSize: 72, lineHeight: 80, fontWeight: '700' },
  bar: { width: '100%', maxWidth: 360, height: 10, borderRadius: 5, backgroundColor: colors.surface2, marginTop: 6, justifyContent: 'center' },
  center: { position: 'absolute', left: '50%', width: 2, height: 18, top: -4, backgroundColor: colors.muted },
  needle: { position: 'absolute', width: 8, height: 22, top: -6, borderRadius: 4, marginLeft: -4 },
  cents: { color: colors.muted, marginTop: 10, fontSize: 13 },
  trail: { flexDirection: 'row', height: 90, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', paddingVertical: 4 },
  col: { flex: 1, position: 'relative' },
  dot: { position: 'absolute', left: 0, right: 0, height: 5, borderRadius: 3, backgroundColor: colors.saffron },
});
