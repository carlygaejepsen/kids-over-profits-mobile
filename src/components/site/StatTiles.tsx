import { Fragment } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, tones, type Tone } from '@/theme/colors';
import { radius, spacing, type } from '@/theme/typography';
import { Icon, type IconName } from '../Icon';
import { chipText, dense, hitSlopFor, size } from './metrics';

export type StatTile = {
  key: string;
  icon: IconName;
  count: number;
  /** "death on record" / "deaths on record": the words after the number. */
  singular: string;
  plural: string;
  tone: Tone;
};

/** The record in numbers: two columns, only the kinds that have something. A tile jumps to its section. */
export function StatTiles({ tiles, onJump }: { tiles: StatTile[]; onJump: (key: string) => void }) {
  const shown = tiles.filter((t) => t.count > 0);
  if (!shown.length) return null;
  const rows: StatTile[][] = [];
  for (let i = 0; i < shown.length; i += 2) rows.push(shown.slice(i, i + 2));
  return (
    <View style={styles.grid} accessibilityLabel="This record in numbers">
      {rows.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((t) => {
            const tone = tones[t.tone];
            const words = t.count === 1 ? t.singular : t.plural;
            return (
              <Pressable
                key={t.key}
                onPress={() => onJump(t.key)}
                accessibilityRole="button"
                accessibilityLabel={`${t.count} ${words}`}
                accessibilityHint="Jumps to that section"
                style={({ pressed }) => [styles.tile, { borderTopColor: tone.edge }, pressed && styles.pressed]}>
                <View style={styles.figure}>
                  <Icon name={t.icon} size={size.statIcon} color={tone.ink} />
                  <Text {...dense} style={[styles.number, { color: tone.ink }]}>{t.count}</Text>
                </View>
                <Text {...dense} style={styles.label}>{words}</Text>
              </Pressable>
            );
          })}
          {row.length === 1 ? <Fragment><View style={styles.spacer} /></Fragment> : null}
        </View>
      ))}
    </View>
  );
}

export type JumpItem = { key: string; label: string };

/** One pill per section, in a row that scrolls sideways. */
export function JumpPills({ items, onJump }: { items: JumpItem[]; onJump: (key: string) => void }) {
  if (!items.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel="Jump to a section"
      contentContainerStyle={styles.pills}>
      {items.map((it) => (
        <Pressable
          key={it.key}
          onPress={() => onJump(it.key)}
          accessibilityRole="button"
          accessibilityLabel={`Jump to ${it.label}`}
          hitSlop={hitSlopFor(size.pillHeight)}
          style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}>
          <Text {...dense} style={styles.pillText}>{it.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 10, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: 10 },
  spacer: { flex: 1 },
  tile: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderTopWidth: 4,
    borderRadius: radius.tile,
    paddingVertical: 11,
    paddingHorizontal: 13,
    gap: spacing.xxs,
  },
  pressed: { backgroundColor: colors.sand },
  figure: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  number: { ...type.statNumber },
  label: { ...type.meta },
  pills: { gap: spacing.sm, paddingVertical: spacing.sm, marginBottom: spacing.sm },
  pill: {
    minHeight: size.pillHeight,
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.mintGreen,
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  pillPressed: { backgroundColor: colors.sand, borderColor: colors.teal },
  pillText: { ...chipText, color: colors.navy },
});
