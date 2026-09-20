# Quality process

This project didn't have any automated verification through Phase 4 — every
change was checked by hand (import resolution, brace balance, export
matching, via one-off scripts). That doesn't scale and it doesn't catch
logic bugs. This document is the replacement: a real, repeatable process,
plus the tooling that runs it.

## The pipeline (`npm run <script>`)

Run in this order — each step catches a different class of problem, and
later steps assume earlier ones passed:

| Step | Command | Catches |
|---|---|---|
| 1. Lint | `npm run lint` | Unused vars/imports, hook rule violations, `any` usage, stray `console.log` |
| 2. Type check | `npm run typecheck` | Wrong types, mismatched props, typos in property names |
| 3. Test | `npm run test` | Logic bugs — the things lint/types can't see (see below) |
| 4. Build | `npm run build` | Anything that only breaks in a production bundle |

`.github/workflows/ci.yml` runs all four automatically on every push and
pull request. **Nothing here requires network access to verify locally
except `npm install` itself** — once dependencies are installed, all four
commands run fully offline.

## What's actually tested, and why those things specifically

Coverage is deliberately concentrated on the highest-risk logic rather than
spread thin over everything:

- **`src/lib/__tests__/leveling.test.ts`** — the XP→level curve. A single
  off-by-one here silently mis-levels everyone.
- **`src/lib/jarvis/__tests__/suggestionRules.test.ts`** — the proactive
  suggestion engine: priority ordering, the dismissal filter, the
  result cap (the actual anti-spam mechanism), and that tone variants
  really do produce different text.
- **`src/lib/__tests__/storage.test.ts`** — the two-hop data migration
  (original prototype → Phase 0 → IndexedDB) against a real
  `fake-indexeddb`, not a mock. This is the single riskiest piece of code
  in the project: a bug here means silent data loss on upgrade, which a
  person might not notice until it's too late to matter.
- **`src/lib/__tests__/time.test.ts`** — the overdue-task boundary logic
  (date-only vs. date+time comparisons are an easy off-by-one).
- **`src/store/__tests__/useHabitsStore.test.ts`**,
  **`useProgressStore.test.ts`** — streak/weekly-progress/peak-streak/
  best-day date arithmetic, using fake timers so "today" is controlled
  rather than depending on when the test happens to run.

Not yet tested: component rendering (no `@testing-library/react` tests
exist yet, though the dependency is installed and `src/test/setup.ts` is
ready for them), the AI client, and the service worker. Adding a
render-level test the next time a component's logic gets non-trivial
(conditional rendering, form validation) is a reasonable bar — not
everything needs one on day one.

## Before shipping a new phase

1. Run all four pipeline steps locally.
2. If a new store or module was added, re-check `main.tsx`'s hydration
   list — a store without a `hydrate()` call there will silently show
   stale/empty state on first load (see `PHASE_ROADMAP.md`'s Phase 1
   handoff notes for why).
3. If new user-facing text was added, sanity-check it renders in all 4
   assistant tones if it goes through `suggestionRules.ts`.
4. If a new interactive element was added, confirm: it has an accessible
   name (visible label or `aria-label`), keyboard focus works, and it
   isn't color-only signal (see existing components for the pattern —
   `IconButton`'s `label` prop is required, not optional, on purpose).
