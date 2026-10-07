import { decodeEntities, fetchPageMeta, parsePageMeta } from '@/lib/pageMeta';

const HTML = `<!doctype html><html><head>
<title>Fallback title | Paper</title>
<meta property="og:title" content="Teen program faces &quot;abuse&quot; claims &amp; a lawsuit">
<meta property='og:site_name' content='The Daily Paper'>
<meta content="2025-03-04T10:00:00-05:00" property="article:published_time">
<meta name="author" content="Jane Reporter">
<meta property="og:type" content="article">
<meta name="description" content="A short summary.">
<script type="application/ld+json">{"@graph":[{"@type":"NewsArticle","datePublished":"2020-01-01","headline":"LD headline"}]}</script>
<style>p{color:red}</style></head>
<body><h1>Heading</h1><p>Body text here.</p><script>var x = 1;</script></body></html>`;

const asFetch = (f: unknown) => f as typeof fetch;
const page = (body: string, ok = true, type = 'text/html') =>
  ({ ok, headers: { get: () => type }, text: async () => body }) as unknown as Response;

describe('parsePageMeta', () => {
  it('reads the share tags in either attribute order and decodes entities', () => {
    const m = parsePageMeta(HTML);
    expect(m.title).toBe('Teen program faces "abuse" claims & a lawsuit');
    expect(m.siteName).toBe('The Daily Paper');
    expect(m.published).toBe('2025-03-04');
    expect(m.author).toBe('Jane Reporter');
    expect(m.ogType).toBe('article');
    expect(m.ldTypes).toContain('NewsArticle');
    expect(m.bodySample).toContain('Body text here.');
    expect(m.bodySample).not.toContain('color:red');
  });

  it('falls back to the page title and JSON-LD, and drops profile-link authors', () => {
    const m = parsePageMeta(
      '<title> Plain &amp; simple </title><meta property="article:author" content="https://facebook.com/jane">' +
        '<script type="application/ld+json">{"@type":"Article","datePublished":"2019-05-06T01:00:00Z"}</script>',
    );
    expect(m.title).toBe('Plain & simple');
    expect(m.author).toBe('');
    expect(m.published).toBe('2019-05-06');
  });

  it('survives empty and malformed input', () => {
    expect(parsePageMeta('').title).toBe('');
    expect(parsePageMeta('<script type="application/ld+json">{oops</script>').ldTypes).toEqual([]);
  });

  it('decodes numeric entities', () => {
    expect(decodeEntities('It&#8217;s &#x41;')).toBe('It’s A');
  });
});

describe('fetchPageMeta', () => {
  it('reads a fetched page', async () => {
    const m = await fetchPageMeta('https://example.org/a', asFetch(async () => page(HTML)));
    expect(m?.siteName).toBe('The Daily Paper');
  });

  it('gives null on failure, non-pages and bad addresses, never throwing', async () => {
    const boom = asFetch(async () => {
      throw new Error('x');
    });
    expect(await fetchPageMeta('https://example.org/a', boom)).toBeNull();
    expect(await fetchPageMeta('https://example.org/a', asFetch(async () => page('', false)))).toBeNull();
    expect(await fetchPageMeta('https://example.org/a.pdf', asFetch(async () => page('%PDF', true, 'application/pdf')))).toBeNull();
    expect(await fetchPageMeta('ftp://x', asFetch(jest.fn()))).toBeNull();
  });
});
