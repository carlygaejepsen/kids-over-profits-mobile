import type { FacilityPayload, NewsFeed, OperatorPayload } from '@/api/types';

/**
 * The fixtures are real responses from kop/v1/facility, /operator and /news (captured by the theme's
 * scripts/test-mobile-api.php --dump). These checks keep the app's types honest against them.
 */
const facilities: FacilityPayload[] = [
  require('./fixtures/facility-9605.json'),
  require('./fixtures/facility-9606.json'),
  require('./fixtures/facility-9607.json'),
];
const operators: OperatorPayload[] = [require('./fixtures/operator-1.json'), require('./fixtures/operator-2.json')];
const news: NewsFeed = require('./fixtures/news.json');

const PRIVATE = ['author', 'submitted_by', 'submission_notes', 'reviewer_notes', 'reviewed_by', 'staff_mentioned', 'survivors_mentioned', 'json_data', 'generated_output'];

function keys(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((v) => keys(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      out.push(k);
      keys(v, out);
    }
  }
  return out;
}

describe.each(facilities.map((f) => [f.name, f] as const))('facility %s', (_name, f) => {
  it('has what the screen reads', () => {
    expect(typeof f.id).toBe('number');
    expect(f.slug).toMatch(/^[a-z0-9-]+$/);
    expect(f.url).toMatch(/^https:\/\//);
    for (const k of ['siblings', 'addresses', 'facts', 'incidents', 'news', 'lawsuits', 'memorials', 'formerly', 'aka', 'profile_links', 'resource_links', 'videos', 'wiki', 'notes', 'practices', 'testimony'] as const) {
      expect(Array.isArray(f[k])).toBe(true);
    }
    expect(f.operator).toEqual(expect.objectContaining({ name: expect.any(String), url: expect.any(String) }));
    expect(f.documents).toEqual({ folder_id: expect.any(Number), url: expect.any(String) });
  });
  it('carries no private column', () => {
    const found = keys(f).filter((k) => PRIVATE.includes(k));
    expect(found).toEqual([]);
  });
  it('lists news as cards the feed also draws', () => {
    for (const n of f.news) {
      expect(typeof n.id).toBe('number');
      expect(n.title).toBeTruthy();
      expect(n.url).toMatch(/^https?:\/\//);
    }
  });
});

describe.each(operators.map((o) => [o.name, o] as const))('operator %s', (_name, o) => {
  it('has what the screen reads', () => {
    expect(o.url).toMatch(/^https:\/\//);
    for (const k of ['facts', 'parents', 'subsidiaries', 'facilities', 'program_tree', 'lawsuits', 'memorials', 'news', 'websites', 'timeline', 'aka'] as const) {
      expect(Array.isArray(o[k])).toBe(true);
    }
    expect(o.people).toEqual({ leaders: expect.any(Array), others: expect.any(Array) });
    expect(o.documents).toEqual({ folder_id: expect.any(Number), program_total: expect.any(Number), url: expect.any(String) });
  });
  it('shows only a published history', () => {
    expect(o.history === null || o.history.status === 'published').toBe(true);
  });
  it('carries no private column', () => {
    expect(keys(o).filter((k) => PRIVATE.includes(k))).toEqual([]);
  });
});

describe('news feed', () => {
  it('has the paging fields', () => {
    expect(news.page).toBe(1);
    expect(news.per_page).toBeGreaterThan(0);
    expect(news.items.length).toBeGreaterThan(0);
    expect(news.pages).toBe(Math.ceil(news.total / news.per_page));
  });
  it('lists months newest first', () => {
    const months = news.months.map((m) => m.month);
    expect([...months].sort().reverse()).toEqual(months);
  });
  it('has no private column', () => {
    expect(keys(news).filter((k) => PRIVATE.includes(k))).toEqual([]);
  });
});
