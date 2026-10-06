import { aliasLabel } from '@/lib/alias';
import { resolveLink, slugFromUrl } from '@/lib/links';
import { parseMarkdownLinks } from '@/lib/markdownLinks';
import { urlLabel } from '@/lib/urlLabel';
import { countries, placeBySlug, placeSlug, stateByCode, states } from '@/data/states';

describe('aliasLabel', () => {
  it('words each kind the way the site does', () => {
    expect(aliasLabel('past', 'Copper Canyon Academy')).toBe('Formerly Copper Canyon Academy');
    expect(aliasLabel('current', 'Sedona Sky Academy')).toBe('Now known as Sedona Sky Academy');
    expect(aliasLabel('other', 'UHS')).toBe('Also known as UHS');
  });
  it('is empty for an empty name', () => {
    expect(aliasLabel('past', '  ')).toBe('');
  });
});

describe('resolveLink', () => {
  it('opens site facility and company pages inside the app', () => {
    expect(resolveLink('https://kidsoverprofits.org/facility/hyde-school-ct/')).toEqual({ kind: 'route', href: '/facility/hyde-school-ct' });
    expect(resolveLink('/operator/universal-health-services/')).toEqual({ kind: 'route', href: '/operator/universal-health-services' });
  });
  it('sends other addresses to the browser', () => {
    expect(resolveLink('https://example.org/story')).toEqual({ kind: 'web', url: 'https://example.org/story' });
    expect(resolveLink('https://kidsoverprofits.org/glossary/')).toEqual({ kind: 'web', url: 'https://kidsoverprofits.org/glossary/' });
  });
  it('refuses things that are not web addresses', () => {
    expect(resolveLink('')).toBeNull();
    expect(resolveLink('javascript:alert(1)')).toBeNull();
    expect(resolveLink('mailto:a@b.org')).toBeNull();
  });
  it('reads the slug from an address', () => {
    expect(slugFromUrl('https://kidsoverprofits.org/facility/hyde-school-ct/')).toBe('hyde-school-ct');
    expect(slugFromUrl('https://example.org/')).toBe('');
  });
});

describe('parseMarkdownLinks', () => {
  it('splits words and links', () => {
    expect(parseMarkdownLinks('Founded in [Bath, Maine](https://example.org/bath) in 1966.')).toEqual([
      { text: 'Founded in ' },
      { text: 'Bath, Maine', url: 'https://example.org/bath' },
      { text: ' in 1966.' },
    ]);
  });
  it('leaves plain text whole', () => {
    expect(parseMarkdownLinks('No links here.')).toEqual([{ text: 'No links here.' }]);
  });
});

describe('urlLabel', () => {
  it('uses the words in the address, with the site', () => {
    expect(urlLabel('https://www.example.org/news/hyde-school-sued-by-students.html')).toBe('Hyde school sued by students (example.org)');
  });
  it('falls back to the site name', () => {
    expect(urlLabel('https://www.example.org/')).toBe('example.org');
    expect(urlLabel('https://www.example.org/a/123456789')).toBe('example.org');
  });
  it('shortens long labels on a word', () => {
    const label = urlLabel('https://example.org/' + 'very-long-headline-about-a-program-'.repeat(5), 60);
    expect(label.length).toBeLessThanOrEqual(61);
    expect(label.endsWith('…')).toBe(true);
  });
});

describe('places', () => {
  it('slugs follow the site rule', () => {
    expect(placeSlug('New York')).toBe('new-york');
    expect(placeSlug('District of Columbia')).toBe('district-of-columbia');
  });
  it('lists 50 states and DC', () => {
    expect(states).toHaveLength(51);
    expect(stateByCode('ut')?.name).toBe('Utah');
  });
  it('finds states and countries by slug', () => {
    expect(placeBySlug('utah')?.kind).toBe('state');
    expect(placeBySlug('costa-rica')?.kind).toBe('country');
    expect(countries.length).toBeGreaterThan(10);
  });
});
