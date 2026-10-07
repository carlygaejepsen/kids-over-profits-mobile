import { Image } from 'expo-image';
import { openBrowserAsync } from 'expo-web-browser';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { NewsItem } from '@/api/types';
import { colors } from '@/theme/colors';
import { radius, serif, spacing, type } from '@/theme/typography';
import { dense, initialText, size } from './metrics';

function Thumb({ item }: { item: NewsItem }) {
  const image = item.image;
  if (image && image.kind === 'logo') {
    return (
      <View style={[styles.thumb, styles.logoBox]}>
        <Image source={{ uri: image.src }} accessible={false} contentFit="contain" style={styles.logo} />
      </View>
    );
  }
  if (image) {
    return <Image source={{ uri: image.src }} accessible={false} contentFit="cover" style={[styles.thumb, styles.photo]} />;
  }
  const initial = (item.outlet || item.title || '?').trim().charAt(0).toUpperCase();
  return (
    <View style={[styles.thumb, styles.initialBox]}>
      <Text style={styles.initial}>{initial}</Text>
    </View>
  );
}

/** One article on a facility or company page: a 92 px picture, the outlet and type, title, date, a short summary. */
export function RecordNewsCard({ item }: { item: NewsItem }) {
  const meta = [item.outlet, item.date_label].filter(Boolean).join(', ');
  return (
    <Pressable
      onPress={() => (item.url ? openBrowserAsync(item.url) : undefined)}
      accessibilityRole="link"
      accessibilityLabel={`${item.title}. ${meta}. Opens the article.`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Thumb item={item} />
      <View style={styles.main}>
        <View style={styles.metaRow}>
          {item.outlet ? <Text {...dense} style={styles.outlet}>{item.outlet}</Text> : null}
          {item.type ? (
            <View style={styles.typePill}>
              <Text {...dense} style={styles.typeText}>{item.type}</Text>
            </View>
          ) : null}
        </View>
        <Text numberOfLines={3} style={styles.title}>{item.title}</Text>
        {item.date_label ? <Text style={styles.date}>{item.date_label}</Text> : null}
        {item.summary ? <Text numberOfLines={3} style={styles.summary}>{item.summary}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.tile,
    padding: 10,
  },
  pressed: { backgroundColor: colors.sand },
  thumb: { width: size.thumb, height: size.thumb, borderRadius: radius.thumb },
  photo: { backgroundColor: colors.sand },
  logoBox: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  logo: { width: size.logoShare, height: size.logoShare },
  initialBox: { backgroundColor: colors.midnight, alignItems: 'center', justifyContent: 'center' },
  initial: { ...initialText, fontFamily: serif, color: colors.white },
  main: { flex: 1, gap: spacing.xxs },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  outlet: { ...type.kicker, color: colors.midnight },
  typePill: { borderWidth: 1, borderColor: colors.teal, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 1 },
  typeText: { ...type.kicker, color: colors.tealInk },
  title: { ...type.cardTitle },
  date: { ...type.meta },
  summary: { ...type.small },
});
