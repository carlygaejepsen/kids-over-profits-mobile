import { useRouter } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SITE } from '@/api/client';
import { useGlobalSearch, useSuggest } from '@/api/queries';
import type { IconName } from '@/components/Icon';
import { Button, DirectoryFacilityRow, HubHeader, HubListRow, SectionBlock } from '@/components/site';
import { Note } from '@/components/tabs/Note';
import { SearchField } from '@/components/tabs/SearchField';
import { TabPage } from '@/components/tabs/TabPage';
import { useDebounced } from '@/components/tabs/useDebounced';
import { ErrorState, Loading } from '@/components/ui';
import { openLink } from '@/lib/links';
import { spacing } from '@/theme/typography';

/** The icon of each site-wide result group; anything else gets a document. */
const GROUP_ICONS: Record<string, IconName> = {
  facilities: 'building',
  news: 'newspaper',
  lawsuits: 'scale',
  wiki: 'book',
  documents: 'file-text',
  places: 'map-pin',
};

export default function SearchScreen() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [more, setMore] = useState(false);
  const q = useDebounced(text, 300);
  const suggest = useSuggest(q);
  const global = useGlobalSearch(q, more);
  const short = q.trim().length < 3;
  const items = suggest.data?.items ?? [];
  const go = (url: string) => openLink(url, (href) => router.push(href));

  return (
    <TabPage>
      <HubHeader
        eyebrow="Search the database"
        title="Find a program"
        standfirst="Search by name, including former and other names."
      />
      <SearchField
        value={text}
        onChangeText={(t) => {
          setText(t);
          setMore(false);
        }}
        placeholder="Search a facility or its old name"
        label="Search facilities by name, including former names"
      />

      {short ? (
        <>
          <Note>Type at least three letters to search.</Note>
          <View style={styles.help}>
            <HubListRow
              title="Need help now? Resources"
              meta="Crisis lines, where to report, survivor support."
              onPress={() => router.push('/resources')}
            />
          </View>
        </>
      ) : suggest.isLoading ? (
        <Loading label="Searching" />
      ) : suggest.isError ? (
        <ErrorState message={(suggest.error as Error).message} onRetry={() => suggest.refetch()} />
      ) : items.length === 0 ? (
        <Note>{`No facility matches "${q.trim()}".`}</Note>
      ) : (
        <View style={styles.results}>
          <Note>{`${items.length} ${items.length === 1 ? 'program' : 'programs'}`}</Note>
          {items.map((item, i) => (
            <DirectoryFacilityRow
              key={`${item.id ?? item.name}-${i}`}
              name={item.name}
              hint={item.hint}
              place={item.place}
              status={item.status}
              onPress={() => (item.url ? go(item.url) : openBrowserAsync(`${SITE}/?s=${encodeURIComponent(item.name)}`))}
            />
          ))}
        </View>
      )}

      {!short && !suggest.isLoading ? (
        <View style={styles.more}>
          {!more ? (
            <Button variant="secondary" label="Search news, lawsuits and records too" icon="search" onPress={() => setMore(true)} />
          ) : global.isLoading ? (
            <Loading label="Searching the whole site" />
          ) : global.isError ? (
            <ErrorState message={(global.error as Error).message} onRetry={() => global.refetch()} />
          ) : (global.data?.groups ?? []).length === 0 ? (
            <Note>Nothing else on the site matches.</Note>
          ) : (
            (global.data?.groups ?? []).map((g) => (
              <SectionBlock
                key={g.key}
                id={g.key}
                title={g.label}
                icon={GROUP_ICONS[g.key] ?? 'file-text'}
                items={g.items}
                renderItem={(it) => <HubListRow title={it.title} meta={it.meta} onPress={() => go(it.url)} />}
              />
            ))
          )}
        </View>
      ) : null}
    </TabPage>
  );
}

const styles = StyleSheet.create({
  results: { gap: spacing.sm + 2, marginTop: spacing.sm },
  more: { marginTop: spacing.lg },
  help: { marginTop: spacing.lg },
});
