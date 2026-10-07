/** Reads a page's title, site, date and author from its HTML with small regexes. There is no DOM in the app. */
export type PageMeta = {
  title: string;
  siteName: string;
  published: string;
  author: string;
  description: string;
  ogType: string;
  ldTypes: string[];
  bodySample: string;
};

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  ldquo: '“',
  rdquo: '”',
  ndash: '–',
  mdash: '—',
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : all;
    }
    return ENTITIES[code.toLowerCase()] ?? all;
  });
}

const clean = (s: string) => decodeEntities(s).replace(/\s+/g, ' ').trim();

/** The content of the first <meta> whose name or property is one of the keys, in key order. */
function metaContent(html: string, keys: string[]): string {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const key of keys) {
    for (const tag of tags) {
      const id = /\b(?:name|property)\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
      if ((id?.[1] ?? id?.[2] ?? '').toLowerCase() !== key) continue;
      const c = /\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
      const value = clean(c?.[1] ?? c?.[2] ?? '');
      if (value) return value;
    }
  }
  return '';
}

function toDate(value: string): string {
  if (!value) return '';
  const m = /^(\d{4})[-/](\d{2})[-/](\d{2})/.exec(value.trim());
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

function ldInfo(html: string): { types: string[]; published: string; headline: string } {
  const types: string[] = [];
  let published = '';
  let headline = '';
  const blocks = html.match(/<script\b[^>]*application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi) ?? [];
  for (const block of blocks) {
    const body = block.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '');
    try {
      const d = JSON.parse(body);
      const items: Record<string, unknown>[] = Array.isArray(d) ? d : Array.isArray(d?.['@graph']) ? d['@graph'] : [d];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const t = ([] as unknown[]).concat(item['@type'] ?? []).filter((x): x is string => typeof x === 'string');
        types.push(...t);
        if (t.some((x) => /Article|BlogPosting|Report/.test(x))) {
          if (!published && typeof item.datePublished === 'string') published = item.datePublished;
          if (!headline && typeof item.headline === 'string') headline = item.headline;
        }
      }
    } catch {
      // malformed JSON-LD is common; skip it
    }
  }
  return { types, published, headline };
}

export function parsePageMeta(html: string): PageMeta {
  const ld = ldInfo(html);
  const titleTag = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  let author = metaContent(html, ['citation_author', 'author', 'article:author']);
  // article:author is often a profile address, which is no use as a byline.
  if (/^https?:\/\//i.test(author)) author = '';
  const text = html.replace(/<(script|style|noscript|svg|head)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ');
  return {
    title: metaContent(html, ['citation_title', 'og:title']) || clean(ld.headline) || clean(titleTag?.[1] ?? ''),
    siteName: metaContent(html, ['og:site_name']),
    published: toDate(
      metaContent(html, ['citation_date', 'citation_publication_date', 'article:published_time']) || ld.published,
    ),
    author,
    description: metaContent(html, ['og:description', 'description']),
    ogType: metaContent(html, ['og:type']),
    ldTypes: ld.types,
    bodySample: clean(text).slice(0, 6000),
  };
}

const TIMEOUT_MS = 8000;
const MAX_CHARS = 400_000;

/** Fetch a page and read its details. Never throws: any failure gives null. */
export async function fetchPageMeta(url: string, fetchImpl: typeof fetch = fetch): Promise<PageMeta | null> {
  if (!/^https?:\/\//i.test(url)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, { signal: controller.signal, headers: { Accept: 'text/html,application/xhtml+xml' } });
    if (!res.ok) return null;
    const type = res.headers?.get?.('content-type') ?? '';
    if (type && !/html|xml/i.test(type)) return null;
    return parsePageMeta((await res.text()).slice(0, MAX_CHARS));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
