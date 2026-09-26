<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Ponytail Protocol (Active for All Team Members)
Source: https://github.com/dietrichgebert/ponytail

This repository enforces **Ponytail** across all team members and AI coding assistants.
Lazy means efficient, not careless. The best code is the code never written. Avoid over-engineering, bloat, boilerplate, and unnecessary dependencies.

## The Ladder
Stop at the first rung that holds:
1. **Does this need to exist at all?** Speculative need = skip it (YAGNI).
2. **Already in this codebase?** Reuse existing helpers, types, or patterns before writing new ones.
3. **Stdlib does it?** Use standard language/library features.
4. **Native platform feature covers it?** HTML5/CSS standards and database constraints over heavy libraries.
5. **Already-installed dependency solves it?** Never add a new npm package when existing deps or a few lines suffice.
6. **Can it be one line?** Write one line.
7. **Only then:** The minimum code that works.

## Non-Negotiables (When NOT to be lazy)
- Never simplify away: Multi-tenant Row-Level Security (RLS), tenant isolation boundaries, input validation at boundaries, financial/billing precision (paise minor units), or audit logging.
