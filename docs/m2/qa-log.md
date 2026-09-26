# M2 QA log

This log tracks the guest-side QA passes called for in [06-pwa-performance-a11y.md](06-pwa-performance-a11y.md)
§6 and §9. Entries are dated; nothing here is edited after the fact except to append a follow-up.

## Automated / emulated QA (this build)

No physical devices are available in the implementation sandbox, so every phase (7 through 11) was verified with:

- `npm run typecheck && npm run lint && npx vitest run tests/unit/guest && npm run build` after every phase.
- A Playwright (`playwright-core` + the sandbox's Chromium at `/opt/pw-browsers/chromium`) functional and
  screenshot pass per screen: menu browse and veg filter, item detail and cart, placing an order and watching the
  status timeline advance, raising a request through to completion, the bill and test-mode payment sheet, the
  receipt (screen, A4 print preview and 80 mm thermal print preview), feedback with the star radiogroup, the
  install-prompt sheet (Android-style and iOS-style), service-worker registration and the offline fallback
  (airplane-mode-equivalent via a blocked network condition), and — this phase — the room QR print sheet.
- `npm run perf:guest` (`scripts/perf/guest-budget.mjs`) on a production build: a throttled-mobile (Fast-3G-class
  network, 4× CPU) Playwright/CDP pass over `/`, `/h/grand-azure`, `/h/grand-azure/menu` and
  `/h/heritage-palace/menu`, checking LCP, CLS, first-load JS and largest image against docs/m2/06 §4's budgets.
- `npx lighthouse` (mobile, simulated throttling) against the same three routes; reports committed under
  `docs/perf/`.

None of this substitutes for the real-device pass below — it's what could be verified without one.

### 2026-09-26 — Performance and accessibility pass (Phase 11)

**Performance budget script** (`npm run perf:guest`), production build:

| Route | LCP | CLS | JS (gzip) | Largest image | Status |
|---|---|---|---|---|---|
| `/` | ~0.9 s | 0.000 | 155.5 KB (budget 140 KB) | n/a | JS over budget |
| `/h/grand-azure` | ~0.8 s | 0.000 | 175.9 KB (budget 180 KB) | 0.1 KB | Pass |
| `/h/grand-azure/menu` | ~2.5–2.6 s (budget 2.0 s) | 0.000 | 179.0 KB (budget 180 KB) | 0.1 KB | LCP over budget |
| `/h/heritage-palace/menu` | ~2.5–2.6 s (budget 2.0 s) | 0.000 | 179.0 KB (budget 180 KB) | 0.1 KB | LCP over budget |

**Lighthouse (mobile, simulated throttling)** — see `docs/perf/*.report.html` for the full reports:

| Route | Performance | Accessibility | Best Practices | LCP | TBT | CLS |
|---|---|---|---|---|---|---|
| `/` (target ≥95/≥95/≥95) | 93 | 100 | 100 | 3.2 s | 30 ms | 0 |
| `/h/grand-azure` (target ≥90/≥95/≥95) | 92 | 100 | 96 | 3.3 s | 50 ms | 0 |
| `/h/grand-azure/menu` (target ≥90/≥95/≥95) | 92 | 100 | 96 | 3.3 s | 70 ms | 0 |

**What was fixed this pass:**
- The data layer statically imported both the `http` adapter (pulling in `zod`) and the `mock` adapter into every
  guest bundle regardless of which was actually used. Switched to `import()` per resolved source
  (`lib/guest/data/index.ts`) — cut guest first-load JS by roughly 90 KB.
- `InstallPrompt` and `SwRegistrar` render nothing until their own effects fire; lazy-loaded them
  (`next/dynamic`) out of the hotel layout's initial bundle.
- Landing page: three decorative preview sections (`guest-showcase.tsx`, `how-it-works.tsx`) wrapped real,
  focusable mock buttons in `aria-hidden` without also removing them from the tab order — added `inert`. Fixed a
  Lighthouse `aria-hidden-focus` violation (landing Accessibility 92 → 100).
- `StatusTimeline`'s de-emphasized step label and timestamp text (`text-ink-subtle`) measured 4.42:1 against a
  `surface-2` card background — under the 4.5:1 AA minimum, since that token is only calibrated against
  `bg`/`surface-1` (docs/m2/03). Changed to `text-ink-muted` everywhere in the component. Fixed a Lighthouse
  `color-contrast` violation.
- The QR print sheet's generated SVG carries its own `width`/`height` (240px) and was overflowing its intended
  52 mm box, overlapping the "Order food" line below it. Added `[&>svg]:h-full [&>svg]:w-full` so it fills the
  box instead. Caught by screenshot QA before this ever shipped.
- `DemoDataBadge` is mounted in the outer `(guest)` layout, which also covers `/offline` and `/q/[token]` —
  routes with no hotel-shell bottom padding reserved for it. Hid it on those two routes so it can't sit on top of
  real content on a short viewport there.

**What's still open, and why it wasn't force-fixed:**
- Landing's Performance score (93) and JS budget (155.5 KB vs. 140 KB), and LCP on both menu routes (~2.5 s vs.
  2.0 s), are driven almost entirely by the React 19 + Next.js 16 App Router client runtime itself — confirmed by
  diffing chunk hashes across unrelated routes and finding the same ~110 KB gzip of framework code (React's own
  minified `react.dev/errors` fingerprint) shipping everywhere. No application-level change removes this.
- The menu-page LCP element is a dish-name `<h3>` set in Playfair Display. Tracing it with a `PerformanceObserver`
  showed the LCP candidate list finalizing only after the webfont swap (`font-display: swap`, as docs/m2/06 §4
  specifies) recalculates the heading's box, and that recalculation is queued behind hydration work under the
  4× CPU throttle. The two ways to close this gap outright — dropping to `font-display: optional` for headings, or
  restructuring `MenuList` into smaller server/client boundaries — were not applied: the first trades away the
  documented font-loading strategy and the menu's premium typography for a synthetic-benchmark number, and the
  second is a larger refactor of already-tested, working code than this pass justified. Recorded here for
  docs/m2/10 follow-up instead.
- All three Lighthouse runs show some run-to-run variance (a repeat of the same route moved LCP by ±100 ms and JS
  by a few KB) — expected under artificial network/CPU throttling, not a regression.

## Real-device pass (Android + iPhone) — **not yet done**

No physical Android or iPhone device is reachable from this environment. The checklist below (docs/m2/06 §6) is
still open and should be run by whoever has the hardware before the pitch:

- [ ] Scan the printed QR from the room card (camera app); lands on the home screen in under 2 s on 4G.
- [ ] Order two items with notes; status advances live; delay notice appears when an order is held.
- [ ] Make an urgent housekeeping request and see it reach "On it".
- [ ] Open the bill, pay by card (test), get the receipt, print a preview (A4 and 80 mm), leave feedback.
- [ ] Toggle Sunlight mode outdoors or at max screen brightness; text stays readable.
- [ ] Airplane mode on the menu: offline banner shows, menu stays visible, cart edits work; reconnect and the
      order goes through.
- [ ] Install to the home screen (Android prompt, iOS manual steps); opens standalone at the hotel home.
- [ ] Rotate the device, enlarge text size (iOS Dynamic Type), run one full order under VoiceOver / TalkBack.
- [ ] Use an expired or revoked token; lands on the friendly re-entry screen.
- [ ] Throttled 4G in DevTools, at least twice a week, per the playbook.

Everything above except the physical-camera scan, real sunlight, real screen-reader software and the real home-
screen install icon has an emulated equivalent already covered by this build's Playwright QA (see above) — those
four specifically need real hardware and haven't been substituted for.

## Known content gaps

- **Hotel banner photos** (docs/m2/07 §3): the seed's original note was that both hotels shared one banner image.
  As of this build, `db/seed/guest/guest_seed.ts` gives Grand Azure and Heritage Palace distinct `banner_url`
  values (`photo-1540555700478…` and `photo-1566073771259…`), so that specific gap looks closed. The images
  themselves remain unverified in this sandbox (`images.unsplash.com` is blocked by the egress proxy) — run
  `npm run verify:images` on a machine or preview with open internet before the pitch, and swap in a distinct
  Heritage Palace courtyard photo if the current one doesn't read as one on inspection.
