import type { TextStyle } from 'react-native';

/** Type scale. Text scales with the reader's font size; dense rows cap growth with denseMaxFontScale. */
export const type = {
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' } as TextStyle,
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '700' } as TextStyle,
  subheading: { fontSize: 18, lineHeight: 24, fontWeight: '600' } as TextStyle,
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' } as TextStyle,
  bodyBold: { fontSize: 16, lineHeight: 24, fontWeight: '600' } as TextStyle,
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400' } as TextStyle,
  smallBold: { fontSize: 14, lineHeight: 20, fontWeight: '600' } as TextStyle,
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' } as TextStyle,
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 6, md: 12, lg: 16, pill: 999 } as const;
/** Minimum size of anything a finger taps. */
export const touchTarget = 44;
export const denseMaxFontScale = 1.6;
export const maxContentWidth = 800;
