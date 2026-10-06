export type AliasKind = 'past' | 'current' | 'other';

/** The words for an alternate name, as the site words them (kop_alias_label in the theme). */
export function aliasLabel(kind: AliasKind, name: string): string {
  const n = name.trim();
  if (!n) return '';
  if (kind === 'past') return `Formerly ${n}`;
  if (kind === 'current') return `Now known as ${n}`;
  return `Also known as ${n}`;
}
