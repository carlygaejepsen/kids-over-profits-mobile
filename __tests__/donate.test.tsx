/** Donate: the header button and the box open the website's /donate/ page in the in-app browser. */
import { fireEvent, render, screen } from '@testing-library/react-native';
import { openBrowserAsync } from 'expo-web-browser';

import { DonateBox, HeaderDonateButton } from '@/components/Donate';
import { DONATE_TEXT, DONATE_URL } from '@/lib/donate';

jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn(() => Promise.resolve()) }));

beforeEach(() => (openBrowserAsync as jest.Mock).mockClear());

describe('Donate', () => {
  it('points at the website donation page', () => {
    expect(DONATE_URL).toBe('https://kidsoverprofits.org/donate/');
  });

  it('opens it from the header', async () => {
    await render(<HeaderDonateButton />);
    await fireEvent.press(screen.getByLabelText('Donate to Kids Over Profits'));
    expect(openBrowserAsync).toHaveBeenCalledWith(DONATE_URL, expect.objectContaining({ toolbarColor: '#000435' }));
  });

  it('says the gift is tax-deductible and opens the page from the box', async () => {
    await render(<DonateBox />);
    expect(screen.getByText('Support this work')).toBeTruthy();
    expect(screen.getByText(DONATE_TEXT)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Donate to Kids Over Profits'));
    expect(openBrowserAsync).toHaveBeenCalledWith(DONATE_URL, expect.anything());
  });
});
