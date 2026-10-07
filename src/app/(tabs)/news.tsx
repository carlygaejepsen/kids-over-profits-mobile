import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNews } from '@/api/queries';
import type { NewsItem } from '@/api/types';
import { NewsCard } from '@/components/NewsCard';
import { StoryCard } from '@/components/site';
import { Note } from '@/components/tabs/Note';
import { Pill } from '@/components/tabs/Pill';
import { pageColumn } from '@/components/tabs/TabPage';
import { ErrorState, Loading } from '@/components/ui';
import { colors } from '@/theme/colors';
import { gutter, spacing } from '@/theme/typography';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function monthLabel(key: string) {
  const [y, m] = key.split('-');
  return `${MONTHS[Number(m) - 1] ?? m} ${y}`;
}

export default function NewsScreen() {
  const [story, setStory] = useState<string | undefined>();
  const [month, setMonth] = useState<string | undefined>();
  const [showMonths, setShowMonths] = useState(false);
  const query = useNews({ story, archive: month });

  const items = useMemo<NewsItem[]>(() => (query.data?.pages ?? []).flatMap((p) => p.items), [query.data]);
  const first = query.data?.pages[0];
  const arcs = first?.arcs ?? [];
  const months = first?.months ?? [];
  const count = first ? `${first.total} article${first.total === 1 ? '' : 's'}` : '';

  const header = (
    <View style={styles.header}>
      {arcs.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          accessibilityLabel="Ongoing stories"
          style={styles.bleed}
          contentContainerStyle={styles.strip}>
          <Pill label="All news" selected={!story} onPress={() => setStory(undefined)} />
          {arcs.map((a) => (
            <StoryCard key={a.id} arc={a} selected={story === a.slug} style={story === a.slug ? styles.picked : undefined} onPress={() => setStory(story === a.slug ? undefined : a.slug)} />
          ))}
        </ScrollView>
      ) : null}
      {months.length ? (
        <View style={styles.pills}>
          <Pill
            label={month ? monthLabel(month) : 'Any month'}
            icon={showMonths ? 'chevron-up' : 'chevron-down'}
            selected={!!month}
            accessibilityLabel={`Month: ${month ? monthLabel(month) : 'any'}`}
            onPress={() => setShowMonths((v) => !v)}
          />
          {month ? <Pill label="Clear month" onPress={() => setMonth(undefined)} /> : null}
        </View>
      ) : null}
      {showMonths ? (
        <ScrollView style={styles.monthList} nestedScrollEnabled contentContainerStyle={styles.pills}>
          {months.map((m) => (
            <Pill
              key={m.month}
              label={`${monthLabel(m.month)} (${m.count})`}
              selected={m.month === month}
              onPress={() => {
                setMonth(m.month);
                setShowMonths(false);
              }}
            />
          ))}
        </ScrollView>
      ) : null}
      {count ? <Note>{`${count}${story ? ' in this story' : month ? ` in ${monthLabel(month)}` : ''}`}</Note> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      {query.isLoading ? (
        <Loading label="Loading news" />
      ) : query.isError ? (
        <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <NewsCard item={item} onStory={(slug) => setStory(slug)} />}
          ItemSeparatorComponent={Gap}
          ListHeaderComponent={header}
          ListEmptyComponent={<Note>No articles match.</Note>}
          ListFooterComponent={query.isFetchingNextPage ? <Loading label="Loading more" /> : null}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
          }}
          onEndReachedThreshold={0.6}
          refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => query.refetch()} tintColor={colors.tealInk} colors={[colors.tealInk]} />}
          contentContainerStyle={pageColumn}
        />
      )}
    </SafeAreaView>
  );
}

const Gap = () => <View style={styles.gap} />;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  header: { gap: spacing.sm, marginBottom: spacing.sm },
  bleed: { marginHorizontal: -gutter },
  strip: { alignItems: 'center', gap: spacing.sm + 4, paddingHorizontal: gutter, paddingVertical: spacing.xs },
  picked: { borderWidth: 2, borderColor: colors.tealInk },
  pills: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  monthList: { maxHeight: 220 },
  gap: { height: spacing.md },
});
