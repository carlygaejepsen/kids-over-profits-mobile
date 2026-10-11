import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { dense } from '@/components/site/metrics';
import { colors } from '@/theme/colors';
import { radius, spacing, touchTarget, type } from '@/theme/typography';

export type Shortcut = { key: string; label: string; meta: string; icon: IconName; onPress: () => void };

/** The home screen's way in to each part of the app: two to a row, a sand tile with a teal icon. */
export function Shortcuts({ items }: { items: Shortcut[] }) {
  return (
    <View style={styles.grid}>
      {items.map((s) => (
        <Pressable
          key={s.key}
          onPress={s.onPress}
          accessibilityRole="link"
          accessibilityLabel={`${s.label}. ${s.meta}`}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
          <Icon name={s.icon} size={24} color={colors.tealInk} />
          <Text {...dense} style={styles.label}>{s.label}</Text>
          <Text style={styles.meta}>{s.meta}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: touchTarget * 2,
    gap: spacing.xs,
    padding: spacing.md - 4,
    backgroundColor: colors.sand,
    borderRadius: radius.box,
    borderTopWidth: 3,
    borderTopColor: colors.teal,
  },
  pressed: { backgroundColor: colors.softPastelYellow },
  label: { ...type.smallBold, fontSize: 16, lineHeight: 22 },
  meta: { ...type.meta },
});
