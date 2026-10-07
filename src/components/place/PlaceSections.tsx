import { Fragment, useState, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import type { StatePage, StateTile } from '@/api/types';
import { Button, DirectoryFacilityRow, EdgeRow, HubBox, HubListRow, MoreButton, SectionBlock, useOpenLink } from '@/components/site';

type Lawsuit = StatePage['lawsuits'][number];
type News = StatePage['news'][number];
/** Bills, when the state feed carries them (the theme's kop_state_collect_legislation rows). */
export type Bill = { id?: number; bill_number?: string; bill_title?: string; status?: string; session_year?: string; official_url?: string; full_text_url?: string };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2024-09-15" as "Sep 15, 2024"; anything else as it came. */
export function shortDate(raw?: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw ?? '');
  return m ? `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}` : (raw ?? '');
}

const words = (s?: string) => (s ?? '').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

/** A summary cut at a word, with an ellipsis, so a list stays a list. */
function clip(text: string | undefined, max = 220): string | undefined {
  if (!text || text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ') > max / 2 ? cut.lastIndexOf(' ') : max).replace(/[ ,.;:-]+$/, '')}…`;
}

function Tile({ t }: { t: StateTile }) {
  const open = useOpenLink();
  return (
    <DirectoryFacilityRow
      name={t.name}
      place={t.city}
      operator={t.operator_name}
      years={t.operating_period}
      status={t.status}
      onPress={t.profile_url ? () => open(t.profile_url) : undefined}
    />
  );
}

export function ProgramsSection({ id, title, tiles }: { id: string; title: string; tiles: StateTile[] }) {
  return <SectionBlock id={id} title={title} icon="building" items={tiles} limit={8} renderItem={(t) => <Tile t={t} />} />;
}

export function NewsSection({ news }: { news: News[] }) {
  return (
    <SectionBlock
      id="news"
      title="News"
      icon="newspaper"
      items={news}
      limit={6}
      renderItem={(n) => (
        <HubListRow
          title={n.display_title || n.article_title}
          meta={[n.publication_name, shortDate(n.publication_date)].filter(Boolean).join(' · ')}
          url={n.article_url}
        />
      )}
    />
  );
}

/** A hub block that shows `limit` rows and "N more +" for the rest. */
function Rows<T>({ items, limit, render }: { items: T[]; limit: number; render: (item: T) => ReactNode }) {
  const [all, setAll] = useState(false);
  const hidden = Math.max(0, items.length - limit);
  return (
    <>
      {(all ? items : items.slice(0, limit)).map((item, i) => (
        <Fragment key={i}>{render(item)}</Fragment>
      ))}
      {hidden > 0 ? <MoreButton count={hidden} expanded={all} onPress={() => setAll((a) => !a)} /> : null}
    </>
  );
}

export function LawsuitsSection({ lawsuits }: { lawsuits: Lawsuit[] }) {
  if (!lawsuits.length) return null;
  return (
    <SectionBlock id="lawsuits" title="Lawsuits" icon="scale" count={lawsuits.length}>
      <HubBox tone="teal">
        <Rows
          items={lawsuits}
          limit={5}
          render={(l) => <EdgeRow kind="lawsuit" title={l.case_name} meta={[l.case_number, l.court, l.status]} body={clip(l.summary)} />}
        />
      </HubBox>
    </SectionBlock>
  );
}

export function LegislationSection({ bills }: { bills: Bill[] }) {
  if (!bills.length) return null;
  return (
    <SectionBlock id="legislation" title="Legislation" icon="landmark" count={bills.length}>
      <HubBox tone="orange">
        <Rows
          items={bills}
          limit={5}
          render={(b) => (
            <HubListRow
              title={b.bill_title || b.bill_number || 'Bill'}
              meta={[b.bill_number, words(b.status), b.session_year].filter(Boolean).join(' · ')}
              url={b.official_url || b.full_text_url}
            />
          )}
        />
      </HubBox>
    </SectionBlock>
  );
}

export function InspectionsSection({ url }: { url: string }) {
  const open = useOpenLink();
  return (
    <SectionBlock id="inspections" title="State inspection reports" icon="clipboard">
      <Button label="Read the state's reports" variant="secondary" icon="clipboard" onPress={() => open(url)} style={styles.button} />
    </SectionBlock>
  );
}

const styles = StyleSheet.create({
  button: { alignSelf: 'flex-start' },
});
