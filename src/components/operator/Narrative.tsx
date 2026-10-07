import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { OperatorPayload } from '@/api/types';
import {
  DirectoryFacilityRow,
  HubListRow,
  InlineSources,
  MoreButton,
  PersonCard,
  SectionBlock,
  Timeline,
  useOpenLink,
} from '@/components/site';
import { parseMarkdownLinks } from '@/lib/markdownLinks';
import { colors } from '@/theme/colors';
import { spacing, type } from '@/theme/typography';
import { peopleList, programList, type Program } from './model';

const YEARS_SHOWN = 12;

/** A history paragraph: the words, and the [words](address) links the site writes as underlined teal links. */
function Paragraph({ text }: { text: string }) {
  const open = useOpenLink();
  return (
    <Text style={styles.paragraph}>
      {parseMarkdownLinks(text).map((r, i) =>
        r.url ? (
          <Text key={i} accessibilityRole="link" onPress={() => open(r.url)} style={styles.link}>
            {r.text}
          </Text>
        ) : (
          r.text
        ),
      )}
    </Text>
  );
}

export function HistorySection({ o }: { o: OperatorPayload }) {
  const history = o.history;
  if (!history?.paragraphs?.length) return null;
  return (
    <SectionBlock id="history" title="History" icon="book">
      {history.paragraphs.map((p, i) => (
        <Paragraph key={i} text={p} />
      ))}
      {history.sources?.length ? (
        <Text style={styles.sources}>
          {'Sources'}
          <InlineSources items={history.sources.map((s) => ({ url: s.url, cite: s.label }))} />
        </Text>
      ) : null}
    </SectionBlock>
  );
}

export function YearSection({ o }: { o: OperatorPayload }) {
  const [all, setAll] = useState(false);
  const items = (o.timeline ?? [])
    .map((t) => ({ when: t.year, text: t.text || t.label || '' }))
    .filter((t) => t.text);
  if (!items.length) return null;
  const hidden = Math.max(0, items.length - YEARS_SHOWN);
  return (
    <SectionBlock id="years" title="Year by year" icon="calendar">
      <Timeline items={all ? items : items.slice(0, YEARS_SHOWN)} />
      {hidden > 0 ? <MoreButton count={hidden} expanded={all} onPress={() => setAll((a) => !a)} /> : null}
    </SectionBlock>
  );
}

function ProgramRow({ p, style }: { p: Program; style?: { marginLeft: number } }) {
  const open = useOpenLink();
  const status = p.status && p.status !== 'Unknown' ? p.status : undefined;
  return (
    <DirectoryFacilityRow
      name={p.name}
      place={p.place}
      years={p.years}
      status={status}
      style={style}
      onPress={p.has_page && p.url ? () => open(p.url) : undefined}
    />
  );
}

export function ProgramsSection({ o }: { o: OperatorPayload }) {
  return (
    <SectionBlock
      id="programs"
      title="Programs it has run"
      icon="building"
      items={programList(o)}
      limit={10}
      renderItem={(p) => (
        <View style={styles.program}>
          <ProgramRow p={p} />
          {(p.homes ?? []).map((h) => (
            <ProgramRow key={h.id} p={h} style={styles.home} />
          ))}
        </View>
      )}
    />
  );
}

export function PeopleSection({ o }: { o: OperatorPayload }) {
  return (
    <SectionBlock id="people" title="People" icon="users" items={peopleList(o)} limit={6} renderItem={(p) => <PersonCard entry={p} />} />
  );
}

export function OwnershipSection({ o }: { o: OperatorPayload }) {
  const groups = [
    { title: 'Owned by', list: o.parents ?? [] },
    { title: 'Companies it has owned', list: o.subsidiaries ?? [] },
  ].filter((g) => g.list.length);
  if (!groups.length) return null;
  return (
    <SectionBlock id="ownership" title="Ownership" icon="landmark">
      {groups.map((g) => (
        <View key={g.title}>
          <Text style={styles.subhead}>{g.title}</Text>
          {g.list.map((c, i) => (
            <HubListRow key={`${c.name}-${i}`} title={c.name} url={c.url} />
          ))}
        </View>
      ))}
    </SectionBlock>
  );
}

const styles = StyleSheet.create({
  paragraph: { ...type.body, lineHeight: 26 },
  link: { color: colors.tealInk, textDecorationLine: 'underline' },
  sources: { ...type.meta },
  program: { gap: spacing.sm },
  home: { marginLeft: spacing.md },
  subhead: { ...type.label, marginBottom: spacing.xs },
});
