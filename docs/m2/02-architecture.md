# 02 · Architecture

> Next.js 16 is **not** the version most training data describes. Before writing any route, read the matching guide
> in `node_modules/next/dist/docs/` (the repo's `AGENTS.md` requires this). Facts this plan relies on, all checked
> against the bundled docs:
>
> - `params` and `searchParams` are **Promises**, so always `await props.params`. Use the global helpers
>   `PageProps<'/h/[hotel]/menu'>`, `LayoutProps<'/h/[hotel]'>` and `RouteContext<'...'>` that typegen generates.
> - `middleware` is now **`proxy.ts`**. M2 doesn't need one.
> - `next build` no longer prints First Load JS sizes. Measure with Lighthouse or the budget script instead
>   (doc 06).
> - **Cache Components stays off** for this repo, because turning it on is a team-wide change. Use the previous
>   caching model: `export const revalidate = 60` plus `generateStaticParams`
>   (`01-app/02-guides/caching-without-cache-components.md`).
> - `images.domains` is deprecated, so use `images.remotePatterns`. `minimumCacheTTL` now defaults to 4 h, which
>   suits us.
> - Private folders (`_components`) are excluded from routing.
> - Calls to native `window.history.pushState` / `replaceState` sync with `useSearchParams`.
> - `import 'server-only'` works without installing the package.
> - Turbopack is the default for both `dev` and `build`. Don't add a `webpack` config.

## 1. File tree (everything M2 creates, marked ★, plus the shared files M2 edits, marked ✎)

```
app/
  layout.tsx                                   ✎ fonts, theme boot script, metadataBase, default dark
  globals.css                                  ✎ imports tokens
  page.tsx                                     ✎ DELETE (placeholder "Hello world"; `/` moves to (marketing))
  icon.svg                                     ★ favicon (gold crest on midnight)
  apple-icon.tsx                               ★ 180×180 PNG via ImageResponse
  manifest.ts                                  ★ generic ResortBrain manifest (start_url "/"); M3 may override for staff
  (marketing)/
    layout.tsx                                 ★ forces dark theme wrapper, MarketingHeader + MarketingFooter
    page.tsx                                   ★ "/" → renders <LandingPage/>
    opengraph-image.tsx                        ★ 1200×630 OG image (ImageResponse)
    landing/
      _components/                             ★ (private — not a route)
        landing-page.tsx                         section composition
        hero.tsx  hero-phone.tsx  built-for.tsx  problem.tsx  how-it-works.tsx
        guest-showcase.tsx  operations-teaser.tsx  security-band.tsx  demo-qr.tsx
        roadmap.tsx  final-cta.tsx
      _content/                                ★ typed copy + team credits (no hardcoded strings in JSX)
        landing-copy.ts  team.ts
  (guest)/
    layout.tsx                                 ★ guest group: noindex metadata, viewport themeColor, SW registrar, offline banner
    offline/page.tsx                           ★ static offline fallback (precached)
    rejoin/page.tsx                            ★ generic re-entry (hotel unknown)
    q/[token]/page.tsx                         ★ SCREEN 1 · QR entry
    h/[hotel]/
      layout.tsx                               ★ loads public hotel, per-hotel accent, GuestProviders, AppBar, BottomNav
      not-found.tsx                            ★ unknown hotel
      error.tsx                                ★ branded error boundary with retry
      manifest.webmanifest/route.ts            ★ per-hotel PWA manifest
      page.tsx                                 ★ SCREEN 2 · Hotel home
      menu/page.tsx  menu/loading.tsx  menu/error.tsx     ★ SCREEN 3 · Menu (SSG + ISR)
      menu/[itemId]/page.tsx                   ★ SCREEN 4a · Item detail (deep-link page; same component as the sheet)
      cart/page.tsx                            ★ SCREEN 4b · Cart and checkout
      request/page.tsx                         ★ SCREEN 5 · Service request
      activity/page.tsx                        ★ SCREEN 6a · Activity feed (orders + requests)
      orders/[orderId]/page.tsx                ★ SCREEN 6b · Order tracking (live)
      requests/[requestId]/page.tsx            ★ SCREEN 6c · Request tracking (live)
      bill/page.tsx                            ★ SCREEN 7 · Bill and payment
      receipt/[invoiceId]/page.tsx             ★ SCREEN 8 · Receipt, print layouts, feedback
      rejoin/page.tsx                          ★ branded re-entry (expired / revoked / checked out)
    icons/[file]/route.tsx                     ★ PWA icons: 192.png, 512.png, maskable-512.png (ImageResponse, static)
    print/qr/[hotel]/page.tsx                  ★ printable room QR tent cards (gated by RB_ENABLE_QR_SHEET)
    dev/guest-kit/page.tsx                     ★ kit showcase for mirror review (notFound() in production)

components/
  ui/
    tokens/
      tokens.css                               ★ design tokens (shared with M3 — M3 must approve)
      status.ts                                ★ shared status wording + tones (shared with M3 — M3 must approve)
    guest-kit/                                 ★ the 8 kit components (one file each, no barrel)
      button.tsx  input.tsx  card.tsx  sheet.tsx  toast.tsx  skeleton.tsx  status-timeline.tsx  menu-item-card.tsx
  guest/                                       ★ guest-specific compositions (list in §3)
  marketing/                                   ★ marketing-header.tsx, marketing-footer.tsx (M3's /pricing reuses them)

lib/
  cn.ts                                        ★ 6-line className joiner (no deps)
  guest/
    types.ts                                   ★ view-model types (camelCase, money in paise)
    copy.ts                                    ★ every guest UI string (doc 08 §2) — no inline strings in JSX
    hotel-directory.ts                         ★ hotelId → slug map generated from the guest seed (until contract C2)
    format.ts                                  ★ formatMoney, formatTime (hotel timezone), relative time
    status.ts                                  ★ maps order/request status → timeline steps (uses components/ui/tokens/status.ts)
    session.ts                                 ★ guest session store (localStorage) + hook
    cart.ts                                    ★ cart reducer + store + hook
    idempotency.ts                             ★ idempotency key per checkout / payment attempt
    network.ts                                 ★ useNetworkStatus (online/offline/slow)
    data/
      index.ts                                 ★ getGuestApi(): picks api | mock (auto-detect) — the ONLY import UI uses
      types.ts                                 ★ GuestApi interface, GuestApiError
      http.ts                                  ★ live adapter → M1 routes, maps snake_case → view models
      mock.ts                                  ★ mock adapter → mock/guest server simulator
      hooks.ts                                 ★ SWR hooks: useOrders, useOrder, useRequests, useRequest, useInvoice
      live.ts                                  ★ stay live updates: Supabase Realtime `stay:{id}` → polling fallback
    server/
      hotels.ts                                ★ server-only: getPublicHotel(slugOrId), listHotelSlugs()
      menu.ts                                  ★ server-only: getHotelMenu(hotelId) → wraps modules/menu/queries

mock/
  guest/
    fixtures.ts                                ★ derives mock hotels/rooms/stays/menu from db/seed (read-only imports)
    server-sim.ts                              ★ in-browser "server": pricing, state progression, persistence

db/seed/guest/guest_seed.ts                    ✎ expanded branding, menus, photos, hotel info (doc 07)

public/
  sw.js                                        ★ service worker: caching (M2) + importScripts('/sw-push.js') for M3

tests/unit/guest/                              ★ vitest: format, cart, status, adapters, simulator, idempotency
scripts/perf/guest-budget.mjs                  ★ Playwright-core budget check on throttled 4G
scripts/verify-seed-images.mjs                 ★ HEAD-checks every seed image URL
docs/PRODUCT.md                                ✎ rewritten by M2 (doc 08 §4)
next.config.ts                                 ✎ images.remotePatterns, sw headers, poweredByHeader:false
package.json                                   ✎ + swr, qrcode, @types/qrcode, playwright-core; + scripts
```

## 2. Route map

| URL | Screen | Rendering | Server data | Client data |
|-----|--------|-----------|-------------|-------------|
| `/` | Landing | Static | seed (for live previews), QR SVG | none (tiny nav toggle island) |
| `/q/[token]` | 1 · QR entry | Static shell | — | `resolveQr(token)` → session → `router.replace` |
| `/h/[hotel]` | 2 · Hotel home | SSG per hotel, `revalidate = 300` | public hotel, chef's picks | session greeting, active strip |
| `/h/[hotel]/menu` | 3 · Menu | SSG, `revalidate = 60` | menu | cart |
| `/h/[hotel]/menu/[itemId]` | 4a · Item detail | SSG (seeded items), `revalidate = 60` | item | cart |
| `/h/[hotel]/cart` | 4b · Cart | SSG shell | menu (names, unit prices) | cart, quote, placeOrder |
| `/h/[hotel]/request` | 5 · Request | Static shell | request presets (seed) | createRequest |
| `/h/[hotel]/activity` | 6a · Activity | Static shell | — | orders + requests |
| `/h/[hotel]/orders/[orderId]` | 6b · Order tracking | Static shell | — | order + live |
| `/h/[hotel]/requests/[requestId]` | 6c · Request tracking | Static shell | — | request + live |
| `/h/[hotel]/bill` | 7 · Bill and pay | Static shell | — | invoice + orders, pay |
| `/h/[hotel]/receipt/[invoiceId]` | 8 · Receipt and feedback | Static shell | hotel (letterhead) | invoice + orders, feedback |
| `/h/[hotel]/rejoin?reason=` | Re-entry | Static | hotel | clears session |
| `/rejoin`, `/offline` | Re-entry / offline | Static | — | — |
| `/h/[hotel]/manifest.webmanifest` | PWA manifest | Route handler, static per hotel | hotel | — |
| `/print/qr/[hotel]` | Room QR sheet | Dynamic, gated | rooms (ops seed, read-only) | — |

**Why tokens stay on the client.** M1's guest API authenticates with a stay token sent in the request (body or
query). The token is written to `localStorage` right after QR resolution, so every stay-scoped read happens on the
client, while every public, cacheable read (hotel, menu) happens on the server and is served as static HTML from
the CDN. That's how the guest shell hits the 2-second budget.

**Hotel param.** `[hotel]` is the hotel **slug** (`grand-azure`, `heritage-palace`). `getPublicHotel()` accepts a
slug or an id (M1's `db.getHotel` already does). Unknown slug → `notFound()`. The guest session stores
`hotelId`. If the session's hotel doesn't match the URL's hotel, the UI treats the guest as having **no session for
this hotel** and shows browse-only mode plus a "Scan the QR in your room to order" prompt. The server never trusts
the slug for writes: writes derive the hotel from the stay token.

## 3. Guest compositions (`components/guest/`)

Each composition is built only from guest-kit components and tokens:

| File | Used by | Notes |
|------|---------|-------|
| `guest-providers.tsx` | h layout | ToastProvider → SessionProvider → CartProvider → LiveProvider |
| `app-bar.tsx` | h layout | hotel crest + name, room chip, Sunlight toggle; glass, sticky, 56 px |
| `bottom-nav.tsx` | h layout | Home · Menu · Request · Activity (badge) · Bill; 64 px + safe-area |
| `theme-toggle.tsx` | app-bar | dark ⇄ light, persists to `localStorage` + cookie `rb-theme` |
| `hotel-hero.tsx`, `quick-actions.tsx`, `active-strip.tsx`, `chefs-picks.tsx`, `info-cards.tsx` | home | |
| `category-nav.tsx` | menu | sticky chip rail with scroll-spy (IntersectionObserver) |
| `menu-list.tsx`, `menu-search.tsx`, `veg-mark.tsx`, `allergen-chips.tsx` | menu | search and veg filter are client-side over SSR data |
| `item-detail.tsx` | menu sheet + item page | one component, two containers |
| `cart-bar.tsx` | menu, home | floating "N items · View cart"; hidden when the cart is empty |
| `cart-view.tsx`, `quote-summary.tsx` | cart | |
| `request-category-grid.tsx`, `request-form.tsx` | request | |
| `activity-feed.tsx`, `order-card.tsx`, `request-card.tsx` | activity | |
| `live-tracker.tsx`, `live-indicator.tsx`, `delay-notice.tsx`, `order-lines.tsx`, `server-totals.tsx` | tracking, bill, receipt | `server-totals` only renders values it's given |
| `invoice-view.tsx`, `payment-method-picker.tsx`, `payment-sheet.tsx` | bill | |
| `receipt-view.tsx`, `printable-invoice.tsx`, `printable-receipt.tsx`, `feedback-form.tsx` | receipt | |
| `rejoin-screen.tsx` | rejoin routes | |
| `session-gate.tsx` | stay-scoped pages | renders children with a session; otherwise a browse-only prompt |
| `install-prompt.tsx`, `sw-registrar.tsx`, `offline-banner.tsx`, `demo-data-badge.tsx` | guest layout | |
| `empty-hint.tsx` | many | **temporary** until M3's `ops-kit/empty-state.tsx` lands; log it as design debt |
| `test-ids.ts` | all | the E2E test-ID contract (doc 06 §7) |

## 4. Client/server boundaries

- Pages and layouts are **Server Components**. Anything with state, effects, storage or browser APIs is a leaf
  client component marked `'use client'`.
- Server components pass **plain serialisable view models** (`PublicHotel`, `MenuItemVM[]`) to client islands,
  never functions or class instances.
- `lib/guest/server/*` starts with `import 'server-only'`. `lib/guest/data/*` is client-safe and never imports
  `@/server/*` or `@/modules/*/service`.
- Load Supabase Realtime lazily (`await import('@supabase/supabase-js')`), and only when enabled (doc 05 §6).
- Don't import barrels. Import each kit component from its own file.

## 5. Shared files M2 edits

Keep each edit additive and explain it in the commit body so M1 and M3 aren't surprised.

**`app/layout.tsx`**

- Load fonts with `next/font/google`: `Inter` (variable, `--font-inter`) and `Playfair_Display` (variable,
  `--font-playfair`), both `display: 'swap'` and subset `latin`.
- `<html lang="en" data-theme="dark" className="dark {fontVars}" suppressHydrationWarning>`.
- An inline `<script>` in `<head>` reads `localStorage['rb-theme']`, falling back to the `rb-theme` cookie, and
  sets `data-theme`, adding or removing the `dark` class to match, before paint. This is the pattern from
  `01-app/02-guides/preventing-flash-before-hydration.md` §Themes. Setting both keeps M1's `.dark` selectors
  working.
- `metadata`: `metadataBase` from `NEXT_PUBLIC_SITE_URL`, default title template `%s · ResortBrain`, and a
  description.
- `viewport` export: `themeColor` `#070B14`, `colorScheme: 'dark light'`, `viewportFit: 'cover'`.
- `body` gets `className="bg-bg text-ink font-sans antialiased"`.

**`app/globals.css`**

```css
@import "tailwindcss";
@import "../components/ui/tokens/tokens.css";
```

**`app/page.tsx`**: delete it. `/` is served by `app/(marketing)/page.tsx`. Two pages resolving to `/` fail the
build.

**`next.config.ts`**

```ts
const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      { source: '/(.*)', headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ]},
      { source: '/sw.js', headers: [
        { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        { key: 'Service-Worker-Allowed', value: '/' },
      ]},
    ];
  },
};
```

Don't add `X-Frame-Options: DENY` globally, because the pitch deck may iframe the landing page. Leave that call to
M1 as release captain.

**`package.json`**

- Dependencies: `swr@^2` and `qrcode@^1`.
- Dev dependencies: `@types/qrcode` and `playwright-core` (Chromium is preinstalled at `/opt/pw-browsers`).
- Scripts:
  - `"perf:guest": "node scripts/perf/guest-budget.mjs"`
  - `"verify:images": "node scripts/verify-seed-images.mjs"`

> **Install note.** `npm ci` currently fails with ERESOLVE: `vitest@5` wants `@types/node ≥ 22` while the root
> pins `^20`. That's M1's `package.json`, so don't change it. Use `npm ci --legacy-peer-deps` and
> `npm install <pkg> --legacy-peer-deps`, and list the issue in doc 10.

**`vitest.config.ts`**: if it isn't on `main` when you start, create it **byte-identical** to M1's version on
`origin/feat/m1-platform-backend` (`git show origin/feat/m1-platform-backend:vitest.config.ts`). The later merge
is then a no-op instead of a conflict.

## 6. Environment variables

| Var | Scope | Default | Purpose |
|-----|-------|---------|---------|
| `NEXT_PUBLIC_GUEST_DATA_SOURCE` | client | `auto` | `auto` \| `api` \| `mock`. `auto` probes `GET /api/health` once per session: 200 → `api`, otherwise `mock` with the **Demo data** badge |
| `NEXT_PUBLIC_GUEST_REALTIME` | client | `poll` | `supabase` enables the `stay:{id}` channel (needs M1's channel and the two Supabase vars) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | — | set by M1 |
| `NEXT_PUBLIC_SITE_URL` | both | `https://$VERCEL_PROJECT_PRODUCTION_URL` → `http://localhost:3000` | absolute URLs for QR codes, OG, `metadataBase` |
| `NEXT_PUBLIC_DEMO_QR_TOKEN` | both | `QR_AZURE_304` | the landing page's live-demo QR and CTA |
| `RB_ENABLE_QR_SHEET` | server | unset (off) | enables `/print/qr/[hotel]`. **Never on in production**, because room tokens are sensitive |
| `NEXT_PUBLIC_SW_IN_DEV` | client | unset | `1` registers the service worker under `next dev` |

## 7. Architecture acceptance

- [ ] `npm run build` passes and no route that should be static is flagged dynamic by accident (check the build
      output's static/dynamic markers for `/`, `/h/[hotel]`, `/h/[hotel]/menu`).
- [ ] No file under `app/(guest)`, `components/guest`, `components/ui/guest-kit` or `lib/guest/data` imports
      `@/server/*`, `@/db/*` or `@/modules/*/service`. Only `lib/guest/server/*` and `mock/guest/*` may read seeds
      or M1 read models.
- [ ] `grep -rn "_paise\s*[*+/-]\|Paise\s*[*+/-]" app/(guest) components lib/guest` finds nothing outside
      `mock/guest/server-sim.ts` and `lib/guest/format.ts` (format is allowed to divide by 100 for display).
