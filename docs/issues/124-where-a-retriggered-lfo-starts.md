# 124: Where a retriggered LFO starts

**What to build:** From review 15 (the inbox, 2026-10-30; [report](../reviews/2026-10-30/15-sound-designer.md), with review 13's Zap Pluck). A retriggered LFO ([31](./31-lfo-retrigger.md)) starts its cycle at the browser oscillator's own phase 0, which is the middle of a Saw's ramp and of a Saw Down's. So a retriggered falling saw, the classic "third envelope", starts halfway and jumps back to its top part-way through the Note: Key Sync opens at 500 Hz, closes to 172 Hz, then jumps to 1.48 kHz at 0.34 s, the reverse of its words, and Zap Pluck and Wobble do the same.

**Blocked by:** none

**Status:** needs-triage · bug. A question for the owner below.

## Question for the owner

Where should a retriggered LFO start its wave?

1. **Where each wave classically starts (Claude's recommendation):** a Saw Down at its top, a Saw at its foot, a Square on its upper half, a Sine and a Triangle at the centre rising (as now). A retriggered falling saw then opens and closes on every Note, as on most synths, and Key Sync, Zap Pluck and Wobble do what their words say. The LFO's picture and the Modulation model start at the same place.
2. **Leave the engine:** change the three Presets and their words instead ([108](./108-preset-claims-and-levels.md)); a retriggered saw keeps starting halfway.
