import { hostOf } from './urlLabel';

type CiteLike = { url?: string; cite?: string; source?: string; label?: string };

const OWN_HOSTS = ['kidsoverprofits.org'];

/**
 * A citation that only points back to us says nothing a reader can check, so the app leaves it out:
 * "Kids Over Profits network map", or a page on our own site. Our copies of other people's documents
 * (the media library under /wp-content/) still count as sources.
 */
export function isOwnSource(c: CiteLike): boolean {
  const words = `${c.cite ?? ''} ${c.source ?? ''} ${c.label ?? ''}`;
  if (/kids over profits|\bnetwork map\b|\bKOP\b/i.test(words) && !/woodbury/i.test(words)) return true;
  const url = c.url ?? '';
  if (url) {
    const host = hostOf(url) || hostOf(`https://example.test${url.startsWith('/') ? url : `/${url}`}`);
    if (OWN_HOSTS.includes(host) || (url.startsWith('/') && !url.startsWith('/wp-content/'))) {
      try {
        const path = url.startsWith('/') ? url : new URL(url).pathname;
        return !path.startsWith('/wp-content/');
      } catch {
        return true;
      }
    }
  }
  return false;
}

/** The citations worth showing: not ours, and with something to link or label. */
export function usableCitations<T extends CiteLike>(items: T[] | undefined): T[] {
  return (items ?? []).filter((c) => c && (c.url || c.cite || c.source || c.label) && !isOwnSource(c));
}

/** The words behind a "(source)" link, without the Woodbury Reports wording. */
export function citeWords(c: CiteLike): string {
  const words = c.cite || c.source || c.label || '';
  return /woodbury/i.test(words) ? '' : words;
}

const WOODBURY =
  /(?:,\s*)?Woodbury Reports(?:,\s*[A-Za-z]+\.?\s+\d{4})?(?:\s*\(#\d+\))?(?:,\s*pp?\.\s*[\d–-]+)?(?:,\s*)?/gi;

/**
 * Prose as the app prints it: the "Woodbury Reports, February 2009, p. 20" wording and bare web
 * addresses written into a sentence are removed; the "(source)" link carries the citation.
 */
export function cleanProse(text: string | null | undefined): string {
  let out = String(text ?? '');
  out = out.replace(/\(((?:[^()]|\([^()]*\))*)\)/g, (_m, inner: string) => {
    if (!/woodbury reports/i.test(inner)) return `(${inner})`;
    const kept = inner.replace(WOODBURY, ' ').replace(/\s+/g, ' ').replace(/^[\s,;]+|[\s,;]+$/g, '');
    return kept ? `(${kept})` : '';
  });
  out = out.replace(/\s*https?:\/\/\S+/g, '');
  return out.replace(/[ \t]{2,}/g, ' ').replace(/\s+([.,;:])/g, '$1').trim();
}
