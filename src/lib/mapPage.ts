import { SITE } from '@/api/client';

/**
 * The website's network map (/network-map/, js/network-map/ in the theme) shown in the app's Map tab. The page
 * is the website's own, so the map stays one program; the app only hides the site's header, footer, donate
 * button and floating buttons, which the tab bar and the app's own screens replace.
 */
export const MAP_PATH = '/network-map/';

/** The map opened on one name, as the site links it: /network-map/#open=<node id>. */
export function mapUrl(open?: string): string {
  return `${SITE}${MAP_PATH}${open ? `#open=${encodeURIComponent(open)}` : ''}`;
}

/** The node id in a site address that opens the map on it ("…/network-map/#open=provo-canyon-school"), or ''. */
export function openFromMapUrl(raw: string | null | undefined): string {
  const m = /[#&]open=([^&]+)/.exec(raw ?? '');
  if (!m) return '';
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

/** True for the map page itself (any hash), which stays in the web view; every other address leaves it. */
export function isMapPage(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.host.replace(/^www\./, '') === new URL(SITE).host && u.pathname.replace(/\/?$/, '/') === MAP_PATH;
  } catch {
    return false;
  }
}

/** Everything around the map on the website that the app has its own version of. */
export const HIDE_SELECTORS = [
  '#masthead',
  '.site-header',
  '#mobile-drawer',
  '#search-drawer',
  '#colophon',
  '.site-footer',
  '.kop-global-search__trigger',
  '.tutorial-toggle-btn',
  '.tutorial-toggle-tooltip',
  '.tutorial-overlay',
  '.tutorial-card',
  '.kop-network__title',
  '.kop-network__donate',
  '.kop-bug-report-link',
  '#addtoany',
  // Signed in through admin mode, the map page would also draw WordPress's admin bar.
  '#wpadminbar',
];

export const MAP_CSS = `${HIDE_SELECTORS.join(',')}{display:none!important}
html,body{background:#fff!important}
html{margin-top:0!important}
#wrapper,#inner-wrap,.content-container,.site-container,.content-area,.content-wrap{margin:0!important;padding:0!important;max-width:none!important;background:#fff!important}
.kop-network{padding:8px 8px 0!important;margin:0!important;box-shadow:none!important;border-radius:0!important}`;

/** Runs before the page's own scripts: the style goes on the root element, as <head> may not exist yet. */
export const MAP_INJECT_BEFORE = `(function(){try{var s=document.createElement('style');s.setAttribute('data-kop-app','');s.textContent=${JSON.stringify(MAP_CSS)};document.documentElement.appendChild(s);}catch(e){}})();true;`;

/** Moves the loaded map to another name without reloading it (url-state.js follows the hash). */
export function openScript(open: string): string {
  return `(function(){location.hash=${JSON.stringify(`open=${encodeURIComponent(open)}`)};})();true;`;
}
