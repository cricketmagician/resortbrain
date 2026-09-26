# 5-Minute Pitch & Conclave Demo Script

## Time & Speaking Split (Exact 300 Seconds)
- **Member 2 (Guest & Commerce)**: 120s (0:00 - 1:30, 4:30 - 5:00) | 3 Judge Q&A questions
- **Member 3 (Operations & Control)**: 120s (1:30 - 3:00, 3:30 - 4:00) | 3 Judge Q&A questions
- **Member 1 (Platform & Backend Lead)**: 60s (3:00 - 3:30, 4:00 - 4:30) | 3 Judge Technical Q&A questions

---

## Detailed Sequence of Actions

### 0:00 - 0:30 (30s) — Problem & Story [Speaker: Member 2]
- **Action**: Display Slide 1 (The Real Hotel Friction).
- **Pitch**: "Guests wait 25 minutes for room service or fresh towels because hotels rely on landline phones, noisy walkie-talkies, and fragmented manual logbooks. ResortBrain turns the guest's phone into a zero-install concierge."

### 0:30 - 1:30 (60s) — Live Guest QR Scan & Order [Speaker: Member 2]
- **Action**: Member 2 asks a judge to scan the live table QR code (or scans live on test phone).
- **Pitch**: "Instant PWA load under 1.5s on mobile 4G. Room 304 at Grand Azure Resort. Browsing gourmet menu, server-verified pricing, selecting artisan club sandwich and fresh coconut water with custom instructions. Order placed!"

### 1:30 - 2:00 (30s) — Kitchen Station Realtime Chime [Speaker: Member 3]
- **Action**: Kitchen tablet chimes aloud with new order alert.
- **Pitch**: "Within 300 milliseconds, the kitchen display screen rings with visual and audio alerts. Chef clicks 'Accept' -> 'Start Preparing'. The guest's phone updates live in real-time."

### 2:00 - 2:30 (30s) — Closed App Web Push [Speaker: Member 3]
- **Action**: Lock staff phone screen with browser closed. Trigger a service request (Extra Towels).
- **Pitch**: "Staff don't keep tabs open all day. Watch this: Phone is locked in pocket, browser closed. Native VAPID Web Push arrives directly to device lock screen."

### 2:30 - 3:00 (30s) — SLA Timer & Automatic Escalation [Speaker: Member 3]
- **Action**: Do not accept the request immediately. Show SLA countdown.
- **Pitch**: "If a task is ignored past its SLA threshold, ResortBrain's backend escalation engine automatically escalates the notification to the Duty Manager's screen with audit reason."

### 3:00 - 3:30 (30s) — Tenant Isolation & Invisible Security [Speaker: Member 1]
- **Action**: Show Member 1 terminal or logged-in session of Hotel A trying to fetch Hotel B URL/ID.
- **Pitch**: "Here is the invisible engineering: ResortBrain is strictly multi-tenant. PostgreSQL Row-Level Security policies isolate tenant data at the database layer. Even if an attacker tampers with room UUIDs, cross-tenant reads return zero rows, and the violation is immediately logged to our immutable audit log."

### 3:30 - 4:00 (30s) — Manager Overview & Analytics [Speaker: Member 3]
- **Action**: Switch to Manager Control Center.
- **Pitch**: "Live metrics: Average fulfillment time (14 mins), active room occupancies, department ticket loads, and staff performance metrics without manual spreadsheets."

### 4:00 - 4:30 (30s) — Backend Architecture & Performance Benchmarks [Speaker: Member 1]
- **Action**: Show Architecture slide with Lighthouse Mobile 95+, 400ms order mutation p95.
- **Pitch**: "Modular monolith built on Next.js, Supabase Postgres, and transactional outbox queues. All prices, GST taxes, and discounts are computed server-side in minor units with idempotency keys preventing double charges."

### 4:30 - 5:00 (30s) — Seamless Guest Checkout & Business Vision [Speaker: Member 2]
- **Action**: Guest phone clicks 'View Bill & Settle', shows itemized GST invoice and printable receipt.
- **Pitch**: "One-click checkout, instant digital invoice, zero front-desk queue. Per-hotel subscription SaaS with tiered room limits. That is ResortBrain."

---

## 9 Prepared Judge Q&A Answers
1. **"How do you keep hotels' data separate?"** [Member 1]
   - *Answer*: PostgreSQL Row Level Security (RLS) on every table, with server-derived JWT tenancy and CI automated leakage tests.
2. **"Will it scale to hundreds of hotels?"** [Member 1]
   - *Answer*: Modular monolith on managed Postgres with composite indexes on `(hotel_id, created_at)`, cursor pagination, cached public menus, and scoped Realtime channels.
3. **"How do you prevent price tampering?"** [Member 1]
   - *Answer*: Prices and taxes are calculated exclusively on the server in integer minor units (paise). Client inputs contain only item IDs and quantities.
4. **"Why a PWA instead of a Native App?"** [Member 2]
   - *Answer*: Guests will never download an 80MB native app for a 2-day vacation; QR opens in 1 second. Staff get push notifications via modern PWA Web Push standards.
5. **"How does the business make money?"** [Member 2]
   - *Answer*: B2B SaaS subscription tiers based on room count and active staff seats, plus add-on usage modules.
6. **"What is your differentiation?"** [Member 2]
   - *Answer*: Ultra-fast guest experience coupled with real-time operational accountability and auto-escalation.
7. **"What if a notification is missed?"** [Member 3]
   - *Answer*: Delivery tracking tracks from dispatch to acknowledgment. Unaccepted tasks trigger background SLA escalation to senior staff and managers.
8. **"What would you build next?"** [Member 3]
   - *Answer*: AI concierge voice ordering, predictive housekeeping scheduling, and PMS/OTA direct integrations using our append-only event log.
9. **"How did 3 people build this so fast?"** [Member 3]
   - *Answer*: Contract-first engineering, strict vertical slices, shared design tokens, and daily integration syncs.
