# 01 · Scope and ownership

## 1. The M2 ledger (from the playbook's fairness charter)

M2 builds exactly these items. The count has to stay equal to M3's, so don't add surfaces that aren't listed here.

| Area | M2 items | Count |
|------|----------|-------|
| Product screens | QR entry · Hotel home · Menu · Item detail and cart · Service request · Order tracking · Bill and payment · Receipt and feedback | 8 |
| Guest half of the component kit | Button · Input · Card · Sheet · Toast · Skeleton · Status timeline · Menu item card | 8 |
| Public and print pages | Landing page · Receipt and invoice print layout | 2 |
| Seed content (both hotels) | Hotel branding · Menus and prices · Photos and room QR codes | 3 |
| Project document | `docs/PRODUCT.md` | 1 |
| Hats | Performance Captain · Demo and Story Captain | 2 |
| Pitch | Slides 1–6, 2:00 of the demo, 3 judge questions | — |

Also in M2's scope, because the playbook assigns them to this role:

- **Guest PWA:** manifest, install prompt, service-worker caching of the public menu and hotel config, and a
  friendly re-entry screen for expired or revoked stay tokens.
- **Guest realtime wiring:** subscribe to `stay:{stay_id}`, with optimistic UI, retry and error states.
- **Guest test IDs** that M3's Playwright suite can target.
- **Performance budgets** and a Lighthouse report for the pitch.

## 2. Folders M2 owns (from `.github/CODEOWNERS`)

```
app/(guest)/                      @m2    all guest routes
components/guest/                 @m2    guest-specific components
components/ui/guest-kit/          @m2    the 8 kit components
components/ui/tokens/             @m2 @m3 shared tokens (M3 must review)
app/(marketing)/landing/          @m2    landing sections live here (private _components)
db/seed/guest/                    @m2 @m1 guest seed content
docs/                             @m2 @m3 PRODUCT.md (M2), this plan
```

Folders M2 creates that have no CODEOWNER yet; they're M2's by convention and documented here:

```
lib/guest/                        guest data layer, session, cart, formatting (client + server helpers)
mock/guest/                       typed mock fixtures and the server simulator (playbook: "mock/  M2/M3")
tests/unit/guest/                 unit tests for the guest data layer
scripts/perf/                     guest performance budget script (Performance Captain)
```

## 3. What M2 must not touch

| Path | Owner | If the guest UI needs a change there |
|------|-------|--------------------------------------|
| `server/**`, `modules/**`, `db/migrations/**`, `app/api/**` | M1 | Add a contract request to [10-integration-notes.md](10-integration-notes.md) and work around it in `lib/guest/data` |
| `db/seed/ops/**`, `db/seed/runner.ts` | M3 / M1 | Import the data read-only; never edit it |
| `app/(staff)/**`, `app/(admin)/**`, `components/staff/**`, `components/ui/ops-kit/**` | M3 | Use M3's kit components if they exist, never edit them |
| `app/(marketing)/pricing/**` | M3 | Link to `/pricing` only |
| `tests/e2e/**` | M3 | Give M3 the test IDs (doc 06 §7) |
| `.github/**` | M1 | — |

**Shared files M2 has to edit.** Keep each change minimal and additive, and call it out in the commit body:
`app/layout.tsx` (fonts, theme script, metadata base), `app/globals.css` (import tokens), `next.config.ts` (images,
service-worker headers), `package.json` / `package-lock.json` (new deps), and deleting the `app/page.tsx`
placeholder. Details are in [02-architecture.md §5](02-architecture.md#5-shared-files-m2-edits).

## 4. M2's 11 backlog issues (playbook appendix) → where they're specified

| # | Issue | Priority | Spec |
|---|-------|----------|------|
| 6 | PRODUCT.md, guest wireframes and Figma for the guest flow | P0 | 08 §4 (PRODUCT.md), 04 (wireframe-level layouts) |
| 8 | Guest half of the component kit v1 (8 components) | P0 | 03 §6 |
| 10 | Guest shell, QR route, hotel home on mock data | P0 | 04 §2–§4, 05 |
| 14 | Guest request UI and live status timeline | P0 | 04 §7–§8, 05 §6 |
| 16 | Guest seed content: branding, menus, prices, photos, room QR codes | P0 | 07 |
| 18 | Menu SSR, item detail, cart and order UI (server priced) | P0 | 04 §5–§6, 05 §7 |
| 22 | Guest PWA: manifest, service-worker cache, install prompt | P0 | 06 §1–§3 |
| 25 | Bill view, pay flow, receipt and print layout | P1 | 04 §9–§10, §12 |
| 28 | Feedback and rating, landing page | P1 | 04 §10, §13 |
| 31 | Lighthouse CI, bundle budget and performance pass | P0 | 06 §4–§5 |
| 33 | Mobile QA on real Android and iPhone, fix list | P0 | 06 §6, 09 §5 |

(#35 demo script, deck and backup video is shared with M3. The code side of it is covered by the landing page's
demo QR and the seed QR print sheet.)

## 5. Guest-side Definition of Done (from the playbook, verbatim intent)

- Every guest screen has **loading, empty, error, expired-token and slow-network** states.
- Everything works at **360 px** wide on Android Chrome and iPhone Safari. Tap targets are at least **44 px** and
  text is readable in sunlight.
- Every guest screen is built **only from tokens and the shared kit**.
- **Price, tax and totals are always server-returned values.** The client never computes money.
- Realtime status updates reach the guest screen (target < 1 s after the server event when Realtime is on, and one
  poll interval when polling is the fallback).
- First interaction in **under 2 s on 4G**, Lighthouse mobile **≥ 90** for Performance and Accessibility on guest
  screens.
