# 64: Display settings while the Demo plays

**What to build:** From the owner's inbox line (2026-10-27): "Should be okay to change display settings while demo, song and tutorials are running." Checked against the app (2026-10-27): the Song and a Tutorial (its Listen included) play on while Display is opened and its options changed. The Demo does not: opening Display ends it ("The Demo stopped: you are playing now"), and so would its options, Snapshot, Freeze and Space (Freeze's key). Display shows the sound without changing it, so like moving around the page it should leave the Demo playing.

**Blocked by:** none

**Status:** done (2026-10-27). The Demo's stop rules (`src/ui/hooks/usePlayers.ts`) leave out the Display menu, Space when it freezes (`freezesOnSpace`, shared with `useKeys.ts`), and the Escape or outside click that closes the panel; they listen in the capture phase, before the panel's own handlers close it. Letter keys, in the same panel, keep it playing too.

- [x] Opening and closing Display, its options, Snapshot and its Clear, Freeze, the axes and Scope cycles leave the Demo playing; Space freezes without ending it
- [x] An e2e test beside the Demo's other "keeps playing" tests (`e2e/demo.spec.ts`)

Later, 2026-10-28, decided by the owner (issue 71): with Display open, a press on the on-screen piano ends the Demo, as it does with Display closed; a click elsewhere that closes the panel still leaves it playing.
