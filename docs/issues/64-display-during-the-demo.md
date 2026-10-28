# 64: Display settings while the Demo plays

**What to build:** From the owner's inbox line (2026-10-27): "Should be okay to change display settings while demo, song and tutorials are running." Checked against the app (2026-10-27): the Song and a Tutorial (its Listen included) play on while Display is opened and its options changed. The Demo does not: opening Display ends it ("The Demo stopped: you are playing now"), and so would its options, Snapshot, Freeze and Space (Freeze's key). Display shows the sound without changing it, so like moving around the page it should leave the Demo playing.

**Blocked by:** none

**Status:** to build

- [ ] Opening and closing Display, its options, Snapshot and its Clear, Freeze, the axes and Scope cycles leave the Demo playing; Space freezes without ending it
- [ ] An e2e test beside the Demo's other "keeps playing" tests (`e2e/demo.spec.ts`)
