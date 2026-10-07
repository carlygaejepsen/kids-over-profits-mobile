import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { cleanProse } from '@/lib/citations';
import { colors } from '@/theme/colors';
import { radius, spacing, type } from '@/theme/typography';
import { MoreButton, Timeline, type TimelineItem } from '../site';

/** A "Administration" / "Notable staff" sub-head inside a section: small navy capitals. */
export function SubHead({ children, first }: { children: string; first?: boolean }) {
  return (
    <Text accessibilityRole="header" style={[styles.subhead, !first && styles.subheadGap]}>
      {children}
    </Text>
  );
}

/** cleanProse, minus the empty brackets and dangling "(:" it leaves where a citation and its address were removed. */
const tidy = (t: string) =>
  cleanProse(t)
    .replace(/\s*\(\s*[:;,.]*\s*\)/g, '')
    .replace(/\s*\(\s*[:;,.]*\s*$/, '')
    .trim();

/** A bulleted list of cleaned sentences (practices, notes, forum leads). */
export function Bullets({ items }: { items: string[] }) {
  const lines = items.map(tidy).filter(Boolean);
  if (!lines.length) return null;
  return (
    <View style={styles.bullets}>
      {lines.map((t, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bullet}>{'•'}</Text>
          <Text style={styles.bulletText}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

/** A grey-ruled paragraph of small muted words under a heading ("The state licenses ..."). */
export function Lead({ children }: { children: ReactNode }) {
  return <Text style={styles.lead}>{children}</Text>;
}

/** The incident timeline cut to `limit` entries with "N more +", so the mint line stays unbroken. */
export function LimitedTimeline({ items, limit = 5 }: { items: TimelineItem[]; limit?: number }) {
  const [all, setAll] = useState(false);
  const hidden = Math.max(0, items.length - limit);
  return (
    <View>
      <Timeline items={all ? items : items.slice(0, limit)} />
      {hidden > 0 ? <MoreButton count={hidden} expanded={all} onPress={() => setAll((a) => !a)} /> : null}
    </View>
  );
}

/** Label and value pairs in a quiet sand panel (the licence summary), a dl without a heading. */
export function FactList({ rows }: { rows: { label: string; value: string }[] }) {
  const list = rows.filter((r) => r.value);
  if (!list.length) return null;
  return (
    <View style={styles.facts}>
      {list.map((r) => (
        <View key={r.label} style={styles.fact}>
          <Text style={styles.dt}>{r.label}</Text>
          <Text style={styles.dd}>{r.value}</Text>
        </View>
      ))}
    </View>
  );
}

/** White card with the site's pale-blue border, used for reports and video rows. */
export const card = {
  backgroundColor: colors.white,
  borderWidth: 1,
  borderColor: colors.cardBorder,
  borderRadius: radius.tile,
} as const;

const styles = StyleSheet.create({
  subhead: { ...type.label },
  subheadGap: { marginTop: spacing.sm },
  bullets: { gap: spacing.xs + 2 },
  bulletRow: { flexDirection: 'row', gap: spacing.sm },
  bullet: { ...type.body, width: 12 },
  bulletText: { ...type.body, flex: 1 },
  lead: { ...type.small, color: colors.textMuted },
  facts: { backgroundColor: colors.sand, borderRadius: radius.box, padding: 14, gap: 10 },
  fact: { gap: spacing.xxs },
  dt: { ...type.label },
  dd: { ...type.body },
});
