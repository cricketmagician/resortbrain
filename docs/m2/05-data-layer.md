# 05 · Data layer and contracts

**One rule:** UI code imports data **only** from `@/lib/guest/data` (plus `lib/guest/session`, `cart`, `format`
and `status`). It never calls `fetch` directly, never imports M1's modules, and never computes money.

## 1. What M1 exposes today

These contracts are read from `origin/feat/m1-platform-backend`, which isn't merged into `main` yet. **Re-read
them before implementing:**

```
git fetch origin
git diff origin/main origin/feat/m1-platform-backend -- app/api modules
```

If M1 changed a shape, the http adapter's mapping is the only place to update.

| Guest need | M1 endpoint | Request | Response (200/201) | Errors |
|------------|-------------|---------|--------------------|--------|
| QR → session | `POST /api/stays/verify` | `{ qrToken }` | `{ success, session: StayTokenSession }` | 404 `{error}` invalid · 429 rate-limited · 400 |
| Resume session | `POST /api/stays/verify` | `{ stayToken }` | same | same |
| Public menu (client, rarely needed) | `GET /api/menu?hotelId=&category=&vegOnly=` | — | `{ hotelId, categories: string[], items: MenuItem[] }` | 400 |
| Place order | `POST /api/orders` | `{ stayToken, items: [{menuItemId, quantity}], specialInstructions?, idempotencyKey? }` | 201 `{ success, order: Order }` | 400 `{error}` (validation, unavailable, **and** invalid token) · 429 |
| My orders | `GET /api/orders?stayToken=` | — | `{ orders: Order[] }` | 400 |
| Create request | `POST /api/requests` | `{ stayToken, category, title, details?, priority }` | 201 `{ success, request: ServiceRequest }` | 400 |
| My requests | `GET /api/requests?stayToken=` | — | `{ requests: ServiceRequest[] }` | 400 |
| Invoice | `GET /api/billing?stayToken=` | — | `{ invoice: Invoice }` | 400 |
| Pay | `POST /api/billing` | `{ invoiceId, stayToken, amountPaise, paymentMethod: 'card_test'\|'upi_test'\|'room_charge', idempotencyKey }` | `{ success, invoice }` | 400 |
| Health (mode probe) | `GET /api/health` | — | `{ status: 'healthy', … }` | — |

Server-side read models already on `main`, which M2 may import **only** from `lib/guest/server/*`:

- `listPublicMenu({ hotelId, category?, vegOnly? })` from `@/modules/menu/queries`
- `db.getHotel(idOrSlug)` from `@/server/db`, wrapped once in `getPublicHotel()` until M1 publishes
  `modules/hotels/queries` (contract request C1)

**M1 shapes the adapter maps from**, which are snake_case with camelCase items:

```ts
StayTokenSession { stayId, hotelId, hotelName, roomId, roomNumber, guestName, stayToken, currency, taxRate, serviceCharge }
Order { id, hotel_id, stay_id, room_id, room_number, order_number, status, items: [{ menuItemId, itemName, quantity, unitPricePaise, totalPricePaise }],
        subtotal_paise, tax_paise, service_charge_paise, total_paise, special_instructions?, idempotency_key?, created_at, updated_at }
ServiceRequest { id, hotel_id, stay_id, room_id, room_number, category, title, details?, status, priority, sla_minutes,
                 escalation_sent, assigned_to?, assigned_name?, created_at, acknowledged_at?, completed_at? }
Invoice { id, hotel_id, stay_id, invoice_number, subtotal_paise, tax_paise, service_charge_paise, total_paise, status: 'draft'|'issued'|'paid', created_at, paid_at? }
```

## 2. View-model types (`lib/guest/types.ts`)

camelCase, money is always `…Paise: number` (integer minor units), and times are ISO UTC strings.

```ts
export type Currency = 'INR' | (string & {});

export interface PublicHotel {
  id: string; slug: string; name: string; shortName: string; tagline: string;
  logoUrl?: string; bannerUrl?: string; accent: string; currency: Currency; timeZone: string;
  contact: { phone?: string; email?: string; address?: string; gstin?: string };
  info: { wifiName?: string; checkoutTime?: string; breakfastHours?: string; poolHours?: string; deliveryEstimate?: string };
  requestPresets: Record<RequestCategory, { slug: string; label: string }[]>;
}

export interface MenuItemVM {
  id: string; name: string; description?: string; category: string; categorySlug: string;
  pricePaise: number; currency: Currency; imageUrl?: string; isVeg: boolean; allergens: string[];
  available: boolean; featured?: boolean;
}

export interface GuestSession {
  stayToken: string; stayId: string; hotelId: string; hotelSlug: string; hotelName: string;
  roomId: string; roomNumber: string; guestName: string; currency: Currency;
  validatedAt: string;               // client clock, for the 10-minute background revalidation
}

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type RequestStatus = 'created' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
export type RequestCategory = 'housekeeping' | 'amenities' | 'front_desk' | 'maintenance';
export type RequestPriority = 'low' | 'normal' | 'high' | 'urgent';
export type PaymentMethod = 'card_test' | 'upi_test';

export interface OrderLine { menuItemId: string; name: string; quantity: number; unitPricePaise: number; totalPricePaise: number }
export interface Order {
  id: string; orderNumber: string; status: OrderStatus; roomNumber: string; lines: OrderLine[];
  subtotalPaise: number; taxPaise: number; serviceChargePaise: number; totalPaise: number;
  specialInstructions?: string; createdAt: string; updatedAt: string;
  optimistic?: boolean;
}
export interface ServiceRequest {
  id: string; category: RequestCategory; title: string; details?: string; status: RequestStatus;
  priority: RequestPriority; roomNumber: string; assigneeFirstName?: string;
  createdAt: string; acknowledgedAt?: string; completedAt?: string; optimistic?: boolean;
}
export interface Invoice {
  id: string; invoiceNumber: string; status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'voided' | 'refunded';
  subtotalPaise: number; taxPaise: number; serviceChargePaise: number; discountPaise: number; totalPaise: number;
  createdAt: string; paidAt?: string; paymentMethod?: PaymentMethod;
}
export interface Quote { subtotalPaise: number; taxPaise: number; serviceChargePaise: number; totalPaise: number }
export interface CartLine { menuItemId: string; quantity: number; note?: string }
export interface StayEvent { entity: 'order' | 'request' | 'invoice' | 'stay'; id: string; status: string }
```

Validate every network response with **Zod** schemas in `lib/guest/data/http.ts` before mapping. If validation
fails, raise a `server` error with a dev-only console warning. Never let bad data render as `NaN` or "undefined".

## 3. The adapter (`lib/guest/data/types.ts`, `index.ts`)

```ts
export interface GuestApi {
  readonly source: 'api' | 'mock';
  readonly capabilities: { quote: boolean; feedback: boolean };
  resolveQr(qrToken: string): Promise<GuestSession>;
  resumeSession(session: GuestSession): Promise<GuestSession>;
  quoteOrder(session: GuestSession, lines: CartLine[]): Promise<Quote | null>;          // null ⇒ unsupported
  placeOrder(session: GuestSession, input: { lines: CartLine[]; specialInstructions?: string; idempotencyKey: string }): Promise<Order>;
  listOrders(session: GuestSession): Promise<Order[]>;
  createRequest(session: GuestSession, input: { category: RequestCategory; title: string; details?: string; priority: RequestPriority }): Promise<ServiceRequest>;
  listRequests(session: GuestSession): Promise<ServiceRequest[]>;
  getInvoice(session: GuestSession): Promise<Invoice>;
  pay(session: GuestSession, input: { invoiceId: string; amountPaise: number; method: PaymentMethod; idempotencyKey: string }): Promise<Invoice>;
  submitFeedback(session: GuestSession, input: { invoiceId?: string; orderId?: string; rating: 1|2|3|4|5; tags: string[]; comment?: string }): Promise<void>;
  subscribe(session: GuestSession, onEvent: (e: StayEvent) => void): () => void;       // mock: simulator; api: see §6
}

export type GuestApiErrorKind =
  | 'network' | 'timeout' | 'rate_limited' | 'expired' | 'invalid' | 'not_found' | 'validation' | 'unsupported' | 'server';
export class GuestApiError extends Error {
  constructor(public kind: GuestApiErrorKind, message: string, public retryAfterSec?: number) { super(message); }
}
```

**Choosing the source** (`getGuestApi()` in `index.ts`, memoised per page load):

1. If `NEXT_PUBLIC_GUEST_DATA_SOURCE` is `api` or `mock`, use that.
2. For `auto` (the default): read `sessionStorage['rb.dataSource']`. If it's missing, send
   `fetch('/api/health', { cache: 'no-store' })` with a 1.5 s timeout: 200 → `api`, anything else → `mock`, then
   store the result.
3. While the probe is in flight, hooks show skeletons. Never render mock data and then swap to api data.
4. In `mock` mode, `<DemoDataBadge>` shows a small, dismissible pill in the bottom-left corner: "Demo data". That
   keeps the demo honest.

## 4. The http adapter (`lib/guest/data/http.ts`)

- `request(path, init)` handles the following:
  - **Timeout:** 10 s via `AbortSignal.timeout`, which becomes `timeout`.
  - **Offline:** `navigator.onLine === false` fails fast with `network`.
  - **Parsing:** read the JSON body `{ error }`.
  - **Status mapping:** 404 on verify → `invalid`. 429 → `rate_limited`, using `Retry-After` if present or 10 s
    otherwise. 401/403 → `expired`. A 400 whose message matches `/unauthori[sz]ed|expired|invalid .*token/i` →
    `expired`. Any other 400 → `validation`, using the server message. 5xx → `server`.
  - **Retries:** idempotent GETs retry twice with backoff (400 ms, 1200 ms) on `network`, `timeout` or 5xx.
    **POSTs are never retried automatically.** The UI's Retry button reuses the same idempotency key.
- **Stay token transport:** M1 currently takes `stayToken` in the JSON body (POST) or the query string (GET).
  Contract request C4 asks for `Authorization: Bearer`. Put this in **one** helper (`withStay(session, …)`), so
  switching is a one-line change.
- **Hotel slug:** `StayTokenSession` has no slug. Map `hotelId → slug` through `HOTEL_DIRECTORY` (a tiny map
  generated from the guest seed in `lib/guest/hotel-directory.ts`) until contract request C2 adds `hotelSlug`.
- **Capabilities:** `quote: false` and `feedback: false` until M1 ships C3 and C5. Once they do, probe with
  `OPTIONS` or flip a constant.
- **Idempotency on orders:** pass the `idempotencyKey` through. M1 dedupes on it.
- **Mapping:** order `items` → `lines` (`itemName` → `name`). `assigned_name` → `assigneeFirstName`
  (first token only). `discount_paise` defaults to 0 when absent.

## 5. Status and wording (`components/ui/tokens/status.ts` shared, `lib/guest/status.ts` guest)

The shared file (M3 approves) is the single source of truth for status labels in **both** halves:

```ts
export const ORDER_STATUS = {
  pending:   { guest: 'Order placed',   guestHint: 'Sent to the kitchen',              staff: 'New',              tone: 'progress' },
  accepted:  { guest: 'Accepted',       guestHint: 'The kitchen has your order',       staff: 'Accepted',         tone: 'progress' },
  preparing: { guest: 'Being prepared', guestHint: 'Freshly made for you',             staff: 'Preparing',        tone: 'progress' },
  ready:     { guest: 'Ready',          guestHint: 'A runner is bringing it to you',   staff: 'Ready for pickup', tone: 'progress' },
  delivered: { guest: 'Delivered',      guestHint: 'Enjoy your meal',                  staff: 'Delivered',        tone: 'success'  },
  cancelled: { guest: 'Cancelled',      guestHint: 'Questions? The front desk can help.', staff: 'Cancelled',     tone: 'danger'   },
} as const;
export const REQUEST_STATUS = {
  created:      { guest: 'Request sent', guestHint: 'Waiting for the team to pick it up', staff: 'New',         tone: 'progress' },
  acknowledged: { guest: 'On it',        guestHint: 'Someone has your request',           staff: 'Accepted',    tone: 'progress' },
  in_progress:  { guest: 'In progress',  guestHint: 'On the way to your room',            staff: 'In progress', tone: 'progress' },
  completed:    { guest: 'Done',         guestHint: 'Anything else? We\'re here.',        staff: 'Completed',   tone: 'success'  },
  cancelled:    { guest: 'Cancelled',    guestHint: 'Questions? The front desk can help.', staff: 'Cancelled',  tone: 'danger'   },
  rejected:     { guest: 'Couldn\'t be completed', guestHint: 'The front desk will follow up', staff: 'Rejected', tone: 'danger' },
} as const;
```

`lib/guest/status.ts` builds `TimelineStep[]` from these. The happy paths are `[pending, accepted, preparing,
ready, delivered]` and `[created, acknowledged, in_progress, completed]`. It attaches timestamps where the server
has them: `createdAt` for the first step, `acknowledgedAt` for acknowledged, `completedAt` for completed, and
`updatedAt` for the current order step. Other steps show no time, and **the client must never invent one**. The
function exposes `stepIndex(status)` so the UI can ignore out-of-order (older) updates.

## 6. Live updates (`lib/guest/data/live.ts` + `LiveProvider`)

`LiveProvider` (inside the hotel layout, active only with a session) exposes
`{ state: 'live' | 'polling' | 'reconnecting' | 'offline' }` and triggers SWR `mutate()` on relevant keys.

| Mode | When | How |
|------|------|-----|
| **Supabase Realtime** | `NEXT_PUBLIC_GUEST_REALTIME=supabase` and the Supabase env is set and `source==='api'` | Lazy `import('@supabase/supabase-js')`, `channel('stay:' + stayId)`, listen for broadcast `status` events carrying `{ entity, id, status }` (ids and status only, per the playbook). On each event, `mutate` that entity's list. Authorisation of the channel by stay token is M1's job (contract request C6). |
| **Polling** (default) | otherwise, in `api` mode | Every **4 s** while the tab is visible **and** there's at least one non-terminal order or request. Every **20 s** when everything is terminal. Paused while hidden. Immediate refetch on `visibilitychange → visible` and on `online`. |
| **Mock simulator** | `source==='mock'` | `subscribe()` emits events from `server-sim.ts` timers |

When the connection drops (fetch failures or a channel error), set the state to `reconnecting` and back off
exponentially (4 s, 8 s, 16 s, max 30 s). `LiveIndicator` renders the state: green "Live", amber "Reconnecting…",
grey "Offline".

**SWR setup** (`lib/guest/data/hooks.ts`): keys are
`['orders', stayId]`, `['requests', stayId]` and `['invoice', stayId]`. Options: `revalidateOnFocus: true`,
`dedupingInterval: 2000`, `keepPreviousData: true`, `shouldRetryOnError: false` (the adapter already retries).
`useOrder(id)` and `useRequest(id)` derive their data from the lists.

## 7. Session, cart and idempotency

**`lib/guest/session.ts`:**

- Store `localStorage['rb.session.v1']` as a `GuestSession`. There's one active session per device, and the latest
  QR scan wins.
- Expose it through `useSyncExternalStore`: `useGuestSession(hotelId)` returns the session only if its `hotelId`
  matches.
- `clearSession()` removes the session, the cart for that stay, and pending checkout keys.
- Also write `rb.lastHotel = slug` for the offline page.
- Never log the token, and never place it in a URL or an analytics event.

**`lib/guest/cart.ts`:**

- Key: `localStorage['rb.cart.{stayId}']`, an array of `CartLine`.
- Reducer actions: `add(id)`, `setQty(id, n)` (0 removes the line), `setNote(id, text)`, `clear()`.
- It syncs across tabs through the `storage` event.
- **The cart stores ids, quantities and notes only, never prices.** Names and prices always come from the SSR menu
  that's passed in, so a price change on the server shows up immediately.
- `cartHash(lines)` is a stable string used for idempotency reuse.

**`lib/guest/idempotency.ts`:**

- `forCheckout(stayId, cartHash)`: read `sessionStorage['rb.idem.checkout.{stayId}']`. If its hash matches, reuse
  the key. Otherwise create `crypto.randomUUID()` and store it.
- `forPayment(invoiceId)` works the same way, keyed on the invoice.
- `settle(kind, id)` deletes the key after a confirmed success.

## 8. Money (`lib/guest/format.ts`)

```ts
formatMoney(paise: number, currency = 'INR'): string
// const fd = paise % 100 === 0 ? 0 : 2;   // set BOTH min and max, or older engines throw RangeError
// new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: fd, maximumFractionDigits: fd }).format(paise / 100)
formatTime(iso: string, timeZone: string): string         // "8:02 PM"
formatDateTime(iso: string, timeZone: string): string     // "26 Sep 2026, 9:14 PM"
formatRelative(iso: string, now = Date.now()): string     // "Just now", "6 min ago", "1 h ago"
```

Dividing by 100 **for display** is the only arithmetic on money anywhere in the guest UI. Cache the
`Intl.NumberFormat` instances.

## 9. The mock server (`mock/guest/fixtures.ts`, `mock/guest/server-sim.ts`)

It's a stand-in for M1, so it's the **only** client-side place allowed to compute money, and it copies M1's
formula exactly:

```
subtotal = Σ unit × qty
tax      = round(subtotal × taxRate / 100)
service  = round(subtotal × serviceCharge / 100)
total    = subtotal + tax + service
```

- **Fixtures** import hotels and menus from `db/seed/guest/guest_seed.ts` and rooms and stays from
  `db/seed/ops/ops_seed.ts` (read-only), so mock and api modes show the same hotels, rooms and guests.
- **Persistence:** `localStorage['rb.mock.v1']` holds orders, requests, invoice and payments per stay. Clear it
  with `?mock=reset`.
- **Latency:** 250 to 650 ms of jitter per call. `?chaos=1` fails 20 % of calls with a random error kind, which
  exercises every error state during QA.
- **Resolving QR codes:** a room QR with an active stay → a session with token `mock_{stayId}`. A vacant room →
  `invalid`.
- **Progression:**
  - Orders: pending → accepted after 8 s → preparing after 15 s → ready after 45 s → delivered after 70 s.
  - Requests: created → acknowledged after 10 s (assignee "Rajesh") → in_progress after 25 s → completed after
    60 s.
  - Emit a `StayEvent` on every change. Progression is computed from `createdAt`, so it survives reloads, and a
    `?sim=fast` flag divides every delay by 5 for demos.
- **Idempotency:** the same key returns the same order or payment.
- **Invoice:** always recomputed from the stay's non-cancelled orders until it's paid, which is the behaviour M1's
  version should have (contract request C7).
- **Quote:** supported, with the same formula. **Feedback:** supported, stored locally.

## 10. Contract requests to M1 (full text in [10-integration-notes.md](10-integration-notes.md))

| ID | Ask | Guest workaround until then |
|----|-----|-----------------------------|
| C1 | `modules/hotels/queries.getPublicHotel(slugOrId)` returning public branding only | wrap `db.getHotel` in `lib/guest/server/hotels.ts` |
| C2 | add `hotelSlug` to `StayTokenSession` | `HOTEL_DIRECTORY` map from the guest seed |
| C3 | `POST /api/orders/quote` → server totals for a cart, without creating an order | no-quote summary copy |
| C4 | accept the stay token as `Authorization: Bearer` (keep it out of query strings and logs) | the `withStay()` helper sends it in the body or query for now |
| C5 | `POST /api/feedback` `{ rating, tags, comment, invoiceId? }` | feedback hidden in `api` mode |
| C6 | Realtime channel `stay:{stay_id}` authorised by stay token, payload `{ entity, id, status }` | polling |
| C7 | invoice recalculated from non-cancelled orders until issued or paid (it's currently frozen at first read) | the bill fetches only when opened |
| C8 | return 401 (not 400) for an invalid or expired stay token, and 404 for an unknown order | message regex mapping |
| C9 | `vitest@5` peer conflict with `@types/node@^20` breaks `npm ci` | `--legacy-peer-deps` |

## 11. Data-layer acceptance (unit-tested in `tests/unit/guest/`)

- [ ] `format.test.ts`: ₹550, ₹1,291.50, the `en-IN` lakh grouping (₹1,00,000), and time zone formatting.
- [ ] `cart.test.ts`: add, increment, set to 0 removes, note, hash stability, no price fields in the store.
- [ ] `status.test.ts`: every status maps to steps. Terminal states are handled, and an out-of-order update is
      ignored.
- [ ] `http.test.ts` (`fetch` mocked): each error mapping row, snake → camel mapping, Zod rejection of malformed
      payloads.
- [ ] `server-sim.test.ts`: the pricing formula matches M1's (the test copies M1's numbers: 105000 → tax 18900,
      service 5250, total 129150), progression over fake timers, idempotent replays.
- [ ] `idempotency.test.ts`: the same cart gets the same key, a changed cart gets a new key, and `settle` clears it.
