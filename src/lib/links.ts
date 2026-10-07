import type { Href } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { Platform } from 'react-native';

import { SITE } from '@/api/client';
import { docKindOf } from './docs';

export type Resolved = { kind: 'route'; href: Href } | { kind: 'web'; url: string };

const HOST = new URL(SITE).host;

/** "#page=21" on a PDF link: the page the citation means. */
function pageOf(hash: string): number | undefined {
  const m = /(?:^#|&)page=(\d+)/.exec(hash);
  return m ? Number(m[1]) : undefined;
}

/** The in-app viewer for a document address (the hash's page kept as a param). */
export function docHref(url: string, title?: string): Href {
  let page: number | undefined;
  let bare = url;
  try {
    const u = new URL(url, SITE);
    page = pageOf(u.hash);
    u.hash = '';
    bare = u.toString();
  } catch {
    // keep the address as given
  }
  const params: Record<string, string> = { url: bare };
  if (page) params.page = String(page);
  if (title) params.title = title;
  return { pathname: '/doc', params } as Href;
}

/**
 * Turn an address from the site into an in-app screen when there is one, else a web address: facility and
 * company pages, their document libraries (#documents), and documents (our own PDFs and pictures, "#page=21"
 * kept) open in the app. Another site's PDF opens in the viewer on iOS, which reads PDFs itself; Android's
 * web view cannot, so there it stays in the browser.
 */
export function resolveLink(raw: string | null | undefined, platform: string = Platform.OS): Resolved | null {
  const value = (raw ?? '').trim();
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value, SITE);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const own = url.host.replace(/^www\./, '') === HOST;
  if (own) {
    const page = url.pathname.match(/^\/(facility|operator)\/([^/]+)\/?$/);
    if (page) {
      const [, kind, slug] = page;
      if (url.hash === '#documents') return { kind: 'route', href: { pathname: '/documents/[slug]', params: { slug, kind } } as Href };
      return { kind: 'route', href: `/${kind}/${slug}` as Href };
    }
    if (url.pathname.startsWith('/wp-content/') && docKindOf(url.pathname) !== 'other') {
      return { kind: 'route', href: docHref(url.toString()) };
    }
  } else if (platform === 'ios' && docKindOf(url.pathname) === 'pdf') {
    return { kind: 'route', href: docHref(url.toString()) };
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
