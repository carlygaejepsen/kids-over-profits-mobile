import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNews } from '@/api/queries';
import type { NewsItem } from '@/api/types';
import { NewsCard } from '@/components/NewsCard';
import { AppText, Chip, Empty, ErrorState, Loading } from '@/components/ui';
import { colors } from '@/theme/colors';
import { maxContentWidth, spacing } from '@/theme/typography';

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

  const header = (
    <View style={styles.header}>
      <AppText variant="small" muted>
        {first ? `${first.total} article${first.total === 1 ? '' : 's'}` : ''}
        {story ? ' in this story' : month ? ` in ${monthLabel(month)}` : ''}
      </AppText>
      {arcs.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} accessibilityLabel="Ongoing stories">
          <Chip label="All news" onPress={() => { setStory(undefined); }} />
          {arcs.map((a) => (
            <Chip key={a.id} label={story === a.slug ? `${a.title} (selected)` : a.title} onPress={() => setStory(story === a.slug ? undefined : a.slug)} />
          ))}
        </ScrollView>
      ) : null}
      {months.length ? (
        <View style={styles.chipRow}>
          <Chip label={month ? `Month: ${monthLabel(month)}` : 'Any month'} onPress={() => setShowMonths((v) => !v)} />
          {month ? <Chip label="Clear month" onPress={() => setMonth(undefined)} /> : null}
        </View>
      ) : null}
      {showMonths ? (
        <ScrollView style={styles.monthList} contentContainerStyle={styles.chipRow}>
          {months.map((m) => (
            <Chip
              key={m.month}
              label={`${monthLabel(m.month)} (${m.count})`}
              onPress={() => {
                setMonth(m.month);
                setShowMonths(false);
              }}
            />
          ))}
        </ScrollView>
      ) : null}
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
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <NewsCard item={item} onStory={(slug) => setStory(slug)} />
            </View>
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={<Empty message="No articles match." />}
          ListFooterComponent={query.isFetchingNextPage ? <Loading label="Loading more" /> : null}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
          }}
          onEndReachedThreshold={0.6}
          refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => query.refetch()} tintColor={colors.tealInk} />}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgPrimary },
  list: { padding: spacing.md, gap: spacing.md, alignSelf: 'center', width: '100%', maxWidth: maxContentWidth },
  header: { gap: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  monthList: { maxHeight: 220 },
  cardWrap: { marginBottom: spacing.md },
});
