# 🪼 Jelly — AI-Powered Personal OS

A Jarvis-style personal operating system — tasks, notes, reminders, and an AI
assistant, built local-first with an offline-capable PWA shell.

This drop covers **Phase 0** (React/TypeScript foundation, existing features
ported, original prototype's bugs fixed), **Phase 1** (data layer moved to
IndexedDB), and **Phase 2** (Calendar, Habit Tracker, Goals, and Focus Mode
are now real modules, and the Dashboard surfaces all of them). Later phases
(see `PHASE_ROADMAP.md`) add a secure AI backend, the actual proactive
"Jarvis" intelligence layer, real push notifications, voice, and cloud sync.

## Quality

```bash
npm run lint       # unused code, hook rules, stray console.log
npm run typecheck  # type errors
npm run test       # logic tests (leveling, suggestion engine, data migration, streaks)
npm run build      # full production build
```

All four run automatically on every push via `.github/workflows/ci.yml`.
See `QUALITY.md` for what's actually covered and why, plus a short checklist
to run through before shipping a new phase.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview
```

## What's here in Phase 0

- **Tasks, Notes, Reminders (Alarms), Study Assistant chat, Pomodoro timer** —
  all ported from the original app, same behavior, now as typed React
  components with persisted state (Zustand + localStorage).
- **Dashboard** with today's progress, quick actions, today's habit
  check-ins, goal progress, and a merged view of today's tasks/events.
- **Calendar**: month grid combining task due dates and standalone events,
  with a day-detail panel and quick event creation.
- **Habit Tracker**: weekly-target habits with a one-tap daily check-in,
  weekly progress dots, and streak counting.
- **Goals**: longer-term goals with an optional milestone checklist and
  progress bar.
- **Focus Mode**: the Pomodoro timer's new home, with a daily completed-
  session count.
- **Progress & Levels**: XP for real completions (tasks, habits, focus
  sessions, goal milestones), a level curve, a daily streak, and peak
  personal records — shown prominently at the top of the Dashboard. See the
  design note in `PHASE_ROADMAP.md` for what's deliberately left out.
- **Proactive assistant (Jarvis layer)**: a rule-based suggestion engine
  reads real app state (overdue tasks, upcoming deadlines, unchecked habits,
  inactivity, streaks) and surfaces up to 3 priority-ranked, tone-adjusted
  suggestions — on the Dashboard and the Assistant page. Runs entirely
  client-side, no AI API key required. Dismiss one and it won't reappear
  until tomorrow.
- **Secure AI backend (optional)**: a Firebase Function (`functions/`) holds
  the Gemini key server-side behind App Check, so it never reaches the
  browser. Deploy it (`functions/README.md`) and the app switches to it
  automatically; skip it and the local dev-key client in Settings still
  works exactly as before.
- **Real notifications**: the single most important suggestion of the
  moment can arrive as an actual browser notification — capped at 3/day,
  respecting configurable quiet hours, reusing the same rule engine the
  in-app panel uses. Works while the browser is open or backgrounded; true
  closed-app push needs cloud sync (Phase 7) first — see `PHASE_ROADMAP.md`
  for why.
- **Settings** — profile name, assistant tone, focus-timer length,
  learning/notifications opt-ins, a local Gemini API key field, and data
  export/import for backup.
- **Sidebar + mobile bottom nav** in place of the original horizontal tab bar,
  so the remaining modules (Calendar, Habits, Goals, Focus Mode, Analytics)
  have somewhere to go as they land — each currently shows a "coming in
  Phase N" placeholder rather than a broken link.
- **A working PWA**: manifest is linked, a real icon set is included, and the
  service worker is actually registered (it wasn't in the original).
- **Legacy data migration**: if this replaces the original app (or a Phase 0
  build) in the same browser, existing tasks/notes/alarms are copied forward
  automatically on first load — first into the Phase 0 localStorage schema,
  then into IndexedDB. Both steps run once and are safe to no-op on repeat
  visits.
- **IndexedDB data layer (Phase 1)**: all persisted data now lives in
  IndexedDB via Dexie rather than localStorage, which removes the ~5MB
  localStorage ceiling that would have bitten Habits/Analytics history in
  later phases. The app briefly shows a splash screen on load while this
  hydrates (typically under 100ms) — see `PHASE_ROADMAP.md` for how this
  works if you're adding a new persisted store.

## What was fixed from the original prototype

- **Stored XSS**: task titles and note content were injected via `innerHTML`
  with no escaping. Everything now renders through JSX, which escapes text by
  default.
- **PWA didn't actually work**: the manifest was never linked in `<head>`, and
  the service worker file existed but was never registered — so the app
  wasn't installable despite looking like a PWA. Both are fixed and the
  manifest now includes real, correctly-sized icons instead of a third-party
  SVG.
- **Broken AI calls**: the original shipped with a hardcoded empty API key.
  The assistant now reads a key from Settings; see the security note below.
- **Lost chat history**: conversations lived only in a JS variable and reset
  on every refresh. They're now persisted like everything else.
- **One 998-line file**: split into modules, components, hooks, and stores
  with a single-responsibility folder structure (see below).

## ⚠️ About the AI Assistant's API key

The Gemini key you paste into Settings is used directly from the browser and
stored only in this browser's `localStorage`. That's fine for personal,
single-user local use — it's the same trust model as the original prototype
— but it is **not safe to deploy publicly**: anyone with dev tools open can
read the key out of a page you control. Phase 3 of the roadmap replaces this
with a Firebase/Supabase server-side function that holds the key instead;
the `AiClient` interface in `src/lib/ai/types.ts` is designed so that swap
doesn't require touching any component.

## Project structure

```
src/
  app root:        App.tsx, main.tsx, index.css
  components/
    layout/         Sidebar, TopBar, MobileNav, AppShell, nav config
    ui/              Button, Modal, Card, ProgressBar, Toast, EmptyState...
  modules/           one folder per feature (tasks, notes, reminders,
                     assistant, dashboard, settings, placeholders)
  store/             Zustand stores — one per domain, each persists itself
  lib/
    storage.ts        typed localStorage read/write + legacy migration
    ai/                 pluggable AI client interface + dev implementation
    time.ts, id.ts      small shared utilities
  types/             shared domain types (Task, Note, Alarm, Settings...)
public/
  manifest.webmanifest, sw.js, offline.html, icons/
```

Each module folder is self-contained (page + its own modal + child
components) so adding Calendar or Habits later means adding a new folder,
not editing existing ones.

## Design system

Dark, instrument-panel aesthetic (deep navy base, electric-cyan accent,
amber for priority/warnings) with a recurring "assistant orb" motif — the
same ringed mark as the app icon — used as the assistant's visual presence
throughout. Type: Space Grotesk for headings, Inter for body text,
JetBrains Mono for clocks/timers/data. ---

## 👤 Author

**Koduru Paka Sai Mani Deep**  
GitHub: [@kodurupakasaimanideep](https://github.com/kodurupakasaimanideep)  
Repo: [github.com/kodurupakasaimanideep/Jelly-](https://github.com/kodurupakasaimanideep/Jelly-)
