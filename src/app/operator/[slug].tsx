import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { useOperator, useOperatorByName } from '@/api/queries';
import type { OperatorFacility, OperatorPayload } from '@/api/types';
import { NewsCard } from '@/components/NewsCard';
import { AppText, Bullets, Card, ErrorState, Facts, LinkRow, Loading, OpenOnSite, Row, Screen, Section, StatusPill } from '@/components/ui';
import { aliasLabel } from '@/lib/alias';
import { openLink } from '@/lib/links';
import { parseMarkdownLinks } from '@/lib/markdownLinks';
import { urlLabel } from '@/lib/urlLabel';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/typography';

/** A history paragraph: plain words with the [words](address) links the site writes drawn as links. */
function Paragraph({ text }: { text: string }) {
  const runs = parseMarkdownLinks(text);
  return (
    <AppText variant="body">
      {runs.map((r, i) =>
        r.url ? (
          <AppText key={i} variant="body" style={styles.inlineLink} onPress={() => openBrowserAsync(r.url!)} accessibilityRole="link">
            {r.text}
          </AppText>
        ) : (
          r.text
        ),
      )}
    </AppText>
  );
}

function ProgramRow({ f, onOpen }: { f: OperatorFacility; onOpen: (url: string) => void }) {
  return (
    <Row
      title={f.name}
      lines={[f.place, f.years]}
      trailing={<StatusPill status={f.status} />}
      onPress={f.has_page && f.url ? () => onOpen(f.url) : undefined}
    />
  );
}

function OperatorBody({ o }: { o: OperatorPayload }) {
  const router = useRouter();
  const open = (url: string) => openLink(url, (href) => router.push(href));
  const aliases = [
    ...(o.current_name ? [aliasLabel('current', o.current_name)] : []),
    ...(o.aka ?? []).map((n) => aliasLabel('other', n)),
  ];
  const leaders = o.people?.leaders ?? [];
  const others = o.people?.others ?? [];

  return (
    <Screen>
      <View style={styles.stack}>
        <AppText variant="title" accessibilityRole="header">{o.name}</AppText>
        {o.full_name && o.full_name !== o.name ? <AppText variant="body" muted>{o.full_name}</AppText> : null}
        {aliases.map((a) => (
          <AppText key={a} variant="body" muted>{a}</AppText>
        ))}
        <StatusPill status={o.status} />
        <OpenOnSite url={o.url} />
      </View>

      {o.summary ? (
        <Card>
          <AppText variant="body">{o.summary}</AppText>
        </Card>
      ) : null}

      {o.facts.length ? (
        <Section title="At a glance">
          <Facts facts={o.facts} />
        </Section>
      ) : null}

      {o.parents.length || o.subsidiaries.length ? (
        <Section title="Related companies">
          {o.parents.map((p) => (
            <Row key={p.url || p.name} title={p.name} lines={['Parent company']} onPress={p.url ? () => open(p.url) : undefined} />
          ))}
          {o.subsidiaries.map((p) => (
            <Row key={p.url || p.name} title={p.name} lines={['Subsidiary']} onPress={p.url ? () => open(p.url) : undefined} />
          ))}
        </Section>
      ) : null}

      {o.history && o.history.paragraphs.length ? (
        <Section title="History">
          {o.history.paragraphs.map((p, i) => (
            <Paragraph key={i} text={p} />
          ))}
          {o.history.sources.map((s, i) => (
            <LinkRow key={i} url={s.url} label={s.label} />
          ))}
        </Section>
      ) : null}

      {o.program_tree.length ? (
        <Section title="Programs" count={o.program_tree.length}>
          <AppText variant="small" muted>{`${o.open_count} open, in ${o.place_count} ${o.place_count === 1 ? 'place' : 'places'}`}</AppText>
          {o.program_tree.map((f) => (
            <View key={f.id} style={styles.stack}>
              <ProgramRow f={f} onOpen={open} />
              {(f.homes ?? []).map((h) => (
                <View key={h.id} style={styles.indent}>
                  <ProgramRow f={h} onOpen={open} />
                </View>
              ))}
            </View>
          ))}
        </Section>
      ) : o.facilities.length ? (
        <Section title="Programs" count={o.facilities.length}>
          {o.facilities.map((f) => (
            <ProgramRow key={f.id} f={f} onOpen={open} />
          ))}
        </Section>
      ) : null}

      {o.memorials.length ? (
        <Section title="Deaths on record" count={o.memorials.length}>
          {o.memorials.map((m, i) => (
            <Card key={i}>
              <AppText variant="bodyBold">{m.name}</AppText>
              <AppText variant="small" muted>{[m.age ? `Age ${m.age}` : '', m.date_label, m.cause].filter(Boolean).join(' · ')}</AppText>
              {m.program ? <AppText variant="body">{m.program}</AppText> : null}
            </Card>
          ))}
        </Section>
      ) : null}

      {o.lawsuits.length ? (
        <Section title="Lawsuits" count={o.lawsuits.length}>
          {o.lawsuits.map((l, i) => (
            <Card key={i}>
              <AppText variant="bodyBold">{l.case_name}</AppText>
              <AppText variant="small" muted>{[l.case_number, l.court, l.year, l.status].filter(Boolean).join(' · ')}</AppText>
              {l.summary ? <AppText variant="body">{l.summary}</AppText> : null}
            </Card>
          ))}
        </Section>
      ) : null}

      {o.news.length ? (
        <Section title="In the news" count={o.news.length}>
          {o.news.map((n) => (
            <NewsCard key={n.id} item={n} />
          ))}
        </Section>
      ) : null}

      {o.timeline.length ? (
        <Section title="Timeline">
          {o.timeline.map((t, i) => (
            <Card key={i}>
              <AppText variant="smallBold" muted>{String(t.year ?? '')}</AppText>
              <AppText variant="body">{t.text || t.label || ''}</AppText>
            </Card>
          ))}
        </Section>
      ) : null}

      {leaders.length || others.length ? (
        <Section title="People" count={leaders.length + others.length}>
          {[...leaders, ...others].map((p, i) => (
            <Card key={`${p.name}-${i}`}>
              <AppText variant="bodyBold">{p.name}</AppText>
              {p.role ? <AppText variant="small" muted>{p.role}</AppText> : null}
            </Card>
          ))}
        </Section>
      ) : null}

      {o.notes.length ? (
        <Section title="Notes">
          <Bullets items={o.notes} />
        </Section>
      ) : null}

      {o.websites.length ? (
        <Section title="Websites">
          {o.websites.map((w, i) => (
            <LinkRow key={i} url={w.go_url || w.url} label={w.label || urlLabel(w.url)} />
          ))}
        </Section>
      ) : null}

      <View style={styles.footer}>
        {o.updated_label ? <AppText variant="small" muted>{`Updated ${o.updated_label}`}</AppText> : null}
        {o.documents.url ? <LinkRow url={o.documents.url} label="Documents on the website" /> : null}
        <OpenOnSite url={o.url} />
      </View>
    </Screen>
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
  stack: { gap: spacing.sm },
  indent: { marginLeft: spacing.lg },
  footer: { gap: spacing.sm, marginTop: spacing.lg },
  inlineLink: { color: colors.tealInk, textDecorationLine: 'underline' },
});
