import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { dense, hitSlopFor, size, chipText } from '@/components/site/metrics';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/typography';

/**
 * A filter pill (news-feed.css .filter-btn, as the feed's chips draw it): white, a 1 px mint border and navy 13/600 text.
 * Selected is midnight text on mint green with a teal-ink border. The pill is 32 tall inside a 44-point target.
 */
export function Pill({
  label,
  onPress,
  selected,
  icon,
  accessibilityLabel,
  style,
}: {
  label: string;
  onPress: () => void;
  selected?: boolean;
  icon?: IconName;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const ink = selected ? colors.midnight : colors.navy;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected }}
      hitSlop={hitSlopFor(size.pillHeight)}
      style={({ pressed }) => [styles.pill, selected && styles.selected, pressed && styles.pressed, style]}>
      <Text {...dense} style={[chipText, { color: ink }]}>{label}</Text>
      {icon ? <Icon name={icon} size={16} color={ink} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: size.pillHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.mintGreen,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md - 4,
  },
  selected: { backgroundColor: colors.mintGreen, borderColor: colors.tealInk },
  pressed: { backgroundColor: colors.sand },
});
