#!/usr/bin/env node
/**
 * Screenshots of the app's screens at phone size, for design review (dev only, never shipped).
 *
 *   npm run shots                       # export the web build, then shoot every screen
 *   npm run shots -- --no-build         # reuse dist/
 *   npm run shots -- --only=facility-9607,news
 *   npm run shots -- --dist=tmp/dist-a --out=tmp/shots-a   # separate folders for parallel runs
 *
 * The web build runs in Chromium at 390x844. Every request to the live API
 * (https://kidsoverprofits.org/wp-json/kop/v1/...) is answered inside the browser from
 * __tests__/fixtures/ and scripts/shot-fixtures/, images get a grey placeholder, and any other
 * outside request is blocked, so the shots need no network. Output: tmp/shots/<name>.png (full page)
 * and <name>-top.png (first screen).
 */
import { Buffer } from 'node:buffer';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { chromium } from 'playwright';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name) => (args.find((a) => a.startsWith(`--${name}=`)) ?? '').slice(name.length + 3);
// --dist=<dir> and --out=<dir> let several runs work side by side.
const dist = path.resolve(root, opt('dist') || 'dist');
const out = path.resolve(root, opt('out') || path.join('tmp', 'shots'));
const appFixtures = path.join(root, '__tests__', 'fixtures');
const shotFixtures = path.join(root, 'scripts', 'shot-fixtures');

const only = opt('only').split(',').filter(Boolean);
const noBuild = args.includes('--no-build');

const SCREENS = [
  { name: 'facility-9607', path: '/facility/9607' },
  { name: 'facility-9605', path: '/facility/9605' },
  { name: 'operator-1', path: '/operator/1' },
  { name: 'place-utah', path: '/place/utah' },
  { name: 'companies', path: '/companies' },
  { name: 'search', path: '/', type: 'falcon' },
  { name: 'news', path: '/news' },
  { name: 'about', path: '/about' },
].filter((s) => !only.length || only.includes(s.name));

/** The fixture file for one API path ("facility/9607", "news", ...), or null. */
function fixtureFor(apiPath, search) {
  const [head, rest = ''] = apiPath.split(/\/(.*)/s);
  const app = (f) => path.join(appFixtures, f);
  const shot = (f) => path.join(shotFixtures, f);
  switch (head) {
    case 'facility': {
      const own = app(`facility-${rest}.json`);
      return fs.existsSync(own) ? own : app('facility-9607.json');
    }
    case 'operator':
      return app(rest === '2' ? 'operator-2.json' : 'operator-1.json');
    case 'news':
      return app('news.json');
    case 'facility-suggest':
      return shot('suggest.json');
    case 'global-search':
      return shot('global-search.json');
    case 'state':
    case 'country':
      return shot('state-utah.json');
    case 'facilities':
      return search.includes('view=index') ? shot('index.json') : null;
    default:
      return null;
  }
}

/** A solid grey PNG, small; the app scales it into each image box. */
function greyPng(w = 160, h = 90) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }, () => [200, 205, 211]).flat())]);
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Serves dist/ the way a static host would, with expo-router's [slug].html for dynamic routes. */
function serve() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon', '.ttf': 'font/ttf' };
  const resolve = (pathname) => {
    const p = decodeURIComponent(pathname).replace(/\/+$/, '') || '/';
    const tries = [path.join(dist, p), path.join(dist, `${p}.html`), path.join(dist, p, 'index.html'), path.join(dist, '(tabs)', `${p}.html`)];
    const segs = p.split('/').filter(Boolean);
    if (segs.length === 2) tries.push(path.join(dist, segs[0], '[slug].html'));
    tries.push(path.join(dist, 'index.html'));
    return tries.find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
  };
  return new Promise((done) => {
    const server = createServer((req, res) => {
      const file = resolve(new URL(req.url, 'http://x').pathname);
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' });
      res.end(fs.readFileSync(file));
    });
    server.listen(0, '127.0.0.1', () => done({ server, port: server.address().port }));
  });
}

function chromePath() {
  const base = '/opt/pw-browsers';
  for (const dir of fs.existsSync(base) ? fs.readdirSync(base).filter((d) => d.startsWith('chromium-')).sort().reverse() : []) {
    const exe = path.join(base, dir, 'chrome-linux', 'chrome');
    if (fs.existsSync(exe)) return exe;
  }
  return undefined; // Playwright's own
}

async function main() {
  if (!noBuild || !fs.existsSync(dist)) {
    console.log('Exporting the web build...');
    execSync(`npx expo export --platform web --output-dir ${JSON.stringify(dist)}`, { cwd: root, stdio: 'inherit' });
  }
  fs.mkdirSync(out, { recursive: true });
  const png = greyPng();
  const { server, port } = await serve();
  const browser = await chromium.launch({ executablePath: chromePath(), headless: true });
  const problems = [];

  for (const screen of SCREENS) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await context.addInitScript(() => localStorage.setItem('kop.disclaimer.accepted.v1', 'yes'));
    await context.route('**/*', async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      if (url.hostname === '127.0.0.1') return route.continue();
      const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' };
      if (url.pathname.startsWith('/wp-json/kop/v1/')) {
        if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
        const file = fixtureFor(url.pathname.slice('/wp-json/kop/v1/'.length).replace(/\/+$/, ''), url.search);
        if (!file || !fs.existsSync(file)) {
          problems.push(`${screen.name}: no fixture for ${url.pathname}${url.search}`);
          return route.fulfill({ status: 404, headers: cors, contentType: 'application/json', body: '{"code":"not_found"}' });
        }
        return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: fs.readFileSync(file) });
      }
      if (req.resourceType() === 'image' || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url.pathname)) {
        return route.fulfill({ status: 200, headers: cors, contentType: 'image/png', body: png });
      }
      return route.abort();
    });
    const page = await context.newPage();
    page.on('console', (m) => m.type() === 'error' && problems.push(`${screen.name}: ${m.text()}`));
    page.on('pageerror', (e) => problems.push(`${screen.name}: ${e.message}`));

    await page.goto(`http://127.0.0.1:${port}${screen.path}`, { waitUntil: 'networkidle' });
    if (screen.type) {
      await page.locator('input').first().fill(screen.type);
      await page.waitForTimeout(1200);
      await page.waitForLoadState('networkidle');
    }
    await page.waitForTimeout(800);
    for (const [suffix, fullPage] of [['', true], ['-top', false]]) {
      const file = path.join(out, `${screen.name}${suffix}.png`);
      await page.screenshot({ path: file, fullPage });
      console.log(`wrote ${path.relative(root, file)}`);
    }
    await context.close();
  }

  await browser.close();
  server.close();
  if (problems.length) {
    console.log('\nPage errors:');
    for (const p of [...new Set(problems)]) console.log(`  ${p}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
