import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import type { ResourcesPayload } from '@/api/types';
import ResourcesScreen from '@/app/resources';
import { contactActions } from '@/lib/contact';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
jest.mock('@/api/queries', () => ({ useResources: jest.fn() }));

const queries = jest.requireMock('@/api/queries');
const browser = jest.requireMock('expo-web-browser');
/** kop/v1/resources, as scripts/test-mobile-api.php --dump writes it. */
const fixture: ResourcesPayload = require('./fixtures/resources.json');

describe('contact lines become Call and Text buttons', () => {
  const urls = (c: string, p = 'android') => contactActions(c, p).map((a) => `${a.label} -> ${a.url}`);

  it('reads every line the /resources/ page has', () => {
    expect(urls('Call or text 988')).toEqual(['Call 988 -> tel:988', 'Text 988 -> sms:988']);
    expect(urls('Text HOME to 741741')).toEqual(['Text HOME to 741741 -> sms:741741?body=HOME']);
    expect(urls('Call 1-866-488-7386, or text START to 678-678')).toEqual([
      'Call 1-866-488-7386 -> tel:18664887386',
      'Text START to 678-678 -> sms:678678?body=START',
    ]);
    expect(urls('Call 1-877-565-8860')).toEqual(['Call 1-877-565-8860 -> tel:18775658860']);
    expect(urls('Call or text 1-800-786-2929')).toEqual(['Call 1-800-786-2929 -> tel:18007862929', 'Text 1-800-786-2929 -> sms:18007862929']);
    expect(urls('Support groups on Zoom, Tuesdays and Thursdays at 7 PM Eastern')).toEqual([]);
  });

  it('fills the first word the way iOS reads it', () => {
    expect(urls('Text HOME to 741741', 'ios')).toEqual(['Text HOME to 741741 -> sms:741741&body=HOME']);
  });

  it('every contact line in the fixture with a number gives a button', () => {
    const lines = fixture.groups.flatMap((g) => g.entries.map((e) => e.contact)).filter((c) => /\d{3}/.test(c) && !/\bPM\b/.test(c));
    expect(lines.length).toBeGreaterThan(5);
    for (const c of lines) expect(contactActions(c).length).toBeGreaterThan(0);
  });
});

describe('Resources screen: the website list', () => {
  beforeEach(() => {
    mockPush.mockClear();
    browser.openBrowserAsync.mockClear();
    queries.useResources.mockReturnValue({ data: fixture, isLoading: false, isError: false, refetch: jest.fn() });
  });

  it('lists every group, crisis lines first and in full', async () => {
    await render(<ResourcesScreen />);
    expect(screen.getByText('Resources')).toBeTruthy();
    expect(screen.getByText(`${fixture.total} resources`)).toBeTruthy();
    // A section title carries its count: "Petitions  1".
    for (const g of fixture.groups) expect(screen.getByLabelText(`${g.heading}, ${g.entries.length}`)).toBeTruthy();
    for (const e of fixture.groups[0].entries) expect(screen.getByText(e.name)).toBeTruthy();
    expect(screen.getByText(fixture.groups[0].intro)).toBeTruthy();
  });

  it('calls a crisis line from its button', async () => {
    const spy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await render(<ResourcesScreen />);
    await fireEvent.press(screen.getByLabelText('Call 988, 988 Suicide and Crisis Lifeline'));
    expect(spy).toHaveBeenCalledWith('tel:988');
    spy.mockRestore();
  });

  it('opens an outside link in the browser and the data form as the Send tab', async () => {
    const withForm: ResourcesPayload = JSON.parse(JSON.stringify(fixture));
    withForm.groups[1].entries.push({
      name: 'Tell this project', url: 'https://kidsoverprofits.org/tti-data-submission/', page: 'tti-data-submission',
      contact: '', note: 'Anonymous.', archived: false, links: [],
    });
    queries.useResources.mockReturnValue({ data: withForm, isLoading: false, isError: false, refetch: jest.fn() });
    await render(<ResourcesScreen />);
    await fireEvent.press(screen.getByLabelText('988 Suicide and Crisis Lifeline'));
    expect(browser.openBrowserAsync).toHaveBeenCalledWith('https://988lifeline.org/');
    await fireEvent.press(screen.getByLabelText('Tell this project'));
    expect(mockPush).toHaveBeenCalledWith('/send');
  });

  it('marks an archived snapshot (SCIAD, in Research and reading)', async () => {
    await render(<ResourcesScreen />);
    expect(screen.getByText('SCIAD')).toBeTruthy();
    expect(screen.getAllByText('Archived copy')).toHaveLength(1);
  });
});
