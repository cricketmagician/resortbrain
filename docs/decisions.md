# Architecture Decision Records (ADRs) & Team Agreements

## Team Agreement & Ledger Record
- **Team**: 3-Member Integrated Execution Team
  - **Member 1 (Senior Platform & Backend Lead)**: Schema, security, RLS, server actions, billing, outbox, push server, deploy.
  - **Member 2 (Equal Co-Lead: Guest & Commerce)**: 8 guest screens, guest PWA, guest kit, landing page, guest seed content, performance captain.
  - **Member 3 (Equal Co-Lead: Operations & Control)**: 8 ops screens, staff realtime & push UX, ops kit, pricing page, ops seed content, QA/E2E captain.
- **Fixed Name Order (Coin Toss Result)**:
  1. Member 1 (Platform & Backend Lead)
  2. Member 2 (Co-Lead: Guest & Commerce)
  3. Member 3 (Co-Lead: Operations & Control)
- **One-Sentence "Who Did What"**:
  - **Member 1**: Engineered the secure multi-tenant core, Postgres RLS isolation, server-side billing/tax engines, and event-driven outbox push notification pipeline.
  - **Member 2**: Designed and built the high-speed Guest PWA, instant QR-to-order flow, live order tracker, and seamless mobile commerce experience.
  - **Member 3**: Built the real-time staff workspaces (kitchen, front desk, housekeeping), manager command dashboard, audit logs, and E2E validation suite.

---

## ADR 001: Multi-Tenant Architecture & Data Isolation
- **Context**: The platform hosts multiple hotels. A breach or leak of Guest A at Hotel 1 seeing Hotel 2 data is catastrophic.
- **Decision**: Multi-tenancy is enforced in the database via PostgreSQL Row-Level Security (RLS) on all hotel-scoped tables using `hotel_id`. The client NEVER passes `hotel_id` as an untrusted parameter; it is derived strictly from the authenticated user's session JWT or validated short-lived guest stay token.
- **Consequences**: Cross-tenant leak tests are run in CI for every table. Direct client database access is constrained by RLS policies.

---

## ADR 002: Server-Authoritative Pricing and Money
- **Context**: Attackers or malicious clients can modify cart prices in request payloads.
- **Decision**: Money is strictly integer minor units (paise / cents). Prices, taxes (e.g., GST), service charges, and discounts are re-calculated exclusively on the server from the menu catalog. Clients only submit `{ itemId, quantity, modifierIds }`.
- **Consequences**: Zero client-side price tampering is possible. Idempotency keys protect all payment mutations.

---

## ADR 003: Push Notifications via Web Push (VAPID) & Outbox Pattern
- **Context**: Kitchen staff and front desk may close the tab or turn off screen on phones/tablets. SMS/WhatsApp adds per-message cost and third-party friction.
- **Decision**: Standard Web Push API with VAPID keys handled via Service Worker. The backend uses a Transactional Outbox table (`outbox_events`) to decouple fast UI mutations from push delivery retries and SLA escalation timers.
- **Consequences**: Works on Android Chrome and iOS Safari (via Add to Home Screen PWA). Zero third-party SMS bills.

---

## ADR 004: Event Catalog & State Machines
- **Context**: Complex transitions across Stays, Orders, and Service Requests must remain auditable and crash-resilient.
- **Decision**: Strict state machines validated with Zod schemas. Every state transition appends an immutable event log row (`order_events`, `request_events`, `audit_logs`). Realtime channels broadcast lightweight `{ id, status }` signals to trigger scoped client refetches.
