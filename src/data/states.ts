/**
 * The places the site has a hub page for: the 50 states and DC (kop/v1/state/<slug>) and
 * the countries with records (kop/v1/country/<slug>). Slugs follow kop_state_slug() in the
 * theme's inc/rest-api.php: lowercase, runs of anything but letters and digits become one dash.
 */
export type Place = { name: string; slug: string; code?: string; kind: 'state' | 'country' };

export function placeSlug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const stateNames: [string, string][] = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'],
  ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'], ['FL', 'Florida'],
  ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'],
  ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
  ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
  ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'],
  ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'],
  ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'],
  ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'],
  ['WY', 'Wyoming'],
];

export const states: Place[] = stateNames.map(([code, name]) => ({ name, slug: placeSlug(name), code, kind: 'state' }));

const countryNames = [
  'Australia', 'Canada', 'Costa Rica', 'Czech Republic', 'Dominican Republic', 'England', 'Fiji', 'Ireland',
  'Israel', 'Italy', 'Jamaica', 'Mexico', 'Netherlands', 'New Zealand', 'Samoa', 'Scotland', 'United Kingdom',
];

export const countries: Place[] = countryNames.map((name) => ({ name, slug: placeSlug(name), kind: 'country' }));

export function stateByCode(code: string | null | undefined): Place | undefined {
  const c = (code ?? '').trim().toUpperCase();
  return states.find((s) => s.code === c);
}

export function placeBySlug(slug: string): Place | undefined {
  return states.find((s) => s.slug === slug) ?? countries.find((c) => c.slug === slug);
}
