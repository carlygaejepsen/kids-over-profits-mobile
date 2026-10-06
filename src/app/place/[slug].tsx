import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { useStatePage } from '@/api/queries';
import type { StateTile } from '@/api/types';
import { AppText, Card, Empty, ErrorState, LinkRow, Loading, OpenOnSite, Row, Screen, Section, StatusPill } from '@/components/ui';
import { placeBySlug } from '@/data/states';
import { openLink } from '@/lib/links';
import { SITE } from '@/api/client';
import { spacing } from '@/theme/typography';

function Tiles({ tiles, onOpen }: { tiles: StateTile[]; onOpen: (t: StateTile) => void }) {
  return (
    <>
      {tiles.map((t, i) => (
        <Row
          key={`${t.name}-${i}`}
          title={t.name}
          lines={[[t.city, t.state].filter(Boolean).join(', '), t.operator_name, t.operating_period]}
          trailing={<StatusPill status={t.status} />}
          onPress={t.profile_url ? () => onOpen(t) : undefined}
        />
      ))}
    </>
  );
}

export default function PlaceScreen() {
  const router = useRouter();
  const { slug, kind } = useLocalSearchParams<{ slug: string; kind?: string }>();
  const place = slug ? placeBySlug(slug) : undefined;
  const query = useStatePage(slug, kind === 'country' || place?.kind === 'country' ? 'country' : 'state');
  const data = query.data;
  const open = (t: StateTile) => openLink(t.profile_url, (href) => router.push(href));
  const siteUrl = `${SITE}/${slug}/`;

  return (
    <>
      <Stack.Screen options={{ title: place?.name ?? data?.state?.name ?? 'Place' }} />
      {query.isLoading ? (
        <Loading label="Loading" />
      ) : query.isError ? (
        <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />
      ) : data ? (
        <Screen>
          <View style={styles.stack}>
            <AppText variant="title" accessibilityRole="header">{data.state.name}</AppText>
            <AppText variant="body" muted>
              {`${data.facilities.total} facilities on record, ${data.counts.news ?? 0} news stories, ${data.counts.lawsuits ?? 0} lawsuits`}
            </AppText>
            <OpenOnSite url={siteUrl} />
          </View>

          {data.facilities.active.length ? (
            <Section title="Open or active" count={data.facilities.active.length}>
              <Tiles tiles={data.facilities.active} onOpen={open} />
            </Section>
          ) : null}
          {data.facilities.closed.length ? (
            <Section title="Closed" count={data.facilities.closed.length}>
              <Tiles tiles={data.facilities.closed} onOpen={open} />
            </Section>
          ) : null}
          {data.facilities.total === 0 ? <Empty message="No facilities on record here yet." /> : null}

          {data.lawsuits.length ? (
            <Section title="Lawsuits" count={data.lawsuits.length}>
              {data.lawsuits.slice(0, 30).map((l) => (
                <Card key={l.id}>
                  <AppText variant="bodyBold">{l.case_name}</AppText>
                  <AppText variant="small" muted>{[l.case_number, l.court, l.status].filter(Boolean).join(' · ')}</AppText>
                  {l.summary ? <AppText variant="body" numberOfLines={4}>{l.summary}</AppText> : null}
                </Card>
              ))}
            </Section>
          ) : null}

          {data.news.length ? (
            <Section title="News" count={data.news.length}>
              {data.news.slice(0, 30).map((n) => (
                <Row
                  key={n.id}
                  title={n.display_title || n.article_title}
                  lines={[[n.publication_name, n.publication_date].filter(Boolean).join(' · ')]}
                  onPress={n.article_url ? () => openBrowserAsync(n.article_url) : undefined}
                />
              ))}
            </Section>
          ) : null}

          {data.inspections.has_reports && data.inspections.page_url ? (
            <Section title="Inspection reports">
              <LinkRow url={data.inspections.page_url} label="Read the state's inspection reports on the website" />
            </Section>
          ) : null}
        </Screen>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
});
