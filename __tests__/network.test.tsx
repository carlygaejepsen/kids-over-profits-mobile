/**
 * The network map in the app: the Map tab's page and links (src/lib/mapPage.ts, resolveLink), and a
 * facility page's Connections section, drawn from real payloads (scripts/test-mobile-api.php --dump).
 */
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { FacilityPayload } from '@/api/types';
import FacilityScreen from '@/app/facility/[slug]';
import { connectionsLayout, DRAW_MAX, shortLabel } from '@/components/facility/ConnectionsSection';
import { presentSections } from '@/components/facility/model';
import { resolveLink } from '@/lib/links';
import { HIDE_SELECTORS, isMapPage, MAP_CSS, mapUrl, openFromMapUrl, openScript } from '@/lib/mapPage';
import { BACK_SCRIPT, BUTTONS, kindWord, MAP_BRIDGE, openNodeScript, parseMessage, pressScript, searchScript } from '@/lib/mapBridge';

const mockPush = jest.fn();
const mockFacility: { current: FacilityPayload } = { current: require('./fixtures/facility-10371.json') };
jest.mock('@/api/queries', () => ({
  useFacility: () => ({ data: mockFacility.current, isLoading: false, isError: false, refetch: jest.fn() }),
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ slug: 'x' }),
  useRouter: () => ({ push: mockPush }),
  Stack: { Screen: () => null },
}));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));

const load = (id: number): FacilityPayload => require(`./fixtures/facility-${id}.json`);
const provo = load(10371);
const falcon = load(9607);
const daytona = load(9606);

beforeEach(() => mockPush.mockClear());

describe('the Map tab page', () => {
  it('opens the website map, on a name when given one', () => {
    expect(mapUrl()).toBe('https://kidsoverprofits.org/network-map/');
    expect(mapUrl('provo-canyon-school')).toBe('https://kidsoverprofits.org/network-map/#open=provo-canyon-school');
    expect(openFromMapUrl('#open=a%2Cb&mode=path')).toBe('a,b');
    expect(openFromMapUrl('#list=1')).toBe('');
    expect(openScript('provo-canyon-school')).toContain('"open=provo-canyon-school"');
  });

  it('keeps only the map page in the web view', () => {
    expect(isMapPage('https://kidsoverprofits.org/network-map/#open=x')).toBe(true);
    expect(isMapPage('https://www.kidsoverprofits.org/network-map')).toBe(true);
    expect(isMapPage('https://kidsoverprofits.org/facility/provo-canyon-school-ut/')).toBe(false);
    expect(isMapPage('https://example.org/network-map/')).toBe(false);
  });

  it("hides the site's header, footer, donate button and floating buttons", () => {
    for (const sel of ['#masthead', '#colophon', '.kop-network__donate', '.kop-global-search__trigger', '.tutorial-toggle-btn']) {
      expect(HIDE_SELECTORS).toContain(sel);
    }
    expect(MAP_CSS).toContain('display:none!important');
  });

  it('sends a site link to the map into the Map tab', () => {
    expect(resolveLink('https://kidsoverprofits.org/network-map/#open=provo-canyon-school')).toEqual({
      kind: 'route',
      href: { pathname: '/map', params: { open: 'provo-canyon-school' } },
    });
    expect(resolveLink('https://kidsoverprofits.org/network-map/')).toEqual({ kind: 'route', href: '/map' });
  });
});

describe("the Map tab's own controls (src/lib/mapBridge.ts)", () => {
  it('gives the map the whole screen: the words above it, its toolbar and its stage buttons are hidden', () => {
    for (const sel of ['.kop-network__standfirst', '.kop-network__tally', '.kop-network__editorial', '.kop-network__toolbar', '.kop-network__zoom', '#kop-network-fullscreen', '#kop-network-filters-toggle']) {
      expect(HIDE_SELECTORS).toContain(sel);
    }
    // The trail stays: it is what Back walks.
    expect(HIDE_SELECTORS).not.toContain('#kop-network-chain');
    expect(MAP_CSS).toContain('.kop-app-handle');
  });

  it('is a script the web view can run', () => {
    expect(() => new Function(MAP_BRIDGE)).not.toThrow();
    for (const js of [BACK_SCRIPT, pressScript('fit'), searchScript('provo'), openNodeScript('a"b')]) expect(() => new Function(js)).not.toThrow();
  });

  it("presses the site's own buttons, by id", () => {
    expect(pressScript('zoomIn')).toContain(JSON.stringify(BUTTONS.zoomIn));
    expect(BUTTONS.wholeMap).toBe('kop-network-whole-map');
    expect(searchScript('Provo "Canyon"')).toContain(JSON.stringify('Provo "Canyon"'));
  });

  it('reads the state and the search answers the page posts, and ignores anything else', () => {
    expect(parseMessage('nope')).toBeNull();
    expect(parseMessage('{"type":"other"}')).toBeNull();
    expect(
      parseMessage(JSON.stringify({ type: 'state', ready: true, trail: [{ id: 'provo-canyon-school', name: 'Provo Canyon School' }, { nope: 1 }], key: true, hash: '#open=provo-canyon-school' })),
    ).toEqual({ type: 'state', ready: true, trail: [{ id: 'provo-canyon-school', name: 'Provo Canyon School' }], key: true, list: false, timeline: false, drawer: false, hash: '#open=provo-canyon-school' });
    expect(parseMessage(JSON.stringify({ type: 'results', q: 'copper', items: [{ id: 'sedona-sky', name: 'Sedona Sky Academy', kind: 'facility', via: 'Copper Canyon Academy', viaKind: 'past' }] }))).toEqual({
      type: 'results',
      q: 'copper',
      items: [{ id: 'sedona-sky', name: 'Sedona Sky Academy', kind: 'facility', via: 'Copper Canyon Academy', viaKind: 'past' }],
    });
    expect(kindWord('parent')).toBe('Company');
    expect(kindWord('facility')).toBe('Program');
  });
});

describe('Connections on a facility page', () => {
  it('is a section only when the map draws the facility', () => {
    expect(presentSections(provo).map((s) => s.id)).toContain('network');
    expect(daytona.network).toBeNull();
    expect(presentSections(daytona).map((s) => s.id)).not.toContain('network');
  });

  it('places names in two columns, renames first, people last, past the cap counted', () => {
    const links = provo.network!.links;
    const { placed, more, center, height } = connectionsLayout(links, 360);
    expect(placed).toHaveLength(Math.min(DRAW_MAX, links.length));
    expect(more).toBe(links.length - placed.length);
    expect(center).toEqual({ x: 180, y: height / 2 });
    expect(placed.every((p) => (p.side === 'left' ? p.x < center.x : p.x > center.x))).toBe(true);
    const ranks = placed.map((p) => (p.link.relation === 'became' || p.link.relation === 'formerly' ? 0 : p.link.kind === 'person' ? 2 : 1));
    expect([...ranks].sort()).toEqual(ranks);
    // No two names on one side share a row.
    for (const side of ['left', 'right']) {
      const ys = placed.filter((p) => p.side === side).map((p) => p.y);
      expect(new Set(ys).size).toBe(ys.length);
    }
  });

  it('draws a single name level with the facility', () => {
    const one = connectionsLayout(falcon.network!.links.slice(0, 1), 300);
    expect(one.placed[0].y).toBe(one.center.y);
  });

  it('shortens long labels', () => {
    expect(shortLabel('Universal Health Services of Provo Canyon', 12)).toBe('Universal H…');
    expect(shortLabel('UHS', 12)).toBe('UHS');
  });

  it("lists the website's groups without the people, and opens the map on the facility", async () => {
    mockFacility.current = provo;
    await render(<FacilityScreen />);
    expect(screen.getByLabelText(`Connections, ${provo.network!.links.length}`)).toBeTruthy();
    const groups = [...new Set(provo.network!.links.map((l) => l.group))].filter((g) => g !== 'People');
    for (const g of groups) expect(screen.getAllByText(g).length).toBeGreaterThan(0);
    const people = provo.network!.links.filter((l) => l.group === 'People').length;
    if (people) expect(screen.getByText(new RegExp(`^${people} (people|person) on the map`))).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Open on the full map'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/map', params: { open: provo.network!.node } });
  });

  it('opens a listed company on its own page', async () => {
    mockFacility.current = falcon;
    await render(<FacilityScreen />);
    const linked = falcon.network!.links.find((l) => l.group === 'Ownership' && l.url)!;
    await fireEvent.press(screen.getByLabelText(linked.role ? `${linked.name}. ${linked.role}` : linked.name));
    // The fixtures' addresses are on example.test, so the link leaves for the browser; on the site it opens the company screen.
    const browser = jest.requireMock('expo-web-browser').openBrowserAsync as jest.Mock;
    expect([...browser.mock.calls.map((c) => c[0]), ...mockPush.mock.calls.map((c) => c[0])]).toContainEqual(expect.stringContaining('/operator/'));
  });
});
