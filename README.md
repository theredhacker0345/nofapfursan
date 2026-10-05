# Fursan — Discipline over desire

A privacy-first, decentralized streak tracker. No account, no ads, no trackers, no
server. Your records are written to your device first; an encrypted copy syncs
through the public [Nostr](https://github.com/nostr-protocol/nips) network so you
can restore or move them.

Ships as a web app, an installable PWA, and a signed Android APK.

---

## What it does

| Screen | Purpose |
| --- | --- |
| **Today** | Streak count, one-tap start, daily check-in, challenge link |
| **Vitals** | Three weeks of mind + morning-signal check-ins |
| **Journal** | Encrypted private entries with mood and energy |
| **Vanguard** | Public relay chat across four channels |
| **History** | Best streak, 14-week consistency grid, activity log |
| **Library** | Guides and references |
| **Nutrition** | Local-only meal and macro log |
| **Profile / Settings** | Identity, backup, relays, themes, reminders |

---

## Architecture

The rule the whole codebase follows: **the device is the source of truth, the
relay network is a backup and a sync channel.**

```
src/
  services/
    localStore.ts   device records: check-ins, journal, activity log (bounded,
                    validated, deduplicated per day)
    nostr.ts        one shared SimplePool; validated relay list that is never
                    empty; every query bounded by maxWait + a hard race timeout;
                    bounded offline queue with a persisted retry counter and a
                    dead-letter drop
    secureStorage.ts  Capacitor Preferences wrapper
  lib/
    streakUtils.ts  streak model: calendar-day arithmetic (DST-proof),
                    last-writer-wins cloud merge on a monotonic `updatedAt`
  components/
    Screen.tsx      the single layout shell (header, width, nav clearance)
  data/themes.ts    six themes, each defining the complete token set
```

### Identity

A private key is generated on first launch and never leaves the device. Journal
entries, check-ins and the streak are published as NIP-44 payloads under a
self-directed conversation key, so a relay operator can store them but not read
them. Your key is the only way back — back it up from **Settings → Your key**.

### Offline

- Writes land locally first; publishing is best-effort.
- Failures queue durably (capped at 200 events, abandoned after 12 attempts) and
  flush on reconnect, on app resume, and every 45 s while visible.
- The service worker precaches the whole build manifest, so every lazy route
  resolves offline. `npm run build` generates that manifest
  (`scripts/build-sw.mjs`).

### Design system

One direction: **"Ledger"** — Swiss/editorial discipline with a warm bronze
accent. Hairline rules, flat planes, elevation reserved for things that genuinely
float. No decorative gradients, no blur panels, no emoji-as-icons, nothing below
11 px.

- Type: `Inter` (UI), `Inter Tight` (display), `JetBrains Mono` (values you
  compare over time). Loaded non-render-blocking with metric-matched fallbacks.
- Theme ids round-trip through Capacitor `Preferences`, whose web backend stores
  values verbatim while the native bridge JSON-decodes them. Both shapes are
  accepted on read, and the pre-paint script in `index.html` handles both — a
  mismatch there throws, leaves the light defaults in place, and silently renders
  every dark theme as light.
- Every theme defines the same 15 tokens — `--bg`, `--surface{,-2,-3}`,
  `--border{,-strong}`, `--ink{,-muted,-faint}`, `--accent{,-hover}`,
  `--on-accent`, `--success`, `--warning`, `--danger` — plus `color-scheme` and a
  matching `theme-color`, so no screen can drift off-palette.
- Theme applies before first paint (inline script in `index.html`), so there is no
  flash of the wrong theme.
- Motion is 120/180/240 ms and fully disabled under `prefers-reduced-motion`,
  including framer-motion via `<MotionConfig reducedMotion="user">`.

---

## Development

```bash
npm install
npm run dev        # vite on :8080
npm run build      # tsc -b → vite build → service-worker manifest
npm run preview    # serve dist on :4173
```

### Verification

```bash
npm run verify     # lint + typecheck + build + browser audit + flow tests
npm run flows      # flow tests only, against an existing build
```

`scripts/verify.mjs` serves the real production bundle to Chromium and fails on
anything a user would notice:

- console errors, unhandled rejections, failed requests
- horizontal overflow at 320 / 390 / 768 / 1440 px
- images without `alt`, controls without an accessible name
- text below 11 px, tap targets under 32 px, more than one `<h1>`
- heap growth, open WebSockets and live intervals across 24 navigations
- navigation on every route while offline

Add `--screenshots` to write `scripts/shots/verify/*.png`.

`scripts/flows.mjs` covers state transitions rather than rendering — 32 cases
against the production bundle:

- start / reset a streak, reload, and confirm the reset is not resurrected by a
  later cloud sync
- write a check-in and a journal entry, reload, and confirm nothing is lost,
  duplicated, or clobbered by a relay response that was already in flight
- write while offline and confirm the record lands on the device and queues for
  delivery, and that the queue stays bounded
- apply all six themes and assert each one actually renders *its own* palette,
  by luminance — not merely that its tokens are populated
- an empty relay list, a corrupt identity, malformed local records, and a
  start date in the future

Every state-dependent assertion polls for its condition rather than sleeping, so
the suite is deterministic.

CI (`.github/workflows/ci.yml`) runs the same gate on every push and pull request.
`release.yml` produces the signed APK on a `v*` tag and fails with an explicit
message if the signing secrets are absent.

---

## Deploying

Static hosting: `npm run build`, serve `dist/`. The app uses `HashRouter`, so no
server rewrite rule is required.

## Android

```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease
```

Set `storeFile`, `storePassword`, `keyAlias` and `keyPassword` in
`android/keystore.properties` (see `.gitignore`) before a release build.

---

## License

MIT.