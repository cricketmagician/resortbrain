# 09 · Build order, verification and Definition of Done

Build in this order. Each phase ends in **one focused commit**, and `main` must build and run after every one of
them (playbook: "after Day 5 main must always run the core flow"). Don't start a phase until the previous one
passes its checks.

## Phase 0: Orientation (no commit)

1. `git fetch origin && git checkout main && git pull`. Check whether M1's `feat/m1-platform-backend` or M3's
   `feat/m3-ops-control` have merged:

   ```
   git log --oneline origin/main -10
   git diff --stat origin/main origin/feat/m1-platform-backend
   ```

   If M1 has merged, the API routes exist, and `auto` mode will pick `api`.
2. `npm ci --legacy-peer-deps` (see doc 02 §5 for why).
3. Read these bundled Next.js docs, per `AGENTS.md`. They're all in `node_modules/next/dist/docs/01-app/`:
   - `01-getting-started/02-project-structure.md` (route groups, private folders)
   - `01-getting-started/04-linking-and-navigating.md` (prefetch, `pushState`)
   - `03-api-reference/03-file-conventions/{layout,page,route,loading,error,not-found,route-groups,dynamic-routes}.md`
   - `03-api-reference/03-file-conventions/01-metadata/` (manifest, icons, opengraph-image)
   - `03-api-reference/04-functions/{generate-static-params,generate-metadata,generate-viewport,image-response,use-search-params,use-router}.md`
   - `02-guides/{progressive-web-apps,preventing-flash-before-hydration,caching-without-cache-components,incremental-static-regeneration}.md`
   - `02-guides/client-side-data-fetching/swr.md`
   - `02-guides/upgrading/version-16.md`
4. Run `npm run dev` and open `/` to confirm the baseline works.

## Phases 1–12

| # | Phase | Scope (see the spec docs) | Commit message |
|---|-------|---------------------------|----------------|
| 1 | **Foundation** | `components/ui/tokens/tokens.css`, `components/ui/tokens/status.ts`, `app/globals.css` import, `app/layout.tsx` (fonts, theme boot script, metadata/viewport, dark default), `lib/cn.ts`, `lib/guest/{types,format,status,copy}.ts` (the kit and landing need them), `next.config.ts`, deps (`swr`, `qrcode`, `@types/qrcode`, `playwright-core`) | `feat(design): add shared dark-first tokens, fonts and theme boot` |
| 2 | **Guest kit** | The 8 components (doc 03 §6) and `/dev/guest-kit` | `feat(guest-kit): add the eight guest kit components and showcase` |
| 3 | **Seed content** | `db/seed/guest/guest_seed.ts` expansion (doc 07), `lib/guest/hotel-directory.ts`, `scripts/verify-seed-images.mjs` | `feat(seed): expand guest branding, menus and request presets` |
| 4 | **Data layer** | `lib/guest/{session,cart,idempotency,network}.ts`, `lib/guest/data/*`, `lib/guest/server/*`, `mock/guest/*`, unit tests for everything under `lib/guest` and `mock/guest`, `vitest.config.ts` (byte-identical to M1's, if missing) | `feat(guest): add guest data layer with live and mock adapters` |
| 5 | **Landing page** | `(marketing)` layout, page and sections, `components/marketing/*`, OG image, favicon and apple icon; **delete `app/page.tsx`** | `feat(landing): add dark premium landing page with live demo QR` |
| 6 | **Shell, QR entry and home** | `(guest)` layout, hotel layout, AppBar, BottomNav, providers, `/q/[token]`, `/h/[hotel]`, rejoin, not-found, error, SessionGate, OfflineBanner, DemoDataBadge | `feat(guest): add guest shell, QR entry and hotel home` |
| 7 | **Menu and cart** | `/menu` (SSG/ISR), the item sheet and item page, `/cart`, order placement with idempotency, CartBar | `feat(guest): add menu, item detail and cart with server-priced orders` |
| 8 | **Requests and tracking** | `/request`, `/activity`, `/orders/[id]`, `/requests/[id]`, LiveProvider, DelayNotice | `feat(guest): add service requests and live status tracking` |
| 9 | **Bill and receipt** | `/bill`, PaymentSheet, `/receipt/[id]`, print layouts (A4 and 80 mm), feedback | `feat(guest): add bill, test-mode payment, receipt and print layouts` |
| 10 | **PWA** | per-hotel manifest, root `app/manifest.ts`, icon routes, `public/sw.js`, SwRegistrar with update toast, InstallPrompt, `/offline` | `feat(guest): add PWA manifest, service worker and install prompt` |
| 11 | **Performance and QR sheet** | `scripts/perf/guest-budget.mjs`, the `perf:guest` / `verify:images` scripts, `/print/qr/[hotel]`, a performance pass (fix whatever the budget flags), Lighthouse reports in `docs/perf/` | `perf(guest): add budget script, Lighthouse reports and room QR sheet` |
| 12 | **Docs** | rewrite `docs/PRODUCT.md` (doc 08 §4), create `docs/m2/qa-log.md`, refresh doc 10 with anything learned | `docs(product): rewrite PRODUCT.md and add guest QA log` |

Commit bodies should say which shared files changed and why (for M1 and M3), and name the backlog issue number
(#6, #8, #10, #14, #16, #18, #22, #25, #28, #31, #33).

## Verification: run this at the end of every phase

```bash
npm run typecheck                 # tsc --noEmit, zero errors
npm run lint                      # eslint (next core-web-vitals + ts), zero errors
npx vitest run tests/unit/guest   # from phase 4 on
npm run build                     # must pass; read the route table: / , /h/[hotel], /h/[hotel]/menu static (○ / ●)
```

**Runtime check.** Use the `run` skill if it's available, otherwise do the same with Playwright:

1. `npm run build && npm start` (production mode, so the service worker and ISR behave for real).
2. With `playwright-core` (`executablePath: '/opt/pw-browsers/chromium'` if needed), visit every route touched in
   the phase at **360 × 800** and **1280 × 800**, in **dark** and **Sunlight**, and save screenshots to the
   session scratchpad (**never commit screenshots**).
3. Open each screenshot and check it against the spec: spacing, hierarchy, no overflow, no raw hex values, no
   broken states.
4. Walk the golden path in mock mode: `/` → "Try the live demo" → home → menu → add 2 items → cart → place
   order → tracking advances on its own (use `?sim=fast`) → request towels → activity → bill → pay → receipt →
   print preview → feedback.
5. Exercise failures: add `?chaos=1` and confirm every error state renders with a working retry. Try an invalid QR
   (`/q/NOPE_123`), a vacant room (`/q/QR_AZURE_105`), and offline (`context.setOffline(true)`).
6. Check the browser console on every page: **zero errors, and zero hydration warnings.**

**Sandbox notes:**

- `images.unsplash.com` is blocked in this environment, so remote photos show the fallback tile locally. That's
  expected. Don't swap in other image hosts or base64 blobs.
- Google Fonts and the npm registry are reachable.
- `next dev` may re-write the managed block in `AGENTS.md`. If that shows up in `git status`, commit it with your
  work, as the file itself instructs.

## Git workflow

- The target is **`main`** on `cricketmagician/resortbrain`, as the user asked. Before each push, run
  `git fetch origin && git rebase origin/main`, then re-run the verification.
- **If a push to `main` is rejected** (branch protection), push the same commits to `feat/m2-guest-commerce` and
  open a PR into `main` with the repo's PR template (`.github/pull_request_template.md`). Fill in every checklist
  line honestly.
- Conventional Commits, and keep each commit focused. Don't mix M2 work with edits to M1 or M3 internals.
- **Merge conflicts** with M1 or M3:
  - `package-lock.json`: re-run `npm install --legacy-peer-deps`. Never hand-edit it.
  - `app/globals.css`: keep both sides. The token import and M1's rules can coexist.
  - `app/page.tsx` (M1 changed it, M2 deleted it): M1's console moves to its own route. See doc 10 §1. Don't
    resolve it by keeping two pages for `/`.

## Final Definition of Done (M2)

**Product**

- [ ] All 8 guest screens, the landing page, the print layouts, the re-entry and offline screens, and the QR print
      sheet are built to spec (doc 04).
- [ ] The golden path works end to end in mock mode, and in api mode if M1 has merged, for **both** hotels, with no
      data crossing between them.
- [ ] Every screen has loading, empty, error, expired-token, slow-network and offline states, and each one has
      been screenshotted and reviewed.

**Quality bars**

- [ ] The client never computes money (the doc 02 §7 grep passes), and every amount shown is a server value.
- [ ] Tokens and kit only: the doc 03 §8 hex grep passes, and there are no one-off buttons, cards or badges.
- [ ] 360 px works on Android Chrome and iPhone Safari, targets are ≥ 44 px, and Sunlight mode is readable
      outdoors.
- [ ] Performance budgets pass (`npm run perf:guest`). Lighthouse mobile ≥ 90 Performance and ≥ 95 Accessibility
      on the guest pages, and ≥ 95 across the board on the landing page. Reports are in `docs/perf/`.
- [ ] `typecheck`, `lint`, guest unit tests and `build` are all green. There are no console errors or hydration
      warnings.

**Handoffs and docs**

- [ ] The PWA installs on Android and iPhone, the menu works offline after one visit, and the update toast works.
- [ ] The E2E test IDs are exported from `components/guest/test-ids.ts`, and M3 has been told they exist.
- [ ] `docs/PRODUCT.md` has been rewritten, `docs/m2/qa-log.md` exists, and doc 10 lists every open contract
      request.
