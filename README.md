# Kids Over Profits mobile app

An iOS and Android app for [kidsoverprofits.org](https://kidsoverprofits.org), a public database of the troubled teen industry. Version one is read-only: look up a facility, browse the companies and states, and read the news feed. It has no accounts, no analytics and no ads. The only network calls go to kidsoverprofits.org.

Built with Expo (SDK 57), expo-router and TypeScript.

## What is in it

| Tab | What it does |
|---|---|
| Search | Facility names as you type, including former and other names ("Formerly X", "Also known as X"). One tap searches news, lawsuits and records too. |
| News | The site's news feed with pictures, ongoing stories, a month filter and infinite scroll. Each card links to its facilities. |
| Places | Every state and a list of other countries; opens that place's facilities, lawsuits and news. |
| Companies | Parent companies; opens a company's history, programs, people, lawsuits and news. |
| About | The disclaimer, the data licence, and links to report abuse or share information on the website. |

A facility screen shows everything the website page shows. Every record has an "Open on kidsoverprofits.org" link. Site addresses for facilities and companies open inside the app.

## What is left to do

The open work, in order, and the steps that need the owner's accounts and devices, are in section 3.14 and the
"Mobile app" part of section 2 of the theme repo's [docs/PLAN.md](https://github.com/carlygaejepsen/Kids-Over-Profits/blob/main/docs/PLAN.md).
Update it in the same commit as the work it tracks.

## Where the data comes from

All data is public and read live from the site's REST API at `https://kidsoverprofits.org/wp-json/kop/v1/`:

| Route | Used for |
|---|---|
| `facility/<slug>` | A facility page |
| `operator/<slug>` and `operator?name=` | A company page |
| `news` | The news feed (`page`, `per_page`, `archive`, `story`, `facility`) |
| `facility-suggest`, `global-search` | Search |
| `state/<slug>`, `country/<slug>` | A state or country page |
| `facilities?view=index` | The list of companies |

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

## Colours and accessibility

`src/theme/colors.ts` mirrors the site's `css/colors.css`. Text on light backgrounds uses the "ink" shades, white text sits only on "fill" shades, and secondary text uses the muted grey, all for WCAG AA contrast. Tap targets are at least 44 points, text follows the reader's font size, and every card and chip has an accessibility label.

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
