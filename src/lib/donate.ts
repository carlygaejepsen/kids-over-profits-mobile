import { openBrowserAsync } from 'expo-web-browser';

import { SITE } from '@/api/client';
import { colors } from '@/theme/colors';

/**
 * Donations go through the website's /donate/ page (Givebutter, kop_donate_widget() in the theme), opened in
 * the in-app browser. The app takes no payment itself: Kids Over Profits is a 501(c)(3), and the stores let a
 * nonprofit link out to its own donation page.
 */
export const DONATE_URL = `${SITE}/donate/`;

/** The footer's words on the website (inc/site-footer.php), kept the same here. */
export const DONATE_HEADING = 'Support this work';
export const DONATE_TEXT = 'Kids Over Profits is a 501(c)(3) nonprofit. Donations are tax-deductible.';

export function openDonate(): Promise<unknown> {
  return openBrowserAsync(DONATE_URL, { toolbarColor: colors.midnight, controlsColor: colors.white });
}
