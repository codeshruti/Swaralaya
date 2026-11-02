import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle, ScrollView } from 'react-native';
import { colors, font, moodColors, radius } from '../theme';
import { NOTE_LABEL_FULL } from '../data/ragas';

export const Screen = ({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) =>
  scroll ? (
    <ScrollView style={s.screen} contentContainerStyle={s.screenContent}>
      <View style={s.max}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[s.screen, s.screenContent]}><View style={s.max}>{children}</View></View>
  );

export const H1 = ({ children }: { children: React.ReactNode }) => <Text style={s.h1}>{children}</Text>;
export const H2 = ({ children }: { children: React.ReactNode }) => <Text style={s.h2}>{children}</Text>;
export const Body = ({ children, style }: { children: React.ReactNode; style?: any }) => <Text style={[s.body, style]}>{children}</Text>;

export const Card = ({ children, onPress, style }: { children: React.ReactNode; onPress?: () => void; style?: ViewStyle }) => (
  <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress}
    style={({ pressed }) => [s.card, style, pressed && onPress ? { opacity: 0.85, transform: [{ scale: 0.99 }] } : null]}>
    {children}
  </Pressable>
);

export const Chip = ({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) => {
  const c = moodColors[label] || colors.gold;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!active }}
      style={[s.chip, { borderColor: c }, active && { backgroundColor: c }]}>
      <Text style={[s.chipText, { color: active ? colors.bg : c }]}>{label}</Text>
    </Pressable>
  );
};

export const Button = ({ title, onPress, variant = 'primary', disabled }: { title: string; onPress: () => void; variant?: 'primary' | 'ghost'; disabled?: boolean }) => (
  <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button"
    style={({ pressed }) => [s.btn, variant === 'ghost' && s.btnGhost, disabled && { opacity: 0.4 }, pressed && { opacity: 0.8 }]}>
    <Text style={[s.btnText, variant === 'ghost' && { color: colors.gold }]}>{title}</Text>
  </Pressable>
);

/** 12-key swara strip showing which notes a raga uses. */
export const SwaraStrip = ({ notes, highlight = colors.gold, dim }: { notes: number[]; highlight?: string; dim?: number[] }) => (
  <View style={s.strip}>
    {NOTE_LABEL_FULL.map((l, i) => {
      const on = notes.includes(i);
      return (
        <View key={i} style={[s.key, on && { backgroundColor: highlight, borderColor: highlight }, !on && dim?.includes(i) && { borderColor: colors.rose }]}>
          <Text style={[s.keyText, on && { color: colors.bg }]} numberOfLines={1}>{l.split('/')[0]}</Text>
        </View>
      );
    })}
  </View>
);

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenContent: { padding: 16, paddingBottom: 48, alignItems: 'center' },
  max: { width: '100%', maxWidth: 760 },
  h1: { fontFamily: font.display, fontSize: 32, color: colors.text, marginBottom: 6, fontWeight: '700' },
  h2: { fontFamily: font.display, fontSize: 20, color: colors.gold, marginTop: 24, marginBottom: 10, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  chipText: { fontSize: 13, fontWeight: '600' },
  btn: { backgroundColor: colors.gold, paddingVertical: 14, paddingHorizontal: 22, borderRadius: 999, alignItems: 'center' },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.gold },
  btnText: { color: colors.bg, fontWeight: '700', fontSize: 16 },
  strip: { flexDirection: 'row', gap: 4, marginVertical: 8 },
  key: { flex: 1, minWidth: 0, height: 44, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface2, paddingHorizontal: 1 },
  keyText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
});
