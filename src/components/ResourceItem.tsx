import { useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ResourceEntry } from '@/api/types';
import { contactActions } from '@/lib/contact';
import { openLink } from '@/lib/links';
import { colors } from '@/theme/colors';
import { radius, spacing, touchTarget, type } from '@/theme/typography';
import { Icon } from './Icon';
import { dense } from './site/metrics';

/** The site's data form is the app's Send tab. */
const IN_APP: Record<string, string> = { 'tti-data-submission': '/send' };

/**
 * One resource as the /resources/ page prints it: the name as a link, the contact line in bold with a
 * Call or Text button for each number in it, "Archived copy" when the site is gone, the note, extra links.
 */
export function ResourceItem({ entry }: { entry: ResourceEntry }) {
  const router = useRouter();
  const target = IN_APP[entry.page];
  const open = target ? () => router.push(target as never) : entry.url ? () => void openLink(entry.url, (h) => router.push(h)) : undefined;
  const actions = contactActions(entry.contact);

  return (
    <View style={styles.item}>
      {open ? (
        <Pressable
          onPress={open}
          accessibilityRole="link"
          accessibilityLabel={entry.name}
          style={({ pressed }) => [styles.namePress, pressed && styles.pressed]}>
          <Text style={styles.name}>{entry.name}</Text>
        </Pressable>
      ) : (
        <Text style={styles.name}>{entry.name}</Text>
      )}
      {entry.contact ? <Text style={styles.contact}>{entry.contact}</Text> : null}
      {actions.length ? (
        <View style={styles.actions}>
          {actions.map((a) => (
            <Pressable
              key={a.url}
              onPress={() => void Linking.openURL(a.url)}
              accessibilityRole="button"
              accessibilityLabel={`${a.label}, ${entry.name}`}
              style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
              <Icon name={a.kind === 'call' ? 'phone' : 'message'} size={18} color={colors.white} />
              <Text {...dense} style={styles.actionLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {entry.archived ? <Text style={styles.archived}>Archived copy</Text> : null}
      {entry.note ? <Text style={styles.note}>{entry.note}</Text> : null}
      {entry.links.length ? (
        <View style={styles.links}>
          {entry.links.map((l) => (
            <Pressable
              key={l.url}
              onPress={() => void openLink(l.url, (h) => router.push(h))}
              accessibilityRole="link"
              style={({ pressed }) => [styles.extra, pressed && styles.pressed]}>
              <Text style={styles.extraText}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { paddingVertical: spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: colors.powderBlue, gap: spacing.xs },
  namePress: { minHeight: touchTarget, justifyContent: 'center' },
  pressed: { backgroundColor: colors.sand },
  name: { ...type.body, fontWeight: '600', color: colors.navy, textDecorationLine: 'underline' },
  contact: { ...type.bodyBold },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.xs },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    minHeight: touchTarget,
    paddingHorizontal: spacing.md - 2,
    borderRadius: radius.box,
    backgroundColor: colors.tealFill,
  },
  actionPressed: { backgroundColor: colors.navy },
  actionLabel: { ...type.smallBold, color: colors.white },
  archived: { ...type.pill, color: colors.textMuted },
  note: { ...type.small },
  links: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.md },
  extra: { minHeight: touchTarget, justifyContent: 'center' },
  extraText: { ...type.small, fontWeight: '600', color: colors.navy, textDecorationLine: 'underline' },
});
