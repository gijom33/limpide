# 87: Display settings remembered in one place

**What to build:** From the 1.15.0 review (2026-10-28): Display settings are remembered three ways (the Viewer settings store's key, the overlays' own key, and the app's on/off pairs for the letter keys and Tooltips), with the load-and-check code copied between the store and the overlays, a try/catch around a storage that never throws, and a key named only `KEY`; which Display settings are remembered is answered in two places. Nothing visible changes.

**Blocked by:** none

**Status:** ready-for-human · enhancement. Built (2026-10-30) on night/2026-10-30, for the owner to try

## Agent Brief

**Category:** enhancement
**Summary:** One module remembers every Display setting (the Viewers' settings, the overlays, the letter keys, Tooltips, the theme), with one way to read back and check a saved value.

**Current behavior:**
- The Viewer settings store saves five settings under one key and the overlays under another, each with its own parse-and-check code.
- The app keeps the letter keys and Tooltips as on/off strings with a state and an effect each; the theme saves itself.

**Desired behavior:**
- One place says which Display settings are remembered and reads each back checked against the values it may take, a missing or garbled one starting at its default.
- What a reload restores is unchanged, including choices saved under today's keys (a browser that saved them before keeps them).
- Freeze and the Snapshot are still never saved.

**Key interfaces:**
- The Viewer settings store's saved state, and how the app reads and writes the letter keys, Tooltips and the theme

**Acceptance criteria:**
- [x] `npx tsc`, `npm run lint`, `npx vitest run` and `npx playwright test` green, no Playwright test changed (on main after the night's merge, 2026-10-31; the one spec changed since, `inBetweenLayout.spec.ts`, was a timing race outside this issue)
- [x] One read-back-and-check helper; no copied parse code
- [x] A node test: settings saved under today's keys come back after the change

**Out of scope:**
- Remembering anything not remembered today
- The Patch library's storage

## Decisions (triage, 2026-10-28)

1. A tidy-up issue, ready for an agent, after 1.15.0. Claude's call, open to the owner.

## How it was built

Built at night (2026-10-30) on `night/2026-10-30`, test-first.

- `src/app/displaySettings.ts` is the one list of the Display settings a new page starts from: the Viewers' five (`limpide.viewSettings`), the overlays (`limpide.overlays`), the letter keys, Tooltips, the theme and the Bead's switch, each under the key and in the form it had, with the values it may take and its default. `recall` reads one back through one check (kept if allowed, else the default; a garbled JSON object counts as nothing saved); `remember` keeps it.
- The Viewer settings store reads and writes through it (still writing only when a setting changes, not at every turn of a knob); the overlays' own load and save and the store's copied parse code are gone.
- The app's letter keys, Tooltips, theme and Bead use one hook, `useDisplaySetting`, in place of a state and an effect each; `src/ui/theme.ts` is gone (the theme now goes through the same never-throwing storage as the rest).
- Tests: `src/app/displaySettings.test.ts` (settings saved under today's keys come back; missing or garbled ones start at their defaults; each is kept under the same key and in the same form). The Viewer settings store's tests are unchanged; no Playwright test changed.
- Checks: `npx tsc`, `npm run lint` and `npx vitest run` (1129 tests) green. `npx playwright test`: 1004 passed, 7 failed; five passed when run again alone. The other two are the Tour's "closed at card N, the Tour gives back the Patch the person had" (`e2e/tour.spec.ts`, issue 128), which fails the same way on the branch without this change (all eight of its cases, on the commit before), so it is not this issue's to fix.

Calls made without the owner (Claude's call, open to the owner):

1. The Bead's switch is folded in: it sits in Display and is remembered, though it came after this issue was written. Its saved value is now checked too (before, any text was taken as it was).
2. A setting is written when it changes, no longer at every page load: the letter keys, Tooltips and the theme used to write their value on each visit. A reload restores the same, since a missing value starts at the same default.
3. The letter keys and Tooltips are held as `'on'`/`'off'`, the form they are kept in and the Display switch's values, rather than as true/false.
4. The tests were placed at the module's `recall`/`remember` and the existing store tests, the seams chosen without the owner.

To try in the app: change every Display setting (Scope cycles, Timeline seconds, the axes, the Amp Tap's source, each overlay, Letter keys, Tooltips, Bead once met, Theme), reload, and find each as left; Freeze and a Snapshot are gone after the reload. A browser that saved its choices with the release before this one keeps them.
