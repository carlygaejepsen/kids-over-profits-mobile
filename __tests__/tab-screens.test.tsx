import { fireEvent, render, screen } from '@testing-library/react-native';
import fs from 'node:fs';
import path from 'node:path';

import type { FacilitiesIndex, NewsFeed, SuggestResponse } from '@/api/types';
import AboutScreen from '@/app/(tabs)/about';
import CompaniesScreen from '@/app/(tabs)/companies';
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
  useFacilitiesIndex: jest.fn(),
}));

const queries = jest.requireMock('@/api/queries');
const news: NewsFeed = require('./fixtures/news.json');

/** The screenshot fixture for the companies index. */
function readIndex(): FacilitiesIndex {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'scripts', 'shot-fixtures', 'index.json'), 'utf8'));
}
const index = readIndex();

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
  queries.useFacilitiesIndex.mockReturnValue({ data: index, isLoading: false, isError: false, refetch: jest.fn() });
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
  const companies = Object.values(index.projects).filter((p) => p.category === 'companies');

  it('draws a tile for every company with its program count', async () => {
    await render(<CompaniesScreen />);
    expect(screen.getByText('Parent companies')).toBeTruthy();
    expect(companies.length).toBeGreaterThan(0);
    for (const c of companies) {
      expect(screen.getByText(c.data!.operator!.name!)).toBeTruthy();
      const n = c.data!.facilities!.length;
      expect(screen.getAllByText(`${n} ${n === 1 ? 'program' : 'programs'}`).length).toBeGreaterThan(0);
    }
  });

  it('has an alphabet row with a button for the first letter of each company', async () => {
    await render(<CompaniesScreen />);
    for (const c of companies) {
      expect(screen.getByLabelText(`Jump to ${c.data!.operator!.name!.charAt(0).toUpperCase()}`)).toBeTruthy();
    }
  });

  it('opens a company by name', async () => {
    await render(<CompaniesScreen />);
    const name = companies[0].data!.operator!.name!;
    await fireEvent.press(screen.getByLabelText(new RegExp(`^${name}\\.`)));
    expect(mockPush).toHaveBeenCalledWith(`/operator/by-name?name=${encodeURIComponent(name)}`);
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
