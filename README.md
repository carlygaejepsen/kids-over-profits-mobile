# Kids Over Profits mobile app

An iOS and Android app for [kidsoverprofits.org](https://kidsoverprofits.org), a public database of the troubled teen industry. Look up a facility, browse the companies and states, and read the news feed. It has no accounts, no analytics and no ads. Network calls go to kidsoverprofits.org, plus one read of the page behind a link when you send it (to fill in its title and date).

Built with Expo (SDK 57), expo-router and TypeScript.

## What is in it

| Tab | What it does |
|---|---|
| Search | Facility names as you type, including former and other names ("Formerly X", "Also known as X"). One tap searches news, lawsuits and records too. |
| News | The site's news feed with pictures, ongoing stories, a month filter and infinite scroll. Each card links to its facilities. |
| Places | Every state and a list of other countries; opens that place's facilities, lawsuits and news. |
| Companies | Parent companies; opens a company's history, programs, people, lawsuits and news. |
| Send | Send a link (article, lawsuit, bill or website), add a missing facility, or correct one. No account. Everything is reviewed by a person first. |
| About | The disclaimer, the data licence, and links to report abuse or share information on the website. |

A facility screen shows everything the website page shows. Every record has an "Open on kidsoverprofits.org" link. Site addresses for facilities and companies open inside the app.

## What is left to do

The open work, in order, and the steps that need the owner's accounts and devices, are in section 3.14 and the
"Mobile app" part of section 2 of the theme repo's [docs/PLAN.md](https://github.com/carlygaejepsen/Kids-Over-Profits/blob/main/docs/PLAN.md).
Update it in the same commit as the work it tracks.

## Send to KOP

The Send tab ports the Chrome extension in the theme repo (`browser-extension/send-to-kop/`). `src/lib/classify.ts` is its
`classify.js`; `src/lib/pageMeta.ts` reads og:title, og:site_name, the published date, author and `<title>` from the fetched HTML.

| Who | Route |
|---|---|
| Anyone | `POST kop/v1/mobile/submit`, `GET kop/v1/mobile/check` (no account) |
| Reviewer signed in (About > Reviewer sign-in) | `kop/v1/extension/submit` and `/check` with HTTP Basic auth (WordPress username + application password) in both `Authorization` and `X-KOP-Authorization`; links only. Facility information always uses the public route |

The login is kept only in `expo-secure-store`. Requests are built in `src/api/submit.ts`.

Ways in: the "Suggest a correction" button on a facility; a link pasted with "Paste link" (expo-clipboard);
the deep link `kidsoverprofits://send?url=<address>`; and sharing a link from a browser or another app.

What needs a development build (not Expo Go): sharing a link into the app. It uses `expo-sharing` (SDK 57, its incoming-share
support is marked experimental), configured in `app.json` (Android: text/plain shares; iOS: a Share Extension for text and web
addresses, which uses the app group `group.org.kidsoverprofits.app`). Build with `eas build --profile development`, or
`npx expo run:android` / `run:ios`. In Expo Go the share code is skipped without error; the deep link, Paste link and the
form all work there. Everything else (secure-store, clipboard) works in Expo Go.

## Where the data comes from

All data is public and read live from the site's REST API at `https://kidsoverprofits.org/wp-json/kop/v1/`:

| Route | Used for |
|---|---|
| `facility/<slug>` | A facility page |
| `operator/<slug>` and `operator?name=` | A company page |
| `news` | The news feed (`page`, `per_page`, `archive`, `story`, `facility`) |
| `facility-suggest`, `global-search` | Search |
| `state/<slug>`, `country/<slug>` | A state or country page |
| `operators` | The list of companies |

The first three are in the theme repo, [`inc/mobile-api.php`](https://github.com/carlygaejepsen/Kids-Over-Profits). They copy named keys only, so private columns (who submitted an article, reviewer notes) never reach the app.

## Run it

```bash
npm install
npx expo start        # scan the QR code with Expo Go on your phone
```

## Check it

```bash
npm run typecheck     # tsc --noEmit
npx expo lint
npm test              # jest: helpers, and the real API fixtures in __tests__/fixtures
npx expo export --platform ios --platform android   # proves the app bundles
```

The fixtures are real responses written by the theme's `scripts/test-mobile-api.php --dump <dir>`. Re-run that after the API changes and copy the files here.

To see every screen at phone size without the live site, run the screenshot harness. It exports the web build, answers every API call from the fixtures (plus the made-up ones in `scripts/shot-fixtures/`) and writes `tmp/shots/<screen>.png` and `<screen>-top.png`:

```bash
npm run shots                                # all screens
npm run shots -- --no-build --only=facility-9607,news
```

## Design

The app copies the website's design, not a design of its own. `src/components/site/` holds one component per thing the website draws (record header, stat tiles, sections with "N more +", the At a glance box, person cards with "Elsewhere in the industry", timelines, news cards, directory rows, company tiles, feed and story cards), each styled from the theme's `css/facility-profile.css`, `css/hub.css`, `css/news-feed.css` and `css/tti-program-index.css`. When the site's look changes, change it there and in `src/theme/`.

## Colours and accessibility

`src/theme/colors.ts` mirrors the site's `css/colors.css` and the component colours of the stylesheets above. Text on light backgrounds uses the "ink" shades, white text sits only on "fill" shades, and secondary text uses the muted grey, all for WCAG AA contrast. Tap targets are at least 44 points, text follows the reader's font size, and every card and chip has an accessibility label.

## Build for phones

```bash
npx eas-cli@latest login
npx eas-cli@latest build --profile preview --platform android   # an APK you can sideload
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --platform all
```

You need an Expo account. Publishing needs an Apple Developer Program membership (99 USD a year) and a Google Play developer account (25 USD once). Universal links need the site to serve `/.well-known/apple-app-site-association` and `assetlinks.json`; the `kidsoverprofits://` scheme works without them.

## Licence

Code: GPL-2.0, like the theme. The data the app shows is CC BY-SA 4.0: credit Kids Over Profits (https://kidsoverprofits.org) and share what you build from it under the same licence.
