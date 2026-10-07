import { fireEvent, render, screen } from '@testing-library/react-native';
import fs from 'node:fs';
import path from 'node:path';

import type { NewsFeed, OperatorsList, SuggestResponse } from '@/api/types';
import AboutScreen from '@/app/(tabs)/about';
import CompaniesScreen, { describe as describeCompany } from '@/app/(tabs)/companies';
import SearchScreen from '@/app/(tabs)/index';
import NewsScreen from '@/app/(tabs)/news';
import PlacesScreen from '@/app/(tabs)/places';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: '1.2.3' } } }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
jest.mock('@/api/queries', () => ({
  useSuggest: jest.fn(),
  useGlobalSearch: jest.fn(),
  useNews: jest.fn(),
  useOperators: jest.fn(),
}));

const queries = jest.requireMock('@/api/queries');
const news: NewsFeed = require('./fixtures/news.json');

/** kop/v1/operators, as scripts/test-mobile-api.php --dump writes it (also the screenshot fixture). */
function readOperators(): OperatorsList {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'scripts', 'shot-fixtures', 'operators.json'), 'utf8'));
}
const operators = readOperators();

const suggest: SuggestResponse = {
  query: 'falcon',
  items: [
    { id: 9607, name: 'Falcon Ridge Ranch', place: 'Virgin, Utah', status: 'Open', hint: '', url: 'https://kidsoverprofits.org/facility/falcon-ridge-ranch-ut/' },
    { id: 8234, name: 'Falcon Ridge Academy', place: 'Escalante, Utah', status: 'Closed', hint: 'Formerly Falcon Ridge Ranch (1998–2020)', url: 'https://kidsoverprofits.org/facility/falcon-ridge-academy-ut/' },
  ],
};

beforeEach(() => {
  mockPush.mockClear();
  queries.useSuggest.mockReturnValue({ data: suggest, isLoading: false, isError: false });
  queries.useGlobalSearch.mockReturnValue({ data: undefined, isLoading: false, isError: false });
  queries.useNews.mockReturnValue({
    data: { pages: [news] },
    isLoading: false,
    isError: false,
    isRefetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(),
  });
  queries.useOperators.mockReturnValue({ data: operators, isLoading: false, isError: false, refetch: jest.fn() });
});

describe('Search tab', () => {
  it('asks for three letters, then lists programs with their former-name hint', async () => {
    await render(<SearchScreen />);
    expect(screen.getByText('Find a program')).toBeTruthy();
    expect(screen.getByText('Type at least three letters to search.')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Search facilities by name, including former names'), 'falcon');
    expect(await screen.findByText('Falcon Ridge Academy')).toBeTruthy();
    expect(screen.getByText('Falcon Ridge Ranch')).toBeTruthy();
    expect(screen.getByText('Formerly Falcon Ridge Ranch (1998–2020)')).toBeTruthy();
    expect(screen.getByText('Escalante, Utah')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(/^Falcon Ridge Academy\. Formerly/));
    expect(mockPush).toHaveBeenCalledWith('/facility/falcon-ridge-academy-ut');
  });

  it('offers the site-wide search once there is a query', async () => {
    await render(<SearchScreen />);
    await fireEvent.changeText(screen.getByLabelText('Search facilities by name, including former names'), 'falcon');
    await fireEvent.press(await screen.findByText('Search news, lawsuits and records too'));
    expect(queries.useGlobalSearch).toHaveBeenLastCalledWith('falcon', true);
  });
});

describe('News tab', () => {
  it('shows an ongoing story card and a feed title', async () => {
    await render(<NewsScreen />);
    expect(screen.getByText('All news')).toBeTruthy();
    expect(screen.getByText(news.arcs[0].title)).toBeTruthy();
    expect(screen.getByText(news.items[0].title)).toBeTruthy();
    expect(screen.getByText(`${news.total} articles`)).toBeTruthy();
  });

  it('filters by story when its card is pressed', async () => {
    await render(<NewsScreen />);
    await fireEvent.press(screen.getByLabelText(new RegExp(`^Ongoing story: ${news.arcs[0].title}\\.`)));
    expect(queries.useNews).toHaveBeenLastCalledWith({ story: news.arcs[0].slug, archive: undefined });
  });
});

describe('Places tab', () => {
  it('lists states and countries and opens a place', async () => {
    await render(<PlacesScreen />);
    expect(screen.getByText('States and countries')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Utah. UT'));
    expect(mockPush).toHaveBeenCalledWith('/place/utah?kind=state');
    expect(screen.getByText('Costa Rica')).toBeTruthy();
  });
});

describe('Companies tab', () => {
  const companies = [...operators.items].sort((a, b) => a.name.localeCompare(b.name));

  it('draws a tile for each company with its program count', async () => {
    await render(<CompaniesScreen />);
    expect(screen.getByText('Parent companies')).toBeTruthy();
    expect(screen.getByText(`${companies.length} companies`)).toBeTruthy();
    // The list draws its first screens at once and the rest on scroll.
    for (const c of companies.slice(0, 8)) {
      expect(screen.getByText(c.name)).toBeTruthy();
      expect(screen.getAllByText(`${c.programs} ${c.programs === 1 ? 'program' : 'programs'}`).length).toBeGreaterThan(0);
    }
  });

  it('has an alphabet row with a button for the first letter of each company', async () => {
    await render(<CompaniesScreen />);
    for (const c of companies) {
      const first = c.name.charAt(0).toUpperCase();
      expect(screen.getByLabelText(`Jump to ${first >= 'A' && first <= 'Z' ? first : '#'}`)).toBeTruthy();
    }
  });

  it('opens a company by its page slug', async () => {
    await render(<CompaniesScreen />);
    const c = companies[0];
    await fireEvent.press(screen.getByLabelText(`${c.name}. ${describeCompany(c)}. ${c.programs} ${c.programs === 1 ? 'program' : 'programs'}`));
    expect(mockPush).toHaveBeenCalledWith(`/operator/${c.slug}`);
  });

  it('says where the programs are, in words', () => {
    expect(describeCompany({ places: ['UT', 'AZ'], years: '' })).toBe('Utah, Arizona');
    expect(describeCompany({ places: ['UT', 'AZ', 'ID'], years: '' })).toBe('3 states');
    expect(describeCompany({ places: ['UT', 'Costa Rica', 'ID'], years: '' })).toBe('3 places');
    expect(describeCompany({ places: ['Samoa'], years: '' })).toBe('Samoa');
    expect(describeCompany({ places: [], years: 'Founded 2005' })).toBe('Founded 2005');
  });
});

describe('About tab', () => {
  it('shows the reporting box and the sharing section', async () => {
    await render(<AboutScreen />);
    expect(screen.getByText('Report abuse')).toBeTruthy();
    expect(screen.getByText('Share information')).toBeTruthy();
    expect(screen.getByLabelText('Find where to report')).toBeTruthy();
    expect(screen.getByText('Version 1.2.3')).toBeTruthy();
  });
});
