import {
  basicHeaders,
  buildCheckRequest,
  buildPublicBody,
  buildReviewerBody,
  buildSubmitRequest,
  describeDuplicates,
  emptyDraft,
  submitDraft,
  testCredentials,
} from '@/api/submit';
import type { SubmitDraft } from '@/api/types';

const creds = { username: 'reviewer', appPassword: 'abcd efgh ijkl' };
const draft = (over: Partial<SubmitDraft>): SubmitDraft => ({ ...emptyDraft(over.type ?? 'article'), ...over });
const reply = (status: number, body: unknown) =>
  jest.fn(async () => ({ ok: status < 400, status, json: async () => body }) as unknown as Response) as unknown as typeof fetch &
    jest.Mock;

describe('which route and headers', () => {
  const article = draft({ type: 'article', url: 'https://example.org/a', title: 'T' });

  it('goes to the public route with no auth when signed out', () => {
    const r = buildSubmitRequest(article, null, '1.0.0');
    expect(r.url).toBe('https://kidsoverprofits.org/wp-json/kop/v1/mobile/submit');
    expect(r.method).toBe('POST');
    expect(r.headers.Authorization).toBeUndefined();
    expect(r.headers['X-KOP-Authorization']).toBeUndefined();
  });

  it('goes to the extension route with Basic auth in both headers when signed in', () => {
    const r = buildSubmitRequest(article, creds);
    expect(r.url).toBe('https://kidsoverprofits.org/wp-json/kop/v1/extension/submit');
    const expected = `Basic ${btoa('reviewer:abcdefghijkl')}`;
    expect(r.headers.Authorization).toBe(expected);
    expect(r.headers['X-KOP-Authorization']).toBe(expected);
    expect(basicHeaders(creds).Authorization).toBe(expected);
  });

  it('sends facility information to the public route even when signed in', () => {
    for (const type of ['facility_new', 'facility_correction'] as const) {
      const r = buildSubmitRequest(draft({ type, name: 'X', facility: 'Y', notes: 'n' }), creds);
      expect(r.url).toMatch(/\/mobile\/submit$/);
      expect(r.headers.Authorization).toBeUndefined();
    }
  });

  it('routes the duplicate check the same way', () => {
    const q = { type: 'article' as const, url: 'https://example.org/a', title: 'T', site_name: 'S', bill_number: '', jurisdiction: '' };
    const open = buildCheckRequest(q, null);
    expect(open.url).toBe('https://kidsoverprofits.org/wp-json/kop/v1/mobile/check?url=https%3A%2F%2Fexample.org%2Fa&title=T&type=article');
    expect(open.headers.Authorization).toBeUndefined();
    const signed = buildCheckRequest(q, creds);
    expect(signed.url).toContain('/extension/check?');
    expect(signed.url).toContain('site_name=S');
    expect(signed.headers['X-KOP-Authorization']).toBeDefined();
  });

  it('encodes non-Latin-1 passwords as UTF-8', () => {
    const h = basicHeaders({ username: 'a', appPassword: 'pässword' });
    expect(Buffer.from(h.Authorization.slice(6), 'base64').toString('utf8')).toBe('a:pässword');
  });
});

describe('public body per type', () => {
  it('article: link fields, honeypot, version, optional extras only when given', () => {
    const b = buildPublicBody(
      draft({
        type: 'article',
        url: ' https://example.org/a ',
        title: 'T',
        site_name: 'S',
        author: 'A',
        published: '2025-01-02',
        case_number: 'ignored',
        facility: 'Hyde',
        facility_id: 9,
        notify_email: 'a@b.org',
      }),
      '1.2.3',
    );
    expect(b).toEqual({
      type: 'article',
      url: 'https://example.org/a',
      title: 'T',
      site_name: 'S',
      author: 'A',
      published: '2025-01-02',
      facility: 'Hyde',
      facility_id: 9,
      notify_email: 'a@b.org',
      website_hp: '',
      app_version: '1.2.3',
    });
  });

  it('lawsuit and legislation carry their own fields', () => {
    expect(
      buildPublicBody(draft({ type: 'lawsuit', url: 'https://c.gov/x', title: 'Doe v. X', case_number: '1:20-cv-1', court: 'D. Utah', author: 'no' })),
    ).toMatchObject({ case_number: '1:20-cv-1', court: 'D. Utah' });
    const leg = buildPublicBody(
      draft({ type: 'legislation', url: 'https://l.gov/x', bill_number: 'LD 1', jurisdiction: 'ME', session: '2025', site_name: 'no' }),
    );
    expect(leg).toMatchObject({ bill_number: 'LD 1', jurisdiction: 'ME', session: '2025' });
    expect(leg).not.toHaveProperty('site_name');
  });

  it('facility_new carries the facility keys and an optional source link', () => {
    const b = buildPublicBody(
      draft({ type: 'facility_new', name: 'New Place', other_names: ['A', ' ', 'B'], city: 'Provo', state: 'UT', operator: 'Op', start_year: '1999', url: '' }),
    );
    expect(b).toMatchObject({ type: 'facility_new', name: 'New Place', other_names: ['A', 'B'], city: 'Provo', state: 'UT', operator: 'Op', start_year: '1999', website_hp: '' });
    expect(b).not.toHaveProperty('url');
    expect(b).not.toHaveProperty('title');
  });

  it('facility_correction carries id, name, notes and optional url', () => {
    expect(
      buildPublicBody(
        draft({ type: 'facility_correction', facility_id: 14182, facility: 'Hyde', notes: 'Closed in 2020', url: 'https://x.org/s', newsletter_email: 'a@b.org' }),
      ),
    ).toMatchObject({
      type: 'facility_correction',
      facility_id: 14182,
      facility: 'Hyde',
      notes: 'Closed in 2020',
      url: 'https://x.org/s',
      newsletter_email: 'a@b.org',
    });
  });
});

describe('reviewer body', () => {
  it('uses the extension keys and never the public-only ones', () => {
    const b = buildReviewerBody(
      draft({ type: 'legislation', url: 'https://l.gov/x', title: 'An Act', bill_number: 'LD 1', jurisdiction: 'ME', notify_email: 'a@b.org', submitter_name: 'N', notes: 'hi' }),
    );
    expect(b).toEqual({ type: 'legislation', url: 'https://l.gov/x', title: 'An Act', bill_number: 'LD 1', jurisdiction: 'ME', notes: 'hi', submitted_via: 'app' });
  });

  it('falls back to the address as the title', () => {
    expect(buildReviewerBody(draft({ type: 'website', url: 'https://x.org/' })).title).toBe('https://x.org/');
  });

  it('refuses facility types', () => {
    expect(() => buildReviewerBody(draft({ type: 'facility_new' }))).toThrow();
  });
});

describe('submitDraft outcomes', () => {
  const art = draft({ type: 'article', url: 'https://example.org/a', title: 'T' });

  it('201 is ok with the queue label', async () => {
    const f = reply(201, { ok: true, type: 'article', queue: 'news review' });
    expect(await submitDraft(art, null, '1', f)).toEqual({ kind: 'ok', queue: 'news review' });
    expect(f.mock.calls[0][0]).toMatch(/mobile\/submit$/);
  });

  it('409 is a duplicate with its status', async () => {
    const f = reply(409, { code: 'kop_duplicate', message: 'dup', duplicates: [{ type: 'news', status: 'in review' }] });
    expect(await submitDraft(art, null, '1', f)).toEqual({
      kind: 'duplicate',
      message: 'Already on file: this article is in review.',
      duplicates: [{ type: 'news', status: 'in review', id: undefined, title: undefined }],
    });
  });

  it('400 and 429 show the site message', async () => {
    expect(await submitDraft(art, null, '1', reply(400, { code: 'x', message: 'Bad link.' }))).toEqual({ kind: 'error', message: 'Bad link.' });
    expect(await submitDraft(art, null, '1', reply(429, { code: 'kop_rate_limited', message: 'Slow down.' }))).toEqual({ kind: 'error', message: 'Slow down.' });
  });

  it('a network failure is an error, not a throw', async () => {
    const f = jest.fn(async () => {
      throw new TypeError('network');
    }) as unknown as typeof fetch;
    expect((await submitDraft(art, null, '1', f)).kind).toBe('error');
  });

  it('a reviewer 401 says to check the login', async () => {
    const r = await submitDraft(art, creds, '1', reply(401, { code: 'rest_not_logged_in' }));
    expect(r.kind).toBe('error');
    expect((r as { message: string }).message).toMatch(/rejected the login/);
  });
});

describe('describeDuplicates and testCredentials', () => {
  it('words the two statuses', () => {
    expect(describeDuplicates([{ type: 'lawsuit', status: 'on the site' }])).toBe('Already on file: this lawsuit is on the site.');
    expect(describeDuplicates([])).toBe('This is already on file.');
  });

  it('names the account the site answers with', async () => {
    expect(await testCredentials(creds, reply(200, { duplicate: false, user: 'Dani' }))).toEqual({ ok: true, user: 'Dani' });
    expect(await testCredentials(creds, reply(200, { user: { display_name: 'Dani R' } }))).toEqual({ ok: true, user: 'Dani R' });
    expect((await testCredentials(creds, reply(401, {}))).ok).toBe(false);
  });
});
