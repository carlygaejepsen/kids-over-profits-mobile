import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { gutter, maxContentWidth, spacing } from '@/theme/typography';

/** The padding and width cap every tab's content shares (a FlatList uses it as its contentContainerStyle). */
export const pageColumn = {
  width: '100%',
  maxWidth: maxContentWidth,
  alignSelf: 'center',
  paddingHorizontal: gutter,
  paddingTop: spacing.md,
  paddingBottom: spacing.xl,
} as const;

/** A scrolling tab page: the site's white content panel, centred and capped in width on tablets. */
export function TabPage({ children, background = colors.white }: { children: ReactNode; background?: string }) {
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={pageColumn}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flexGrow: 1 },
});
