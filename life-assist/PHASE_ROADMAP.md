[text](../../ultron-by-sagar-builds-main)# LifeAssist Phase Roadmap

| Phase | Goal | Status |
|---|---|---|
| 0 | React/Vite/TS scaffold, port existing features, working PWA | ✅ done |
| 1 | Local-first data layer: IndexedDB (Dexie), schema versioning, sync-ready adapters | ✅ done (this drop) |
| 2 | Core module expansion: Calendar, Habit Tracker, Goals, Focus Mode, richer Dashboard | ✅ done (this drop) |
| 3 | AI backend: Firebase Functions/Supabase Edge proxy so API keys never reach the client | ✅ done (this drop) — Firebase Functions implementation |
| 4 | Jarvis intelligence layer: context builder (time, deadlines, habits, inactivity), proactive suggestions, tone-adjustable messages, opt-in memory | ✅ rule-based core done — opt-in memory not yet built |
| 5 | Real notifications: Notification API + Web Push, priority-based scheduling, anti-spam | ✅ done for foreground/backgrounded use (this drop) — true closed-app push needs Phase 7 first, see handoff notes |
| 6 | Voice: Web Speech API STT/TTS first, provider APIs as an upgrade path | ✅ done (this drop) — Web Speech API STT/TTS |
| 7 | Cloud sync: Firebase/Supabase auth + multi-device sync, conflict resolution | ✅ done (this drop) — Firebase Auth + Firestore Multi-device Sync |
| 8 | Analytics & insights: productivity history, AI daily/weekly summaries | ✅ done (this drop) — XP Charts + AI Productivity Reviews |
| 9 | Polish: accessibility audit, animation pass, performance pass, install-flow polish | ✅ done (this drop) — PWA Install + a11y + Lazy Loading |

## Notes for whoever picks this up next

- The `AiClient` interface (`src/lib/ai/types.ts`) is the seam for Phase 3 —
  implement a new class that calls your backend instead of Gemini directly,
  and swap it in `useAssistantStore.getClient()`. No component changes needed.
- `NAV_ITEMS` in `components/layout/nav.ts` already lists every module,
  including ones that don't exist yet (`comingSoon: true`). Building a new
  module means: add a folder under `src/modules/`, add a route in `App.tsx`,
  and flip `comingSoon` off in `nav.ts`.

### Phase 1 handoff (data layer)

- Storage now lives in IndexedDB via Dexie (`src/lib/storage.ts`), in a
  single `kv` table keyed by name — deliberately schema-light, so Phase 1
  didn't force a relational redesign. `readJSON`/`writeJSON` keep the exact
  same signatures as Phase 0; stores didn't need to change how they read or
  write, only how they *initialize*.
- Because IndexedDB is async and Zustand stores previously read
  `localStorage` synchronously at module-load time, every store now has a
  `hydrate()` action that re-syncs its state from the cache. `main.tsx`
  awaits `hydrateStorage()`, calls every store's `hydrate()`, *then* renders
  the real app — a `LoadingScreen` covers the (typically sub-100ms) gap.
  **If you add a new persisted store, give it a `hydrate()` action and add
  it to the list in `main.tsx`, or its initial state will be stale.**
- Migration is two-hop and automatic: original prototype's flat
  `lifeassist_tasks` etc. keys → Phase 0's namespaced `lifeassist:*`
  localStorage keys → IndexedDB. Both hops are idempotent and only run once
  each (guarded by a marker row in IndexedDB).
- Settings → "Export/Restore backup" now reads/writes IndexedDB via
  `exportAllData`/`importAllData` in `storage.ts` instead of raw
  `localStorage` access.
- Next natural step for Phase 1-adjacent work: give the Dexie schema real
  tables (`tasks`, `notes`, `alarms`...) instead of one generic `kv` table,
  once a module needs to query rather than just load-everything (e.g.
  Analytics history in Phase 8, or Calendar date-range queries in Phase 2).
  Not needed yet — the KV shape is intentionally the simplest thing that
  could work for Phase 1.

### Phase 2 handoff (Calendar, Habits, Goals, Focus Mode)

- Each new module follows the same pattern as Phase 0's: a Zustand store
  with its own `hydrate()` (added to `main.tsx`'s hydration list), a page,
  and an add-modal wired through `useUIStore`'s `activeModal`.
- **Habits**: streak/weekly-progress math lives in `useHabitsStore`
  (`weeklyProgress`, `currentStreak`) rather than in components, so Phase 4's
  context builder can call the same functions the UI uses — one source of
  truth for "how is this habit doing."
- **Goals**: intentionally self-contained (title + milestone checklist)
  rather than linked to Task records. Cross-linking goals to tasks is a
  reasonable Phase 2.x follow-up but adds real complexity (what happens to
  a goal's progress when a linked task is deleted?) that didn't feel worth
  it before the AI layer exists to actually use the connection.
- **Focus Mode**: the Pomodoro timer moved here from the Assistant page
  (`src/modules/focus/`). Completed sessions log to `useFocusStore`, which
  is the seam Phase 8 (Analytics) will read from for focus-time history.
- **Calendar**: shows Task due dates and standalone Events on a month grid.
  Deliberately does **not** plot Alarms/Reminders — the `Alarm` type only
  stores a time + repeat pattern, not a specific date, so there's nothing
  correct to place on a calendar cell. If Alarms grow a `date` field later,
  wire them into `CalendarPage.tsx`'s `itemsByDay` the same way Tasks are.
- Dashboard now surfaces today's habit check-ins (tappable inline), goal
  progress bars, and a merged "today's calendar" list — all reading directly
  from the same stores the dedicated pages use, so there's no duplicated
  state or format-drift risk.

### Progress & Levels (added on request, not one of the original 9 phases)

- `useProgressStore` (`src/store/useProgressStore.ts`) logs XP per calendar
  day, and derives total XP, current streak, peak streak, and best single
  day from that log — nothing is double-counted or separately maintained.
- XP is awarded at the UI call sites for real completions, not inside the
  domain stores themselves (keeps `useTasksStore` etc. free of cross-store
  imports): +10 task complete (`TaskRow.tsx`), +5 habit check-in
  (`HabitCard.tsx` and the Dashboard's habit chips — both paths call
  `addXp`), +15 focus session (`PomodoroTimer.tsx`), +10 goal milestone
  (`GoalCard.tsx`). All four only fire on the incomplete→complete
  transition, never on un-checking.
- The level curve (`src/lib/leveling.ts`) is a pure function of total XP —
  front-loaded so early levels come fast, no artificial gates.
- Explicitly **not** included, on purpose: streak loss/decay, "come back or
  lose your progress" messaging, notification nudges to re-open the app,
  or anything that manufactures urgency. Nothing here decays — a missed day
  just doesn't add to the streak; it doesn't erase what's already earned.
  If push notifications get built in Phase 5, keep them the same way: tied
  to genuine reminders/suggestions, never "you're about to lose your streak."

### Phase 4 handoff (Jarvis intelligence layer)

- `src/lib/jarvis/` is the whole engine, deliberately **not** dependent on
  the AI client — every proactive suggestion is a deterministic rule over
  local data, so it works with zero API key configured and costs nothing to
  run:
  - `contextBuilder.ts` — `useDailyContext()` hook, pulls a snapshot from
    every relevant store (tasks, habits, goals, focus, progress, morning
    alarm). This is the one place "what's going on right now" gets
    assembled; add new signals here first if a future rule needs them.
  - `suggestionRules.ts` — one small pure function per rule, each with four
    tone variants (`professional`/`friendly`/`humorous`/`motivational`,
    read from Settings). `generateSuggestions()` runs all of them, drops
    anything dismissed today, sorts by priority, and caps the result —
    that cap *is* the anti-spam mechanism the original brief asked for.
  - `useSuggestions.ts` — the hook components actually call.
  - `types.ts` — `Suggestion` shape.
- `useNudgesStore` tracks dismissals per calendar day (`dateKey ->
  suggestion ids`), so a dismissed nudge won't reappear today but returns
  fresh tomorrow — no manual cleanup needed, old dates just accumulate
  harmlessly (small enough not to matter; revisit if that ever changes).
- `JarvisPanel` (`src/components/JarvisPanel.tsx`) is the one UI surface —
  reused as-is on the Dashboard (top of page) and the Assistant page
  ("Suggested for you"), so there's exactly one rendering of a suggestion
  card to maintain.
- The Assistant page's "Start discussion" button now feeds `useDailyContext()`
  into the actual AI prompt instead of a generic string — first bridge
  between the rule engine and the LLM chat.
- **Not built yet, and intentionally deferred**: the opt-in "learn my
  routines" memory system (the toggle already exists in Settings but does
  nothing yet), and real push delivery (Phase 5) — everything above only
  surfaces while the app is open. Both are natural Phase 4.x/5 follow-ons
  once there's real usage history to learn from.

### Phase 3 handoff (secure AI backend)

- `functions/` is a separate Firebase Functions project (its own
  `package.json`/`tsconfig.json` — not part of the frontend build).
  `functions/src/index.ts` is the whole backend: one HTTPS function,
  `assistantChat`, that holds the Gemini key server-side via Firebase
  Secret Manager and requires a valid **App Check** token instead of user
  login (there's no auth system yet — see Phase 7).
- `functions/README.md` is a real step-by-step deployment guide — creating
  the Firebase project, enabling App Check/reCAPTCHA v3, setting the
  secret, deploying, and wiring the frontend `.env`. This needs a Firebase
  project only the project owner can create, so it couldn't be deployed
  from here — it's ready to deploy, not deployed.
- Frontend seam: `src/lib/ai/secureBackendClient.ts` implements the same
  `AiClient` interface `GeminiDevClient` always has.
  `useAssistantStore.getClient()` now prefers the secure backend whenever
  `VITE_ASSISTANT_API_URL` is set at build time, falling back to the local
  dev-key client otherwise — no other code changed. Settings and
  `ChatWindow` both detect which mode is active and adjust their copy
  accordingly.
- Deliberately **not** built: per-user rate limiting (App Check stops
  scripted abuse but not a legitimate-looking browser hammering the
  endpoint) and real user accounts. Both make more sense once Phase 7
  adds Firebase Auth — rate-limit by user ID then, not before.

### Phase 6 handoff (voice)

- `src/lib/voice/speechRecognition.ts` and `speechSynthesis.ts` are thin
  wrappers around the browser-native Web Speech API — zero new dependencies,
  zero server calls, works offline. `SpeechRecognition` isn't in TypeScript's
  DOM lib, so its ambient type lives in `src/vite-env.d.ts` (minimal surface,
  only what the wrapper actually uses).
- Both toggles default to **off** in `AppSettings` (`voiceInputEnabled`,
  `voiceOutputEnabled`) and each checkbox in Settings → Voice disables itself
  with an explanatory line if the browser doesn't support that half — mic
  input and speech output have independent browser support, so they're
  checked and gated separately, not as one "voice" flag.
- `useSpeechRecognition()` is one-shot per press (`continuous = false`) by
  design: press mic → speak → final transcript appends into the chat
  composer's existing draft state → user reviews/edits → sends normally.
  It does **not** auto-send, so a misheard phrase never fires off a message
  unreviewed.
- Voice output speaks only the newest assistant message, once, guarded by a
  ref keyed on message id — re-renders (hydration, unrelated state changes)
  can't cause a reply to be read twice. `AssistantOrb` gained a third
  `'speaking'` state (mint pulse) so this has its own honest visual signal
  instead of reusing `'thinking'`.
- Deliberately **not** built: the roadmap's "provider APIs as an upgrade
  path" — if Web Speech's accuracy/voice quality isn't enough later, that's
  a new `AiClient`-style seam (swap the wrapper's internals, same
  `start()`/`stop()`/`speak()` call sites), not a rewrite of ChatWindow.
  Also not built: wake-word / always-listening — deliberately press-to-talk
  only, consistent with the rest of the app never doing anything without a
  direct user action.

### Phase 5 handoff (real notifications)

- What's real: `src/lib/notifications/permissions.ts` (permission
  request/state, must be triggered by a user gesture — wired to a button
  in Settings, not requested automatically), `quietHours.ts` (pure,
  tested — the overnight-wraparound case is the one worth re-checking if
  this ever gets touched), and `NotificationScheduler.tsx` (mounted once
  in `AppShell`, checks every 15 minutes, and reuses
  `generateSuggestions()` from Phase 4 — **the exact same rule engine**,
  not a separate copy). Only ever the single highest-priority,
  not-yet-sent suggestion becomes a real OS notification, capped at 3/day,
  never during quiet hours. `useNotificationLogStore` tracks what's
  already been sent today, separate from the in-app dismissal log.
- What's *not* real, and can't be without Phase 7: this only fires while
  the browser process is alive (tab open or backgrounded, not fully
  closed/killed). Actual closed-app push requires the server to know your
  task/habit state independently — which means Firestore-synced data
  (Phase 7) plus VAPID keys, stored push subscriptions, and a scheduled
  Cloud Function running a server-side copy of the same rules. That's real
  work, not a small addition — sequence Phase 7 before attempting it, or
  the "closed-app" version will end up notifying from stale/empty data.
- Service worker gained a `notificationclick` handler (`public/sw.js`) so
  tapping a notification focuses or opens the app — it did nothing before.

### Phase 7 handoff (Cloud Sync & Authentication)

- **Database clearing**: Added `clearAllData()` to [storage.ts](file:///c:/Users/Saimanideep/OneDrive/Desktop/life-assist-phase6-voice_1/life-assist/src/lib/storage.ts) to erase both the local Dexie store and the in-memory cache upon logout or switching users.
- **Firebase Auth linking**: In [sync.ts](file:///c:/Users/Saimanideep/OneDrive/Desktop/life-assist-phase6-voice_1/life-assist/src/lib/sync.ts), the new authentication actions (`signUp`, `logIn`, `logOut`) handle user management. `signUp` automatically links the current anonymous user account credentials via `linkWithCredential`, preserving the local-first history seamlessly.
- **Privacy & Safety**: In-memory and local database data are cleared when logging in to another user account or logging out, preventing data cross-leakage.
- **Settings UI**: Added full account registration and login card with form inputs under the Profile tab in [SettingsPage.tsx](file:///c:/Users/Saimanideep/OneDrive/Desktop/life-assist-phase6-voice_1/life-assist/src/modules/settings/SettingsPage.tsx). Displays sync status badge, user credentials, and logout controls dynamically based on the Firebase Auth state.

### Phase 8 handoff (Analytics & Insights)

- **Interactive Graphs**: Added a customized HTML/CSS vertical bar chart to [AnalyticsPage.tsx](file:///c:/Users/Saimanideep/OneDrive/Desktop/life-assist-phase6-voice_1/life-assist/src/modules/analytics/AnalyticsPage.tsx) visualizing the last 7 days of XP earnings. Each bar displays dates and XP numbers via detailed tooltips.
- **Productivity Summaries**: Consolidated statistics across multiple stores: completed tasks ([useTasksStore.ts](file:///c:/Users/Saimanideep/OneDrive/Desktop/life-assist-phase6-voice_1/life-assist/src/store/useTasksStore.ts)), focus time ([useFocusStore.ts](file:///c:/Users/Saimanideep/OneDrive/Desktop/life-assist-phase6-voice_1/life-assist/src/store/useFocusStore.ts)), level progress ([useProgressStore.ts](file:///c:/Users/Saimanideep/OneDrive/Desktop/life-assist-phase6-voice_1/life-assist/src/store/useProgressStore.ts)), and habit completions ([useHabitsStore.ts](file:///c:/Users/Saimanideep/OneDrive/Desktop/life-assist-phase6-voice_1/life-assist/src/store/useHabitsStore.ts)).
- **AI Summary Integration**: Added a "Generate AI Weekly Review" button that aggregates statistics, customizes a prompt based on the user's preferred assistant tone, queries the AI client dynamically, and saves the output to local storage.
- **Routing**: Removed the "Coming Soon" screen mapping, linking `/analytics` to the new page. Enables navigation tab under Sidebar.

### Phase 9 handoff (Polish)

- **Performance Pass**: Refactored [App.tsx](file:///c:/Users/Saimanideep/OneDrive/Desktop/life-assist-phase6-voice_1/life-assist/src/App.tsx) routing to lazy-load all core pages using `React.lazy` and `Suspense`, improving initial script size and load performance.
- **Accessibility Pass**: Enhanced visual navigation components in [Sidebar.tsx](file:///c:/Users/Saimanideep/OneDrive/Desktop/life-assist-phase6-voice_1/life-assist/src/components/layout/Sidebar.tsx) and [IconButton.tsx](file:///c:/Users/Saimanideep/OneDrive/Desktop/life-assist-phase6-voice_1/life-assist/src/components/ui/IconButton.tsx) with explicit focus ring states and ARIA labeling.
- **Install Flow Pass (PWA)**: Added PWA install listener to [main.tsx](file:///c:/Users/Saimanideep/OneDrive/Desktop/life-assist-phase6-voice_1/life-assist/src/main.tsx) capturing prompt events and saving them in a new store, [usePwaStore.ts](file:///c:/Users/Saimanideep/OneDrive/Desktop/life-assist-phase6-voice_1/life-assist/src/store/usePwaStore.ts). Wired up a dynamic installation card in [SettingsPage.tsx](file:///c:/Users/Saimanideep/OneDrive/Desktop/life-assist-phase6-voice_1/life-assist/src/modules/settings/SettingsPage.tsx) which triggers browser installation.
