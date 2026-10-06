import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { Pressable, StyleSheet, View } from 'react-native';

import { useFacility } from '@/api/queries';
import type { FacilityPayload, Incident, LawsuitRow, MemorialRow, StaffEntry } from '@/api/types';
import { NewsCard } from '@/components/NewsCard';
import {
  AppText,
  Bullets,
  Card,
  Cited,
  ErrorState,
  Facts,
  LinkRow,
  Loading,
  OpenOnSite,
  Row,
  Screen,
  Section,
  StatusPill,
} from '@/components/ui';
import { aliasLabel } from '@/lib/alias';
import { cleanProse } from '@/lib/citations';
import { openLink } from '@/lib/links';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/typography';

function IncidentList({ items }: { items: Incident[] }) {
  return (
    <>
      {items.map((inc, i) => (
        <Card key={i}>
          {inc.when || inc.kind ? (
            <AppText variant="smallBold" muted>{[inc.when, inc.kind].filter(Boolean).join(' · ')}</AppText>
          ) : null}
          <Cited text={inc.text} sources={[inc, ...(inc.also ?? [])]} />
        </Card>
      ))}
    </>
  );
}

function Lawsuits({ items }: { items: LawsuitRow[] }) {
  return (
    <>
      {items.map((l, i) => (
        <Card key={l.id ?? i}>
          <AppText variant="bodyBold">{l.case_name}</AppText>
          <AppText variant="small" muted>
            {[l.case_number, l.court, l.year, l.status].filter(Boolean).join(' · ')}
          </AppText>
          {l.outcome ? <AppText variant="body">{`Outcome: ${l.outcome}`}</AppText> : null}
          {l.summary ? <AppText variant="body">{l.summary}</AppText> : null}
        </Card>
      ))}
    </>
  );
}

function Memorials({ items }: { items: MemorialRow[] }) {
  return (
    <>
      {items.map((m, i) => (
        <Card key={m.id ?? i}>
          <AppText variant="bodyBold">{m.name}</AppText>
          <Cited
            variant="small"
            muted
            text={[m.age ? `Age ${m.age}` : '', m.date_label, m.cause].filter(Boolean).join(' · ')}
            sources={[{ url: m.source_url, cite: m.source_name }]}
          />
          {m.program ? <AppText variant="body">{m.program}</AppText> : null}
        </Card>
      ))}
    </>
  );
}

function staffGroups(staff: FacilityPayload['staff']): [string, StaffEntry[]][] {
  if (Array.isArray(staff)) return staff.length ? [['Staff', staff]] : [];
  return Object.entries(staff ?? {}).filter(([, v]) => Array.isArray(v) && v.length);
}

function Staff({ staff }: { staff: FacilityPayload['staff'] }) {
  const groups = staffGroups(staff);
  if (!groups.length) return null;
  return (
    <Section title="Staff and leadership">
      {groups.map(([role, entries]) => (
        <View key={role} style={styles.stack}>
          <AppText variant="smallBold" muted style={styles.capitalize}>{role.replace(/([A-Z])/g, ' $1').toLowerCase()}</AppText>
          {entries.map((e, i) => (
            <Card key={i}>
              {e.name && e.text && e.text !== e.name ? (
                <>
                  <AppText variant="bodyBold">{e.name}</AppText>
                  <Cited text={e.text} sources={[e]} />
                </>
              ) : (
                <Cited variant="bodyBold" text={e.name || e.text} sources={[e]} />
              )}
              {e.role ? <AppText variant="small" muted>{e.role}</AppText> : null}
              {(e.career ?? []).map((c, j) => (
                <AppText key={j} variant="small" muted>
                  {[c.label ?? c.name ?? c.text, c.role, c.place, c.years].filter(Boolean).join(' · ')}
                </AppText>
              ))}
            </Card>
          ))}
        </View>
      ))}
    </Section>
  );
}

function FacilityBody({ f }: { f: FacilityPayload }) {
  const router = useRouter();
  const aliasLines = [
    ...(f.current_name ? [aliasLabel('current', f.current_name)] : []),
    ...(f.formerly ?? []).map((n) => aliasLabel('past', n)),
    ...(f.aka ?? []).map((n) => aliasLabel('other', n)),
  ];
  const homes = f.program_homes?.homes ?? [];
  const insp = f.inspections;
  const eraList = f.eras?.list ?? [];
  const forum = f.forum;

  return (
    <Screen>
      <View style={styles.stack}>
        <AppText variant="title" accessibilityRole="header">{f.name}</AppText>
        {aliasLines.map((l) => (
          <AppText key={l} variant="body" muted>{l}</AppText>
        ))}
        <View style={styles.badges}>
          <StatusPill status={f.status} />
          {f.place ? <AppText variant="body">{f.place}</AppText> : null}
        </View>
        {f.operated ? <AppText variant="body">{`Operated: ${f.operated}`}</AppText> : null}
        {f.operator?.name ? (
          f.operator.url ? (
            <Pressable
              onPress={() => openLink(f.operator.url, (href) => router.push(href))}
              accessibilityRole="link"
              accessibilityLabel={`Parent company ${f.operator.name}`}
              style={styles.operatorLink}>
              <AppText variant="body">Run by </AppText>
              <AppText variant="bodyBold" style={styles.link}>{f.operator.name}</AppText>
            </Pressable>
          ) : (
            <AppText variant="body">{`Run by ${f.operator.name}`}</AppText>
          )
        ) : null}
        {f.home_of ? (
          <AppText variant="body" muted>{`One of ${f.home_of.count} homes of ${f.home_of.program.name}`}</AppText>
        ) : homes.length ? (
          <AppText variant="body" muted>{`A program of ${homes.length} licensed homes`}</AppText>
        ) : null}
        <OpenOnSite url={f.url} />
      </View>

      {f.summary ? (
        <Card>
          <AppText variant="body">{cleanProse(f.summary)}</AppText>
        </Card>
      ) : null}

      {f.facts.length ? (
        <Section title="At a glance">
          <Facts facts={f.facts} sources={f.fact_sources} />
        </Section>
      ) : null}

      {f.addresses.length || f.former_locations.length ? (
        <Section title="Where">
          {f.addresses.length ? <Bullets items={f.addresses} /> : null}
          {f.former_locations.map((l, i) => (
            <AppText key={i} variant="small" muted>{`Formerly at ${l.line}${l.years ? ` (${l.years})` : ''}`}</AppText>
          ))}
        </Section>
      ) : null}

      {eraList.length ? (
        <Section title="Names over the years" count={eraList.length}>
          {eraList.map((e) => (
            <Card key={String(e.id)}>
              <AppText variant="bodyBold">{`As ${e.name}`}</AppText>
              {e.years ? <AppText variant="small" muted>{String(e.years)}</AppText> : null}
            </Card>
          ))}
          <AppText variant="small" muted>The web page sorts each name’s records by year.</AppText>
        </Section>
      ) : null}

      {f.practices.length ? (
        <Section title="Reported practices">
          {f.practices.map((g) => (
            <View key={g.label} style={styles.stack}>
              <AppText variant="smallBold" muted>{g.label}</AppText>
              <Bullets items={g.items} />
            </View>
          ))}
        </Section>
      ) : null}

      {f.memorials.length ? (
        <Section title="Deaths on record" count={f.memorials.length}>
          <Memorials items={f.memorials} />
        </Section>
      ) : null}

      {f.incidents.length ? (
        <Section title="Incidents" count={f.incidents.length}>
          <IncidentList items={f.incidents} />
        </Section>
      ) : null}

      {insp ? (
        <Section title="Licensing and inspections" count={insp.total}>
          {insp.summary ? (
            <Facts
              facts={[
                { label: 'Licensed as', value: (insp.summary.licensed_names ?? []).join('; ') },
                { label: 'Program', value: insp.summary.licensed_program_name },
                { label: 'License category', value: insp.summary.program_category },
                { label: 'Executive director', value: insp.summary.executive_director },
                { label: 'Bed capacity', value: insp.summary.bed_capacity },
                { label: 'License expires', value: insp.summary.license_expiration },
                { label: 'Latest licensing action', value: insp.summary.licensing_action },
                { label: 'Phone on file', value: insp.summary.phone },
              ].filter((x) => x.value)}
            />
          ) : null}
          {insp.reports.map((r) => (
            <Card key={r.id}>
              <AppText variant="bodyBold">{r.date_label || r.date}</AppText>
              {r.summary ? <AppText variant="body">{r.summary}</AppText> : null}
              {r.findings.slice(0, 5).map((fi, i) => (
                <AppText key={i} variant="small">{`${fi.label ? `${fi.label}: ` : ''}${fi.text}`}</AppText>
              ))}
              {r.url ? <LinkRow url={r.url} label="Read the report" /> : null}
            </Card>
          ))}
          {insp.more > 0 && insp.page_url ? <LinkRow url={insp.page_url} label={`See all ${insp.total} reports on the website`} /> : null}
        </Section>
      ) : null}

      {f.lawsuits.length ? (
        <Section title="Lawsuits" count={f.lawsuits.length}>
          <Lawsuits items={f.lawsuits} />
        </Section>
      ) : null}

      {f.news.length ? (
        <Section title="In the news" count={f.news.length}>
          {f.news.map((n) => (
            <NewsCard key={n.id} item={n} />
          ))}
        </Section>
      ) : null}

      <Staff staff={f.staff} />

      {f.testimony.length || forum ? (
        <Section title="Survivor accounts">
          {f.testimony.map((t, i) => (
            <Card key={i}>
              <AppText variant="body">{t.text}</AppText>
              <AppText variant="small" muted>
                {`${t.submitted ? 'Submitted by a survivor' : 'Survivor account'}${t.date_label ? `, shared ${t.date_label}` : ''}`}
              </AppText>
            </Card>
          ))}
          {forum?.incidents?.length ? <IncidentList items={forum.incidents} /> : null}
          {forum?.leads?.length ? <Bullets items={forum.leads} /> : null}
          {(forum?.links ?? []).map((l, i) => (
            <LinkRow key={i} url={l.url} label={l.label} />
          ))}
        </Section>
      ) : null}

      {f.notes.length || f.field_notes.length ? (
        <Section title="Notes">
          {f.notes.length ? <Bullets items={f.notes} /> : null}
          {f.field_notes.map((n, i) => (
            <Cited key={i} text={n.label ? `${n.label}: ${n.text}` : n.text} />
          ))}
        </Section>
      ) : null}

      {f.siblings.length ? (
        <Section title={`Other programs run by ${f.operator.name || 'the same company'}`} count={f.siblings.length}>
          {f.siblings.map((s) => (
            <Row key={s.url || s.name} title={s.name} lines={[s.place, s.status]} onPress={s.url ? () => openLink(s.url, (href) => router.push(href)) : undefined} />
          ))}
        </Section>
      ) : null}

      {homes.length ? (
        <Section title="Licensed homes" count={homes.length}>
          {homes.map((h) => (
            <Row
              key={h.id}
              title={h.home_name || h.name}
              lines={[h.place ?? '', h.status ?? '']}
              onPress={h.url ? () => openLink(h.url, (href) => router.push(href)) : undefined}
            />
          ))}
        </Section>
      ) : null}

      {f.videos.length ? (
        <Section title="Video" count={f.videos.length}>
          {f.videos.map((v, i) => (
            <Pressable key={i} onPress={() => openBrowserAsync(v.url)} accessibilityRole="link" accessibilityLabel={`${v.title || 'Video'}. Opens the video.`} style={styles.video}>
              {v.thumb ? <Image source={{ uri: v.thumb }} accessible={false} style={styles.thumb} contentFit="cover" /> : null}
              <AppText variant="bodyBold" style={styles.link}>{v.title || 'Watch'}</AppText>
              {v.source ? <AppText variant="small" muted>{v.source}</AppText> : null}
            </Pressable>
          ))}
        </Section>
      ) : null}

      {f.wiki.length ? (
        <Section title="Reddit wiki entries" count={f.wiki.length}>
          {f.wiki.map((w) => (
            <Card key={w.id}>
              <AppText variant="bodyBold">{w.title}</AppText>
              <AppText variant="small" muted>{[w.place, w.organization, w.years].filter(Boolean).join(' · ')}</AppText>
            </Card>
          ))}
          {f.wiki_url ? <LinkRow url={f.wiki_url} label="Read the wiki on the website" /> : null}
        </Section>
      ) : null}

      {f.profile_links.length || f.resource_links.length ? (
        <Section title="Materials and links">
          {f.profile_links.map((l, i) => (
            <LinkRow key={`p${i}`} url={l.go_url || l.url} label={l.label} />
          ))}
          {f.resource_links.map((g) => (
            <View key={g.kind + g.label} style={styles.stack}>
              <AppText variant="smallBold" muted>{g.label}</AppText>
              {g.links.map((l, i) => (
                <LinkRow key={i} url={l.go_url || l.url} label={l.label} />
              ))}
            </View>
          ))}
        </Section>
      ) : null}

      {f.documents.url ? (
        <Section title="Documents">
          <LinkRow url={f.documents.url} label="Open the document library on the website" />
        </Section>
      ) : null}

      <View style={styles.footer}>
        {f.updated_label ? <AppText variant="small" muted>{`Updated ${f.updated_label}`}</AppText> : null}
        <OpenOnSite url={f.url} />
        {f.submit_url ? <LinkRow url={f.submit_url} label="Know something we are missing? Share it" /> : null}
      </View>
    </Screen>
  );
}

export default function FacilityScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const query = useFacility(slug);
  const name = query.data?.name;

  return (
    <>
      <Stack.Screen options={{ title: name ?? 'Facility' }} />
      {query.isLoading ? (
        <Loading label="Loading facility" />
      ) : query.isError ? (
        <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />
      ) : query.data ? (
        <FacilityBody f={query.data} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  badges: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  operatorLink: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', minHeight: 44 },
  link: { color: colors.tealInk, textDecorationLine: 'underline' },
  capitalize: { textTransform: 'capitalize' },
  video: { gap: spacing.xs, minHeight: 44 },
  thumb: { width: '100%', height: 160, borderRadius: radius.sm, backgroundColor: colors.sand },
  footer: { gap: spacing.sm, marginTop: spacing.lg },
});
