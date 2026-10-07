import { StyleSheet, Text, View } from 'react-native';

import type { FacilityPayload } from '@/api/types';
import { colors } from '@/theme/colors';
import { spacing, type } from '@/theme/typography';
import { Button, HubListRow, NoticeBox, SectionBlock, type TimelineItem, useOpenLink } from '../site';
import type { SectionProps } from './model';
import { Bullets, LimitedTimeline } from './parts';

export function DocumentsSection({ f, onLayoutY }: SectionProps & { f: FacilityPayload }) {
  const open = useOpenLink();
  if (!f.documents?.url) return null;
  return (
    <SectionBlock id="documents" title="Documents" icon="file-text" onLayoutY={onLayoutY}>
      <Button
        variant="secondary"
        icon="file-text"
        label="Open the document library on the website"
        onPress={() => open(f.documents.url)}
        style={styles.button}
      />
    </SectionBlock>
  );
}

/** Survivors' own accounts, each in the site's midnight-framed notice. */
export function TestimonySection({ f, onLayoutY }: SectionProps & { f: FacilityPayload }) {
  return (
    <SectionBlock id="testimony" title="Survivor testimony" icon="book" items={f.testimony} onLayoutY={onLayoutY}
      renderItem={(t) => (
        <NoticeBox variant="testimony">
          <Text style={styles.account}>{t.text}</Text>
          <Text style={styles.meta}>
            {`${t.submitted ? 'Submitted by a survivor' : 'Survivor account'}${t.date_label ? `, shared ${t.date_label}` : ''}`}
          </Text>
        </NoticeBox>
      )}
    />
  );
}

export function ForumSection({ f, onLayoutY }: SectionProps & { f: FacilityPayload }) {
  const forum = f.forum;
  if (!forum || !(forum.incidents?.length || forum.leads?.length || forum.links?.length)) return null;
  const incidents: TimelineItem[] = (forum.incidents ?? []).map((i) => ({
    when: i.when,
    kind: i.kind,
    text: i.text,
    sources: [i, ...(i.also ?? [])],
  }));
  return (
    <SectionBlock id="forum" title="Reported on survivor forums" icon="users" onLayoutY={onLayoutY}>
      {incidents.length ? <LimitedTimeline items={incidents} /> : null}
      {forum.leads?.length ? <Bullets items={forum.leads} /> : null}
      {(forum.links ?? []).map((l, i) => (
        <HubListRow key={i} title={l.label} url={l.url} />
      ))}
    </SectionBlock>
  );
}

export function NotesSection({ f, onLayoutY }: SectionProps & { f: FacilityPayload }) {
  if (!f.notes.length && !f.field_notes.length) return null;
  return (
    <SectionBlock id="notes" title="Research notes" icon="lightbulb" onLayoutY={onLayoutY}>
      <Bullets items={f.notes} />
      {f.field_notes.length ? (
        <View style={styles.field}>
          {f.field_notes.map((n, i) => (
            <Text key={i} style={styles.body}>
              {n.label ? <Text style={styles.bold}>{`${n.label}: `}</Text> : null}
              {n.text}
            </Text>
          ))}
        </View>
      ) : null}
    </SectionBlock>
  );
}

export function WikiSection({ f, onLayoutY }: SectionProps & { f: FacilityPayload }) {
  return (
    <SectionBlock id="wiki" title="Wiki entries" icon="book" items={f.wiki} onLayoutY={onLayoutY}
      renderItem={(w) => (
        <HubListRow title={w.title} meta={[w.organization, w.place, w.years].filter(Boolean).join(' | ')} url={f.wiki_url} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  button: { alignSelf: 'flex-start' },
  account: { ...type.body },
  meta: { ...type.meta },
  field: { gap: spacing.sm, marginTop: spacing.xs },
  body: { ...type.body },
  bold: { ...type.bodyBold, color: colors.midnight },
});
