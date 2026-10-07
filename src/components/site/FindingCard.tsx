import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing, type } from '@/theme/typography';
import { dense, hitSlopFor } from './metrics';
import { useOpenLink } from './useOpenLink';

export type Severity = 'grave' | 'severe' | 'other';

const EDGE = { grave: colors.coralPinkInk, severe: colors.orange, other: colors.teal } as const;
const FILL = { grave: colors.coralPinkFill, severe: colors.orangeFill, other: colors.tealFill } as const;

/** A serious violation confirmed by inspectors: the kind of harm, the date, the report's own words, a link to the report. */
export function FindingCard({
  severity,
  tag,
  date,
  quote,
  url,
  linkLabel = 'Read the report',
}: {
  severity: Severity;
  tag: string;
  date?: string;
  quote: string;
  url?: string;
  linkLabel?: string;
}) {
  const open = useOpenLink();
  return (
    <View style={[styles.card, { borderLeftColor: EDGE[severity] }]}>
      <View style={styles.head}>
        <View style={[styles.tag, { backgroundColor: FILL[severity] }]}>
          <Text {...dense} style={styles.tagText}>{tag}</Text>
        </View>
        {date ? <Text {...dense} style={styles.date}>{date}</Text> : null}
      </View>
      <Text style={styles.quote}>{quote}</Text>
      {url ? (
        <Pressable
          onPress={() => open(url)}
          accessibilityRole="link"
          accessibilityLabel={`${linkLabel}: ${tag}${date ? `, ${date}` : ''}`}
          hitSlop={hitSlopFor(type.smallBold.lineHeight!)}
          style={styles.link}>
          <Text style={styles.linkText}>{linkLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderLeftWidth: 5,
    borderRadius: radius.tile,
    paddingTop: 13,
    paddingRight: 16,
    paddingBottom: 12,
    paddingLeft: 16,
    gap: spacing.sm,
  },
  head: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  tag: { borderRadius: radius.pill, paddingVertical: 2, paddingHorizontal: 10 },
  tagText: { ...type.pill, fontWeight: '700', color: colors.white },
  date: { ...type.smallBold, color: colors.textMuted },
  quote: { ...type.body },
  link: { alignSelf: 'flex-start' },
  linkText: { ...type.smallBold, color: colors.navy, textDecorationLine: 'underline' },
});
