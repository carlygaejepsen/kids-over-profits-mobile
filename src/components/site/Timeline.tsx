import { StyleSheet, Text, View } from 'react-native';

import { cleanProse } from '@/lib/citations';
import { colors } from '@/theme/colors';
import { radius, spacing, type } from '@/theme/typography';
import { dense, size } from './metrics';
import { InlineSources, type Cite } from './Source';

export type TimelineItem = {
  /** A date or a year. */
  when?: string | number;
  /** A short kind ("Escape", "Investigation") shown as a pill. */
  kind?: string;
  text: string;
  sources?: Cite[];
};

/** Incidents, and a company's year by year: a mint line down the left, a dot on it for each entry. */
export function Timeline({ items }: { items: TimelineItem[] }) {
  if (!items.length) return null;
  return (
    <View accessibilityRole="list">
      {items.map((it, i) => {
        const when = it.when === undefined ? '' : String(it.when);
        return (
          <View key={`${when}-${i}`} style={styles.entry} accessibilityRole="none">
            <View style={styles.line} />
            <View style={styles.dot} />
            {when || it.kind ? (
              <View style={styles.head}>
                {when ? <Text {...dense} style={styles.when}>{when}</Text> : null}
                {it.kind ? (
                  <View style={styles.kind}>
                    <Text {...dense} style={styles.kindText}>{it.kind}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
            <Text style={styles.text}>
              {cleanProse(it.text)}
              <InlineSources items={it.sources} />
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  entry: { paddingLeft: size.timelineIndent, paddingBottom: spacing.md, gap: spacing.xxs },
  line: {
    position: 'absolute',
    left: 4.5,
    top: 0,
    bottom: 0,
    width: size.timelineLine,
    backgroundColor: colors.mintGreen,
  },
  dot: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: size.dot,
    height: size.dot,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: size.dotRing,
    borderColor: colors.orangeInk,
  },
  head: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  when: { ...type.smallBold, color: colors.orangeInk },
  kind: {
    borderWidth: 1,
    borderColor: colors.orange,
    borderRadius: radius.pill,
    paddingVertical: 1,
    paddingHorizontal: spacing.sm,
  },
  kindText: { ...type.pill, textTransform: 'none', letterSpacing: 0, color: colors.midnight },
  text: { ...type.body },
});
