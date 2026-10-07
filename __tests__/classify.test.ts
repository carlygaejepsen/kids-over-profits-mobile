import { classify, classifyUrl } from '@/lib/classify';
import { extractUrl, looksLikeEmail } from '@/lib/sendLink';

describe('classify', () => {
  it('calls court hosts lawsuits and reads the case number and court', () => {
    const r = classify({
      hostname: 'www.courtlistener.com',
      pathname: '/docket/1/x/',
      title: 'Doe v. Acme Academy',
      bodySample: 'Case No. 2:21-cv-01234-ABC filed in the United States District Court for the District of Utah.',
    });
    expect(r.type).toBe('lawsuit');
    expect(r.fields.case_number).toBe('2:21-cv-01234-ABC');
    expect(r.fields.court).toContain('United States District Court');
  });

  it('calls a federal case number in the title a lawsuit on any host', () => {
    expect(classify({ hostname: 'example.org', title: 'Smith v. Jones, 1:20-cv-00555' }).type).toBe('lawsuit');
  });

  it('reads bill number, state and session from a LegiScan address', () => {
    const r = classifyUrl('https://legiscan.com/ME/bill/LD1234/2025');
    expect(r.type).toBe('legislation');
    expect(r.fields).toMatchObject({ jurisdiction: 'ME', bill_number: 'LD 1234', session: '2025' });
  });

  it('reads a Congress.gov bill', () => {
    const r = classifyUrl('https://www.congress.gov/bill/118th-congress/house-bill/1234');
    expect(r.fields).toMatchObject({ jurisdiction: 'US', bill_number: 'HR 1234', session: '118th Congress' });
  });

  it('knows a state legislature host and finds the bill in the title', () => {
    const r = classify({ hostname: 'legislature.maine.gov', pathname: '/x', title: 'LD 77 An Act' });
    expect(r.type).toBe('legislation');
    expect(r.fields.bill_number).toBe('LD 77');
    expect(classifyUrl('https://lis.leg.state.nv.us/x').fields.jurisdiction).toBe('NV');
  });

  it('calls pages that declare themselves articles articles, and the rest websites', () => {
    expect(classify({ hostname: 'news.example.com', ogType: 'article' }).type).toBe('article');
    expect(classify({ hostname: 'news.example.com', ldTypes: ['NewsArticle'] }).type).toBe('article');
    expect(classify({ hostname: 'news.example.com', published: '2025-01-02' }).type).toBe('article');
    expect(classifyUrl('https://hydeschool.org/').type).toBe('website');
  });
});

describe('sendLink', () => {
  it('pulls one address out of shared text and trims trailing punctuation', () => {
    expect(extractUrl('Look at this https://example.org/story?id=2, wow')).toBe('https://example.org/story?id=2');
    expect(extractUrl('(https://example.org/a)')).toBe('https://example.org/a');
    expect(extractUrl('no link here')).toBe('');
    expect(extractUrl(undefined)).toBe('');
  });
  it('checks an email loosely', () => {
    expect(looksLikeEmail('a@b.org')).toBe(true);
    expect(looksLikeEmail('a@b')).toBe(false);
  });
});
