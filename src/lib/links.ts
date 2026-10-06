import type { Href } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';

import { SITE } from '@/api/client';

export type Resolved = { kind: 'route'; href: Href } | { kind: 'web'; url: string };

const HOST = new URL(SITE).host;

/** Turn an address from the site into an in-app screen when there is one, else a web address. */
export function resolveLink(raw: string | null | undefined): Resolved | null {
  const value = (raw ?? '').trim();
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value, SITE);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.host.replace(/^www\./, '') === HOST) {
    const facility = url.pathname.match(/^\/facility\/([^/]+)\/?$/);
    if (facility) return { kind: 'route', href: `/facility/${facility[1]}` as Href };
    const operator = url.pathname.match(/^\/operator\/([^/]+)\/?$/);
    if (operator) return { kind: 'route', href: `/operator/${operator[1]}` as Href };
  }
  return { kind: 'web', url: url.toString() };
}

/** Open an address: an app screen when the site page has one, otherwise the in-app browser. */
export async function openLink(raw: string | null | undefined, navigate: (href: Href) => void): Promise<void> {
  const target = resolveLink(raw);
  if (!target) return;
  if (target.kind === 'route') navigate(target.href);
  else await openBrowserAsync(target.url);
}

/** The slug at the end of a /facility/<slug>/ or /operator/<slug>/ address. */
export function slugFromUrl(raw: string | null | undefined): string {
  const m = (raw ?? '').match(/\/(?:facility|operator)\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}
