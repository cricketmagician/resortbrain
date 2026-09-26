# 06 · PWA, performance, accessibility, security

M2 wears the **Performance Captain** hat, so this document is also the performance charter the team signs up to.

## 1. Manifests

**Per-hotel guest manifest** (`app/(guest)/h/[hotel]/manifest.webmanifest/route.ts`, a GET route handler with
`generateStaticParams` over the seed slugs):

```json
{
  "id": "/h/grand-azure",
  "name": "Grand Azure Resort & Spa",
  "short_name": "Grand Azure",
  "description": "In-room dining, requests and your bill — Grand Azure Resort & Spa",
  "start_url": "/h/grand-azure",
  "scope": "/h/grand-azure",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#070B14",
  "theme_color": "#070B14",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "shortcuts": [
    { "name": "In-room dining", "url": "/h/grand-azure/menu" },
    { "name": "Make a request", "url": "/h/grand-azure/request" },
    { "name": "Your bill", "url": "/h/grand-azure/bill" }
  ]
}
```

- Serve it with `Content-Type: application/manifest+json` and `Cache-Control: public, max-age=3600`.
- The hotel layout's `generateMetadata` points `manifest` at this URL.
- **Root manifest** `app/manifest.ts`: the generic ResortBrain manifest, with `start_url: '/'`. M3 may point staff
  layouts at their own manifest.
- **Verify** in the built HTML that each guest page has exactly **one** `<link rel="manifest">`, and that it's the
  hotel one.

**Icons** (`app/(guest)/icons/[file]/route.tsx`): `ImageResponse` from `next/og`, with `generateStaticParams`
returning `192.png`, `512.png` and `maskable-512.png`. Draw a midnight background, a gold crest ring and the "RB"
monogram in a serif. The maskable variant keeps the art inside the central 80 % safe zone. `app/apple-icon.tsx`
produces the 180 × 180 version, and `app/icon.svg` is the favicon.

## 2. Service worker (`public/sw.js`, hand-written, about 120 lines, no Workbox)

```
const VERSION = 'rb-sw-v1';               // bump on every change to this file
const STATIC = `${VERSION}-static`, PAGES = `${VERSION}-pages`, IMAGES = `${VERSION}-images`, DATA = `${VERSION}-data`;
const PRECACHE = ['/offline', '/icon.svg', '/icons/192.png'];

install  → cache PRECACHE; self.skipWaiting()
activate → delete caches not starting with VERSION; self.clients.claim()
fetch    → only GET; route by URL:
  • /_next/static/*                           cache-first (immutable, hashed)
  • /_next/image*, images.unsplash.com/*      stale-while-revalidate, trim IMAGES to 80 entries
  • /api/menu*                                stale-while-revalidate (public, cacheable)
  • navigations to /h/* and /                 network-first with a 3 s timeout → cached page → /offline
                                              (on success, put a copy in PAGES; trim to 30)
  • EVERYTHING ELSE → untouched (no respondWith). In particular never cache:
      /api/orders*, /api/requests*, /api/billing*, /api/stays/*, /api/health, /api/notifications*,
      /q/*, any RSC request (header 'RSC: 1' or '_rsc' search param), and all staff/admin routes.
message  → { type: 'SKIP_WAITING' } → self.skipWaiting()

// M3 owns push. Keep this block at the very end:
try { importScripts('/sw-push.js'); } catch (e) { /* push handler not deployed yet */ }
```

**Registration** (`components/guest/sw-registrar.tsx`, in the `(guest)` layout):

- Register after `window.load` with `navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })`.
- Only in production, or when `NEXT_PUBLIC_SW_IN_DEV === '1'`.
- M3's staff layout registers the **same** `/sw.js`, so there's one registration and one scope.
- When a new worker is waiting, show a toast: "A fresh version is ready" with a **Refresh** action. The action
  posts `SKIP_WAITING`, waits for `controllerchange`, then reloads.

## 3. Install prompt (`components/guest/install-prompt.tsx`)

- **When:** after the guest's **first successful order or request** (the moment the app has earned a place on the
  home screen), or on the third visit. Never on the first load. Don't show it again for 7 days after a dismiss
  (`localStorage['rb.install.dismissedAt']`). Never show it in standalone mode
  (`matchMedia('(display-mode: standalone)')` or `navigator.standalone`).
- **Android / Chromium:** capture `beforeinstallprompt` (`preventDefault`, keep the event). The sheet reads "Add
  {hotel short name} to your home screen: one tap back to room service." It has a primary "Add to Home Screen"
  button (calls `event.prompt()`) and a ghost "Not now".
- **iPhone Safari:** the same sheet, with three illustrated steps: tap the Share icon (inline SVG of the iOS share
  glyph), choose **Add to Home Screen**, tap **Add**.
- **Any other browser:** render nothing. The Next docs warn that `beforeinstallprompt` isn't cross-browser, so
  this component is progressive enhancement only.

## 4. Performance budgets (Performance Captain)

These are hard ceilings. After the first measured build, set each budget to *measured + 10 %*, but never above the
ceiling.

| Metric | Guest (`/h/grand-azure`, `/h/grand-azure/menu`) | Landing (`/`) | How |
|--------|------------------------------------------------|---------------|-----|
| LCP, mobile, slow 4G, 4× CPU | ≤ 2.0 s | ≤ 1.8 s | budget script and Lighthouse |
| Total blocking time | ≤ 200 ms | ≤ 150 ms | Lighthouse |
| CLS | ≤ 0.05 | ≤ 0.02 | budget script and Lighthouse |
| JS transferred, first load (gzip/br) | ≤ 180 KB | ≤ 140 KB | budget script |
| Largest image | ≤ 120 KB | — (no hero image) | budget script |
| Lighthouse mobile: Performance / Accessibility / Best Practices | ≥ 90 / ≥ 95 / ≥ 95 | ≥ 95 / ≥ 95 / ≥ 95 | Lighthouse |
| Tap → next screen visible | ≤ 150 ms perceived | — | `<Link prefetch>`, route `loading.tsx`, optimistic UI |

**How we hit them:**

- Static HTML for every public guest page (SSG + ISR).
- Server Components by default, with client islands kept small and leaf-level.
- Images: `next/image` with `sizes`, AVIF/WebP, `priority` only for the LCP image, and a blur-free CSS gradient
  placeholder (no base64 blobs).
- Two variable fonts through `next/font` (self-hosted, preloaded, `swap`).
- No animation or UI library. Supabase is lazy-loaded only when Realtime is on.
- `swr` is the only client data library.
- `<Link>` prefetch for bottom-nav destinations, plus `router.prefetch` for the likely next step (menu → cart, cart
  → tracking).

**`scripts/perf/guest-budget.mjs`** (`npm run perf:guest`, run after `npm run build && npm start`):

- Use `playwright-core`'s chromium. If the bundled revision doesn't match, launch with
  `executablePath: process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium'`.
- For each route in `['/', '/h/grand-azure', '/h/grand-azure/menu', '/h/heritage-palace/menu']`:
  1. Open a fresh context: 360 × 800, `isMobile`, `deviceScaleFactor: 3`, a mobile UA.
  2. Through CDP, apply `Network.emulateNetworkConditions({ latency: 150, downloadThroughput: 1.6 Mbps/8, uploadThroughput: 750 Kbps/8 })`
     and `Emulation.setCPUThrottlingRate({ rate: 4 })`.
  3. Sum `encodedDataLength` from `Network.loadingFinished` for script responses, and track the largest image.
  4. Read LCP and CLS through an injected `PerformanceObserver({ buffered: true })` after `networkidle` plus 1 s.
- Print a table and **exit 1** when any budget is exceeded.

**Lighthouse report for the pitch:**

```
npx lighthouse http://localhost:3000/h/grand-azure/menu \
  --form-factor=mobile --screenEmulation.mobile --throttling-method=simulate \
  --chrome-flags="--headless=new" --output=html --output=json \
  --output-path=docs/perf/lighthouse-guest-menu
```

Run the same for `/` and `/h/grand-azure`. Commit the HTML reports under `docs/perf/`; the numbers go on slide 11
(M1 presents them).

## 5. Accessibility (target: WCAG 2.2 AA; Lighthouse Accessibility ≥ 95)

- **Landmarks and structure:** `header`, `nav[aria-label]` and `main` on every page, one `h1` per page, logical
  heading order, and a **Skip to content** link as the first focusable element.
- **Colour:** follow the token contrast in doc 03. Status is **never** conveyed by colour alone: every state has an
  icon and a label.
- **Keyboard:**
  - Everything is operable by keyboard.
  - Sheets trap focus (native `<dialog>`), close on Escape and restore focus.
  - Star rating is a radiogroup with arrow keys.
  - Chip rails scroll the focused chip into view.
- **Screen readers:**
  - StatusTimeline announces changes politely.
  - Toasts use `role="status"` (errors use `role="alert"`).
  - The cart quantity is announced.
  - Icon-only buttons have an `aria-label`.
  - Decorative images get `alt=""`. Dish photos get `alt="{dish name}"`.
- **Forms:** visible labels (placeholders aren't labels), errors tied to fields with `aria-describedby`, and
  `inputMode` / `autoComplete` where it applies.
- **Touch:** targets ≥ 44 × 44 px with ≥ 8 px between adjacent targets, and there are no hover-only affordances.
- **Motion:** respect `prefers-reduced-motion` (handled globally), with no autoplaying motion longer than 5 s
  except the hero phone. The hero phone pauses under reduced motion and gets a pause button.
- **Zoom:** the layout works at 200 % zoom and at a 320 px width, with no horizontal scroll.
- **Language:** `lang="en"` on `html`. Prices use `en-IN` formatting.

## 6. Mobile QA (issue #33): run it on real devices

**Devices:** one mid-range Android (Chrome) and one iPhone (Safari, iOS 16.4 or later), plus desktop Chrome at
360 px.

For each device, run through this and log the results in `docs/m2/qa-log.md` (date, device, pass/fail, fixes):

- [ ] Scan the printed QR from the room card (camera app). It lands on the home screen in under 2 s on 4G (use a
      real hotspot).
- [ ] Order two items with notes, watch the status advance live, and see the delay notice when the order is held.
- [ ] Make an urgent housekeeping request and see it reach "On it".
- [ ] Open the bill, pay by card (test), get the receipt, print a preview (A4 and 80 mm), and leave feedback.
- [ ] Toggle Sunlight mode outdoors or at maximum screen brightness, and check the text is readable.
- [ ] Put the phone in airplane mode on the menu: the offline banner shows, the menu is still visible, and cart
      edits work. Reconnect and the order goes through.
- [ ] Install to the home screen (Android prompt and iOS guide), open it from the icon, and confirm it opens
      standalone at the hotel home.
- [ ] Rotate the device, enlarge the text size (iOS Dynamic Type), and turn on VoiceOver / TalkBack for one full
      order.
- [ ] Use an expired or revoked token (clear the session, or check out the stay in `api` mode) and land on the
      friendly re-entry screen.
- [ ] Throttled 4G (DevTools) at least twice a week, as the playbook asks.

## 7. Test IDs for M3's E2E suite (`components/guest/test-ids.ts`)

Export the IDs as a typed constant so M3 imports the exact strings rather than retyping them:

```ts
export const GUEST_TID = {
  qrLoading: 'guest-qr-loading', qrError: 'guest-qr-error', qrRetry: 'guest-qr-retry',
  home: 'guest-home', greeting: 'guest-home-greeting', activeStrip: 'guest-active-strip',
  quick: (k: string) => `guest-quick-${k}`, nav: (k: string) => `guest-nav-${k}`,
  menu: 'guest-menu', menuSearch: 'menu-search', vegToggle: 'menu-veg-toggle',
  menuCat: (slug: string) => `menu-cat-${slug}`, menuItem: (id: string) => `menu-item-${id}`,
  menuAdd: (id: string) => `menu-add-${id}`, menuQty: (id: string) => `menu-qty-${id}`,
  cartBar: 'cart-bar', itemSheet: 'item-sheet', itemAdd: 'item-add',
  cart: 'guest-cart', cartLine: (id: string) => `cart-line-${id}`, cartPlaceOrder: 'cart-place-order', cartEmpty: 'cart-empty',
  request: 'guest-request', requestCategory: (c: string) => `request-category-${c}`,
  requestPreset: (s: string) => `request-preset-${s}`, requestSubmit: 'request-submit',
  activity: 'guest-activity',
  orderTracking: 'guest-order-tracking', orderTimeline: 'order-status-timeline', orderCurrent: 'order-status-current',
  requestTracking: 'guest-request-tracking', requestTimeline: 'request-status-timeline', requestCurrent: 'request-status-current',
  bill: 'guest-bill', billTotal: 'bill-total', billPay: 'bill-pay', paymentConfirm: 'payment-confirm',
  receipt: 'guest-receipt', feedbackSubmit: 'feedback-submit', feedbackThanks: 'feedback-thanks',
  rejoin: 'rejoin-screen', offline: 'guest-offline', landing: 'landing', landingDemoQr: 'landing-demo-qr',
} as const;
```

The current step element also carries `data-status="{status}"`, so E2E can assert on
`[data-testid=order-status-current][data-status=preparing]`.

## 8. Security and privacy (guest side)

- **Stay token:**
  - It lives in `localStorage` only. It's never put in a URL after `/q/` resolves, never logged, never sent to
    analytics, and never included in share text.
  - QR entry uses `router.replace`, so the token path leaves history.
  - "Not you? Leave this device" clears everything.
- **No money math on the client** (see doc 05 §8). Payment amounts sent back to the server are the server's own
  values.
- **Nothing the server derives is sent from the client.** The guest client never sends `hotelId`, `roomId`,
  prices, `slaMinutes` or roles. Only the stay token plus ids, quantities and text.
- **Guest pages** are `noindex, nofollow`. The landing page is indexable.
- **The room QR print sheet** is gated by `RB_ENABLE_QR_SHEET`. It returns `notFound()` otherwise, and must stay
  off in production. The landing page exposes only the single demo room token (`NEXT_PUBLIC_DEMO_QR_TOKEN`).
- **`dangerouslySetInnerHTML`** is allowed in exactly two places: the static theme boot script, and the SVG
  string produced by `qrcode` from a URL we build ourselves.
- **External links** get `rel="noopener noreferrer"`. `tel:` links use the hotel phone from the seed.
- **Push payload privacy** is M1's and M3's concern, but the guest UI never shows another guest's data. Every list
  is scoped by the stay token on the server.

## 9. Acceptance

- [ ] Lighthouse mobile shows the page is installable, the manifest is valid, the service worker is registered,
      and it works offline for `/h/grand-azure/menu` (visited once while online).
- [ ] `npm run perf:guest` passes every budget on a production build.
- [ ] axe (via Lighthouse) reports no violations on any guest screen or the landing page.
- [ ] `docs/perf/` contains the Lighthouse HTML reports for `/`, `/h/grand-azure` and `/h/grand-azure/menu`.
- [ ] `docs/m2/qa-log.md` contains the real-device pass for Android and iPhone.
