# 126: The keyboard octave a Patch carries

**What to build:** From the 1.16.1 code review (the inbox, 2026-10-30). Since [125](./125-the-preset-collection.md) a Preset may carry the keyboard's octave (the Basses start on C2). The field rides in the Patch, so it also comes back with a restored Patch (Last session, a Share link), which opens the page in that octave, and it survives editing: a Bass reworked into a lead and saved still starts on C2, with no control to see or clear the octave.

**Blocked by:** none

**Status:** done (2026-10-30). The octave buttons, Z and X write the Patch's keyboard octave, so a saved Patch or a Share link opens on the octave the player last chose; a Preset loaded and left alone keeps its own, and the octave alone does not mark the Patch changed.

## Question for the owner

How should a changed Patch treat its octave? Claude's recommendation: the octave buttons write it, so the octave the player last chose is what a saved Patch keeps, and a Patch saved from a Bass played at C4 starts on C4. The page opening in a restored Patch's octave stays (a Share link of a Bass plays as a Bass). The other way: only Presets carry an octave, never a saved or shared Patch.

## Decisions (2026-10-30, decided by the owner)

1. The octave buttons write the Patch's keyboard octave, so a saved or shared Patch keeps the octave the player last chose; a restored Patch (Last session, a Share link) opens the page in its octave, as now.

## Agent Brief

**Category:** bug
**Summary:** The keyboard octave a Patch carries is the one the player last chose, not one left over from a Preset.

**Desired behavior:**
- Pressing an octave button sets the Patch's keyboard octave to the new octave (C4 being the default, it is stored like any other value).
- Loading a Preset still sets the keyboard to the Preset's octave (or C4 without one); saving or sharing afterwards keeps whatever octave the player then chose.
- A Patch changed only in its octave does not count as changed from its Preset (the "changed" mark ignores it, as today).

**Acceptance criteria:**
- [x] Load a Bass (C2), press Octave up twice, save: the saved Patch opens on C4
- [x] A Share link made after the octave buttons opens on that octave
- [x] Loading a Bass and touching nothing still opens a Share link on C2

## How it was built

- **The octave buttons write it** (`src/ui/App.tsx`, `src/ui/hooks/useKeys.ts`). One function moves the keyboard from the octave shown and writes `keyboardOctave` into the Patch, as a change by hand; the two octave buttons and the computer keyboard's Z and X call it. C4 is written like any other octave. A load still sets the keyboard from the Patch loaded (its own octave, or C4), and the Demo and Listen still only show their phrase's octave, writing nothing: a button pressed while they show one moves from the octave shown. The Last session, a saved Patch, a file and a Share link all carry the Patch, so each keeps the octave.
- **The "changed" mark leaves it out** (`src/patch/patchStore.ts`): the Patch store compares the Patch with the one loaded or saved without its keyboard octave, so the octave alone never marks a Preset changed.
- **Words:** the `keyboardOctave` field's comment (`src/patch/patch.ts`) and the Preset entry in `CONTEXT.md` say the octave buttons write it.
- **Tests:** `src/patch/patchStore.test.ts` (the octave alone is no change; it failed before, the Patch marked changed); `e2e/patches.spec.ts`, "the octave buttons write the Patch's keyboard octave…": Sub Bass's Share link untouched opens on C2; after Octave up twice the panel is not marked changed and the Share link opens on C4 (it opened on C2 before); saved, then loaded back after Sub Bass, it opens on C4. Run in Chromium and WebKit with `e2e/piano.spec.ts`, `e2e/song.spec.ts`, `e2e/tutorial.spec.ts` and `e2e/demo.spec.ts`; the whole Vitest suite passes.
- **Claude's call, open to the owner:** Z and X count as octave buttons and write the octave too, since they are the keyboard's way of choosing it.
