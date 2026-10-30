# 126: The keyboard octave a Patch carries

**What to build:** From the 1.16.1 code review (the inbox, 2026-10-30). Since [125](./125-the-preset-collection.md) a Preset may carry the keyboard's octave (the Basses start on C2). The field rides in the Patch, so it also comes back with a restored Patch (Last session, a Share link), which opens the page in that octave, and it survives editing: a Bass reworked into a lead and saved still starts on C2, with no control to see or clear the octave.

**Blocked by:** none

**Status:** needs-triage · bug. A question for the owner below.

## Question for the owner

How should a changed Patch treat its octave? Claude's recommendation: the octave buttons write it, so the octave the player last chose is what a saved Patch keeps, and a Patch saved from a Bass played at C4 starts on C4. The page opening in a restored Patch's octave stays (a Share link of a Bass plays as a Bass). The other way: only Presets carry an octave, never a saved or shared Patch.
