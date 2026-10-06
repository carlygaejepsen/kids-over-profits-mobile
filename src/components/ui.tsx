import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, statusColor } from '@/theme/colors';
import { maxContentWidth, radius, spacing, touchTarget, type } from '@/theme/typography';
import { openLink } from '@/lib/links';
import { citeWords, cleanProse, usableCitations } from '@/lib/citations';
import { urlLabel } from '@/lib/urlLabel';
import { SITE } from '@/api/client';
import { Icon } from './Icon';

type Variant = keyof typeof type;

export function AppText({
  variant = 'body',
  muted,
  style,
  ...rest
}: TextProps & { variant?: Variant; muted?: boolean; style?: StyleProp<TextStyle> }) {
  return <Text {...rest} style={[type[variant], { color: muted ? colors.textMuted : colors.textPrimary }, style]} />;
}

/** A scrolling page on the sand background, centred and capped in width on tablets. */
export function Screen({ children, edges = ['bottom'] }: { children: ReactNode; edges?: ('top' | 'bottom')[] }) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.column}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function Section({ title, children, count }: { title: string; children: ReactNode; count?: number }) {
  return (
    <View style={styles.section}>
      <AppText variant="heading" accessibilityRole="header" style={styles.sectionTitle}>
        {title}
        {count !== undefined ? <AppText variant="small" muted>{`  ${count}`}</AppText> : null}
      </AppText>
      {children}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** A tappable row: a title, optional lines under it, a chevron. At least 44 points tall. */
export function Row({
  title,
  lines = [],
  onPress,
  trailing,
  label,
}: {
  title: string;
  lines?: string[];
  onPress?: () => void;
  trailing?: ReactNode;
  label?: string;
}) {
  const body = (
    <View style={styles.rowInner}>
      <View style={styles.rowText}>
        <AppText variant="bodyBold" maxFontSizeMultiplier={1.6}>{title}</AppText>
        {lines.filter(Boolean).map((l, i) => (
          <AppText key={i} variant="small" muted maxFontSizeMultiplier={1.6}>{l}</AppText>
        ))}
      </View>
      {trailing}
      {onPress ? <Icon name="chevron" size={20} color={colors.textMuted} /> : null}
    </View>
  );
  if (!onPress) return <Card>{body}</Card>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label ?? [title, ...lines].filter(Boolean).join('. ')}
      style={({ pressed }) => [styles.card, styles.rowPress, pressed && styles.pressed]}>
      {body}
    </Pressable>
  );
}

export function StatusPill({ status }: { status: string }) {
  if (!status) return null;
  const c = statusColor(status);
  return (
    <View style={[styles.pill, { backgroundColor: c.background, borderColor: c.border }]}>
      <AppText variant="smallBold" style={{ color: c.text }}>{status}</AppText>
    </View>
  );
}

export function Chip({ label, onPress }: { label: string; onPress?: () => void }) {
  const inner = <AppText variant="small" style={{ color: colors.midnight }}>{label}</AppText>;
  if (!onPress) return <View style={styles.chip}>{inner}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.chip, styles.chipPress, pressed && styles.pressed]}>
      {inner}
    </Pressable>
  );
}

/** A link in words, never an address. Opens a site page in the app and anything else in the in-app browser. */
export function LinkRow({ url, label }: { url: string; label?: string }) {
  const router = useRouter();
  if (!url) return null;
  const words = label && !/^https?:\/\//i.test(label) ? label : urlLabel(url);
  return (
    <Pressable
      onPress={() => openLink(url, (href) => router.push(href))}
      accessibilityRole="link"
      accessibilityLabel={words}
      style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}>
      <AppText variant="body" style={styles.link} maxFontSizeMultiplier={1.6}>{words}</AppText>
    </Pressable>
  );
}

export type Cite = { url?: string; cite?: string; source?: string; label?: string };

/**
 * Citations as the website shows them: "(source)", or "(source 1, source 2)" when there are several, set inline
 * after the text they support. A link opens the page; with no address the word is plain text. The words behind
 * the number are the accessibility label, so a screen reader hears what each source is.
 */
export function InlineSources({ items }: { items?: Cite[] }) {
  const router = useRouter();
  const list = usableCitations(items);
  if (!list.length) return null;
  return (
    <Text style={styles.cite}>
      {' ('}
      {list.map((c, i) => {
        const word = list.length > 1 ? `source ${i + 1}` : 'source';
        const preview = citeWords(c);
        const label = preview ? `${word}: ${preview}` : word;
        return (
          <Text key={i}>
            {i > 0 ? ', ' : ''}
            {c.url ? (
              <Text
                onPress={() => openLink(c.url, (href) => router.push(href))}
                accessibilityRole="link"
                accessibilityLabel={label}
                style={styles.citeLink}>
                {word}
              </Text>
            ) : (
              <Text accessibilityLabel={label}>{word}</Text>
            )}
          </Text>
        );
      })}
      {')'}
    </Text>
  );
}

/** A line of text with its citations inline at the end. */
export function Cited({
  text,
  sources,
  variant = 'body',
  muted,
}: {
  text: string;
  sources?: Cite[];
  variant?: Variant;
  muted?: boolean;
}) {
  return (
    <AppText variant={variant} muted={muted}>
      {cleanProse(text)}
      <InlineSources items={sources} />
    </AppText>
  );
}

/** Every record can be opened on the website, where its sources and full text live. */
export function OpenOnSite({ url }: { url: string }) {
  const router = useRouter();
  if (!url) return null;
  return (
    <Pressable
      onPress={() => openLink(url.startsWith('http') ? url : `${SITE}${url}`, (href) => router.push(href))}
      accessibilityRole="link"
      accessibilityLabel="Open this page on kidsoverprofits.org"
      style={({ pressed }) => [styles.openOnSite, pressed && styles.pressed]}>
      <Icon name="external" size={18} color={colors.tealInk} />
      <AppText variant="smallBold" style={styles.link}>Open on kidsoverprofits.org</AppText>
    </Pressable>
  );
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator size="large" color={colors.tealInk} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center} accessibilityRole="alert">
      <Icon name="alert" size={32} color={colors.coralPinkInk} />
      <AppText variant="body" style={styles.centerText}>{message}</AppText>
      {onRetry ? (
        <Pressable onPress={onRetry} accessibilityRole="button" accessibilityLabel="Try again" style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <AppText variant="bodyBold" style={styles.buttonText}>Try again</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Empty({ message }: { message: string }) {
  return (
    <View style={styles.center}>
      <AppText variant="body" muted style={styles.centerText}>{message}</AppText>
    </View>
  );
}

/** Label and value pairs ("Capacity", "Founded"), each with its citations when the record has them. */
export function Facts({ facts, sources }: { facts: { label: string; value: string }[]; sources?: Record<string, Cite[]> }) {
  if (!facts.length) return null;
  return (
    <Card>
      {facts.map((f, i) => (
        <View key={`${f.label}-${i}`} style={styles.fact}>
          <AppText variant="smallBold" muted>{f.label}</AppText>
          <Cited text={f.value} sources={sources?.[f.label]} />
        </View>
      ))}
    </Card>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <View style={styles.bullets}>
      {items.map(cleanProse).filter(Boolean).map((t, i) => (
        <View key={i} style={styles.bulletRow}>
          <AppText variant="body" style={styles.bullet}>{'•'}</AppText>
          <AppText variant="body" style={styles.bulletText}>{t}</AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, alignItems: 'center' },
  column: { width: '100%', maxWidth: maxContentWidth, gap: spacing.md },
  section: { gap: spacing.sm, marginTop: spacing.sm },
  sectionTitle: { color: colors.midnight },
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSecondary,
    padding: spacing.md,
    gap: spacing.sm,
  },
  rowPress: { minHeight: touchTarget },
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowText: { flex: 1, gap: 2 },
  pressed: { opacity: 0.7 },
  pill: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.sm + 2, paddingVertical: 2 },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.softPastelYellow,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  chipPress: { minHeight: touchTarget - 12, justifyContent: 'center' },
  linkRow: { minHeight: touchTarget, justifyContent: 'center' },
  link: { color: colors.tealInk, textDecorationLine: 'underline' },
  openOnSite: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: touchTarget },
  center: { padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  centerText: { textAlign: 'center' },
  button: {
    minHeight: touchTarget,
    justifyContent: 'center',
    backgroundColor: colors.tealFill,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  buttonText: { color: colors.white },
  fact: { gap: 2 },
  cite: { fontSize: 14, color: colors.textMuted },
  citeLink: { color: colors.tealInk, textDecorationLine: 'underline' },
  bullets: { gap: spacing.xs },
  bulletRow: { flexDirection: 'row', gap: spacing.sm },
  bullet: { width: 12 },
  bulletText: { flex: 1 },
});
