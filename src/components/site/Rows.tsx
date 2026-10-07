import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, directoryStatusColor } from '@/theme/colors';
import { radius, spacing, touchTarget, type } from '@/theme/typography';
import { dense } from './metrics';
import { SourceLink, type Cite } from './Source';
import { useOpenLink } from './useOpenLink';

/** A lawsuit or a death: no card, a divider under it and a coloured edge on the left. */
export function EdgeRow({
  title,
  kind,
  meta,
  body,
  sources,
  onPress,
}: {
  title: string;
  kind: 'lawsuit' | 'death';
  meta?: (string | undefined | null)[];
  body?: string;
  sources?: Cite[];
  onPress?: () => void;
}) {
  const metaLine = (meta ?? []).filter(Boolean).join(' | ');
  const edge = { borderLeftColor: kind === 'death' ? colors.coralPinkInk : colors.orange };
  const head = (
    <>
      <Text style={styles.edgeTitle}>{title}</Text>
      {metaLine ? <Text style={styles.meta}>{metaLine}</Text> : null}
    </>
  );
  return (
    <View style={[styles.edge, edge]}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="link"
          accessibilityLabel={[title, metaLine].filter(Boolean).join('. ')}
          style={({ pressed }) => [styles.edgePress, pressed && styles.pressed]}>
          {head}
        </Pressable>
      ) : (
        head
      )}
      {body ? <Text style={styles.small}>{body}</Text> : null}
      <SourceLink items={sources} />
    </View>
  );
}

/** One line of a place or company list: a navy title, a meta line, a pale rule under it. */
export function HubListRow({
  title,
  meta,
  url,
  onPress,
}: {
  title: string;
  meta?: string;
  url?: string;
  onPress?: () => void;
}) {
  const open = useOpenLink();
  const press = onPress ?? (url ? () => open(url) : undefined);
  const body = (
    <>
      <Text style={styles.hubTitle}>{title}</Text>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </>
  );
  if (!press) return <View style={styles.hubRow}>{body}</View>;
  return (
    <Pressable
      onPress={press}
      accessibilityRole="link"
      accessibilityLabel={[title, meta].filter(Boolean).join('. ')}
      style={({ pressed }) => [styles.hubRow, styles.hubPress, pressed && styles.pressed]}>
      {body}
    </Pressable>
  );
}

export type DirectoryFacilityRowProps = {
  name: string;
  /** "Formerly X", "Now known as Y". */
  hint?: string;
  place?: string;
  operator?: string;
  years?: string;
  status?: string | null;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** A facility in the directory (search results, place lists, sibling programs): a card edged in its status colour. */
export function DirectoryFacilityRow({ name, hint, place, operator, years, status, onPress, style }: DirectoryFacilityRowProps) {
  const color = directoryStatusColor(status);
  const badge = (status ?? '').trim();
  const body = (
    <>
      <View style={styles.dirMain}>
        <Text style={styles.dirName}>{name}</Text>
        <View style={styles.dirUnderline} />
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        {place ? <Text style={styles.small2}>{place}</Text> : null}
        {operator ? <Text style={styles.small2}>{operator}</Text> : null}
        {years ? <Text style={styles.small2}>{years}</Text> : null}
      </View>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text {...dense} style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </>
  );
  const frame = [styles.dir, { borderColor: color }, style];
  if (!onPress) return <View style={frame}>{body}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={[name, hint, place, operator, years, badge].filter(Boolean).join('. ')}
      style={({ pressed }) => [...frame, pressed && styles.pressed]}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { backgroundColor: colors.sand },
  meta: { ...type.meta },
  small: { ...type.small },
  small2: { ...type.small, color: colors.textMuted },
  edge: {
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    borderLeftWidth: 4,
    paddingTop: 9,
    paddingBottom: 9,
    paddingLeft: 13,
    gap: spacing.xxs,
  },
  edgePress: { minHeight: touchTarget - 18, justifyContent: 'center', gap: spacing.xxs },
  edgeTitle: { ...type.body, fontWeight: '600', color: colors.navy },
  hubRow: { paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.powderBlue, gap: spacing.xxs },
  hubPress: { minHeight: touchTarget, justifyContent: 'center' },
  hubTitle: { ...type.body, fontWeight: '600', color: colors.navy },
  dir: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.tile,
    borderWidth: 5,
    borderLeftWidth: 8,
    padding: 12,
  },
  dirMain: { flex: 1, gap: spacing.xxs },
  dirName: { ...type.bodyBold, color: colors.directoryNavy },
  dirUnderline: { width: '40%', height: 2, backgroundColor: colors.teal, marginBottom: spacing.xxs },
  hint: { ...type.small, fontStyle: 'italic', color: colors.navy },
  badge: { alignSelf: 'flex-start', borderRadius: radius.thumb, paddingVertical: 2, paddingHorizontal: spacing.sm },
  badgeText: { ...type.pill, fontWeight: '700', color: colors.white },
});
