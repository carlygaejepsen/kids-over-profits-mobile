import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { Pressable, StyleSheet, View } from 'react-native';

import type { NewsItem } from '@/api/types';
import { colors } from '@/theme/colors';
import { radius, spacing, touchTarget } from '@/theme/typography';
import { AppText, Chip } from './ui';

/** One article. The card opens the article in the in-app browser; each facility chip opens that facility. */
export function NewsCard({ item, onStory }: { item: NewsItem; onStory?: (slug: string) => void }) {
  const router = useRouter();
  const meta = [item.outlet, item.date_label].filter(Boolean).join(' · ');
  const warnings = (item.content_warnings ?? []).filter(Boolean);
  const label = [item.title, meta, item.summary].filter(Boolean).join('. ');

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => (item.url ? openBrowserAsync(item.url) : undefined)}
        accessibilityRole="link"
        accessibilityLabel={`${label}. Opens the article.`}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}>
        {item.image ? (
          <Image
            source={{ uri: item.image.src }}
            accessible={false}
            contentFit={item.image.kind === 'logo' ? 'contain' : 'cover'}
            style={[styles.image, item.image.kind === 'logo' && styles.logo]}
          />
        ) : null}
        <AppText variant="subheading">{item.title}</AppText>
        {meta ? <AppText variant="small" muted>{meta}</AppText> : null}
        {item.summary ? <AppText variant="body" numberOfLines={4}>{item.summary}</AppText> : null}
        {warnings.length ? <AppText variant="small" muted>{`Content note: ${warnings.join(', ')}`}</AppText> : null}
      </Pressable>
      {item.story_arc || (item.facilities && item.facilities.length) ? (
        <View style={styles.chips}>
          {item.story_arc ? (
            <Chip label={`Ongoing story: ${item.story_arc.title}`} onPress={onStory ? () => onStory(item.story_arc!.slug) : undefined} />
          ) : null}
          {(item.facilities ?? []).map((f) => (
            <Chip key={f.id} label={f.name} onPress={f.slug ? () => router.push(`/facility/${f.slug}` as Href) : undefined} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSecondary,
    overflow: 'hidden',
  },
  body: { padding: spacing.md, gap: spacing.sm, minHeight: touchTarget },
  pressed: { opacity: 0.7 },
  image: { width: '100%', height: 160, borderRadius: radius.sm, backgroundColor: colors.sand },
  logo: { height: 64, backgroundColor: colors.white },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
});
