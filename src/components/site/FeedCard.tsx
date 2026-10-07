import { Image } from 'expo-image';
import { openBrowserAsync } from 'expo-web-browser';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { NewsFacility, NewsItem, StoryArc } from '@/api/types';
import { colors, newsTypeColor, shadows } from '@/theme/colors';
import { radius, spacing, type } from '@/theme/typography';
import { chipText, dense, hitSlopFor, size } from './metrics';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-10-03" as "Oct 3, 2026"; anything else as it came. */
function dateWords(raw: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw ?? '');
  if (!m) return raw ?? '';
  return `${MONTHS[Number(m[2]) - 1] ?? ''} ${Number(m[3])}, ${m[1]}`.trim();
}

/** One article in the News tab. The card opens the article; the story badge and facility chips are their own buttons. */
export function FeedCard({
  item,
  wide,
  onFacility,
  onStory,
  style,
}: {
  item: NewsItem;
  wide?: boolean;
  onFacility?: (facility: NewsFacility) => void;
  onStory?: (slug: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const badge = newsTypeColor(item.type);
  const meta = [item.outlet, item.date_label].filter(Boolean).join(' · ');
  const warnings = (item.content_warnings ?? []).filter(Boolean);
  const facilities = item.facilities ?? [];
  const label = [item.title, meta, item.summary].filter(Boolean).join('. ');
  return (
    <View style={[styles.card, wide && styles.wide, style]}>
      <Pressable
        onPress={() => (item.url ? openBrowserAsync(item.url) : undefined)}
        accessibilityRole="link"
        accessibilityLabel={`${label}. Opens the article.`}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}>
        {item.image && item.image.kind === 'photo' ? (
          <Image source={{ uri: item.image.src }} accessible={false} contentFit="cover" style={styles.photo} />
        ) : null}
        {item.image && item.image.kind === 'logo' ? (
          <Image source={{ uri: item.image.src }} accessible={false} contentFit="contain" contentPosition="left" style={styles.logo} />
        ) : null}
        {item.type ? (
          <View style={[styles.type, { backgroundColor: badge.background }]}>
            <Text {...dense} style={[styles.typeText, { color: badge.text }]}>{item.type}</Text>
          </View>
        ) : null}
        <Text style={styles.title}>{item.title}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        {item.summary ? <Text numberOfLines={4} style={styles.summary}>{item.summary}</Text> : null}
        {warnings.length ? <Text style={styles.meta}>{`Content note: ${warnings.join(', ')}`}</Text> : null}
      </Pressable>
      {item.story_arc || facilities.length ? (
        <View style={styles.chips}>
          {item.story_arc ? (
            <Pressable
              disabled={!onStory}
              onPress={() => onStory?.(item.story_arc!.slug)}
              accessibilityRole={onStory ? 'button' : 'text'}
              accessibilityLabel={`Ongoing story: ${item.story_arc.title}`}
              hitSlop={hitSlopFor(32)}
              style={styles.storyChip}>
              <Text {...dense} style={styles.chipText}>{`Ongoing story: ${item.story_arc.title}`}</Text>
            </Pressable>
          ) : null}
          {facilities.map((f) => (
            <Pressable
              key={f.id}
              disabled={!onFacility}
              onPress={() => onFacility?.(f)}
              accessibilityRole={onFacility ? 'button' : 'text'}
              accessibilityLabel={f.name}
              hitSlop={hitSlopFor(32)}
              style={styles.chip}>
              <Text {...dense} style={styles.chipText}>{f.name}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** One ongoing story in the strip above the feed. Selected = sand. */
export function StoryCard({
  arc,
  selected,
  onPress,
  style,
}: {
  arc: StoryArc;
  selected?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const count = `${arc.article_count} ${arc.article_count === 1 ? 'article' : 'articles'}`;
  const meta = arc.latest_date ? `${count} · updated ${dateWords(arc.latest_date)}` : count;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ongoing story: ${arc.title}. ${meta}`}
      accessibilityState={{ selected: !!selected }}
      style={[styles.story, selected && styles.storySelected, style]}>
      <View style={styles.flag}>
        <Text {...dense} style={styles.flagText}>Ongoing story</Text>
      </View>
      <Text style={styles.storyTitle}>{arc.title}</Text>
      {arc.description ? <Text numberOfLines={3} style={styles.storyText}>{arc.description}</Text> : null}
      <Text style={styles.meta}>{meta}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.feedBorder,
    padding: 20,
    gap: spacing.sm + 2,
    ...shadows.card,
  },
  wide: { padding: 24 },
  body: { gap: spacing.sm },
  pressed: { opacity: 0.7 },
  photo: { width: '100%', aspectRatio: size.photoRatio, borderRadius: radius.box, backgroundColor: colors.sand },
  logo: { width: '100%', height: size.feedLogoHeight, backgroundColor: colors.sand },
  type: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingVertical: 2, paddingHorizontal: 10 },
  typeText: { ...type.pill },
  title: { ...type.feedTitle },
  meta: { ...type.meta },
  summary: { ...type.body },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  storyChip: {
    justifyContent: 'center',
    backgroundColor: colors.softPastelYellow,
    borderWidth: 1,
    borderColor: colors.orange,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: 10,
  },
  chip: {
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.mintGreen,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: 10,
  },
  chipText: { ...chipText, color: colors.navy },
  story: {
    width: size.storyWidth,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.feedBorder,
    borderLeftWidth: 4,
    borderLeftColor: colors.orange,
    borderRadius: radius.card,
    padding: 14,
    gap: spacing.xs + 2,
  },
  storySelected: { backgroundColor: colors.sand },
  flag: { alignSelf: 'flex-start', backgroundColor: colors.orangeFill, borderRadius: radius.sm, paddingVertical: 2, paddingHorizontal: 6 },
  flagText: { ...type.kicker, color: colors.white },
  storyTitle: { ...type.subheading, color: colors.navy },
  storyText: { ...type.small },
});
