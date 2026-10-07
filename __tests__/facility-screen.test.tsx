import { fireEvent, render, screen } from '@testing-library/react-native';

import FacilityScreen from '@/app/facility/[slug]';

const mockFacility = { current: require('./fixtures/facility-9607.json') };

jest.mock('@/api/queries', () => ({
  useFacility: () => ({ data: mockFacility.current, isLoading: false, isError: false, refetch: jest.fn() }),
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ slug: 'x' }),
  useRouter: () => ({ push: jest.fn() }),
  Stack: { Screen: () => null },
}));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));

const falcon = require('./fixtures/facility-9607.json');
const canyon = require('./fixtures/facility-9605.json');
const staffNames: string[] = Object.values(falcon.staff as Record<string, { name: string }[]>).flatMap((g) => g.map((e) => e.name));

describe('facility screen, Falcon Ridge Ranch', () => {
  beforeEach(() => {
    mockFacility.current = falcon;
  });

  it('shows the title and the eyebrow', async () => {
    await render(<FacilityScreen />);
    expect(screen.getByRole('header', { name: 'Falcon Ridge Ranch' })).toBeTruthy();
    expect(screen.getByText(/facility profile · utah/i)).toBeTruthy();
    expect(screen.getByLabelText('Run by Sequel TSI')).toBeTruthy();
  });

  it('prints each staff member once and never the "Previously:" sentence', async () => {
    await render(<FacilityScreen />);
    await fireEvent.press(screen.getByLabelText('Show 6 more'));
    expect(staffNames.length).toBeGreaterThan(6);
    for (const name of staffNames) expect(screen.getAllByText(name)).toHaveLength(1);
    expect(screen.queryByText(/Previously:/)).toBeNull();
    expect(screen.getAllByText('Elsewhere in the industry').length).toBeGreaterThan(0);
    expect(screen.getByText('Administration')).toBeTruthy();
    expect(screen.getByText('Notable staff')).toBeTruthy();
  });

  it('shows the lawsuit, the news and the stat tiles', async () => {
    await render(<FacilityScreen />);
    expect(screen.getByText(falcon.lawsuits[0].case_name)).toBeTruthy();
    expect(screen.getByText(falcon.news[0].title)).toBeTruthy();
    expect(screen.getByLabelText('1 lawsuit')).toBeTruthy();
    expect(screen.getByLabelText(`${falcon.news.length} news articles`)).toBeTruthy();
    expect(screen.getByLabelText('Jump to Lawsuits')).toBeTruthy();
  });

  it('leaves out empty sections and cleans citation leftovers from the notes', async () => {
    await render(<FacilityScreen />);
    expect(screen.queryByText('Incidents on record')).toBeNull();
    expect(screen.queryByText('Deaths on record')).toBeNull();
    expect(screen.getByText('Serves: Female')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Jump to Lawsuits'));
  });

  it('ends with the reporting notice and the footer', async () => {
    await render(<FacilityScreen />);
    expect(screen.getByText('Reporting this program')).toBeTruthy();
    expect(screen.getByText(`Record updated ${falcon.updated_label}.`)).toBeTruthy();
    expect(screen.getByText('Generated from the Kids Over Profits facility database.')).toBeTruthy();
    expect(screen.getByText('Suggest a correction')).toBeTruthy();
  });
});

describe('facility screen, Canyon State Academy', () => {
  beforeEach(() => {
    mockFacility.current = canyon;
  });

  it('lists the deaths on record by name', async () => {
    await render(<FacilityScreen />);
    expect(canyon.memorials.length).toBeGreaterThan(0);
    for (const m of canyon.memorials) expect(screen.getByText(m.name)).toBeTruthy();
    expect(screen.getByText('Deaths on record')).toBeTruthy();
  });
});
