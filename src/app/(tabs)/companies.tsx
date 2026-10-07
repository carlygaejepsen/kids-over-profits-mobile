import { useRouter, type Href } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOperators } from '@/api/queries';
import type { OperatorListItem } from '@/api/types';
import { CompanyTile, HubHeader } from '@/components/site';
import { AlphabetBar } from '@/components/tabs/AlphabetBar';
import { Note } from '@/components/tabs/Note';
import { SearchField } from '@/components/tabs/SearchField';
import { pageColumn } from '@/components/tabs/TabPage';
import { ErrorState, Loading } from '@/components/ui';
import { stateByCode } from '@/data/states';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/typography';

type Company = { key: string; slug: string; name: string; line: string; count: number; letter: string };

const letterOf = (name: string) => {
  const c = name.trim().charAt(0).toUpperCase();
  return c >= 'A' && c <= 'Z' ? c : '#';
};

/** Where a company's programs are ("Arizona, Utah", "5 places"), else its years ("Founded 2005"). */
export function describe(c: Pick<OperatorListItem, 'places' | 'years'>): string {
  const places = c.places.map((p) => stateByCode(p)?.name ?? p);
  if (places.length && places.length <= 2) return places.join(', ');
  if (places.length) return places.every((p, i) => stateByCode(c.places[i])) ? `${places.length} states` : `${places.length} places`;
  return c.years;
}

export default function CompaniesScreen() {
  const router = useRouter();
  const list = useRef<FlatList<Company | null>>(null);
  const [filter, setFilter] = useState('');
  const index = useOperators();

  const companies = useMemo<Company[]>(
    () =>
      (index.data?.items ?? [])
        .map((c) => ({ key: String(c.id), slug: c.slug, name: c.name, line: describe(c), count: c.programs, letter: letterOf(c.name) }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [index.data],
  );

  const shown = companies.filter((c) => c.name.toLowerCase().includes(filter.trim().toLowerCase()));
  // Two columns: an odd last company gets an empty cell so its tile keeps the column width.
  const cells: (Company | null)[] = shown.length % 2 ? [...shown, null] : shown;
  const letters = [...new Set(shown.map((c) => c.letter))];
  const total = companies.length;
  const count = `${shown.length === total ? '' : `${shown.length} of `}${total} ${total === 1 ? 'company' : 'companies'}`;

  const jump = (letter: string) => {
    const at = shown.findIndex((c) => c.letter === letter);
    if (at >= 0) list.current?.scrollToIndex({ index: Math.floor(at / 2), animated: true });
  };

  const header = (
    <View style={styles.header}>
      <HubHeader
        eyebrow="Directory"
        title="Parent companies"
        standfirst="The companies that own and run troubled teen programs."
        counts={total ? [count] : []}
      />
      <SearchField value={filter} onChangeText={setFilter} placeholder="Filter companies" label="Filter the list of companies" />
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <AlphabetBar letters={letters} onPick={jump} />
      {index.isLoading ? (
        <Loading label="Loading companies" />
      ) : index.isError ? (
        <ErrorState message={(index.error as Error).message} onRetry={() => index.refetch()} />
      ) : (
        <FlatList
          ref={list}
          data={cells}
          numColumns={2}
          keyExtractor={(c, i) => c?.key ?? `empty-${i}`}
          columnWrapperStyle={styles.columns}
          ItemSeparatorComponent={Gap}
          ListHeaderComponent={header}
          ListEmptyComponent={<Note>No company matches.</Note>}
          keyboardShouldPersistTaps="handled"
          onScrollToIndexFailed={(info) => {
            list.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
            setTimeout(() => list.current?.scrollToIndex({ index: info.index, animated: true }), 300);
          }}
          renderItem={({ item }) => (
            <View style={styles.cell}>
              {item ? (
                <CompanyTile
                  style={styles.tile}
                  name={item.name}
                  line={item.line}
                  programs={item.count}
                  onPress={() => router.push(`/operator/${encodeURIComponent(item.slug)}` as Href)}
                />
              ) : null}
            </View>
          )}
          contentContainerStyle={pageColumn}
        />
      )}
    </SafeAreaView>
  );
}

const Gap = () => <View style={styles.gap} />;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: { marginBottom: spacing.md },
  columns: { gap: spacing.md - 4 },
  cell: { flex: 1, minWidth: 0 },
  tile: { flex: 1 },
  gap: { height: spacing.md - 4 },
});
