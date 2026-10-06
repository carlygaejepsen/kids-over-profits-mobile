import { useRouter } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { SITE } from '@/api/client';
import { useGlobalSearch, useSuggest } from '@/api/queries';
import { AppText, Empty, ErrorState, Loading, Row, Screen, Section, StatusPill } from '@/components/ui';
import { openLink } from '@/lib/links';
import { colors } from '@/theme/colors';
import { radius, spacing, touchTarget } from '@/theme/typography';

function useDebounced(value: string, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function SearchScreen() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [more, setMore] = useState(false);
  const q = useDebounced(text, 300);
  const suggest = useSuggest(q);
  const global = useGlobalSearch(q, more);
  const short = q.trim().length < 3;

  return (
    <Screen>
      <View style={styles.inputWrap}>
        <TextInput
          value={text}
          onChangeText={(t) => {
            setText(t);
            setMore(false);
          }}
          placeholder="Search a facility or its old name"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Search facilities by name, including former names"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="while-editing"
          style={styles.input}
        />
      </View>
      <AppText variant="small" muted>
        Names match past and other names too, shown as Formerly or Also known as.
      </AppText>

      {short ? (
        <Empty message="Type at least three letters to search." />
      ) : suggest.isLoading ? (
        <Loading label="Searching" />
      ) : suggest.isError ? (
        <ErrorState message={(suggest.error as Error).message} onRetry={() => suggest.refetch()} />
      ) : (
        <Section title="Facilities" count={suggest.data?.items.length ?? 0}>
          {(suggest.data?.items ?? []).length === 0 ? (
            <Empty message={`No facility matches "${q.trim()}".`} />
          ) : (
            suggest.data!.items.map((item, i) => (
              <Row
                key={`${item.id ?? item.name}-${i}`}
                title={item.name}
                lines={[item.hint, item.place]}
                trailing={<StatusPill status={item.status} />}
                onPress={() =>
                  item.url
                    ? openLink(item.url, (href) => router.push(href))
                    : openBrowserAsync(`${SITE}/?s=${encodeURIComponent(item.name)}`)
                }
              />
            ))
          )}
        </Section>
      )}

      {!short && !suggest.isLoading ? (
        <View style={styles.moreWrap}>
          {!more ? (
            <Pressable onPress={() => setMore(true)} accessibilityRole="button" style={({ pressed }) => [styles.more, pressed && { opacity: 0.7 }]}>
              <AppText variant="bodyBold" style={{ color: colors.tealInk }}>Search news, lawsuits and records too</AppText>
            </Pressable>
          ) : global.isLoading ? (
            <Loading label="Searching the whole site" />
          ) : global.isError ? (
            <ErrorState message={(global.error as Error).message} onRetry={() => global.refetch()} />
          ) : (
            (global.data?.groups ?? []).map((g) => (
              <Section key={g.key} title={g.label} count={g.items.length}>
                {g.items.map((it, i) => (
                  <Row
                    key={`${g.key}-${i}`}
                    title={it.title}
                    lines={[it.meta ?? '']}
                    onPress={() => openLink(it.url, (href) => router.push(href))}
                  />
                ))}
              </Section>
            ))
          )}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  inputWrap: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.tealInk },
  input: { minHeight: touchTarget + 4, paddingHorizontal: spacing.md, fontSize: 17, color: colors.textPrimary },
  moreWrap: { gap: spacing.sm },
  more: { minHeight: touchTarget, justifyContent: 'center', alignItems: 'center' },
});
