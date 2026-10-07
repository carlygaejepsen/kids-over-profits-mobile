import { type ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';

import { spacing, type } from '@/theme/typography';

/** An empty, short-query or count line: plain muted text, never a box. */
export function Note({ children }: { children: ReactNode }) {
  return <Text style={styles.note}>{children}</Text>;
}

const styles = StyleSheet.create({
  note: { ...type.meta, paddingVertical: spacing.sm },
});
