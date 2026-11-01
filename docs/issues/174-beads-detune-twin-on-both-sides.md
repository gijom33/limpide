# 174: Bead's Detune twin on both sides

**What to build:** The owner's bug (inbox, 2026-10-31): "Bead's ghosting effect from detune should be symmetric. Ghost on left when detune negative, ghost on right when detune positive." Detune splits Bead into a twin that wobbles as the two Oscillators beat (issue 127), but its offset is worked out from Detune's size alone, so the twin always stands to Bead's left, whichever way Osc 2 is detuned. Polish of Bead in v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · bug

## Decisions

1. **The twin's side follows Detune's sign:** to Bead's left below 0 cents, to its right above. Decided by the owner, 2026-10-31.

Claude's call, open to the owner:

2. **Everything else as now:** its distance (up to 16 px at ±50 cents), its wobble with the beats, still with reduced motion, and only in Bead's drop form. Turned through 0 the twin passes through Bead and comes out the other side.

## Agent Brief

**Category:** bug
**Summary:** Bead's Detune twin always stands to its left; it should stand on the side of Detune's sign.

**Current behavior:** Bead's pose holds the twin's offset as a positive distance from Detune's absolute value, and the drawing always moves the twin left by it.

**Desired behavior:** The twin's offset carries Detune's sign: left of Bead for negative Detune, right for positive, the same distance and wobble as now. The pose's doc comment and bead.md say so.

**Key interfaces:**
- Bead's pose (the twin's offset) and how it is dressed from what is heard
- Bead's drawing of the twin

**Acceptance criteria:**
- [ ] Detune −30 cents: the twin left of Bead; +30: right; 0: no twin (a unit test on the pose; the mascot spec checks the side in one browser)
- [ ] Reduced motion: still, on the right side
- [ ] The mascot specs and Bead's frame-cost test pass as before
