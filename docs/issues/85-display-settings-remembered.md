# 85: Every Display setting remembered

**What to build:** The owner's idea (2026-10-28): "All display settings should be remembered." Today a reload keeps the overlays, the theme and the letter keys, but puts the axes, the Scope's cycles, the Env Timeline's length and what the Amp Viewers follow back to their defaults. This changes issue 77's decision 3 (only the overlays remembered), as the owner now asks.

**Blocked by:** none

**Status:** done (2026-10-28). A reload keeps every Display setting: the axes, the Scope's cycles, the Env Timeline's length and what the Amp Viewers follow, besides the overlays; never Freeze or the Snapshot.

## Agent Brief

**Category:** enhancement
**Summary:** The Viewer settings store also saves the Frequency and Level axes, the Scope's cycles, the Env Timeline's length and what the Amp Viewers follow; a new page starts from them.

**Current behavior:**
- The Viewer settings store saves the overlays only; Freeze, the Snapshot, the axes, the cycles, the Timeline's length and the Amp Tap's source start at their defaults on every page.
- The theme and the letter keys are saved on their own.

**Desired behavior:**
- Saved and restored with the overlays: the Frequency axis, the Level axis, the Scope's cycles, the Env Timeline's length, and what the Amp Viewers follow (the engine gets that source from the start).
- Never saved: Freeze and the Snapshot, which are moments, not settings.
- What is read back is checked: a missing, garbled or unknown value falls back to its default, and unusable storage behaves as empty, as the overlays already do.

**Key interfaces:**
- The Viewer settings store: what it saves, and the state it starts from

**Acceptance criteria:**
- [x] `npx tsc`, `npm run lint`, `npx vitest run` and `npx playwright test` green
- [x] Node tests over the store and a fake storage: each of the five settings survives a new store; Freeze and the Snapshot do not; a garbled value starts at its default; the engine hears the saved Amp Tap source when the store is built
- [x] A Playwright test: change the axes, cycles, Timeline length and what the Amp Viewers follow, reload, and Display shows the same

**Out of scope:**
- The theme, the letter keys and the bend range, already saved
- Freeze and the Snapshot

## Decisions (triage, 2026-10-28, decided by the owner)

1. Remember the five settings above with the overlays; never Freeze or the Snapshot. Issue 77's decision 3 is changed by this.

## How it was built

- The Viewer settings store saves the five settings under their own key (`limpide.viewSettings`), each checked against the values it may take when read back; the overlays keep theirs. Tests: `src/viewers/viewerStore.test.ts`.
- Test: "every Display setting is remembered across a reload, Freeze and the Snapshot aside (issue 85)" in `e2e/displayPanel.spec.ts`.

