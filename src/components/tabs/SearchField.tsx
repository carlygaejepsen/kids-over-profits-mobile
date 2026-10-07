import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { colors } from '@/theme/colors';
import { radius, spacing, touchTarget, type } from '@/theme/typography';

/**
 * The site's search box (home.css .kop-home-search): white, a 2 px navy border, radius 6, 48 tall, a search
 * icon at the left and a clear button at the right. Focus draws the site's teal outline.
 */
export function SearchField({
  value,
  onChangeText,
  placeholder,
  label,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  /** What a screen reader says the box is for. */
  label: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.box, focused && styles.focused]}>
      <Icon name="search" size={20} color={colors.navy} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        style={styles.input}
      />
      {value ? (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="Clear"
          hitSlop={spacing.xs}
          style={styles.clear}>
          <Icon name="x" size={20} color={colors.navy} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touchTarget + 4,
    paddingLeft: spacing.md - 2,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.navy,
    borderRadius: radius.sm,
  },
  focused: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: colors.teal, outlineOffset: 1 },
  input: { ...type.body, flex: 1, minWidth: 0, minHeight: touchTarget, paddingVertical: 0, outlineWidth: 0 },
  clear: { width: touchTarget, height: touchTarget, alignItems: 'center', justifyContent: 'center' },
});
