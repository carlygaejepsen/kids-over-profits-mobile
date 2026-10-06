import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { useFacilitiesIndex } from '@/api/queries';
import { AppText, Empty, ErrorState, Loading, Row, Screen } from '@/components/ui';
import { colors } from '@/theme/colors';
import { radius, spacing, touchTarget } from '@/theme/typography';

export default function CompaniesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('');
  const index = useFacilitiesIndex();

  const companies = useMemo(() => {
    const projects = index.data?.projects ?? {};
    return Object.entries(projects)
      .filter(([, p]) => (p.category ?? p.data?.category) === 'companies')
      .map(([key, p]) => ({
        key,
        name: (p.data?.operator?.name as string | undefined) || p.name || p.label || key,
        count: p.data?.facilities?.length ?? 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [index.data]);

  const shown = companies.filter((c) => c.name.toLowerCase().includes(filter.trim().toLowerCase()));

  return (
    <Screen>
      <AppText variant="small" muted>
        Parent companies that own or run programs. Open one for its history, programs, people and news.
      </AppText>
      <View style={styles.inputWrap}>
        <TextInput
          value={filter}
          onChangeText={setFilter}
          placeholder="Filter companies"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Filter the list of companies"
          autoCorrect={false}
          style={styles.input}
        />
      </View>
      {index.isLoading ? (
        <Loading label="Loading companies" />
      ) : index.isError ? (
        <ErrorState message={(index.error as Error).message} onRetry={() => index.refetch()} />
      ) : shown.length === 0 ? (
        <Empty message="No company matches." />
      ) : (
        shown.map((c) => (
          <Row
            key={c.key}
            title={c.name}
            lines={[`${c.count} ${c.count === 1 ? 'program' : 'programs'} on record`]}
            onPress={() => router.push(`/operator/by-name?name=${encodeURIComponent(c.name)}` as Href)}
          />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  inputWrap: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.tealInk },
  input: { minHeight: touchTarget, paddingHorizontal: spacing.md, fontSize: 16, color: colors.textPrimary },
});
