# 124: Where a retriggered LFO starts

**What to build:** From review 15 (the inbox, 2026-10-30; [report](../reviews/2026-10-30/15-sound-designer.md), with review 13's Zap Pluck). A retriggered LFO ([31](./31-lfo-retrigger.md)) starts its cycle at the browser oscillator's own phase 0, which is the middle of a Saw's ramp and of a Saw Down's. So a retriggered falling saw, the classic "third envelope", starts halfway and jumps back to its top part-way through the Note: Key Sync opens at 500 Hz, closes to 172 Hz, then jumps to 1.48 kHz at 0.34 s, the reverse of its words, and Zap Pluck and Wobble do the same.

**Blocked by:** none

**Status:** ready-for-agent · bug. The owner chose the classic starts (decision below).

## Question for the owner

Where should a retriggered LFO start its wave?

1. **Where each wave classically starts (Claude's recommendation):** a Saw Down at its top, a Saw at its foot, a Square on its upper half, a Sine and a Triangle at the centre rising (as now). A retriggered falling saw then opens and closes on every Note, as on most synths, and Key Sync, Zap Pluck and Wobble do what their words say. The LFO's picture and the Modulation model start at the same place.
2. **Leave the engine:** change the three Presets and their words instead ([108](./108-preset-claims-and-levels.md)); a retriggered saw keeps starting halfway.

## Decisions (triage, 2026-10-30, decided by the owner)

1. A retriggered LFO starts each wave where it classically starts: a Saw Down at its top, a Saw at its foot, a Square on its upper half, a Sine and a Triangle at the centre rising (as now).

## Agent Brief

**Category:** bug
**Summary:** A retriggered LFO starts its wave at the wave's classic start, in the sound, the Modulation model and the LFO's picture alike.

**Current behavior:** a retriggered LFO starts at the browser oscillator's phase 0, the middle of a Saw's or Saw Down's ramp.

**Desired behavior:**
- On each retrigger, the LFO's wave starts at: its top for Saw Down, its foot for Saw, the start of its upper half for Square, the centre rising for Sine and Triangle.
- A free-running LFO (retrigger off) is unchanged.
- The Modulation model's LFO phase at a restart matches, so the Timeline, the rings and the Effective values agree with the sound (ADR-0003); the LFO's own plot draws the wave from the same start.
- Key Sync, Zap Pluck and Wobble then do what their words say, or their words are corrected to what they do; the fix of their words beyond that is [108](./108-preset-claims-and-levels.md)'s.

**Key interfaces:**
- The engine's LFO restart, the Modulation model's LFO phase, the LFO plot

**Acceptance criteria:**
- [ ] An engine test per wave: a retriggered LFO's first value after the Note is the wave's classic start, and the model agrees
- [ ] Key Sync rendered offline opens at the Note's start and closes over the LFO's cycle, as its words say
- [ ] Every model-against-sound test passes

**Out of scope:**
- A free-running LFO's phase
