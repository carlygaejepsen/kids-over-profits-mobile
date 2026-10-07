import { fireEvent, render, screen } from '@testing-library/react-native';
import { openBrowserAsync } from 'expo-web-browser';
import { useLocalSearchParams } from 'expo-router';

import OperatorScreen from '@/app/operator/[slug]';
import PlaceScreen from '@/app/place/[slug]';
import { useOperator, useOperatorByName, useStatePage } from '@/api/queries';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useLocalSearchParams: jest.fn(),
  Stack: { Screen: () => null },
}));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
jest.mock('@/api/queries', () => ({
  useOperator: jest.fn(),
  useOperatorByName: jest.fn(),
  useStatePage: jest.fn(),
}));

const operator1 = require('./fixtures/operator-1.json');
const operator2 = require('./fixtures/operator-2.json');
const utah = require('../scripts/shot-fixtures/state-utah.json');

const ok = (data: unknown) => ({ data, isLoading: false, isError: false, error: null, refetch: jest.fn() });
/** A section's heading button is labelled "Title, count" (or just the title when it has no count). */
const heading = (title: string) => screen.queryByLabelText(new RegExp(`^${title}(,|$)`));
const people = [...operator1.people.leaders, ...operator1.people.others].map((p: { name: string }) => p.name);

function showOperator(data: unknown) {
  (useLocalSearchParams as jest.Mock).mockReturnValue({ slug: '1' });
  (useOperator as jest.Mock).mockReturnValue(ok(data));
  (useOperatorByName as jest.Mock).mockReturnValue(ok(undefined));
}

describe('company screen', () => {
  it('opens with the eyebrow, the name, the place line and every section the record has', async () => {
    showOperator(operator1);
    await render(<OperatorScreen />);
    expect(screen.getByText(/parent company profile/i)).toBeTruthy();
    expect(screen.getByText('CEDU')).toBeTruthy();
    expect(screen.getByText('6 programs, in 2 places')).toBeTruthy();
    for (const title of ['Programs it has run', 'People', 'Ownership', 'News coverage', 'Lawsuits', 'Deaths on record', 'Documents', 'Websites']) {
      expect(heading(title)).toBeTruthy();
    }
    expect(screen.getByText('Updated October 2, 2026.')).toBeTruthy();
  });

  it('draws a history link as a link and opens it', async () => {
    showOperator({
      ...operator1,
      history: {
        status: 'published',
        paragraphs: ['It began in [Running Springs](https://example.org/springs) in 1967.'],
        sources: [{ label: 'The Source Article', url: 'https://example.org/source' }],
      },
    });
    await render(<OperatorScreen />);
    expect(heading('History')).toBeTruthy();
    await fireEvent.press(screen.getByText('Running Springs'));
    expect(openBrowserAsync).toHaveBeenCalledWith('https://example.org/springs');
    expect(screen.getByLabelText('source: The Source Article')).toBeTruthy();
  });

  it('prints each person once, six first and the rest behind "more"', async () => {
    showOperator(operator1);
    await render(<OperatorScreen />);
    for (const name of people.slice(0, 6)) expect(screen.getAllByText(name)).toHaveLength(1);
    expect(screen.queryByText(people[6])).toBeNull();
    await fireEvent.press(screen.getByLabelText('Show 11 more'));
    for (const name of people) expect(screen.getAllByText(name)).toHaveLength(1);
  });

  it('has no History section when the record has no history', async () => {
    showOperator(operator2);
    await render(<OperatorScreen />);
    expect(screen.getByText('Ascent Companies')).toBeTruthy();
    expect(heading('History')).toBeNull();
    expect(screen.queryByText('History')).toBeNull();
    expect(heading('Programs it has run')).toBeTruthy();
  });

  it('reads a company by name on the by-name route', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ slug: 'by-name', name: 'CEDU' });
    (useOperator as jest.Mock).mockReturnValue(ok(undefined));
    (useOperatorByName as jest.Mock).mockReturnValue(ok(operator1));
    await render(<OperatorScreen />);
    expect(screen.getByText('CEDU')).toBeTruthy();
  });
});

describe('place screen', () => {
  beforeEach(() => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ slug: 'utah' });
    (useStatePage as jest.Mock).mockReturnValue(ok(utah));
  });

  it('is a state hub with count pills, open programs and a lawsuit', async () => {
    await render(<PlaceScreen />);
    expect(screen.getByText(/state hub/i)).toBeTruthy();
    expect(screen.getByText('Utah')).toBeTruthy();
    expect(screen.getByText('Every facility, lawsuit, news story and bill on record in Utah.')).toBeTruthy();
    expect(screen.getByText('12 programs')).toBeTruthy();
    expect(screen.getByText('6 open')).toBeTruthy();
    expect(heading('Open programs')).toBeTruthy();
    expect(screen.getByText('Falcon Ridge Ranch')).toBeTruthy();
    expect(screen.getByText('Former Students v. Falcon Ridge Ranch and Sequel TSI')).toBeTruthy();
    expect(heading('State inspection reports')).toBeTruthy();
  });

  it('shows no legislation block when the feed has none, and one when it does', async () => {
    const { rerender } = await render(<PlaceScreen />);
    expect(heading('Legislation')).toBeNull();
    (useStatePage as jest.Mock).mockReturnValue(
      ok({ ...utah, legislation: [{ id: 1, bill_title: 'Youth Residential Oversight Act', bill_number: 'HB 12', status: 'in_committee' }] }),
    );
    await rerender(<PlaceScreen />);
    expect(heading('Legislation')).toBeTruthy();
    expect(screen.getByText('Youth Residential Oversight Act')).toBeTruthy();
    expect(screen.getByText('HB 12 · In committee')).toBeTruthy();
  });

  it('calls a country a country hub', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ slug: 'mexico', kind: 'country' });
    await render(<PlaceScreen />);
    expect(screen.getByText(/country hub/i)).toBeTruthy();
  });
});
