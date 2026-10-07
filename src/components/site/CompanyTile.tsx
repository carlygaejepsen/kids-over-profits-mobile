import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, shadows } from '@/theme/colors';
import { radius, spacing, type } from '@/theme/typography';
import { dense, size } from './metrics';

/** A company in the directory grid: navy tile, teal frame, white name, a pale rule, place and program count. */
export function CompanyTile({
  name,
  line,
  programs,
  onPress,
  style,
}: {
  name: string;
  /** Place or years. */
  line?: string;
  programs?: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const count = programs === undefined ? '' : `${programs} ${programs === 1 ? 'program' : 'programs'}`;
  const long = name.length > size.longName;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={[name, line, count].filter(Boolean).join('. ')}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed, style]}>
      <Text {...dense} style={long ? styles.nameLong : styles.name}>{name}</Text>
      {line || count ? <View style={styles.rule} /> : null}
      {line ? <Text {...dense} style={styles.line}>{line}</Text> : null}
      {count ? <Text {...dense} style={styles.line}>{count}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.directoryNavy,
    borderWidth: 2,
    borderColor: colors.teal,
    borderRadius: radius.box,
    padding: 14,
    minHeight: size.tileMinHeight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    ...shadows.tile,
  },
  pressed: { backgroundColor: colors.midnight },
  name: { ...type.subheading, color: colors.white, textAlign: 'center' },
  nameLong: { ...type.small, fontWeight: '700', color: colors.white, textAlign: 'center' },
  rule: { alignSelf: 'stretch', height: 1, backgroundColor: colors.powderBlue, opacity: 0.4, marginVertical: spacing.xs },
  line: { ...type.meta, color: colors.white, textAlign: 'center' },
});
