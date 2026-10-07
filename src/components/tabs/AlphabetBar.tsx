import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { dense } from '@/components/site/metrics';
import { colors } from '@/theme/colors';
import { gutter, radius, touchTarget, type } from '@/theme/typography';

/** The site's alphabet buttons (tti-program-index.css #alphabet-filter): navy, white bold, radius 4, 32 px in a 44 hit area. */
const BUTTON = 32;

export function AlphabetBar({ letters, onPick }: { letters: string[]; onPick: (letter: string) => void }) {
  if (!letters.length) return null;
  return (
    <View style={styles.bar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        accessibilityLabel="Jump to a letter"
        contentContainerStyle={styles.row}>
        {letters.map((letter) => (
          <Pressable
            key={letter}
            onPress={() => onPick(letter)}
            accessibilityRole="button"
            accessibilityLabel={letter === '#' ? 'Jump to names that start with a number' : `Jump to ${letter}`}
            style={styles.hit}>
            {({ pressed }) => (
              <View style={[styles.button, pressed && styles.pressed]}>
                <Text {...dense} style={styles.letter}>{letter}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  row: { paddingHorizontal: gutter - 6 },
  hit: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
  button: {
    width: BUTTON,
    height: BUTTON,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.directoryNavy,
    borderRadius: radius.thumb,
  },
  pressed: { backgroundColor: colors.midnight },
  letter: { ...type.meta, fontWeight: '700', color: colors.white },
});
