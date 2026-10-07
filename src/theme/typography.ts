import { Platform, type TextStyle } from 'react-native';

import { colors } from './colors';

/**
 * The website's type, in points (1rem = 16). The site sets no web font, so the app uses the system font
 * at weights 400, 600 and 700. Text scales with the reader's font size; dense rows cap growth with
 * denseMaxFontScale.
 */
export const serif = Platform.select({ ios: 'Georgia', default: 'serif' });

export const type = {
  /** Record page title: clamp(2rem, 4vw, 3rem), line-height 1.1, midnight. */
  title: { fontSize: 32, lineHeight: 36, fontWeight: '700', color: colors.midnight } as TextStyle,
  /** "Facility profile · Utah": .82rem, 600, uppercase, .08em, navy. */
  eyebrow: { fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: colors.navy } as TextStyle,
  /** Section h2: 1.35rem, midnight. */
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: colors.midnight } as TextStyle,
  /** Hub section heading, card titles: 1.15rem. */
  subheading: { fontSize: 18, lineHeight: 24, fontWeight: '700', color: colors.midnight } as TextStyle,
  /** dt, sub-heads ("Administration"): .72rem, 600, uppercase, .06em, navy. */
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.7, textTransform: 'uppercase', color: colors.navy } as TextStyle,
  /** Summary under the header: 1.15rem / 1.5. */
  lead: { fontSize: 18, lineHeight: 27, fontWeight: '400', color: colors.midnight } as TextStyle,
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400', color: colors.midnight } as TextStyle,
  bodyBold: { fontSize: 16, lineHeight: 24, fontWeight: '700', color: colors.midnight } as TextStyle,
  /** Roles, summaries in lists: .88–.9rem. */
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400', color: colors.midnight } as TextStyle,
  smallBold: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: colors.midnight } as TextStyle,
  /** Dates, sources, counts: .8–.82rem, muted. */
  meta: { fontSize: 13, lineHeight: 18, fontWeight: '400', color: colors.textMuted } as TextStyle,
  /** Kept for screens not yet moved to `meta`. */
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400', color: colors.textMuted } as TextStyle,
  /** Pills and badges: .78rem, 600, uppercase, .05em. */
  pill: { fontSize: 12.5, lineHeight: 16, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' } as TextStyle,
  /** "Elsewhere in the industry": .7rem, 700, .06em. */
  kicker: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase' } as TextStyle,
  /** Stat tile numbers: 1.6rem / 700 / 1. */
  statNumber: { fontSize: 26, lineHeight: 28, fontWeight: '700' } as TextStyle,
  /** News feed card titles: 1.25rem / 700 / 1.4, #2D3748. */
  feedTitle: { fontSize: 20, lineHeight: 28, fontWeight: '700', color: colors.headingInk } as TextStyle,
  /** Record-page news card titles: 1.02rem / 1.3, navy. */
  cardTitle: { fontSize: 16, lineHeight: 21, fontWeight: '600', color: colors.navy } as TextStyle,
} as const;

export const spacing = { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

/** tile 6 (record-page cards), box 8 (hub blocks, notices), card 12 (feed cards), thumb 4, pill 999. */
export const radius = { sm: 6, md: 12, lg: 16, tile: 6, box: 8, card: 12, thumb: 4, pill: 999 } as const;

/** Minimum size of anything a finger taps. */
export const touchTarget = 44;
export const denseMaxFontScale = 1.6;
export const maxContentWidth = 800;
/** Page gutter (the site's 1rem on phones). */
export const gutter = 16;
