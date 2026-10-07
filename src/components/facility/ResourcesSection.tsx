import type { FacilityPayload } from '@/api/types';
import { urlLabel } from '@/lib/urlLabel';
import { HubListRow, SectionBlock } from '../site';
import type { SectionProps } from './model';
import { Lead, SubHead } from './parts';

type Row = { title: string; url?: string; meta?: string; head?: string; lead?: string };

/** The words for a link, never its address. */
const words = (label: string | undefined, url: string) => (label && !/^https?:\/\//i.test(label) ? label : urlLabel(url));

/**
 * The materials the project holds, by group (not online, so no links), then the program's own links,
 * then each group of research links under its sub-head (template: the 'resources' section).
 */
export function ResourcesSection({ f, onLayoutY }: SectionProps & { f: FacilityPayload }) {
  const rows: Row[] = [];
  const groups = new Map<string, FacilityPayload['resources']>();
  for (const r of f.resources ?? []) {
    if (!groups.has(r.group)) groups.set(r.group, []);
    groups.get(r.group)!.push(r);
  }
  for (const [group, items] of groups) {
    items.forEach((r, i) => rows.push({
      title: r.label,
      meta: r.detail || undefined,
      head: i === 0 ? group : undefined,
      lead: rows.length === 0 ? 'Materials the project holds for this facility. Ask through the Send tab to see any of them.' : undefined,
    }));
  }
  f.profile_links
    .map((l) => ({ url: l.url || l.go_url || '', label: l.label }))
    .filter((l) => l.url)
    .forEach((l, i) => rows.push({ url: l.url, title: words(l.label, l.url), head: i === 0 ? 'External links' : undefined }));
  for (const g of f.resource_links) {
    g.links
      .filter((l) => l.url || l.go_url)
      .forEach((l, i) => rows.push({ url: l.url || l.go_url || '', title: words(l.label, l.url || l.go_url || ''), head: i === 0 ? g.label : undefined }));
  }
  return (
    <SectionBlock id="resources" title="Materials and links" icon="link" items={rows} limit={8} onLayoutY={onLayoutY}
      renderItem={(r, i) => (
        <>
          {r.lead ? <Lead>{r.lead}</Lead> : null}
          {r.head ? <SubHead first={i === 0}>{r.head}</SubHead> : null}
          <HubListRow title={r.title} meta={r.meta} url={r.url} />
        </>
      )}
    />
  );
}
