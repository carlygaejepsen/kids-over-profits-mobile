import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing, touchTarget, type } from '@/theme/typography';
import { Icon, type IconName } from '../Icon';
import { dense, hitSlopFor } from './metrics';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: IconName;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** The site's buttons: white on teal fill, or tealInk text and border on white. */
export function Button({ label, onPress, variant = 'primary', icon, disabled, accessibilityLabel, style }: ButtonProps) {
  const primary = variant === 'primary';
  const ink = primary ? colors.white : colors.tealInk;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.base,
        primary ? styles.primary : styles.secondary,
        pressed && (primary ? styles.primaryPressed : styles.secondaryPressed),
        disabled && styles.disabled,
        style,
      ]}>
      {icon ? <Icon name={icon} size={18} color={ink} /> : null}
      <Text {...dense} style={[styles.label, { color: ink }]}>{label}</Text>
    </Pressable>
  );
}

/** "3 more +" / "Show fewer −": a pill under a list that hides its tail. */
export function MoreButton({
  count,
  expanded,
  onPress,
  style,
}: {
  count: number;
  expanded: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const text = expanded ? 'Show fewer −' : `${count} more +`;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={expanded ? 'Show fewer' : `Show ${count} more`}
      accessibilityState={{ expanded }}
      hitSlop={hitSlopFor(type.smallBold.lineHeight! + 2 * spacing.xs + 2)}
      style={({ pressed }) => [styles.more, pressed && styles.morePressed, style]}>
      <Text {...dense} style={styles.moreText}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.tile,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  primary: { backgroundColor: colors.tealFill, borderWidth: 2, borderColor: colors.tealFill },
  primaryPressed: { backgroundColor: colors.buttonPressed, borderColor: colors.buttonPressed },
  secondary: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.tealInk },
  secondaryPressed: { backgroundColor: colors.sand },
  disabled: { opacity: 0.5 },
  label: { ...type.bodyBold },
  more: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.tealInk,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
  morePressed: { backgroundColor: colors.sand },
  moreText: { ...type.smallBold, color: colors.tealInk },
});
