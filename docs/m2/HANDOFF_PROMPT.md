# Handoff prompt for the implementing model

Paste everything inside the fence below as the first message of a new Claude Code session that has the
`cricketmagician/resortbrain` repository attached.

```text
You are implementing Member 2's half of ResortBrain, a multi-tenant hotel operations SaaS built as a
3-member team project. I am Member 2: Co-Lead, Guest and Commerce Experience. Build ONLY my scope.
Member 1 (platform/backend) and Member 3 (operations/staff screens) are building their own parts in parallel.

The complete, approved specification is already in the repo under docs/m2/. It is the source of truth.
Do not redesign it, do not skip parts of it, and do not build anything outside it.

STEP 1: READ BEFORE CODING
1. git fetch origin && git checkout main && git pull
2. Read, in full and in order:
   docs/m2/README.md
   docs/m2/01-scope-and-ownership.md
   docs/m2/02-architecture.md
   docs/m2/03-design-system.md
   docs/m2/04-screens.md
   docs/m2/05-data-layer.md
   docs/m2/06-pwa-performance-a11y.md
   docs/m2/07-seed-content.md
   docs/m2/08-copy-deck.md
   docs/m2/09-build-order.md
   docs/m2/10-integration-notes.md
   Also read docs/PRODUCT.md, docs/DESIGN.md, docs/decisions.md, .github/CODEOWNERS,
   modules/menu/*, server/db.ts, db/seed/guest/guest_seed.ts and db/seed/ops/ops_seed.ts.
3. This repo uses Next.js 16.3 with React 19.2 and Tailwind v4. AGENTS.md requires reading the bundled docs in
   node_modules/next/dist/docs/ before writing code. Install first with `npm ci --legacy-peer-deps`, then read the
   guides listed in docs/m2/09-build-order.md, Phase 0. Remember:
   - params and searchParams are Promises
   - error.tsx receives { error, retry } (not reset)
   - Cache Components stays OFF: use `export const revalidate` + generateStaticParams
   - useSearchParams in a static page needs a <Suspense> boundary
   - images use remotePatterns
4. Check whether M1's branch (origin/feat/m1-platform-backend) has merged into main. docs/m2/05-data-layer.md §1
   lists the API contract as it stood on 26 Sep 2026. If M1 has changed it, update only the mapping in
   lib/guest/data/http.ts.

STEP 2: BUILD, PHASE BY PHASE
Follow docs/m2/09-build-order.md phases 1 to 12 exactly, in order, one focused Conventional Commit per phase.
After every phase:
- run: npm run typecheck && npm run lint && (from phase 4) npx vitest run tests/unit/guest && npm run build
- start the production build and screenshot every touched route with Playwright (Chromium is preinstalled at
  /opt/pw-browsers), at 360x800 and 1280x800, in dark and in Sunlight mode. Look at every screenshot and fix
  anything that doesn't match the spec before moving on. Screenshots go to the scratchpad; never commit them.
- walk the golden path in mock mode, and the failure paths with ?chaos=1 (doc 09).
Do not start the next phase while anything is red.

NON-NEGOTIABLE RULES
- Scope: only the files and folders marked as M2's in docs/m2/01 and docs/m2/02. Never edit server/, modules/,
  db/migrations/, app/api/, db/seed/ops/, or M3's folders. The shared files listed in docs/m2/02 §5 get minimal,
  additive edits only.
- Money: the client NEVER computes money. Show only server-returned paise values, formatted with
  lib/guest/format.ts. The only exception is the mock server simulator in mock/guest/server-sim.ts.
- Design: dark-first, premium, quiet luxury (docs/m2/03). The landing page at "/" is ALWAYS dark. The guest app
  starts dark and has a Sunlight toggle. Use tokens and the guest kit only: no raw hex values in components, no
  one-off buttons or cards, no UI, animation or state libraries. The only new runtime deps are swr and qrcode.
- Every screen ships with loading, empty, error, expired-session, slow-network and offline states, 44px+ tap
  targets, and full keyboard and screen-reader support.
- Performance: meet the budgets in docs/m2/06 §4. Server Components by default, small client islands.
- Honesty: no fabricated customers, statistics or reviews. Mock mode shows the "Demo data" badge.
- Security: never put the stay token in a URL (after /q/), in logs or in share text. Never send hotelId, prices,
  roles or slaMinutes from the guest client.
- Copy comes from docs/m2/08. Don't invent strings.
- Images: images.unsplash.com is blocked in this sandbox. Keep the existing seed image URLs, give new menu items
  no image_url, and make sure the designed plate-tile fallback looks intentional. Don't substitute other image
  hosts.

GIT
- I want this work on the main branch of cricketmagician/resortbrain. Before every push:
  git fetch origin && git rebase origin/main, then re-verify.
- If pushing to main is rejected by branch protection, push the same commits to feat/m2-guest-commerce and open a
  pull request into main using .github/pull_request_template.md. Fill its checklist truthfully.
- Resolve conflicts as described in docs/m2/09 (Git workflow). Never delete or overwrite teammates' work to make a
  conflict go away. If M1's app/page.tsx collides with the landing page, stop and tell me.

WHEN YOU FINISH
Give me:
1. what was built, phase by phase, with commit hashes
2. the verification results (typecheck, lint, tests, build, budget script, Lighthouse scores)
3. anything that is not done or not verified, and why
4. the open contract requests from docs/m2/10 that I should send to Member 1 and Member 3
Keep it short and honest. If something failed, say so plainly with the output.
```

## Tips for running it

- **Model:** use the strongest coding model you have for the implementing session. The spec is long, and the
  quality of the UI depends on following it closely.
- **Budget:** the build is 12 phases. If the session runs out of room partway, start a new session with the same
  prompt plus "Continue from phase N". Each phase is committed, so no work is lost.
- **Real devices:** phases 10–11 end with checks only a human can do (a real Android phone, a real iPhone, an
  outdoor sunlight check, scanning a printed QR). Do those yourself and log them in `docs/m2/qa-log.md`.
- **Photos:** on your own laptop, run `npm run verify:images`, then add verified Unsplash URLs for the new menu
  items (doc 07 §3).
