# 126: The keyboard octave a Patch carries

**What to build:** From the 1.16.1 code review (the inbox, 2026-10-30). Since [125](./125-the-preset-collection.md) a Preset may carry the keyboard's octave (the Basses start on C2). The field rides in the Patch, so it also comes back with a restored Patch (Last session, a Share link), which opens the page in that octave, and it survives editing: a Bass reworked into a lead and saved still starts on C2, with no control to see or clear the octave.

**Blocked by:** none

**Status:** ready-for-agent · bug. The owner accepted the recommendation (decision below).

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
- [ ] Load a Bass (C2), press Octave up twice, save: the saved Patch opens on C4
- [ ] A Share link made after the octave buttons opens on that octave
- [ ] Loading a Bass and touching nothing still opens a Share link on C2

