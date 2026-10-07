import { Fragment, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, tones, type Tone } from '@/theme/colors';
import { spacing, touchTarget, type } from '@/theme/typography';
import { Icon, type IconName } from '../Icon';
import { MoreButton } from './Button';
import { dense, size } from './metrics';

export type SectionBlockProps<T> = {
  id: string;
  title: string;
  icon: IconName;
  tone?: Tone;
  count?: number;
  initiallyCollapsed?: boolean;
  /** A list that hides everything past `limit` behind "N more +". */
  items?: T[];
  renderItem?: (item: T, index: number) => ReactNode;
  limit?: number;
  children?: ReactNode;
  /** The section's top edge inside its parent, so a screen can scroll to it. */
  onLayoutY?: (id: string, y: number) => void;
};

/** A record-page section: icon and title over a mint rule, a count, a chevron that folds the body, "N more +". */
export function SectionBlock<T>({
  id,
  title,
  icon,
  tone = 'info',
  count,
  initiallyCollapsed = false,
  items,
  renderItem,
  limit = 5,
  children,
  onLayoutY,
}: SectionBlockProps<T>) {
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);
  const [all, setAll] = useState(false);
  const total = count ?? items?.length;
  if (items && !items.length && !children) return null;

  const ink = tone === 'grave' ? colors.coralPinkInk : colors.tealInk;
  const hidden = items ? Math.max(0, items.length - limit) : 0;
  const shown = items ? (all ? items : items.slice(0, limit)) : [];

  return (
    <View style={styles.section} onLayout={onLayoutY ? (e) => onLayoutY(id, e.nativeEvent.layout.y) : undefined}>
      <Pressable
        onPress={() => setCollapsed((c) => !c)}
        accessibilityRole="button"
        accessibilityLabel={total !== undefined ? `${title}, ${total}` : title}
        accessibilityHint={collapsed ? 'Shows this section' : 'Hides this section'}
        accessibilityState={{ expanded: !collapsed }}
        style={[styles.head, { borderBottomColor: collapsed ? colors.sand : colors.mintGreen }]}>
        <Icon name={icon} size={size.headingIcon} color={ink} />
        <Text {...dense} style={styles.title}>
          {title}
          {total !== undefined ? <Text style={styles.count}>{`  ${total}`}</Text> : null}
        </Text>
        <Icon name={collapsed ? 'chevron-down' : 'chevron-up'} size={size.headingIcon} color={tones.info.ink} />
      </Pressable>
      {collapsed ? null : (
        <View style={styles.body}>
          {items && renderItem ? shown.map((item, i) => <Fragment key={i}>{renderItem(item, i)}</Fragment>) : null}
          {children}
          {hidden > 0 ? <MoreButton count={hidden} expanded={all} onPress={() => setAll((a) => !a)} /> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xl },
  head: {
    minHeight: touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: 6,
    borderBottomWidth: 2,
  },
  title: { ...type.heading, flex: 1 },
  count: { ...type.meta },
  body: { marginTop: spacing.md, gap: spacing.sm },
});
