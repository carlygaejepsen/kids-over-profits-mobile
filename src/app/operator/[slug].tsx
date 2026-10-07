import { Stack, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useOperator, useOperatorByName } from '@/api/queries';
import type { OperatorPayload } from '@/api/types';
import { PageFooter, PageScroll, Slot, usePageJump } from '@/components/operator/PageScroll';
import { HistorySection, OwnershipSection, PeopleSection, ProgramsSection, YearSection } from '@/components/operator/Narrative';
import {
  DeathsSection,
  DocumentsSection,
  LawsuitsSection,
  NewsSection,
  NotesSection,
  WebsitesSection,
} from '@/components/operator/Records';
import { aliasLines, glanceRows, placeLine, sectionsOf, statTiles } from '@/components/operator/model';
import { GlanceBox, JumpPills, RecordHeader, StatTiles } from '@/components/site';
import { ErrorState, Loading, OpenOnSite } from '@/components/ui';
import { spacing, type } from '@/theme/typography';

const SECTIONS: Record<string, (props: { o: OperatorPayload }) => ReactNode> = {
  history: HistorySection,
  years: YearSection,
  programs: ProgramsSection,
  people: PeopleSection,
  ownership: OwnershipSection,
  news: NewsSection,
  lawsuits: LawsuitsSection,
  deaths: DeathsSection,
  documents: DocumentsSection,
  websites: WebsitesSection,
  notes: NotesSection,
};

function OperatorBody({ o }: { o: OperatorPayload }) {
  const jump = usePageJump();
  const sections = sectionsOf(o);
  const glance = glanceRows(o);

  return (
    <PageScroll jump={jump}>
      <RecordHeader eyebrow="Parent company profile" title={o.name} aliases={aliasLines(o)} place={placeLine(o)} status={o.status} />
      {o.summary ? <Text style={styles.summary}>{o.summary}</Text> : null}
      <StatTiles tiles={statTiles(o)} onJump={jump.to} />
      {sections.length > 1 ? <JumpPills items={sections} onJump={jump.to} /> : null}
      {glance.length ? <GlanceBox rows={glance} /> : null}

      <View onLayout={jump.onBody}>
        {sections.map(({ key }) => {
          const Section = SECTIONS[key];
          return (
            <Slot key={key} id={key} jump={jump}>
              <Section o={o} />
            </Slot>
          );
        })}
      </View>

      <PageFooter>
        {o.updated_label ? <Text style={styles.updated}>{`Updated ${o.updated_label}.`}</Text> : null}
        <OpenOnSite url={o.url} />
      </PageFooter>
    </PageScroll>
  );
}

export default function OperatorScreen() {
  const { slug, name } = useLocalSearchParams<{ slug: string; name?: string }>();
  const byName = slug === 'by-name';
  const bySlug = useOperator(byName ? undefined : slug);
  const byNameQuery = useOperatorByName(byName ? name : undefined);
  const query = byName ? byNameQuery : bySlug;

  return (
    <>
      <Stack.Screen options={{ title: query.data?.name ?? 'Company' }} />
      {query.isLoading ? (
        <Loading label="Loading company" />
      ) : query.isError ? (
        <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />
      ) : query.data ? (
        <OperatorBody o={query.data} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  summary: { ...type.lead, marginBottom: spacing.md },
  updated: { ...type.meta },
});
