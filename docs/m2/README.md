# Member 2 build plan: Guest and Commerce Experience

**Owner:** Member 2 (Co-Lead, Guest and Commerce)
**Source of truth:** *Hotel SaaS 3-Member Playbook v3.0* (26 Sep 2026), sections 2, 3 (Member 2 page), 4, 5, 8, 9, 10, 12, A
**Repo:** `cricketmagician/resortbrain` · Next.js 16.3.6 · React 19.2 · Tailwind v4 · Zod 4 · TypeScript strict
**Status:** Plan approved for implementation. Nothing in this folder is code; it's the spec the implementing model builds from.

---

## What this folder is

This folder is the full implementation spec for **everything Member 2 owns, and nothing else**. The work is split
into numbered documents. Read them in order before writing code. Each one ends with its own acceptance checklist.

| # | Document | What it decides |
|---|----------|-----------------|
| 01 | [Scope and ownership](01-scope-and-ownership.md) | Exactly what M2 builds, what M2 must not touch, the 11 backlog issues |
| 02 | [Architecture](02-architecture.md) | File tree, route map, rendering strategy, shared-file edits, dependencies, env vars |
| 03 | [Design system](03-design-system.md) | Dark-first tokens (ready-to-paste CSS), type, motion, the 8 guest-kit components and their APIs |
| 04 | [Screens](04-screens.md) | The 8 guest screens, the landing page, the print layouts, the re-entry and offline screens |
| 05 | [Data layer and contracts](05-data-layer.md) | Types, the adapter (live API or mock), realtime, session, cart, money, errors, idempotency, contract asks for M1 |
| 06 | [PWA, performance, accessibility, security](06-pwa-performance-a11y.md) | Manifest, service worker, install prompt, budgets, Lighthouse, a11y, privacy |
| 07 | [Seed content](07-seed-content.md) | Hotel branding, menus and prices, photos, room QR codes for both hotels |
| 08 | [Copy deck and PRODUCT.md](08-copy-deck.md) | Voice, every status and state string, PRODUCT.md outline |
| 09 | [Build order and verification](09-build-order.md) | Phase-by-phase tasks, commit plan, verification commands, Definition of Done |
| 10 | [Integration notes for M1 and M3](10-integration-notes.md) | Conflicts to expect, contract requests, shared files (send this to teammates) |
| — | [HANDOFF_PROMPT.md](HANDOFF_PROMPT.md) | The copy-paste prompt that starts the implementing model |

## The product in one paragraph

A guest scans the QR code in their room. In about two seconds a hotel-branded app opens, with no install and no
sign-up. They browse the menu, order food, or ask for towels in two taps, then watch the status update live:
*Order placed → Accepted → Being prepared → Ready → Delivered*. At the end of the stay they open the bill, pay in test
mode and get a receipt they can print. The first thing anyone sees on the marketing site is a **dark, premium
landing page** that sells this and lets a judge scan a live demo QR with their own phone.

## Decisions already made (don't reopen these)

1. **Dark mode first.** The landing page is always dark. The guest app starts dark, and a one-tap **Sunlight mode**
   (high-contrast light theme) covers the playbook's "readable in sunlight" requirement. Print layouts are always
   light.
2. **The client never computes money.** Every price, tax, service charge and total on screen is a value the server
   returned. The UI only formats values with `Intl.NumberFormat`; it never adds or multiplies them.
3. **One data layer.** Every guest read and write goes through `lib/guest/data`. It talks to M1's API when that's
   available and falls back to a typed, clearly-badged mock when it isn't, so the UI never waits on the backend.
4. **Contract-first.** M2 consumes M1's contracts from `modules/*/schema.ts` and `app/api/*`. M2 doesn't edit
   `server/`, `modules/`, `db/migrations/` or `app/api/`. Anything the guest UI needs from them goes into
   [10-integration-notes.md](10-integration-notes.md) as a contract request.
5. **Lean by default.** Server Components everywhere except small client islands. No UI framework, no animation
   library and no state library. The only new runtime dependencies are `swr` and `qrcode`.
6. **Premium means restraint.** Warm ivory on deep midnight, one champagne-gold accent, Playfair Display for
   display type and Inter for everything else. Generous spacing, 150 ms motion, and real content in every empty,
   loading and error state.

## Git target

The user asked for M2's work to land on **`main`** of `cricketmagician/resortbrain`. Commit in small,
Conventional-Commit, M2-scoped slices (see [09-build-order.md](09-build-order.md)). If branch protection rejects a
direct push to `main`, push the same commits to `feat/m2-guest-commerce` and open a PR into `main`.
