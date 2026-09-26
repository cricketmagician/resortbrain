# 08 · Copy deck and PRODUCT.md

Microcopy decides whether this feels like a five-star product or a hackathon demo. Use these strings verbatim (they
live in typed constants, never inline in JSX): `lib/guest/copy.ts` for the guest app and
`app/(marketing)/landing/_content/landing-copy.ts` for the landing page.

## 1. Voice

- **Warm concierge, not a chatbot.** Short sentences, second person, present tense.
- **Calm under failure.** Say what happened and what to do next. Never blame the guest, never say "Oops", never
  expose error codes.
- **Honest.** Don't promise times we don't know, and don't claim statistics we haven't measured. Phrase targets as
  targets ("designed to load in under 2 seconds").
- **Specific.** Say "Room 304", "Grand Azure" and "Being prepared", not "your room", "the hotel" or "processing".
- **No emoji** in the UI. Icons do that job.
- **Indian English conventions:** ₹ with lakh grouping (handled by `en-IN`), "check-out" as the noun, and times
  as "8:02 PM".

## 2. Guest app strings (`lib/guest/copy.ts`)

| Key | String |
|-----|--------|
| qr.resolving | Unlocking your stay |
| qr.slow | Still connecting… hotel Wi-Fi can be slow. Hang tight. |
| qr.error.title | We couldn't connect |
| qr.error.body | Check that you're online, then try again. The Wi-Fi name is on your key card. |
| common.retry | Try again |
| common.callDesk | Call the front desk |
| home.greeting.morning / afternoon / evening | Good morning, {first name} / Good afternoon, {first name} / Good evening, {first name} |
| home.greeting.noSession | Welcome to {hotel} |
| home.noSession.body | Scan the QR code in your room to order and make requests. |
| home.welcomeToast | Welcome to {hotel}. Your room is connected. |
| home.quick.dining / housekeeping / amenities / frontDesk / bill / activity | In-room dining · Housekeeping · Amenities · Front desk · Your bill · Activity |
| home.quick.hints | Delivered to your door · Towels, cleaning, turndown · Toiletries, pillows, more · Taxis, late check-out · See and settle · Orders and requests |
| home.chefsPicks | Chef's picks |
| home.info.wifi | Wi-Fi · {network} · Password on your key card |
| menu.title | In-room dining |
| menu.subtitle | Delivered to Room {room} · {estimate} |
| menu.subtitle.noSession | Browse our menu |
| menu.search.placeholder | Search dishes |
| menu.vegOnly | Veg only |
| menu.noResults | No dishes match "{q}" |
| menu.clearSearch | Clear search |
| menu.empty | The kitchen is resting right now. The front desk can help. |
| menu.added | Added to your order |
| menu.unavailable | Unavailable right now |
| menu.scanToOrder | Scan the QR code in your room to order |
| item.each | {price} each |
| item.note.label | Note for the kitchen |
| item.note.placeholder | e.g. no chilli, extra crispy |
| item.add / item.update / item.removed | Add to order · Update order · Removed from your order |
| item.allergens / item.noAllergens | Contains: {list} · No listed allergens |
| cart.title | Your order |
| cart.deliverTo | Deliver to |
| cart.addMore | Add more items |
| cart.note.label | Note for the kitchen |
| cart.summary.calculated | Calculated by {hotel}'s billing system. |
| cart.summary.noQuote | Taxes and service charge are added by the hotel. You'll see the exact total the moment you place your order. |
| cart.place / cart.placing | Place order · Placing your order… |
| cart.empty.title / body / cta | Your order is empty · Pick something delicious from the menu. · Browse the menu |
| cart.error.unavailable | {item} is no longer available. We've taken it out of your order. |
| cart.error.rate | You're ordering a little fast. Please try again in a moment. |
| cart.error.offline | You're offline. Your order is saved here, so try again when you're connected. |
| cart.error.tooLong | Kitchen notes can be up to 500 characters. |
| request.title / subtitle | How can we help? · Our team is notified instantly. |
| request.category.* | Housekeeping · Amenities · Front desk · Maintenance |
| request.whatDoYouNeed | What do you need? |
| request.other | Something else |
| request.details | Details (optional) |
| request.urgent | It's urgent |
| request.send / sending | Send request · Sending… |
| activity.title | Your activity |
| activity.filters | All · Orders · Requests |
| activity.empty.title / body | Nothing here yet · Order something delicious or ask us for anything. |
| tracking.placedBanner | Order placed. The kitchen has been notified. |
| tracking.sentBanner | Request sent. The team has been notified. |
| tracking.placedAgo | Placed {relative} |
| tracking.live / reconnecting / offline | Live · Reconnecting… · Offline, showing last update |
| tracking.delay.pending | The kitchen is busy right now. Your order is in the queue, and this screen updates the moment it's accepted. |
| tracking.delay.preparing | Taking a little longer than usual. Thank you for your patience. |
| tracking.delay.request | Still waiting? The team has been notified, and you can also call the front desk. |
| tracking.notFound | We couldn't find this order. |
| tracking.orderAgain / orderElse | Order again · Order something else |
| tracking.assignee | {first name} has your request |
| bill.title | Your bill |
| bill.unpaid / paid | Unpaid · Paid |
| bill.testMode | Test mode. No real money moves. |
| bill.payWith | Pay with |
| bill.method.card / upi | Card · test card ending 4242 / UPI · resortbrain@testupi |
| bill.pay | Pay {amount} |
| bill.processing | Processing securely… |
| bill.error | The payment didn't go through. You haven't been charged, so try again. |
| bill.nothing.title / body | Nothing on your bill yet · Anything you order will appear here. |
| bill.viewReceipt | View receipt |
| receipt.success | Payment successful |
| receipt.print / pdf / share / home | Print receipt · Save invoice (PDF) · Share · Back to home |
| feedback.title | How was everything? |
| feedback.tags | Fast service · Delicious food · Friendly staff · Clean room · Great value |
| feedback.comment | Tell us more (optional) |
| feedback.send | Send feedback |
| feedback.thanks | Thank you. We've shared this with the team. |
| feedback.low | We're sorry it wasn't perfect. The front desk is one tap away. |
| rejoin.* | see doc 04 §11 |
| offline.title / body | You're offline · Your menu is saved on this device. |
| offline.back | Back online |
| install.title | Add {hotel} to your home screen |
| install.body | One tap back to room service, requests and your bill. |
| install.ios.steps | Tap the Share icon · Choose "Add to Home Screen" · Tap "Add" |
| update.ready | A fresh version is ready · Refresh |
| demo.badge | Demo data |
| session.notYou | Not you? Leave this device |
| theme.toSunlight / toDark | Switch to Sunlight mode · Switch to dark mode |

## 3. Landing page copy

**Header CTA:** Try the live demo

**Hero**
- Eyebrow: Hotel operations, reimagined
- H1: **Hospitality at the speed of a scan.**
- Sub: Guests order, request and pay from the QR code in their room, with no app and no waiting. Your team gets the
  right task on the right device, with a clock on it.
- CTAs: **Try the live demo** · See how it works
- Proof row: No app to install · Works on any phone · Designed to load in under 2 seconds

**Built for:** Resorts · Boutique hotels · Heritage properties · Serviced apartments

**Problem → answer** (section title: *Every stay runs on a thousand small requests.*)
1. *Guests wait.* Calls to reception ring out, and towels take an age. → **Two taps, live status.** Guests see
   exactly where their order or request is, to the minute.
2. *Staff miss requests.* Walkie-talkies, sticky notes and phones that ring out. → **The right task, on the right
   device.** A chime in the kitchen, a push to the housekeeper's phone, and a clear owner for every job.
3. *Managers are blind.* No one knows what's late until a guest complains. → **Nothing slips.** Missed deadlines
   escalate automatically, and the dashboard shows it live.

**How it works** (title: *Three steps. No app store.*)
1. **Scan.** Every room has its own QR code, and the guest's camera is the app.
2. **Order or ask.** A branded menu, one-tap requests, and notes for the kitchen.
3. **Watch it happen.** Placed, accepted, preparing, delivered, updated live.

**For guests** (title: *A concierge in every pocket.*)
- Branded menu: Your menu, your photos, your prices, rendered in about two seconds.
- Live status: Every order and request, tracked to the minute.
- One-tap requests: Towels, turndown, a taxi. Picked from a list, sent instantly.
- Bill and receipt: See the bill, pay, and print or save a GST invoice.
- Installable: Add to the home screen, no app store required.
- Built for hotel Wi-Fi: Designed to load in under 2 seconds on 4G, with a menu that works offline.

**For teams** (title: *Your team, perfectly in sync.*)
- Kitchen display: New orders chime in real time. Accept, prepare, ready.
- Push to any phone: Alerts arrive even when the app is closed.
- Escalation built in: If a task sits past its deadline, the duty manager knows.
- Manager dashboard: Response times, volumes and performance, live.
- CTA: See plans →

**Security** (title: *Engineering you can't see.*)
- Every hotel's data is isolated at the database layer, and that's tested on every change.
- Prices, taxes and totals are calculated on the server, never on the phone.
- Payments are idempotent, so a double tap never means a double charge.
- Every critical action is written to an audit trail.

**Live demo** (title: *Scan it. Right now.*)
- Body: Point your phone's camera at the code. You'll be in Room 304 at Grand Azure Resort & Spa, so order
  something and watch it move.
- Steps: Open your camera · Scan the code · Order or request anything
- Caption: Demo stay · test mode · no real orders or payments

**Roadmap** (title: *What's next.*): AI concierge · Inventory forecasting · OTA and PMS integrations · Payroll export

**Final CTA:** *Bring ResortBrain to your property.* Try the live demo · See plans

**Footer:** Built by Member 1 (Senior Lead & Platform Owner), Member 2 (Co-Lead, Guest & Commerce) and Member 3
(Co-Lead, Operations & Control), in the fixed name order from `docs/decisions.md` with real names filled in by the
team. © 2026 ResortBrain.

**Meta description:** ResortBrain turns every room's QR code into a branded concierge: in-room dining, service
requests, live status and digital receipts, with real-time staff workspaces behind it.

## 4. `docs/PRODUCT.md` (M2's document; rewrite it and have M3 review)

Keep the existing vision and personas, and expand them into this outline. Target 2–3 pages.

1. **Vision:** one sentence plus the north-star flow (playbook §1), verbatim in spirit.
2. **Users and jobs to be done:**
   - Guest: "When I want something in my room, I want to ask once and know it's handled."
   - Kitchen and runner, front desk and housekeeping, manager, platform owner: one job each, taken from the
     playbook.
3. **Principles (ranked):**
   1. Guest-first speed.
   2. Honest status: never show a state the server didn't confirm.
   3. The server owns money, identity and tenancy.
   4. Calm by design.
   5. Works on the worst phone on the worst Wi-Fi.
   6. Every state is designed.
4. **Tone of voice:** the voice rules from §1 of this doc, with three do/don't examples.
5. **Scope tiers:** must-have, should-have and roadmap (from the playbook), with the guest-side items marked.
6. **Success metrics:** the playbook's metric table, with owners.
7. **Shared status language:** a table pointing to `components/ui/tokens/status.ts`, which is the contract with
   M3.
8. **Out of scope:** native apps, SMS/WhatsApp, live payments, loyalty.
9. **Glossary:** stay, stay token, QR token, request, order, invoice, SLA, escalation, tenant.
