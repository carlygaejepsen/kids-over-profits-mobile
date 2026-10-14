import { Pressable, StyleSheet, Text } from 'react-native';

import { Icon } from '@/components/Icon';
import { Button, HubBox } from '@/components/site';
import { DONATE_HEADING, DONATE_TEXT, openDonate } from '@/lib/donate';
import { colors } from '@/theme/colors';
import { denseMaxFontScale, spacing, touchTarget, type } from '@/theme/typography';

/** "Donate" with a heart, white on the midnight header. */
export function HeaderDonateButton() {
  return (
    <Pressable
      onPress={() => void openDonate()}
      accessibilityRole="link"
      accessibilityLabel="Donate to Kids Over Profits"
      accessibilityHint="Opens the donation page in the browser"
      hitSlop={spacing.xs}
      style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}>
      <Icon name="heart" size={18} color={colors.white} />
      <Text maxFontSizeMultiplier={denseMaxFontScale} style={styles.headerLabel}>Donate</Text>
    </Pressable>
  );
}

/** The website footer's donate block: heading, the 501(c)(3) line, a Donate button. */
export function DonateBox() {
  return (
    <HubBox title={DONATE_HEADING} tone="orange">
      <Text style={type.body}>{DONATE_TEXT}</Text>
      <Button label="Donate" icon="heart" onPress={() => void openDonate()} accessibilityLabel="Donate to Kids Over Profits" style={styles.button} />
    </HubBox>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    minHeight: touchTarget,
    paddingHorizontal: spacing.md - 4,
    marginRight: spacing.xs,
    borderRadius: 6,
  },
  headerPressed: { backgroundColor: colors.navy },
  headerLabel: { ...type.smallBold, color: colors.white },
  button: { alignSelf: 'flex-start' },
});
