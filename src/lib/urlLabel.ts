/**
 * The words a reader sees for an address, never the address itself. A simplified copy of the
 * site's kop_url_label(): the page's own words when its path has some, else the site name.
 */
export function hostOf(raw: string): string {
  try {
    return new URL(raw).host.replace(/^www\d*\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function wordsFromSegment(segment: string): string {
  let s = decodeURIComponent(segment);
  s = s.replace(/\.(html?|php|aspx?|jsp|cfm|pdf|docx?|xlsx?|pptx?|jpe?g|png|gif|txt)$/i, '');
  s = s.replace(/[-_+.~]+/g, ' ');
  const words = s
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !/^\d{5,}$/.test(w) && !(w.length >= 12 && /^[0-9a-f]+$/i.test(w) && /\d/.test(w)));
  const text = words.join(' ');
  if ((text.match(/[a-z]/gi) ?? []).length < 3) return '';
  const lower = text === text.toUpperCase() || text === text.toLowerCase() ? text.toLowerCase() : text;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function urlLabel(raw: string, max = 70): string {
  const url = (raw ?? '').trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) return url;
  const host = hostOf(url);
  let path = '';
  try {
    path = new URL(url).pathname;
  } catch {
    return host;
  }
  const segments = path.split('/').filter(Boolean);
  const words = segments.length ? wordsFromSegment(segments[segments.length - 1]) : '';
  let label = words ? `${words} (${host})` : host;
  if (label.length > max) {
    const cut = label.slice(0, max - 1);
    const space = cut.lastIndexOf(' ');
    label = `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[ ,.;:-]+$/, '')}…`;
  }
  return label;
}
