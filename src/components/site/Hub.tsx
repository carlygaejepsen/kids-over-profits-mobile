import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing, type } from '@/theme/typography';
import { dense } from './metrics';

/** A count in a pill ("214 PROGRAMS"): sand ground, midnight text. */
export function CountPill({ label }: { label: string }) {
  return (
    <View style={styles.count} accessible accessibilityLabel={label}>
      <Text {...dense} style={styles.countText}>{label}</Text>
    </View>
  );
}

/** A place or company page's top: eyebrow, title, standfirst, count pills, then the teal rule. */
export function HubHeader({
  eyebrow,
  title,
  standfirst,
  counts,
}: {
  eyebrow?: string;
  title: string;
  standfirst?: string;
  counts?: string[];
}) {
  const pills = (counts ?? []).filter(Boolean);
  return (
    <View style={styles.header}>
      {eyebrow ? <Text {...dense} style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {standfirst ? <Text style={styles.standfirst}>{standfirst}</Text> : null}
      {pills.length ? (
        <View style={styles.pills}>
          {pills.map((p) => (
            <CountPill key={p} label={p} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** A block on a hub page: sand, with a teal (or orange) top edge. */
export function HubBox({ title, tone = 'teal', children }: { title?: string; tone?: 'teal' | 'orange'; children?: ReactNode }) {
  return (
    <View style={[styles.box, { borderTopColor: tone === 'orange' ? colors.orange : colors.teal }]}>
      {title ? <Text accessibilityRole="header" style={styles.boxTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: colors.teal,
    marginBottom: spacing.lg,
  },
  eyebrow: { ...type.eyebrow },
  title: { ...type.title },
  standfirst: { ...type.lead, color: colors.navy },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  count: { backgroundColor: colors.sand, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 10 },
  countText: { ...type.pill, color: colors.midnight },
  box: {
    backgroundColor: colors.sand,
    borderTopWidth: 4,
    borderRadius: radius.box,
    padding: 16,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  boxTitle: { ...type.subheading },
});
