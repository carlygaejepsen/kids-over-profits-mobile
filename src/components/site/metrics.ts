import type { TextStyle } from 'react-native';

import { denseMaxFontScale, type } from '@/theme/typography';

/** Spread onto the Text in pills, badges and list rows so large system text cannot break them. */
export const dense = { maxFontSizeMultiplier: denseMaxFontScale } as const;

/** Sizes the website's stylesheets fix in pixels (colours and type come from the theme). */
export const size = {
  /** Record-page news thumbnail, and the share of it a publisher logo fills. */
  thumb: 92,
  logoShare: '62%',
  /** Stat tile icon, section heading icon. */
  statIcon: 22,
  headingIcon: 20,
  /** Timeline dot (ring included) and the line it sits on. */
  dot: 11,
  dotRing: 2,
  timelineIndent: 22,
  timelineLine: 2,
  /** Feed photo ratio and logo height. */
  photoRatio: 16 / 9,
  feedLogoHeight: 48,
  /** Width of one story card in the horizontal strip. */
  storyWidth: 260,
  tileMinHeight: 120,
  /** A company tile's name is set smaller past this many characters. */
  longName: 40,
  /** Pill height the 44-point hit area is built around. */
  pillHeight: 32,
} as const;

/** The big white initial on a news card that has no picture. */
export const initialText: TextStyle = { fontSize: 40, lineHeight: 44, fontWeight: '700' };

/** Hit slop that lifts a small pill or link line to a 44-point target. */
export const hitSlopFor = (height: number) => {
  const v = Math.max(0, Math.ceil((44 - height) / 2));
  return { top: v, bottom: v, left: 8, right: 8 };
};

/** Small bold navy text the site uses for chips and links (13/600). */
export const chipText: TextStyle = { ...type.meta, fontWeight: '600' };
