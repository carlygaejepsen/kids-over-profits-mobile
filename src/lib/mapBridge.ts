/**
 * The app's controls for the website's network map (js/network-map/ in the theme), run inside the Map tab's web
 * view. The page stays the website's own; the app drives it through what the map already puts on `window`:
 * KOPNetworkMap (app.js: store, focus, viewport), KOPNetworkSearch.rank (search.js, the map's own ranking), and
 * the site's buttons by id, clicked even while hidden, so each control runs the map's own code.
 *
 * Page -> app: `window.ReactNativeWebView.postMessage(JSON)` with
 *   {type: 'state', ready, trail: [{id, name}], key, list, timeline, drawer, hash}   whenever any of those change
 *   {type: 'results', q, items: [{id, name, kind, via, viaKind}]}             answer to search(q)
 * App -> page: `mapCommand(...)` strings for WebView.injectJavaScript.
 */

export type TrailStep = { id: string; name: string };
export type MapState = {
  ready: boolean;
  trail: TrailStep[];
  key: boolean;
  list: boolean;
  timeline: boolean;
  drawer: boolean;
  /** The map's address hash ("#open=a,b&mode=..."): what Copy link copies. */
  hash: string;
};
export type MapResult = { id: string; name: string; kind: string; via: string; viaKind: string };
export type MapMessage = ({ type: 'state' } & MapState) | { type: 'results'; q: string; items: MapResult[] };

export const EMPTY_STATE: MapState = { ready: false, trail: [], key: false, list: false, timeline: false, drawer: false, hash: '' };

/** The site's buttons each app control presses. */
export const BUTTONS = {
  zoomIn: 'kop-network-zoom-in',
  zoomOut: 'kop-network-zoom-out',
  fit: 'kop-network-zoom-fit',
  reset: 'kop-network-reset-view',
  wholeMap: 'kop-network-whole-map',
  key: 'kop-network-filters-toggle',
  list: 'kop-network-list-toggle',
  timeline: 'kop-network-timeline-toggle',
  closeDrawer: 'kop-network-drawer-close',
} as const;
export type MapButton = keyof typeof BUTTONS;

/** The map's words for its node kinds (search.js KIND_WORDS). */
const KIND_WORDS: Record<string, string> = {
  facility: 'Program',
  parent: 'Company',
  person: 'Person',
  association: 'Trade group',
  church: 'Church',
  government: 'Government body',
};
export const kindWord = (kind: string) => KIND_WORDS[kind] ?? '';

/** A message from the page, or null for anything else (the page may post its own). */
export function parseMessage(raw: string): MapMessage | null {
  let m: unknown;
  try {
    m = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!m || typeof m !== 'object') return null;
  const o = m as Record<string, unknown>;
  if (o.type === 'state') {
    const trail = Array.isArray(o.trail)
      ? o.trail.filter((t): t is TrailStep => !!t && typeof (t as TrailStep).id === 'string').map((t) => ({ id: t.id, name: String(t.name ?? t.id) }))
      : [];
    return { type: 'state', ready: !!o.ready, trail, key: !!o.key, list: !!o.list, timeline: !!o.timeline, drawer: !!o.drawer, hash: typeof o.hash === 'string' ? o.hash : '' };
  }
  if (o.type === 'results' && Array.isArray(o.items)) {
    return {
      type: 'results',
      q: String(o.q ?? ''),
      items: o.items
        .filter((i): i is MapResult => !!i && typeof (i as MapResult).id === 'string')
        .map((i) => ({ id: i.id, name: String(i.name ?? i.id), kind: String(i.kind ?? ''), via: String(i.via ?? ''), viaKind: String(i.viaKind ?? '') })),
    };
  }
  return null;
}

/**
 * Installed once the page has loaded: window.__kopApp, and a watcher that posts the state whenever it changes.
 * The map writes its trail into the address with history.replaceState (url-state.js), so that is wrapped too;
 * a short poll catches what changes no address (the Key, the drawer) and the map becoming ready.
 */
export const MAP_BRIDGE = `(function(){
if (window.__kopApp) { window.__kopApp.post(true); return; }
var last = '';
function el(id){ return document.getElementById(id); }
function on(id, attr){ var b = el(id); return !!b && b.getAttribute(attr) === 'true'; }
function state(){
  var app = window.KOPNetworkMap, trail = [];
  try {
    if (app && app.focus && app.focus.chain) trail = app.focus.chain().map(function(id){
      var n = app.store.node(id); return { id: String(id), name: (n && n.name) || String(id) };
    });
  } catch (e) {}
  var d = el('kop-network-drawer');
  return { type: 'state', ready: !!(app && app.store && app.store.ready), trail: trail,
    key: on('kop-network-filters-toggle', 'aria-expanded'), list: on('kop-network-list-toggle', 'aria-pressed'),
    timeline: on('kop-network-timeline-toggle', 'aria-pressed'), drawer: !!d && !d.hidden, hash: String(location.hash || '') };
}
function post(force){
  var s = JSON.stringify(state());
  if (!force && s === last) return;
  last = s;
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
}
var rs = history.replaceState;
history.replaceState = function(){ var r = rs.apply(history, arguments); setTimeout(post, 0); return r; };
window.addEventListener('hashchange', function(){ setTimeout(post, 0); });
setInterval(post, 400);
/* The drawer is a sheet over the lower half on a phone: a handle to drag it down and away. */
function handle(){
  var d = el('kop-network-drawer');
  if (!d || d.querySelector('.kop-app-handle')) return;
  var h = document.createElement('div');
  h.className = 'kop-app-handle';
  h.setAttribute('aria-hidden', 'true');
  d.insertBefore(h, d.firstChild);
  var y0 = null, dy = 0;
  h.addEventListener('touchstart', function(e){ y0 = e.touches[0].clientY; dy = 0; d.style.transition = 'none'; }, { passive: true });
  h.addEventListener('touchmove', function(e){ if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0); d.style.transform = 'translateY(' + dy + 'px)'; }, { passive: true });
  h.addEventListener('touchend', function(){
    d.style.transition = ''; d.style.transform = '';
    if (dy > 70) { var c = el('kop-network-drawer-close'); if (c) c.click(); }
    y0 = null;
  });
}
setInterval(handle, 1000);
window.__kopApp = {
  post: post,
  press: function(id){ var b = el(id); if (b) b.click(); setTimeout(post, 50); },
  search: function(q){
    var app = window.KOPNetworkMap, S = window.KOPNetworkSearch, items = [];
    if (app && S && app.store) items = S.rank(app.store.nodes, q, 8).map(function(h){
      return { id: String(h.node.id), name: h.node.name, kind: h.node.kind || '', via: h.via || '', viaKind: h.viaKind || '' };
    });
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'results', q: q, items: items }));
  },
  open: function(id){
    var app = window.KOPNetworkMap, n = app && app.store && app.store.node(id);
    if (n) app.focus.select(n);
    setTimeout(post, 50);
  },
  back: function(){
    var app = window.KOPNetworkMap; if (!app) return;
    var c = app.focus.chain();
    if (c.length > 1) app.focus.restore(c.slice(0, -1), app.focus.mode());
    else if (c.length === 1) { var w = el('kop-network-whole-map'); if (w) w.click(); else app.focus.clear(); }
    setTimeout(post, 50);
  }
};
post(true);
})();true;`;

const call = (body: string) => `(function(){if(window.__kopApp){${body}}})();true;`;

/** JS for the web view: press one of the site's buttons. */
export const pressScript = (b: MapButton) => call(`window.__kopApp.press(${JSON.stringify(BUTTONS[b])});`);
/** JS for the web view: rank the map's names for `q`; the answer comes back as a 'results' message. */
export const searchScript = (q: string) => call(`window.__kopApp.search(${JSON.stringify(q)});`);
/** JS for the web view: put a name on the board, with its connections. */
export const openNodeScript = (id: string) => call(`window.__kopApp.open(${JSON.stringify(id)});`);
/** JS for the web view: one step back along the trail; from its first name, the whole map. */
export const BACK_SCRIPT = call('window.__kopApp.back();');
