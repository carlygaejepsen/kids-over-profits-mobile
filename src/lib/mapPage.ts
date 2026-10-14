import { SITE } from '@/api/client';

/**
 * The website's network map (/network-map/, js/network-map/ in the theme) shown in the app's Map tab. The page
 * is the website's own, so the map stays one program; the app hides the site's header, footer, donate
 * button and floating buttons, which the tab bar and the app's own screens replace, and the map's words above it,
 * its toolbar and its stage buttons, which the app's own controls replace (src/lib/mapBridge.ts presses them).
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
  // The words above the map: the app's header says what the tab is, and the room goes to the map.
  '.kop-network__standfirst',
  '.kop-network__tally',
  '.kop-network__editorial',
  // The app's search, chips and buttons replace the toolbar and the stage's own buttons.
  '.kop-network__toolbar',
  '.kop-network__view-controls',
  '.kop-network__zoom',
  '#kop-network-zoom-hint',
  '#kop-network-filters-toggle',
  // A web view has no full screen to give.
  '#kop-network-fullscreen',
];

export const MAP_CSS = `${HIDE_SELECTORS.join(',')}{display:none!important}
html,body{background:#fff!important}
html{margin-top:0!important}
#wrapper,#inner-wrap,.content-container,.site-container,.content-area,.content-wrap{margin:0!important;padding:0!important;max-width:none!important;background:#fff!important}
.kop-network{padding:6px 6px 0!important;margin:0!important;box-shadow:none!important;border-radius:0!important}
.kop-network__app{height:calc(100vh - 6px)!important;height:calc(100svh - 6px)!important;min-height:0!important}
.kop-network__stage{min-height:0!important}
html,body{overscroll-behavior:none}
.kop-network__chain{height:44px!important}
.kop-network__chain-list button,.kop-network__chain-home{min-height:40px}
.kop-network__drawer{padding-top:0!important}
.kop-network__drawer-close{width:44px!important;height:44px!important}
.kop-app-handle{position:sticky;top:0;z-index:2;height:28px;margin:0 -1rem 4px;background:#fff;touch-action:none}
.kop-app-handle::after{content:"";position:absolute;left:50%;top:10px;width:44px;height:5px;margin-left:-22px;border-radius:3px;background:#4A5568}
.kop-network__rail label,.kop-network__legend label{min-height:40px;display:flex;align-items:center}
.kop-network__rail input[type=checkbox],.kop-network__legend input[type=checkbox]{width:22px;height:22px}
.kop-network__list a,.kop-network__list button{min-height:40px}`;

/**
 * The app's style, added to the root element once there is one: at document start the page may not have an
 * <html> yet (Chromium and WebKit both run start scripts that early), so it waits for it. Safe to run twice.
 */
export const MAP_STYLE_SCRIPT = `(function(){var css=${JSON.stringify(MAP_CSS)};function add(){var r=document.documentElement;if(!r)return false;if(document.querySelector('style[data-kop-app]'))return true;var s=document.createElement('style');s.setAttribute('data-kop-app','');s.textContent=css;r.appendChild(s);return true;}try{if(!add()){var mo=new MutationObserver(function(){if(add())mo.disconnect();});mo.observe(document,{childList:true,subtree:true});}}catch(e){}})();`;

/** Runs before the page's own scripts, so the site's header never shows. */
export const MAP_INJECT_BEFORE = `${MAP_STYLE_SCRIPT}true;`;

/** Moves the loaded map to another name without reloading it (url-state.js follows the hash). */
export function openScript(open: string): string {
  return `(function(){location.hash=${JSON.stringify(`open=${encodeURIComponent(open)}`)};})();true;`;
}
