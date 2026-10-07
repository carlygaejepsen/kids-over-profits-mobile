/**
 * The site's palette (css/colors.css in the Kids-Over-Profits theme) and the component colours its
 * stylesheets use (facility-profile.css, hub.css, news-feed.css, tti-program-index.css). Keep in step.
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
  /** The site's content panel is white; sand is for boxes inside it (the At a glance rail, hub blocks). */
  bgPrimary: '#FFFFFF',
  bgSecondary: '#FFFFFF',
  bgAccent: '#FFF5CB',
  borderPrimary: '#B6E3D4',
  borderSecondary: '#AEE0ED',
  borderAccent: '#B2E102',
  focus: '#33A7B5',
  /** Card and list-row borders on record pages (facility-profile.css). */
  cardBorder: '#AEE0ED',
  /** News feed cards (news-feed.css). */
  feedBorder: '#E2E8F0',
  /** Kadence's heading colour, used by the news feed titles. */
  headingInk: '#2D3748',
  /** Directory navy (tti-program-index.css company tiles and facility names). */
  directoryNavy: '#00004D',
  /** Button pressed state (the site's hover). */
  buttonPressed: '#000080',
} as const;

export type ColorName = keyof typeof colors;

export type StatusTone = { text: string; background: string; border: string };

/** Status pills on record pages (facility-profile.css .kop-fp-status). */
const statusPills: Record<string, StatusTone> = {
  open: { text: '#7A4A08', background: '#FFF5CB', border: '#EF9034' },
  closed: { text: '#000080', background: '#F2EEDF', border: '#B6E3D4' },
  suspended: { text: '#8A1F2B', background: '#F2EEDF', border: '#FE8088' },
  transferred: { text: '#1F5F66', background: '#F2EEDF', border: '#33A7B5' },
  unknown: { text: '#4A5568', background: '#FFFFFF', border: '#AEE0ED' },
};

export function statusKey(status: string | null | undefined): keyof typeof statusPills {
  const key = (status ?? '').trim().toLowerCase();
  if (key === 'open' || key === 'active' || key === 'operating') return 'open';
  if (key === 'closed' || key === 'inactive') return 'closed';
  if (key === 'suspended') return 'suspended';
  if (key === 'transferred' || key === 'renamed' || key === 'merged') return 'transferred';
  return 'unknown';
}

/** Status pill colours: dark text on a soft fill, never white on an accent. */
export function statusColor(status: string | null | undefined): StatusTone {
  return statusPills[statusKey(status)];
}

/**
 * Directory facility rows (tti-program-index.css): a 5 px border (8 px on the left) in the status
 * colour, and a status badge in white on that colour. Every colour carries white text at 4.5:1 or better.
 */
const directoryStatus: Record<string, string> = {
  open: '#B34700',
  closed: '#0D7A8A',
  suspended: '#B0293A',
  transferred: '#5A5A5A',
  unknown: '#5F5F5F',
};

export function directoryStatusColor(status: string | null | undefined): string {
  return directoryStatus[statusKey(status)];
}

/** Stat tiles and section accents (facility-profile.css): top border, then icon and number. */
export const tones = {
  grave: { edge: '#FE8088', ink: '#D9020F' },
  warn: { edge: '#EF9034', ink: '#A3570D' },
  info: { edge: '#33A7B5', ink: '#24757F' },
} as const;
export type Tone = keyof typeof tones;

/** News article type badges (news-feed.css .article-type-badge). */
const newsTypes: Record<string, { background: string; text: string }> = {
  lawsuit: { background: '#FED7D7', text: '#9B2C2C' },
  event: { background: '#C6F6D5', text: '#276749' },
  expose: { background: '#FEEBC8', text: '#9C4221' },
  arrest: { background: '#E9D8FD', text: '#6B46C1' },
  closure: { background: '#FED7E2', text: '#97266D' },
  corporate: { background: '#BEE3F8', text: '#2C5282' },
  general: { background: '#E2E8F0', text: '#4A5568' },
};

export function newsTypeColor(type: string | null | undefined) {
  return newsTypes[(type ?? '').trim().toLowerCase()] ?? newsTypes.general;
}

/** Shadows the site puts under feed and directory cards (iOS shadow* props, Android elevation). */
export const shadows = {
  card: { shadowColor: '#000435', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  tile: { shadowColor: '#33A7B5', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
} as const;
