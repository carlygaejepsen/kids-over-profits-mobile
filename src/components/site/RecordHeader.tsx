import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, statusColor } from '@/theme/colors';
import { radius, spacing, type } from '@/theme/typography';
import { dense } from './metrics';

/** The record's status as the site's pill: dark text on a soft fill, never white on an accent. */
export function StatusPill({ status }: { status?: string | null }) {
  const text = (status ?? '').trim();
  if (!text) return null;
  const c = statusColor(text);
  return (
    <View
      testID="status-pill"
      accessible
      accessibilityLabel={`Status: ${text}`}
      style={[styles.pill, { backgroundColor: c.background, borderColor: c.border }]}>
      <Text {...dense} style={[styles.pillText, { color: c.text }]}>{text}</Text>
    </View>
  );
}

export type RecordHeaderProps = {
  eyebrow?: string;
  title: string;
  /** "Formerly X", "Also known as Y": one italic line each. */
  aliases?: string[];
  place?: string;
  status?: string | null;
  children?: ReactNode;
};

/** Eyebrow, title, alias lines, place, status, then the 3 px teal rule with space under it. */
export function RecordHeader({ eyebrow, title, aliases, place, status, children }: RecordHeaderProps) {
  const names = (aliases ?? []).filter(Boolean);
  return (
    <View style={styles.header}>
      {eyebrow ? <Text {...dense} style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {names.map((a, i) => (
        <Text key={`${a}-${i}`} style={styles.alias}>{a}</Text>
      ))}
      {place ? <Text style={styles.place}>{place}</Text> : null}
      {status ? <StatusPill status={status} /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs + 2,
    paddingBottom: spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: colors.teal,
    marginBottom: spacing.lg,
  },
  eyebrow: { ...type.eyebrow },
  title: { ...type.title },
  alias: { ...type.body, fontStyle: 'italic', color: colors.navy },
  place: { ...type.small, color: colors.navy },
  pill: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 11,
  },
  pillText: { ...type.pill },
});
