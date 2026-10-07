/** Pull one web address out of whatever a person pasted or shared ("Title https://example.org/x"). */
export function extractUrl(text: string | null | undefined): string {
  const m = /https?:\/\/[^\s<>"']+/i.exec(text ?? '');
  if (!m) return '';
  const url = m[0].replace(/[).,;:!?\]}]+$/, '');
  try {
    return new URL(url).toString();
  } catch {
    return '';
  }
}

/** A plausible email address; the site checks it again. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}
