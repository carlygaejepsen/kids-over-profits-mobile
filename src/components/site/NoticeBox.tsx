import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing, type } from '@/theme/typography';

/**
 * A callout on a pale-yellow ground. 'testimony': a survivor's own account, in a midnight frame with a wide left edge.
 * 'reporting': where to report, with an orange edge.
 */
export function NoticeBox({
  variant,
  title,
  children,
}: {
  variant: 'testimony' | 'reporting';
  title?: string;
  children?: ReactNode;
}) {
  return (
    <View style={[styles.box, variant === 'testimony' ? styles.testimony : styles.reporting]}>
      {title ? <Text accessibilityRole="header" style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.softPastelYellow, padding: 16, gap: spacing.sm, marginBottom: spacing.md },
  testimony: {
    borderWidth: 2,
    borderColor: colors.midnight,
    borderLeftWidth: 8,
    borderRadius: radius.box,
  },
  reporting: {
    borderLeftWidth: 4,
    borderLeftColor: colors.orange,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: radius.tile,
    borderBottomRightRadius: radius.tile,
  },
  title: { ...type.subheading },
});
