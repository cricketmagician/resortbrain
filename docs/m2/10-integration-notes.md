# 10 · Integration notes for M1 and M3

M2 can send this page straight to the team channel. It lists what M2's work changes in shared space, what M2 needs
from M1 (contract requests), and what M3 should know. It's based on `main` at `d998b1d` and M1's branch
`feat/m1-platform-backend` at `201b6fa` (26 Sep 2026).

## 1. Route collision on `/` (action for M1)

- M2 owns the landing page, which the playbook assigns to the "(marketing) landing" route. It's served at `/` by
  `app/(marketing)/page.tsx`, and M2 **deletes the placeholder `app/page.tsx`** on `main`.
- M1's branch turns `app/page.tsx` into a 1,274-line multi-workspace demo console. When it merges, git will report
  a modify/delete conflict, and keeping both files fails the build (two pages resolve to `/`).
- **Proposal:** move the console to `app/(platform)/console/page.tsx` (→ `/console`) in M1's branch before
  merging, or retire it as M3's staff screens land. M2 will link to `/console` from the footer if M1 wants it
  visible.

## 2. Contract requests from M2 to M1

Each of these would get a `contract` label. M2 has a working fallback for all of them, so none blocks M2.

| ID | Request | Suggested shape | Why the guest UI needs it |
|----|---------|-----------------|---------------------------|
| C1 | Public hotel read model | `modules/hotels/queries.ts` → `getPublicHotel(slugOrId): PublicHotel \| null`, returning branding, contact, info and presets only, with no plan, limits or internal flags | Hotel home, the letterhead and the manifest. M2 wraps `db.getHotel` in one place until then |
| C2 | Hotel slug in the session | add `hotelSlug` to `StayTokenSession` | Redirect after the QR scan without a client-side id → slug map |
| C3 | Order quote | `POST /api/orders/quote` `{ items: [{ menuItemId, quantity }] }` + stay token → `{ subtotal_paise, tax_paise, service_charge_paise, total_paise, lines: [...] }`, with no side effects | Show server totals in the cart **before** placing the order, without the client computing money |
| C4 | Stay token in a header | accept `Authorization: Bearer <stayToken>` on the guest endpoints, and stop requiring it in query strings | Query strings end up in access logs, CDN logs and browser history |
| C5 | Feedback | `POST /api/feedback` `{ rating: 1..5, tags: string[], comment?: string, invoice_id?, order_id? }` + stay token → 201 | Receipt screen feedback (should-have tier) |
| C6 | Guest Realtime channel | `stay:{stay_id}`, authorised by the stay token, broadcasting `{ entity: 'order'\|'request'\|'invoice'\|'stay', id, status }` | Sub-second guest status. Polling every 4 s is the fallback |
| C7 | Live invoice totals | `getOrCreateStayInvoice` should recompute from non-cancelled orders while the invoice is `draft`. Today it's frozen at the first read, so later orders are missing from the bill | Correct bill and receipt |
| C8 | Error semantics | 401 for an invalid or expired stay token, 404 for an unknown order or request, 409 for an invalid transition. Today everything is 400 | Precise guest error states without regex on messages |
| C9 | Clean install | `vitest@5` needs `@types/node >= 22`, but the root pins `^20`, so `npm ci` fails with ERESOLVE | CI and new clones. Everyone currently needs `--legacy-peer-deps` |
| C10 | Guest GETs | `GET /api/orders/:id` and `GET /api/requests/:id` scoped by stay token | Tracking pages refetch one entity instead of the whole list |

## 3. Security observations for the Security and Release Captain

These came up while M2 read M1's branch to build the guest client. None of them is M2's code, and M2 hasn't
changed any of it. They're listed so M1 can triage them before the demo.

1. **Stay-token signature can be forged.** In `server/auth.ts`, the signature is
   `base64url("${payload}.${SECRET}").slice(0, 16)`. The first 16 base64 characters only encode the first 12
   bytes of the string, which are the first 12 characters of the **payload**. So the signature never depends on
   the secret, and anyone can mint a token for any `stayId` or `hotelId` with any expiry. That breaks guest tenant
   isolation. **Suggested fix:** a real HMAC-SHA256 (`crypto.createHmac('sha256', secret).update(payload).digest('base64url')`),
   compared with `timingSafeEqual`, and a server-only secret with no default.
2. **Client-supplied tenant on staff endpoints.** `PATCH /api/orders/[id]` takes `hotelId` from the `x-hotel-id`
   header or the body (defaulting to `hotel-001`), and `GET /api/orders?hotelId=` / `GET /api/requests?hotelId=`
   return a hotel's queue without any auth. The playbook rule is "the server derives hotel_id, role and price",
   so these should derive tenant and role from the staff session.
3. **Seeded stay tokens don't verify.** `stay_token_live_demo_room_304` isn't an `rb_…` token, so the order,
   request and billing services reject it (they call `verifyStayToken` directly). The QR flow still works because
   it mints a fresh signed token. Be aware of this if any demo script uses the raw seeded token.
4. **Payment amount.** `POST /api/billing` records whatever `amountPaise` the client sends and marks the invoice
   paid. It should check `amountPaise === invoice.total_paise` (or support partial payments explicitly) and dedupe
   on `idempotencyKey`, which the schema requires but the service doesn't use yet.

## 4. Shared files M2 changes (all additive)

| File | Change | Who should look |
|------|--------|-----------------|
| `app/layout.tsx` | Inter and Playfair via `next/font`; `data-theme="dark"` plus the `dark` class on `<html>`; a pre-paint theme script; `metadataBase`, title template and viewport | M1, M3 |
| `app/globals.css` | `@import "../components/ui/tokens/tokens.css"` | M1 (the branch also edits this file, so keep both sides) |
| `app/page.tsx` | **deleted** (see §1) | M1 |
| `next.config.ts` | `images.remotePatterns` (images.unsplash.com), `/sw.js` headers, `poweredByHeader: false`, nosniff and referrer headers | M1 |
| `package.json` | + `swr`, `qrcode`, `@types/qrcode`, `playwright-core`; + `perf:guest` and `verify:images` scripts | M1, M3 (align the Playwright version with the E2E suite) |
| `components/ui/tokens/tokens.css`, `status.ts` | Shared tokens and the shared status wording | **M3 must approve** |
| `components/marketing/*` | Marketing header and footer, reusable by M3's `/pricing` | M3 |
| `app/manifest.ts` | Generic ResortBrain manifest (`start_url: '/'`) | M3 may add a staff manifest |
| `public/sw.js` | Guest caching plus `try { importScripts('/sw-push.js') } catch {}` | **M3 owns `public/sw-push.js`** (the push and notificationclick handlers) |
| `db/seed/guest/guest_seed.ts` | Additive fields and items. Existing ids and prices are unchanged except `item-202`'s category | M1 |
| `vitest.config.ts` | Created byte-identical to M1's version if it isn't on `main` yet | M1 |

## 5. For M3 specifically

- **Tokens and status wording** (`components/ui/tokens/*`) are the shared contract. The dark theme is the default
  on `<html>`, which suits the kitchen display. Staff screens can opt into Sunlight with
  `data-theme="light"` on any wrapper.
- **`status.ts`** carries both `guest` and `staff` labels per status, so the two halves never disagree on wording.
- **Service worker:** one worker at `/sw.js` with scope `/`. The guest side caches only `/_next/static`, images,
  `/api/menu` and navigations under `/h/*` and `/`. Staff routes are left untouched. Put push handling in
  `public/sw-push.js`, and register the same `/sw.js` from the staff layout.
- **Test IDs** for the Playwright suite: import `GUEST_TID` from `components/guest/test-ids.ts` (full list in doc
  06 §7). The current timeline step carries `data-status`.
- **Kit crossover:** the guest screens use M3's `EmptyState` once `components/ui/ops-kit/empty-state.tsx` exists.
  Until then `components/guest/empty-hint.tsx` stands in, and it's logged as design debt. The guest side uses its
  own `StatusPill` and chip buttons instead of Badge and Tabs.
- **Landing page:** the "For teams" section describes the kitchen chime, push to a locked phone, SLA escalation
  and the manager dashboard. Correct the copy if the ops side ends up different. The nav and CTA link to your
  `/pricing` page.
- **Mirror review:** open `/dev/guest-kit` (dev only) to review every guest component in both themes.

## 6. Events M2 consumes (from the playbook's event catalog)

| Event | Guest effect |
|-------|--------------|
| `stay.checked_in` | QR resolves to a session |
| `stay.checked_out` | The next call returns `expired` or `revoked`, and the guest sees the re-entry screen ("Thanks for staying with us") |
| `order.accepted / preparing / ready / delivered` | Timeline advances on the order tracking page and in the activity feed |
| `request.accepted / started / completed` (API statuses `acknowledged / in_progress / completed`) | Timeline advances on the request tracking page |
| `invoice.issued / payment.succeeded` | The bill shows Paid, and the receipt becomes available |
