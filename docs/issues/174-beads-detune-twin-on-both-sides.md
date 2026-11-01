# 174: Bead's Detune twin on both sides

**What to build:** The owner's bug (inbox, 2026-10-31): "Bead's ghosting effect from detune should be symmetric. Ghost on left when detune negative, ghost on right when detune positive." Detune splits Bead into a twin that wobbles as the two Oscillators beat (issue 127), but its offset is worked out from Detune's size alone, so the twin always stands to Bead's left, whichever way Osc 2 is detuned. Polish of Bead in v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-human · bug. Built (2026-11-01) on night/2026-10-31, for the owner to try

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
- [x] Detune −30 cents: the twin left of Bead; +30: right; 0: no twin (a unit test on the pose; the mascot spec checks the side in one browser)
- [x] Reduced motion: still, on the right side
- [x] The mascot specs and Bead's frame-cost test pass as before

## How it was built

- **The pose:** the twin's offset now carries Detune's sign, negative (to Bead's left) below 0 cents, positive (to its right) above. Its distance, its wobble with the beats and its stillness under reduced motion are as before; within half a pixel of 0 there is one drop, so turned through 0 the twin goes into Bead and comes out the other side. The pose's doc comment and `docs/bead.md` say so.
- **The drawing:** the twin is moved by the signed offset, with Bead's facing undone. Bead's box is mirrored when it turns round, which also flipped the old twin to its right whenever Bead faced the other way; now the twin stays on Detune's side of the page whichever way Bead faces, and as Bead turns it closes in and comes back out on the same side, without swapping (Claude's call, open to the owner).
- **Tests:** a unit test on the pose (−30 cents left, +30 right, 0 none, with and without reduced motion, still at 9.6 px with it), red before the fix; in the mascot spec, Chromium only, "Detune splits it, its twin on the side of Detune's sign…" turns Detune to −50 and +50 and checks the twin's side over 30 frames (red on the old drawing).
- **Tests run:** `npx tsc`, `npm run lint`, the mascot unit tests (107 passed), the whole mascot spec in Chromium (26 passed, the frame-cost test included).
- **To try:** bring Bead, mix Osc 2 in, and turn Osc 2's Detune down then up: the twin to Bead's left below 0, to its right above, one drop at 0. Let Bead stroll and turn round with Detune set: the twin should stay on its side.
