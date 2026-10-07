import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FacilityPayload } from '@/api/types';
import { colors } from '@/theme/colors';
import { radius, spacing, type } from '@/theme/typography';
import {
  DirectoryFacilityRow,
  EdgeRow,
  FindingCard,
  HubListRow,
  RecordNewsCard,
  SectionBlock,
  useOpenLink,
  type TimelineItem,
} from '../site';
import { homeRows, violationsOf, type SectionProps } from './model';
import { Lead, LimitedTimeline, card } from './parts';

export function ErasSection({ f, onLayoutY }: SectionProps & { f: FacilityPayload }) {
  const list = f.eras?.list ?? [];
  if (!list.length) return null;
  return (
    <SectionBlock id="eras" title="Names over the years" icon="book" items={list} onLayoutY={onLayoutY}
      renderItem={(e) => {
        const operators = Array.isArray(e.operators) ? (e.operators as string[]).join(', ') : '';
        const meta = [e.years, operators].filter(Boolean).join(' | ');
        return <HubListRow title={`As ${e.name}`} meta={meta} url={typeof e.url === 'string' ? e.url : undefined} />;
      }}>
      <Lead>The website sorts each name’s records by year.</Lead>
    </SectionBlock>
  );
}

export function HomesSection({ f, onLayoutY }: SectionProps & { f: FacilityPayload }) {
  const { isProgram, homes } = homeRows(f);
  const program = f.home_of?.program;
  const open = useOpenLink();
  if (!homes.length) return null;
  return (
    <SectionBlock
      id="homes"
      title={isProgram ? 'Homes' : `Other homes of ${program?.name ?? 'this program'}`}
      icon="home"
      items={homes}
      onLayoutY={onLayoutY}
      renderItem={(h) => <HubListRow title={h.title} meta={h.meta} url={h.url} />}>
      {!isProgram && program?.url ? (
        <HubListRow title="The whole program, with every home's news, lawsuits and serious findings" onPress={() => open(program.url)} />
      ) : null}
    </SectionBlock>
  );
}

export function MemorialsSection({ f, onLayoutY }: SectionProps & { f: FacilityPayload }) {
  const open = useOpenLink();
  return (
    <SectionBlock id="memorials" title="Deaths on record" icon="candle" tone="grave" items={f.memorials} onLayoutY={onLayoutY}
      renderItem={(m) => (
        <EdgeRow
          kind="death"
          title={m.name}
          meta={[m.age ? `age ${m.age}` : '', m.date_label || m.date, m.cause]}
          body={m.program && m.program !== f.name ? m.program : undefined}
          sources={[{ url: m.source_url, cite: m.source_name }]}
          onPress={m.kop_url || f.memorial_url ? () => open(m.kop_url || f.memorial_url) : undefined}
        />
      )}
    />
  );
}

export function ViolationsSection({ f, onLayoutY }: SectionProps & { f: FacilityPayload }) {
  return (
    <SectionBlock id="violations" title="Serious violations" icon="alert-triangle" tone="grave" items={violationsOf(f)} onLayoutY={onLayoutY}
      renderItem={(v) => (
        <FindingCard
          severity={v.category === 'death' || v.category === 'sexual_abuse' ? 'grave' : v.severe ? 'severe' : 'other'}
          tag={v.label}
          date={v.date_label ? `Inspected ${v.date_label}` : undefined}
          quote={v.short || v.excerpt || ''}
          url={v.source_url}
        />
      )}
    />
  );
}

export function LawsuitsSection({ f, onLayoutY }: SectionProps & { f: FacilityPayload }) {
  return (
    <SectionBlock id="lawsuits" title="Lawsuits" icon="scale" items={f.lawsuits} onLayoutY={onLayoutY}
      renderItem={(l) => (
        <EdgeRow
          kind="lawsuit"
          title={l.case_name}
          meta={[l.case_number, l.court, l.year, l.status]}
          body={[l.outcome ? `Outcome: ${l.outcome}` : '', l.summary].filter(Boolean).join('\n\n') || undefined}
        />
      )}
    />
  );
}

export function IncidentsSection({ f, onLayoutY }: SectionProps & { f: FacilityPayload }) {
  const items: TimelineItem[] = f.incidents.map((i) => ({ when: i.when, kind: i.kind, text: i.text, sources: [i, ...(i.also ?? [])] }));
  if (!items.length) return null;
  return (
    <SectionBlock id="incidents" title="Incidents on record" icon="siren" count={items.length} onLayoutY={onLayoutY}>
      <LimitedTimeline items={items} />
    </SectionBlock>
  );
}

export function NewsSection({ f, onLayoutY }: SectionProps & { f: FacilityPayload }) {
  return (
    <SectionBlock id="news" title="News coverage" icon="newspaper" items={f.news} limit={4} onLayoutY={onLayoutY}
      renderItem={(n) => <RecordNewsCard item={n} />} />
  );
}

export function VideosSection({ f, onLayoutY }: SectionProps & { f: FacilityPayload }) {
  const open = useOpenLink();
  return (
    <SectionBlock id="videos" title="Video" icon="tv" items={f.videos} onLayoutY={onLayoutY}
      renderItem={(v) => (
        <Pressable
          onPress={() => open(v.url)}
          accessibilityRole="link"
          accessibilityLabel={`${v.title || 'Video'}. Opens the video.`}
          style={({ pressed }) => [styles.video, pressed && styles.pressed]}>
          {v.thumb ? <Image source={{ uri: v.thumb }} accessible={false} contentFit="cover" style={styles.thumb} /> : null}
          <View style={styles.videoText}>
            <Text style={styles.videoTitle}>{v.title || 'Watch'}</Text>
            {v.source ? <Text style={styles.meta}>{v.source}</Text> : null}
          </View>
        </Pressable>
      )}
    />
  );
}

export function SiblingsSection({ f, onLayoutY }: SectionProps & { f: FacilityPayload }) {
  const open = useOpenLink();
  return (
    <SectionBlock id="related" title={`Other programs run by ${f.operator?.name || 'the same operator'}`} icon="building" items={f.siblings} onLayoutY={onLayoutY}
      renderItem={(s) => (
        <DirectoryFacilityRow
          name={s.name}
          place={s.place}
          status={s.status && s.status !== 'Unknown' ? s.status : null}
          onPress={s.url ? () => open(s.url) : undefined}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  video: { ...card, overflow: 'hidden' },
  pressed: { backgroundColor: colors.sand },
  thumb: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.sand, borderTopLeftRadius: radius.tile, borderTopRightRadius: radius.tile },
  videoText: { padding: 10, gap: spacing.xxs },
  videoTitle: { ...type.cardTitle },
  meta: { ...type.meta },
});
