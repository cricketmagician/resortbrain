# Product Specification & Principles (PRODUCT.md)

## 1. Vision

ResortBrain turns a hotel room's QR code into the entire guest-service desk, and turns every hotel team's
walkie-talkie chatter into one shared, honest queue. The north-star flow: a guest scans the code on their bedside
table, and within one screen tap can order food, ask for anything, and watch it happen — with no app to install and
no front-desk call to place — while the exact same request lands, already triaged, on the right team's screen.

## 2. Users and jobs to be done

- **Guest (PWA / mobile):** "When I want something in my room, I want to ask once and know it's handled" — order
  room dining, raise a service request, and track it to done without downloading anything or repeating themselves.
- **Kitchen chef and runner:** see every order the moment it's placed, in the order it should be cooked, and know
  the instant it's ready to go out.
- **Front desk and housekeeping:** see every guest request as it lands, with enough context (room, guest, ask) to
  act on it without a phone call, and a visible SLA clock so nothing is quietly forgotten.
- **Hotel manager:** see occupancy, response times, order volume and revenue for their property at a glance, and
  know immediately when something is escalating.
- **Platform owner:** onboard a new hotel, manage subscription limits, and inspect usage and audit logs across every
  tenant from one control plane, with zero risk of one hotel seeing another's data.

## 3. Principles (ranked)

1. **Guest-first speed.** Every guest-facing decision optimizes for the guest's next tap, not the internal workflow.
2. **Honest status.** Never show a state the server hasn't confirmed — no optimistic "Delivered", no silent retries
   that hide a failure.
3. **The server owns money, identity and tenancy.** The client never computes a price, decides who a guest is, or
   assumes which hotel it's talking to.
4. **Calm by design.** Slow Wi-Fi, an expired session, an empty list — every one of those is a designed screen, not
   a blank one or a console error.
5. **Works on the worst phone on the worst Wi-Fi.** Mid-range Android, spotty hotel Wi-Fi, direct sunlight — that's
   the baseline, not the edge case.
6. **Every state is designed.** Loading, empty, error, expired and offline are product surfaces, not afterthoughts.

## 4. Tone of voice

Warm concierge, not a chatbot: short sentences, second person, present tense, calm under failure, no emoji (icons do
that job). Specific beats generic, and honest beats reassuring.

| Do | Don't |
|----|-------|
| "Room 304 — Grand Azure" | "your room at the hotel" |
| "Still connecting… hotel Wi-Fi can be slow. Hang tight." | "Oops! Something went wrong (Error 504)." |
| "Designed to load in under 2 seconds." | "Guaranteed instant delivery." |

## 5. Scope tiers

**Must-have (P0), shipped this milestone** — *guest-side items are M2's:*
- *[Guest]* QR entry, hotel home, menu, item detail and cart, service request, order and request tracking
- *[Guest]* Bill, test-mode payment, receipt and print, feedback
- *[Guest]* Guest half of the component kit (Button, Input, Card, Sheet, Toast, Skeleton, Status timeline, Menu
  item card), landing page, PWA (manifest, service worker, install prompt), performance budgets and Lighthouse
- Kitchen and runner order queue, front desk and housekeeping request board with SLA countdowns
- Multi-tenant data isolation (RLS), stay tokens, realtime order/request status

**Should-have (P1), shipped where time allowed:**
- *[Guest]* Feedback and rating on the receipt screen, the room QR print sheet for venue day
- Manager's executive dashboard (occupancy, response time, revenue, escalations)
- Platform owner's tenant control plane (onboarding, limits, usage, audit log)

**Roadmap, deliberately not built:**
- A native mobile app (the PWA is the guest surface)
- SMS/WhatsApp notifications
- Live, real payment processing (payment is test-mode only — see §8)
- A loyalty program

## 6. Success metrics

| Metric | Target | Owner |
|--------|--------|-------|
| First guest interaction | < 2 s on 4G, mobile | M2 |
| Realtime status latency | < 1 s after the server event (Realtime on), one poll interval otherwise | M1 / M2 |
| Lighthouse mobile — Performance / Accessibility / Best Practices | ≥ 90 / ≥ 95 / ≥ 95 (guest), ≥ 95 / ≥ 95 / ≥ 95 (landing) | M2 (Performance Captain) |
| Guest-side JS, first load (gzip) | ≤ 180 KB (guest), ≤ 140 KB (landing) | M2 |
| Request SLA adherence | % of requests acknowledged and completed inside their SLA window | M3 |
| Order accuracy and time-to-ready | Kitchen accepts → ready, tracked per order | M3 |
| Tenant isolation | Zero cross-tenant reads in `tests/rls` | M1 |

These are targets to design and build toward, not measured production numbers — see `docs/perf/` for the current
Lighthouse reports and `docs/m2/qa-log.md` for what's actually been verified.

## 7. Shared status language

`components/ui/tokens/status.ts` is the single source of truth for order and request status wording, shared by the
guest (M2) and staff (M3) halves of the app so the two sides never disagree on what a status is called or means.

| Table | Guest sees | Staff sees | Tone |
|-------|-----------|------------|------|
| `ORDER_STATUS` | "Order placed" → "Accepted" → "Being prepared" → "Ready" → "Delivered" (or "Cancelled") | "New" → "Accepted" → "Preparing" → "Ready for pickup" → "Delivered" | progress / success / danger |
| `REQUEST_STATUS` | "Request sent" → "On it" → "In progress" → "Done" (or "Cancelled" / "Couldn't be completed") | "New" → "Accepted" → "In progress" → "Completed" | progress / success / danger |

Neither side should hardcode this wording elsewhere — import from this file so a status change never needs to be
made twice.

## 8. Out of scope

Native apps, SMS/WhatsApp notifications, live (real-money) payments, and a loyalty program. Payment in this build is
test-mode only: guests see and confirm a method and amount, the server records the "payment," and no money moves —
by design, so a real payment gateway is a deliberate future integration, not a gap.

## 9. Glossary

- **Stay:** one guest's checked-in period in one room, from check-in to check-out.
- **Stay token:** the opaque, server-issued credential that identifies an active stay to the guest's browser. Never
  a room number or guest name, never logged, never put in a URL that could be shared or cached.
- **QR token:** the value printed on a room's physical QR code (`?q=QR_AZURE_304`); resolving it starts or resumes a
  stay session. Different from the stay token: the QR token is on paper, the stay token is in the browser.
- **Request:** a guest's ask that isn't a food order — housekeeping, maintenance, concierge, etc. — routed to the
  right team with an SLA clock.
- **Order:** a food or amenity order placed from the menu, always priced and totalled by the server.
- **Invoice:** the itemised bill for a stay; becomes a receipt once paid.
- **SLA:** the target time a request should be acknowledged and completed within; shown to staff as a countdown and
  to the guest as an honest, non-committal estimate.
- **Escalation:** a request that has missed its SLA and needs a manager's attention.
- **Tenant:** one hotel's isolated slice of the platform — its own rooms, menu, staff, guests and data, invisible to
  every other tenant.
