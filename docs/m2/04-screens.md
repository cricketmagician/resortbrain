# 04 · Screens

The 8 guest screens (§2–§10), the re-entry and offline screens (§11), the print layouts (§12) and the landing page
(§13). Every screen spec lists its route, layout, data, interactions, **all** states, test IDs and acceptance
criteria. The copy for each one lives in [08-copy-deck.md](08-copy-deck.md), so pull strings from there rather
than inventing them.

> **Next 16 reminders for every page:**
>
> - `const { hotel } = await props.params`.
> - `error.tsx` is a client component and receives `{ error, retry }`. It's **`retry`**, not `reset`.
> - A static page that calls `useSearchParams()` needs the island wrapped in `<Suspense>`, or the build fails.
> - Guest pages set `metadata.robots = { index: false, follow: false }` through the `(guest)` layout.

---

## 1. The guest shell (`app/(guest)/layout.tsx` + `app/(guest)/h/[hotel]/layout.tsx`)

**Group layout, `(guest)/layout.tsx`** (server):

- Exports `metadata` with robots noindex, and a `viewport` with `themeColor: '#070B14'`.
- Renders `{children}` together with the client islands `<SwRegistrar/>`, `<OfflineBanner/>` and `<DemoDataBadge/>`.

**Hotel layout, `h/[hotel]/layout.tsx`** (server):

- `export const revalidate = 300` and `export const dynamicParams = true`.
- `generateStaticParams()` returns the seed slugs, via `listHotelSlugs()`.
- `generateMetadata()` returns title = hotel name, `manifest: /h/{slug}/manifest.webmanifest`,
  `appleWebApp: { capable: true, title: hotel.shortName, statusBarStyle: 'black-translucent' }`.
- `getPublicHotel(slug)`, and `notFound()` when it's missing.
- Renders:

  ```
  <div style={{'--rb-hotel': hotel.accent}} className="min-h-dvh bg-bg">
    <GuestProviders hotel={publicHotel}>
      <AppBar hotel={…}/>                      glass, sticky top-0, 56px
      <main className="mx-auto max-w-[480px] px-4 pb-[calc(64px+env(safe-area-inset-bottom)+24px)]">
        {children}
      </main>
      <BottomNav hotelSlug={…}/>                glass, fixed bottom, 64px + safe-bottom
    </GuestProviders>
  </div>
  ```

- On ≥ 1024 px, add a fixed radial glow in `--rb-hotel` at 8 % behind the column.

**Session revalidation** (inside `SessionProvider`):

- On mount, if a session exists for **this** hotel and it was last validated more than 10 minutes ago, call
  `resumeSession(token)` in the background.
- If that returns `expired`, `revoked` or `invalid`, clear the session and
  `router.replace('/h/{slug}/rejoin?reason=…')`.
- While offline, trust the cached session.

**Browse-only mode** (no session for this hotel): the menu is fully viewable. Add buttons become "View" and open
the detail sheet. The cart bar is replaced by a slim pill: *"Scan the QR code in your room to order."* The cart,
request, activity, bill and receipt pages render `<SessionGate>`, a centred card with the scan tips and a front-desk
call button.

**AppBar:**

- **Left:** a 32 px crest (the hotel logo in a 1.5 px `--rb-hotel` ring) and the hotel name (`font-display`,
  truncated), linking to `/h/{slug}`.
- **Right:** a `RoomChip` ("Room 304", which opens a small sheet with the guest name, room and a "Not you? Leave
  this device" sign-out action) and `ThemeToggle` (sun/moon, `aria-label` "Switch to Sunlight mode" or "Switch to
  dark mode").
- A 1 px bottom hairline in `--rb-hotel` at 30 %.

**BottomNav:**

- Five items: Home, Menu, Request, Activity and Bill. Activity carries a gold badge with the count of active orders
  plus requests.
- The active item gets a gold icon and label plus a 2 px top indicator.
- It's hidden in print and on `/q/*` and `/rejoin`.

Test IDs: `guest-appbar`, `guest-room-chip`, `guest-theme-toggle`, `guest-nav-{home|menu|request|activity|bill}`.

---

## 2. Screen 1 · QR entry (`/q/[token]`)

**Purpose:** turn the room's QR code into a guest session in under 2 s and get out of the way.

**Server page:**

- `const { token } = await params`.
- If the token fails `/^[A-Za-z0-9_-]{4,128}$/`, render `<RejoinScreen reason="invalid"/>`.
- Otherwise render `<QrEntry token={token}/>`.
- This page must **not** be statically generated for tokens. Use `generateStaticParams = () => []` with the
  default `dynamicParams`, so the static shell is fine and the token only ever reaches the client.

**`<QrEntry>`** (client):

1. Full-bleed dark screen. A centred ResortBrain crest with a slowly rotating gold ring (CSS), and under it
   *"Unlocking your stay"* in `font-display text-2xl`, plus a three-dot progress indicator.
2. Call `api.resolveQr(token)` with an **8 s timeout**. After **2.5 s**, fade in the slow-network hint.
3. **Success:**
   - `session.save(s)`.
   - `router.prefetch('/h/{slug}')` and `router.prefetch('/h/{slug}/menu')`.
   - `router.replace('/h/{slug}?welcome=1')`. Using replace keeps the token out of the back stack.
4. **Failure mapping:**

   | Error kind | Where it goes |
   |------------|---------------|
   | `invalid` / `not_found` | `/rejoin?reason=invalid` |
   | `rate_limited` | inline message with a countdown and a "Try again" button |
   | `network` / `timeout` | inline "Couldn't connect" with "Try again" plus the Wi-Fi tip |
   | `server` | inline generic error with "Try again" |

**States:**

| State | UI |
|-------|----|
| resolving | crest, ring and "Unlocking your stay" |
| slow network (> 2.5 s) | + "Still connecting… hotel Wi-Fi can be slow. Hang tight." |
| error | icon, message, primary "Try again", ghost "Call the front desk" (hidden if the hotel isn't known) |
| success | a 200 ms fade into the home screen (no extra screen) |

**Test IDs:** `guest-qr-loading`, `guest-qr-error`, `guest-qr-retry`.

**Acceptance:**

- [ ] `/q/QR_AZURE_304` lands on `/h/grand-azure` with the greeting for Dr. Siddharth Verma, Room 304.
- [ ] `/q/QR_HERITAGE_1` lands on `/h/heritage-palace` with the Heritage branding. The two hotels never share a
      session.
- [ ] `/q/QR_AZURE_105` (vacant villa) → re-entry screen, reason `invalid`.
- [ ] The token never appears in any URL after the redirect.

---

## 3. Screen 2 · Hotel home (`/h/[hotel]`)

```
┌──────────────────────────────┐
│ ◉ Grand Azure Resort…  304 ☼ │  AppBar
├──────────────────────────────┤
│ [ banner image, 220px,       │  HotelHero (next/image priority, gradient to bg)
│   gradient fade ]            │
│  ◉  Grand Azure Resort & Spa │  crest + display-md name + tagline
│  Good evening, Dr. Verma     │  greeting (client) + RoomChip
├──────────────────────────────┤
│ ● Being prepared · RB-1004 › │  ActiveStrip (only if active items)
├──────────────────────────────┤
│ [Dining] [Housekeeping]      │  QuickActions 2×3 (tiles 104px tall,
│ [Amenities] [Front desk]     │  icon + label + one-line hint)
│ [Your bill] [Activity]       │
├──────────────────────────────┤
│ Chef's picks            All ›│  horizontal scroll-snap, feature cards 240px
│ [card][card][card]           │
├──────────────────────────────┤
│ Wi-Fi · Breakfast · Pool ·   │  InfoCards 2×2
│ Check-out                    │
└──────────────────────────────┘
```

- **Server:** hotel, plus chef's picks (seed items with `featured: true`, up to 5).
- **Client:**
  - The greeting uses the hotel timezone: 05–12 "Good morning", 12–17 "Good afternoon", otherwise "Good evening".
  - `?welcome=1` → a single success toast, "Welcome to {hotel}. Your room is connected.", then remove the param
    with `replaceState`.
  - ActiveStrip comes from `useOrders()` plus `useRequests()`, filtered to non-terminal items.
- **Quick actions:** In-room dining → `/menu`. Housekeeping, Amenities and Front desk →
  `/request?c={category}`. Your bill → `/bill`. Activity → `/activity`.
- **Info cards** come from the seed `info` block (doc 07). The Wi-Fi card shows the network name and *"Password on
  your key card"*. Never show a password.
- **States:** hero skeleton (server-rendered, so there's normally no skeleton), ActiveStrip skeleton (a single
  pill), browse-only (greeting → "Welcome to {hotel}" plus the scan prompt), and an error on the active strip that
  silently hides the strip rather than breaking home.
- **Test IDs:** `guest-home`, `guest-home-greeting`, `guest-quick-{dining|housekeeping|amenities|front_desk|bill|activity}`,
  `guest-active-strip`.

**Acceptance:** the HTML is static (served from the CDN), the LCP element is the banner image or the hotel name,
there's no layout shift when the greeting hydrates (reserve its height), and it works in both themes.

---

## 4. Screen 3 · Menu (`/h/[hotel]/menu`)

- **Server:** `export const revalidate = 60`. `getHotelMenu(hotel.id)` groups items into categories ordered by the
  seed's `categoryOrder`.
- Pass `MenuItemVM[]` to the client `<MenuList>`.
- `menu/loading.tsx` shows `SkeletonMenuItem × 6` under a skeleton chip rail. `menu/error.tsx` shows the branded
  error with `retry()`.

```
Title  "In-room dining"                         (display-md)
Sub    "Delivered to Room 304 · usually 25–35 min" (or "Browse our menu" in browse-only)
[🔍 Search dishes…          ] [● Veg only]      SearchField + chip (pressed state)
[All-day dining][Grills][Indian][Drinks][Desserts]   CategoryNav — sticky at top-14, glass, scroll-snap
## All-day dining · 5
  MenuItemCard(row) …  (dividers between rows)
## Signature grills · 3
  …
                        ┌──────────────────────────┐
                        │ 🛍 2 items   View cart › │  CartBar (floating, bottom 80px, glass + gold border)
                        └──────────────────────────┘
```

**Interactions:**

- **Search** filters by name, description and category (case-insensitive, 120 ms debounce). Sections with no
  matches disappear, and the chip rail updates.
- **Veg only** hides non-veg items. It persists in `sessionStorage`.
- **CategoryNav:** tapping a chip smooth-scrolls to its section (offset for the sticky headers). An
  IntersectionObserver (rootMargin `-120px 0px -70% 0px`) highlights the current chip and scrolls the chip rail to
  keep it in view.
- **Item sheet:** tapping a card opens `<Sheet>` with `<ItemDetail>` and calls `history.pushState(null, '', '?item={id}')`.
  Back or Escape closes it (listen to `popstate`). Loading the page with `?item=` opens the sheet, so the island
  sits in `<Suspense>`.
- **Add / stepper** update the cart immediately (optimistic, local). The first add in a session shows the toast
  "Added to your order", with an "View cart" action.
- **Unavailable items** are filtered out by the API. If one arrives flagged unavailable, render the unavailable
  state instead.

**States:**

| State | UI |
|-------|----|
| loading | server `loading.tsx` skeleton (same geometry) |
| empty (no items for the hotel) | empty hint: "The kitchen is resting" plus the front desk call |
| no search results | "No dishes match '{q}'" plus a "Clear search" chip |
| veg-only with no results | "No vegetarian dishes in this section" |
| image failed | gradient tile with the initial |
| offline | cached HTML from the service worker, with the offline banner. Adds still work locally; placing an order waits (doc 05 §8) |
| browse-only | "View" buttons, scan pill in place of the CartBar |

**Test IDs:** `guest-menu`, `menu-search`, `menu-veg-toggle`, `menu-cat-{slug}`, `menu-item-{id}`,
`menu-add-{id}`, `menu-qty-{id}`, `cart-bar`, `item-sheet`, `item-sheet-add`.

**Acceptance:**

- [ ] The menu HTML is prerendered for both hotels at build time.
- [ ] The first two images are `priority`, the rest lazy.
- [ ] Scrolling a 30-item menu is smooth on a mid-range Android.
- [ ] Opening the sheet takes under 150 ms perceived.

---

## 5. Screen 4a · Item detail (sheet and `/h/[hotel]/menu/[itemId]`)

A single `<ItemDetail item quantity canOrder onChange onAdd>` component renders in two containers: the sheet on the
menu, and the standalone SSG page (`generateStaticParams` over the seed items, `revalidate = 60`, `notFound()`
for unknown ids or items belonging to another hotel).

```
[ 16:10 image, rounded-xl ]
● Artisan Avocado Sourdough Tartine        (display-md)
₹550 each                                   (tabular, text-accent)
Crushed Hass avocado, organic microgreens…  (full description)
Contains: Gluten                            (allergen chips with icons; "No listed allergens" otherwise)
Note for the kitchen  [ e.g. no chilli, extra crispy ]   (Input, max 120)
[ − 1 + ]                    [ Add to order ]           (sticky footer; primary lg)
```

- If the item is already in the cart, the CTA becomes "Update order" and the stepper starts at the current
  quantity. Quantity 0 plus Update removes the item and shows the toast "Removed from your order".
- The CTA **never** shows a multiplied price. The unit price appears once as "₹550 each".
- **States:** loading (the standalone page uses `loading.tsx`), not found → "This dish isn't on the menu anymore"
  plus a back-to-menu button, and browse-only (CTA → "Scan your room QR to order", disabled, with the scan tips
  link).
- **Test IDs:** `item-detail`, `item-note`, `item-qty`, `item-add`.

---

## 6. Screen 4b · Cart and checkout (`/h/[hotel]/cart`)

- **Server:** the menu, for names and unit prices, passed to the client `<CartView>`.
- **Client:** the cart store (doc 05 §7), quote (if supported) and place order.

```
Title "Your order"
┌ Deliver to ─────────────────────────┐
│ 🛏 Room 304 · Grand Azure            │   (from session)
│ Usually 25–35 minutes                │
└──────────────────────────────────────┘
Lines (Card, divided):
  ● Avocado Tartine          [ − 2 + ]
    ₹550 each · "no chilli" ✎
  ● Coconut Water            [ − 1 + ]
    ₹250 each · Add note ✎
[ + Add more items ] (ghost → menu)
Note for the kitchen  [ textarea, counter "46 / 500" ]
┌ Summary ────────────────────────────┐
│ Subtotal                    ₹1,350   │  ← only if server quote exists
│ GST                           ₹243   │
│ Service charge                 ₹68   │
│ Total                       ₹1,661   │
│ Calculated by the hotel's billing.   │
└──────────────────────────────────────┘
   — or, without quote support —
┌ Summary ────────────────────────────┐
│ Taxes and service charge are added   │
│ by the hotel. You'll see the exact   │
│ total the moment you place the order.│
└──────────────────────────────────────┘
[ Place order ]  (sticky footer, primary lg, full width; loading "Placing your order…")
```

**Rules:**

- **Special instructions sent to M1** = the per-item notes compiled as `"{item}: {note}"` lines, followed by the
  general note, joined with newlines. It must stay **≤ 500 characters**. The counter shows the compiled length,
  and the CTA is disabled with an inline error when it's over.
- **Quote:** `api.quoteOrder(session, lines)`, debounced 400 ms after cart changes. While it's refreshing, keep
  showing the previous values dimmed. If the adapter reports `capabilities.quote === false`, render the
  no-quote summary.
- **Place order:**
  1. Disable the CTA.
  2. `key = idempotency.forCheckout(stayId, cartHash)`.
  3. `api.placeOrder(session, { lines, specialInstructions, idempotencyKey: key })`.
  4. **Success:** clear the cart, clear the key, `mutate` the orders cache with the new order, then
     `router.replace('/h/{slug}/orders/{id}?placed=1')`.
  5. **Failure:** keep the key if the cart is unchanged, so a retry reuses it (no duplicate orders).
- **Error mapping:**
  - `validation` with an item name in the message → toast "{item} is no longer available", and remove that line
    after confirmation.
  - `rate_limited` → "You're ordering a little fast — try again in a moment."
  - `expired` → the rejoin screen.
  - `network` → "You're offline — we'll keep your order here. Try again when you're connected." plus Retry.

**States:** empty cart ("Your order is empty", "Browse the menu"), no session (SessionGate), loading quote
(dimmed values plus spinner), submitting, and every error above.

**Test IDs:** `guest-cart`, `cart-line-{id}`, `cart-note`, `cart-quote`, `cart-no-quote`, `cart-place-order`,
`cart-empty`.

**Acceptance:**

- [ ] Double-tapping "Place order" creates exactly one order (the idempotency key is reused).
- [ ] Every amount on this screen comes from the server (or the mock server simulator), and no component
      multiplies or adds.
- [ ] Going offline mid-checkout doesn't lose the cart.

---

## 7. Screen 5 · Service request (`/h/[hotel]/request`)

- **Server:** request presets per category from the seed (doc 07).
- **Client:** form state, `createRequest`.

```
Title "How can we help?"
Sub   "Our team is notified instantly."
┌───────────────┐┌───────────────┐
│ 🛏 Housekeeping││ 🧴 Amenities   │   RequestCategoryGrid — 2×2 tiles, 112px, icon + name + hint
│ Towels, clean…││ Toiletries, …  │   ?c=… preselects a tile
└───────────────┘└───────────────┘
┌───────────────┐┌───────────────┐
│ 🛎 Front desk  ││ 🔧 Maintenance │
└───────────────┘└───────────────┘
── after selecting (animate-rise) ──
What do you need?
[Extra towels] [Room cleaning] [Turndown] [Fresh linen] [Something else]   (chips, single-select)
Details (optional)  [ textarea, max 1000 ]
[ ] It's urgent                     (toggle → priority 'high')
[ Send request ]                    (primary lg, sticky)
```

- **Payload to the adapter:** `{ category, title, details?, priority }`.
  - `title` = the chip label, or for "Something else", the first 60 characters of details (at least 3, so
    validate).
  - **Never send `slaMinutes`.** SLA is derived on the server by department rules (playbook §5).
- **Optimistic:** on submit, add a pending request card to the SWR cache (`status: 'created'`, `id: 'temp_…'`),
  then `router.push('/h/{slug}/requests/{id}?sent=1')` once the server id returns. On failure, remove the
  optimistic card and show the error toast with a Retry action.
- **States:** nothing selected (tiles only), selected, submitting, error, and no session (SessionGate).
- **Test IDs:** `guest-request`, `request-category-{housekeeping|amenities|front_desk|maintenance}`,
  `request-preset-{slug}`, `request-details`, `request-urgent`, `request-submit`.

**Acceptance:** the request shows on M3's desk or housekeeping queue (in `api` mode) and the guest lands on live
tracking within one round trip.

---

## 8. Screen 6 · Order and request tracking, plus the activity feed

### 8a. Activity (`/h/[hotel]/activity`)

- Title "Your activity", with filter chips **All · Orders · Requests** (chip buttons, not M3's Tabs).
- A single chronological feed, newest first:
  - `OrderCard`: order number, relative time, the first two item names plus "+N more", a `StatusPill` (live when
    active), and the server total.
  - `RequestCard`: category icon, title, relative time, `StatusPill`.
- Tapping a card goes to its tracking page.
- **States:** skeleton (3 cards), empty ("Nothing here yet" plus two CTAs: "Order food" and "Make a request"),
  error (inline retry), and filtered-empty.
- **Test IDs:** `guest-activity`, `activity-filter-{all|orders|requests}`, `activity-order-{id}`,
  `activity-request-{id}`.

### 8b. Order tracking (`/h/[hotel]/orders/[orderId]`)

```
‹ Back                                   Order RB-1004
✓ Order placed — the kitchen has been notified.   (only with ?placed=1; animate-check; auto-hide 6s)
BEING PREPARED                            ● Live     (eyebrow + LiveIndicator)
Freshly made for you                                  (display-md headline = current step label)
Placed 6 min ago                                       (relative, updates every 30s)
StatusTimeline (vertical, live, announce)
  ✓ Order placed        8:02 PM
  ✓ Accepted            8:03 PM
  ◉ Being prepared      8:05 PM
  ○ Ready
  ○ Delivered
DelayNotice (conditional)
┌ Items ───────────────────────────────┐
│ 1 × Avocado Tartine          ₹550    │   server line totals (totalPricePaise)
│ 2 × Coconut Water            ₹500    │
│ "Less ice in coconut water please"   │
└──────────────────────────────────────┘
ServerTotals: Subtotal / GST / Service charge / Total   (order.*Paise — server values)
[ Call front desk ]  [ Order something else ]
```

- **Data:** `useOrder(orderId)` reads from the orders list, since M1 has no guest `GET /orders/:id`. Live updates
  come from the `LiveProvider` (doc 05 §6).
- **DelayNotice rules:**
  - `pending` for more than 3 minutes → the "busy kitchen" notice.
  - `preparing` for more than 25 minutes → the "taking a little longer" notice.
  - Each notice is dismissible and shown once per status.
- **Terminal `cancelled`:** the timeline shows the danger terminal row, the headline reads "Order cancelled", and
  the front desk CTA becomes primary.
- **States:** loading (SkeletonTimeline plus a skeleton card), not found ("We couldn't find this order" →
  Activity), live, reconnecting (LiveIndicator amber "Reconnecting…"), offline (grey "Offline — showing last
  update"), delivered (a success headline "Enjoy your meal", then an "Order again" button).
- **Test IDs:** `guest-order-tracking`, `order-status-timeline`, `order-status-current`, `order-live-indicator`,
  `order-delay-notice`, `order-totals`.

### 8c. Request tracking (`/h/[hotel]/requests/[requestId]`)

The same structure with the request steps (doc 05 §5), no totals, and the assigned staff member's first name shown
when available: "Rajesh has your request". Show the first name only, for privacy.

- **DelayNotice:** `created` for more than `max(5, sla/2)` minutes → "Still waiting? The team has been notified.
  You can also call the front desk."
- **Test IDs:** `guest-request-tracking`, `request-status-timeline`, `request-status-current`.

**Acceptance for screen 6:**

- [ ] With the mock simulator, the timeline advances on its own and each change is announced to screen readers.
- [ ] In `api` mode, M3 accepting an order updates the guest screen within one poll interval (≤ 4 s) or under 1 s
      with Realtime.
- [ ] The timeline never goes backwards. If an older status arrives late, ignore it (order the steps by index).

---

## 9. Screen 7 · Bill and payment (`/h/[hotel]/bill`)

```
Title "Your bill"
┌ INV-2026-4821                 [Unpaid] ┐   StatusPill: Unpaid (warning) / Paid (success)
│ Room 304 · Dr. Siddharth Verma          │
├─────────────────────────────────────────┤
│ RB-1001 · Today 7:48 PM          ₹1,292 │   one row per order (server order total)
│   Avocado Tartine ×1 · Coconut Water ×2 │
│ RB-1004 · Today 8:02 PM          ₹1,661 │
├─────────────────────────────────────────┤
│ Subtotal                         ₹2,400 │   invoice.*Paise — server values only
│ GST                                ₹432 │
│ Service charge                     ₹120 │
│ Total due                        ₹2,952 │   (display type, tabular)
└─────────────────────────────────────────┘
ⓘ Test mode — no real money moves.          (info banner)
Pay with
( ● ) Card        test card ending 4242
(   ) UPI         resortbrain@testupi
[ Pay ₹2,952 ]   (primary lg, sticky; amount = formatMoney(invoice.totalPaise))
```

- **Data:** `useInvoice()` (M1 `GET /api/billing`) plus `useOrders()` for the lines. Only fetch the invoice when
  this page opens. (M1's invoice is created on first read; see doc 10.)
- **Methods:** `card_test` and `upi_test` only. Don't offer `room_charge`, because M1 marks it paid immediately,
  and that would confuse guests.
- **Pay flow (`<PaymentSheet>`):**
  1. The sheet summarises the method and amount, with a primary "Confirm payment".
  2. `key = idempotency.forPayment(invoiceId)`.
  3. `api.pay(session, { invoiceId, amountPaise: invoice.totalPaise, method, idempotencyKey: key })`. The amount
     is the **server's own value, passed back unchanged**.
  4. Show "Processing securely…" (lock icon, at least 1.2 s so it doesn't flicker).
  5. **Success:** update the invoice cache, then `router.replace('/h/{slug}/receipt/{invoiceId}')`.
  6. **Failure:** show the error in the sheet with "Try again", which reuses the same key.
- **States:**
  - loading: skeleton invoice
  - nothing to pay (`totalPaise === 0` or no orders): "Nothing on your bill yet", a menu CTA, Pay hidden
  - already paid: the Paid pill, a "View receipt" primary button, Pay hidden
  - error: inline retry
  - no session: SessionGate
- **Test IDs:** `guest-bill`, `bill-invoice-number`, `bill-status`, `bill-order-{id}`, `bill-total`,
  `bill-method-{card|upi}`, `bill-pay`, `payment-sheet`, `payment-confirm`, `payment-processing`, `payment-error`.

**Acceptance:**

- [ ] The same payment tapped twice (or retried after a timeout) produces one payment and one receipt.
- [ ] The receipt total equals the ledger total.

---

## 10. Screen 8 · Receipt and feedback (`/h/[hotel]/receipt/[invoiceId]`)

```
      ✓  (animated check in emerald ring)
Payment successful
₹2,952 · Card (test) · 26 Sep 2026, 9:14 PM
┌ Receipt ────────────────────────────────┐
│ [logo] Grand Azure Resort & Spa          │  letterhead: address, phone, GSTIN (seed)
│ Receipt INV-2026-4821 · Room 304         │
│ Guest: Dr. Siddharth Verma               │
│ — lines per order / item (server) —      │
│ Subtotal / GST / Service charge / Total  │
│ Paid · Card (test mode)                  │
└──────────────────────────────────────────┘
[ Print receipt ] [ Save invoice (PDF) ]  [ Share ]   (secondary buttons, wrap on 360px)
[ Back to home ]                                       (ghost)
── Feedback ──
How was everything?
★ ★ ★ ★ ★        (radiogroup; 44px stars; arrow keys; gold fill)
[Fast service] [Delicious food] [Friendly staff] [Clean room] [Great value]   (multi-select chips)
[ Tell us more (optional) ]  (textarea, max 500)
[ Send feedback ]
```

- **Data:** the invoice and orders (cached from the bill page, or refetched). If the invoice isn't `paid`, go to
  `/bill`.
- **Print:** "Print receipt" sets `printFormat = 'thermal'`, injects `@page { size: 80mm auto; margin: 4mm }`,
  then calls `window.print()`. "Save invoice (PDF)" sets `'a4'`, injects `@page { size: A4; margin: 16mm }`, then
  prints (users pick "Save as PDF"). Both print-only components are in the DOM but hidden on screen (doc 04 §12).
- **Share:** `navigator.share({ title, text: 'Receipt INV-… from Grand Azure' })` where it's supported. Otherwise
  hide the button. Never share the token or a URL that contains it.
- **Feedback:** only render it when `capabilities.feedback`.
  - **Submit** → `api.submitFeedback(session, { invoiceId, rating, tags, comment })`, then the thank-you state:
    "Thank you — we've shared this with the team." (with the check animation).
  - Rating 1–2 → show an extra line, "We're sorry. The front desk will be in touch." Only show it if the hotel
    has a phone number. It's just a CTA, so don't promise a callback.
- **States:** loading, not paid (redirect), feedback submitting, sent, error, and feedback unsupported (section
  hidden).
- **Test IDs:** `guest-receipt`, `receipt-print`, `receipt-invoice-pdf`, `receipt-share`, `feedback-form`,
  `feedback-star-{1..5}`, `feedback-tag-{slug}`, `feedback-submit`, `feedback-thanks`.

---

## 11. Re-entry and offline screens

**`<RejoinScreen reason hotel?>`**, used by `/h/[hotel]/rejoin?reason=` (branded) and `/rejoin` (generic):

| reason | Headline | Body |
|--------|----------|------|
| `expired` | Your session has timed out | For your security, room sessions expire. Scan the QR code in your room to continue. |
| `revoked` / `checked_out` | Thanks for staying with us | Your stay has ended, so this room link is no longer active. We hope to welcome you back soon. |
| `invalid` | This code isn't active | It may belong to a room that isn't checked in yet. The front desk can help. |
| default | Let's reconnect you | Scan the QR code in your room to open your stay. |

- **Actions:** primary "How to scan" (opens a tips sheet: open the camera, point it at the card on your bedside
  table, tap the link) and secondary "Call the front desk" (`tel:` from the hotel, hidden when unknown).
- It always clears the stored session and cart for that stay first.
- Visuals: the crest in a muted ring, calm copy, no red error styling. It's a normal moment, not a failure.
- **Test ID:** `rejoin-screen`.

**`/offline`:** a static page precached by the service worker.

- Content: "You're offline", plus "Your menu is saved on this device" and a link to the last visited hotel's menu
  (read from `localStorage['rb.lastHotel']`), plus a "Try again" button (`location.reload()`).
- **Test ID:** `guest-offline`.

**`<OfflineBanner>`:** a slim glass bar under the app bar, "You're offline — showing saved info", driven by
`useNetworkStatus()`. It hides 2 s after reconnecting, with the brief message "Back online".

---

## 12. Print layouts (`printable-invoice.tsx`, `printable-receipt.tsx`)

Both use `print-only` (hidden on screen). The rest of the app gets `no-print` (app bar, nav, buttons, feedback,
toasts). The print theme is forced light by `tokens.css`.

**A4 tax invoice:**

- **Header row:** the hotel logo (40 px, grayscale OK), name, address, phone and GSTIN on the left. On the right,
  "TAX INVOICE", then Invoice No., Date (hotel timezone), Room and Guest.
- **Table:** `# · Item · Qty · Rate · Amount`, one row per order item (`unitPricePaise`, `totalPricePaise`).
  Group by order with a subtle "Order RB-1004 · 8:02 PM" row.
- **Totals block**, right-aligned: Subtotal, GST, Service charge, Discount (only if > 0), **Total**, then Paid
  (method, time).
- **Footer:** "This is a computer-generated invoice and does not require a signature." · "Test mode — no real
  payment was taken." · "Powered by ResortBrain".
- Typography: Inter 10.5 pt, tabular numbers, 1 px `#ccc` rules, `break-inside: avoid` on rows.

**80 mm thermal receipt:**

- Single column, 72 mm printable width, centred hotel name, dashed separators, qty × name on one line with the
  amount right-aligned, then totals and "Thank you" at the bottom.
- `font-size: 9pt`, all black.

**Acceptance:** Chrome's print preview at A4 fits one invoice with up to 25 lines on one page, with no app chrome
visible. The 80 mm receipt has no horizontal overflow.

---

## 13. Landing page (`/`, always dark)

Every section is a Server Component. The only client islands are the mobile nav toggle and (optionally) the hero
phone's animation controller, which should be pure CSS where possible. **No images above the fold**: the LCP is the
H1. Showcase visuals are **live kit components rendered with seed data**, not screenshots. They're lighter, crisp,
and honest.

**`app/(marketing)/layout.tsx`:**

- `<div data-theme="dark" className="dark bg-bg text-ink">`, which forces dark regardless of the guest's Sunlight
  preference.
- Contains `<MarketingHeader/>`, `{children}` and `<MarketingFooter/>`.

**Sections, in order.** All copy comes from [08 §3](08-copy-deck.md#3-landing-page-copy).

1. **MarketingHeader** (sticky glass, 64 px): wordmark (crest plus "ResortBrain" in Playfair), anchor nav (Product,
   How it works, For guests, For teams, Security), a Pricing link (`/pricing`, M3's page), and a primary CTA "Try
   the live demo" → `/q/{NEXT_PUBLIC_DEMO_QR_TOKEN}`. On mobile, a menu button opens a full-height glass sheet
   with the same links.
2. **Hero** (`min-h-[88svh]`, two columns at ≥ 1024 px, stacked on mobile):
   - **Left:** an eyebrow pill, the H1 (`text-display-xl font-display`), the subhead, two CTAs (primary "Try the
     live demo", secondary "See how it works" → `#how`), and a proof row of three checkmarks (copy deck).
   - **Right:** `<HeroPhone>`, a CSS device frame (rounded 44 px, 1 px line-strong border, inner shadow) showing a
     mini Grand Azure screen. Over a 6 s loop it runs the order status (`StatusTimeline` horizontal) through
     Placed → Accepted → Preparing → Delivered with CSS animation delays. Two floating glass cards sit beside it:
     "New order · Room 304" with a bell (the kitchen's view) and "Delivered · 14 min" with a check.
   - **Background:** a radial gold glow (`radial-gradient` at 12 % opacity), a faint 32 px grid mask, and SVG
     noise at 3 %.
   - Reduced motion shows the final "Delivered" state statically.
3. **Built for:** a strip of four property types with icons (Resorts, Boutique hotels, Heritage properties,
   Serviced apartments). **No fake customer logos.**
4. **Problem → answer** (`#product`): three cards, each a pain (muted) turning into an answer (ivory, gold icon):
   guests wait, staff miss requests, managers are blind.
5. **How it works** (`#how`): three numbered steps in a row (stacked on mobile) with gold numerals in Playfair,
   each with a tiny live visual: the QR glyph; a `MenuItemCard` (feature layout, seed item, non-interactive); a
   `StatusTimeline` (vertical, three steps).
6. **For guests** (`#guests`), a bento grid on a 6-column desktop grid:
   - Branded menu: a large tile with two live `MenuItemCard`s.
   - Live status: a tall tile with a `StatusTimeline`.
   - One-tap requests: chips.
   - Bill and receipt: a mini receipt.
   - Installable, no app store: a phone icon with a "Add to Home Screen" hint.
   - Fast on hotel Wi-Fi: "Designed to load in under 2 seconds on 4G".
7. **For teams** (`#teams`): the operations half, credited to the product, not a person. Four cards: kitchen chime
   and realtime queue, push alerts to a locked phone, SLA escalation to the manager, live manager dashboard. Use
   the ops wording from M3's DESIGN.md language. The CTA "See plans" goes to `/pricing`.
8. **Security** (`#security`), "Engineering you can't see": four rows with icons for tenant isolation (row-level
   security, tested in CI), server-side pricing, idempotent payments, and an audit trail on every critical action.
9. **Live demo** (`#demo`): "Scan it with your phone, right now." A large QR (server-generated SVG via `qrcode`,
   `errorCorrectionLevel: 'M'`, white modules on a white card with midnight dots, 240 px) that encodes
   `{SITE_URL}/q/{DEMO_QR_TOKEN}`. Beside it: "Grand Azure Resort & Spa · Room 304 (demo)", a copyable link, and
   three steps to follow.
10. **Roadmap:** "What's next": AI concierge, inventory forecasting, OTA integrations, payroll export (small cards
    with a "Roadmap" pill).
11. **Final CTA band:** gold-lit panel. "Bring ResortBrain to your property." Primary "Try the live demo",
    secondary "See plans" → `/pricing`.
12. **MarketingFooter:** wordmark, links, a team credit line built from `landing/_content/team.ts` in the fixed name
    order from `docs/decisions.md` ("Member 1 — Senior Lead & Platform Owner · Member 2 — Co-Lead, Guest &
    Commerce · Member 3 — Co-Lead, Operations & Control", with real names filled in by the team), and "© 2026
    ResortBrain".

**Metadata:** title "ResortBrain — Hospitality at the speed of a scan", the description from the copy deck, OG
image `app/(marketing)/opengraph-image.tsx` (1200×630, midnight background, gold crest, the H1 in Playfair), and
`twitter: { card: 'summary_large_image' }`.

**Motion:**

- Sections fade and rise in once when they enter the viewport. Use CSS `animation-timeline: view()` inside
  `@supports`, and render them static where it's unsupported. Don't use a JS observer library.
- Hover on bento tiles: `border-line-strong` plus a 1 px gold inner glow.

**Test IDs:** `landing`, `landing-hero-cta`, `landing-demo-qr`, `landing-nav-pricing`.

**Acceptance:**

- [ ] Lighthouse mobile (landing): Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.
- [ ] LCP < 1.8 s and CLS < 0.02 on simulated 4G.
- [ ] Always dark, even after the guest app switched to Sunlight.
- [ ] Scanning the QR on a real phone opens the Room 304 demo.
- [ ] Every claim is either true of the product or phrased as a design target, with no invented customers or
      statistics.
