import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { citeWords, usableCitations } from '@/lib/citations';
import { colors } from '@/theme/colors';
import { type } from '@/theme/typography';
import { dense, hitSlopFor } from './metrics';
import { useOpenLink } from './useOpenLink';

export type Cite = { url?: string; cite?: string; source?: string; label?: string };

function words(list: Cite[], i: number) {
  const word = list.length > 1 ? `source ${i + 1}` : 'source';
  const preview = citeWords(list[i]);
  return { word, label: preview ? `${word}: ${preview}` : word };
}

/**
 * Citations as the website shows them, set inline after the text they support: "(source)", or
 * "(source 1, source 2)" when there are several. A link opens the page; with no address the word is plain text.
 * The words behind the number are the accessibility label.
 */
export function InlineSources({ items }: { items?: Cite[] }) {
  const open = useOpenLink();
  const list = usableCitations(items);
  if (!list.length) return null;
  return (
    <Text style={styles.cite}>
      {' ('}
      {list.map((c, i) => {
        const { word, label } = words(list, i);
        return (
          <Text key={i}>
            {i > 0 ? ', ' : ''}
            {c.url ? (
              <Text onPress={() => open(c.url)} accessibilityRole="link" accessibilityLabel={label} style={styles.link}>
                {word}
              </Text>
            ) : (
              <Text accessibilityLabel={label}>{word}</Text>
            )}
          </Text>
        );
      })}
      {')'}
    </Text>
  );
}

/** The same citations on a line of their own (under a person, an edge row, a finding): "source" in navy, underlined. */
export function SourceLink({ items, style }: { items?: Cite[]; style?: StyleProp<ViewStyle> }) {
  const open = useOpenLink();
  const list = usableCitations(items);
  if (!list.length) return null;
  return (
    <View style={[styles.line, style]}>
      {list.map((c, i) => {
        const { word, label } = words(list, i);
        return (
          <View key={i} style={styles.item}>
            {i > 0 ? <Text style={styles.cite}>{', '}</Text> : null}
            {c.url ? (
              <Pressable
                onPress={() => open(c.url)}
                accessibilityRole="link"
                accessibilityLabel={label}
                hitSlop={hitSlopFor(type.meta.lineHeight ?? 18)}>
                <Text {...dense} style={styles.link}>{word}</Text>
              </Pressable>
            ) : (
              <Text {...dense} accessibilityLabel={label} style={styles.cite}>{word}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cite: { ...type.meta },
  link: { ...type.meta, color: colors.navy, textDecorationLine: 'underline' },
  line: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  item: { flexDirection: 'row', alignItems: 'center' },
});
