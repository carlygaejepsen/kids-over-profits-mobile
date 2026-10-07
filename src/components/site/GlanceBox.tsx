import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing, type } from '@/theme/typography';
import { InlineSources, type Cite } from './Source';

export type GlanceRow = { label: string; value: string | ReactNode; sources?: Cite[] };

/** "At a glance": label and value pairs on sand under a midnight edge, as the site's facts rail. */
export function GlanceBox({ rows, title = 'At a glance' }: { rows: GlanceRow[]; title?: string }) {
  const list = rows.filter((r) => r.value !== undefined && r.value !== null && r.value !== '');
  if (!list.length) return null;
  return (
    <View style={styles.box}>
      <Text accessibilityRole="header" style={styles.heading}>{title}</Text>
      {list.map((r, i) => (
        <View key={`${r.label}-${i}`} style={styles.row} accessible={typeof r.value === 'string'}>
          <Text style={styles.dt}>{r.label}</Text>
          {typeof r.value === 'string' ? (
            <Text style={styles.dd}>
              {r.value}
              <InlineSources items={r.sources} />
            </Text>
          ) : (
            <View>
              {r.value}
              {r.sources?.length ? (
                <Text style={styles.dd}>
                  <InlineSources items={r.sources} />
                </Text>
              ) : null}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.sand,
    borderTopWidth: 4,
    borderTopColor: colors.midnight,
    borderRadius: 0,
    padding: 20,
    gap: 12,
    marginBottom: spacing.lg,
  },
  heading: { ...type.label, fontSize: type.eyebrow.fontSize, lineHeight: type.eyebrow.lineHeight },
  row: { gap: spacing.xxs },
  dt: { ...type.label },
  dd: { ...type.body },
});
