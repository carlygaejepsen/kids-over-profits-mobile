/**
 * The site's palette (css/colors.css in the Kids-Over-Profits theme). Keep the two in step.
 *
 * Contrast rules (WCAG AA: 4.5:1 text, 3:1 large text and icons):
 * - An accent used as text or an icon on a light ground is its "ink" shade.
 *   Bright accents are for borders and highlights, and for text on midnight or navy.
 * - White text sits only on a "fill" shade, never on a bright accent (white on teal is 2.86:1).
 * - Secondary text (dates, sources, counts) is textMuted, never a lighter grey.
 */
export const colors = {
  midnight: '#000435',
  navy: '#000080',
  teal: '#33A7B5',
  orange: '#EF9034',
  chartreuse: '#B2E102',
  paleSpringYellow: '#ECF385',
  coralPink: '#FE8088',
  bubblegumPink: '#FC8ED6',
  powderBlue: '#AEE0ED',
  sand: '#F2EEDF',
  softPastelYellow: '#FFF5CB',
  mintGreen: '#B6E3D4',
  white: '#FFFFFF',
  tealInk: '#24757F',
  orangeInk: '#A3570D',
  coralPinkInk: '#D9020F',
  chartreuseInk: '#5C7401',
  bubblegumPinkInk: '#CC0587',
  tealFill: '#24757F',
  orangeFill: '#A3570D',
  coralPinkFill: '#D9020F',
  bubblegumPinkFill: '#CC0587',
  textPrimary: '#000435',
  textSecondary: '#000080',
  textMuted: '#4A5568',
  bgPrimary: '#F2EEDF',
  bgSecondary: '#FFFFFF',
  bgAccent: '#FFF5CB',
  borderPrimary: '#B6E3D4',
  borderSecondary: '#AEE0ED',
  borderAccent: '#B2E102',
  focus: '#33A7B5',
} as const;

export type ColorName = keyof typeof colors;

const statusColors = {
  open: { text: colors.midnight, background: colors.mintGreen, border: colors.tealInk },
  closed: { text: colors.midnight, background: colors.sand, border: colors.textMuted },
  unknown: { text: colors.textMuted, background: colors.white, border: colors.borderSecondary },
};

/** Status pills: dark text on a soft fill, never white on an accent. */
export function statusColor(status: string | null | undefined) {
  const key = (status ?? '').trim().toLowerCase();
  if (key === 'open' || key === 'active' || key === 'operating') return statusColors.open;
  if (key === 'closed' || key === 'inactive') return statusColors.closed;
  return statusColors.unknown;
}
