# 124: Where a retriggered LFO starts

**What to build:** From review 15 (the inbox, 2026-10-30; [report](../reviews/2026-10-30/15-sound-designer.md), with review 13's Zap Pluck). A retriggered LFO ([31](./31-lfo-retrigger.md)) starts its cycle at the browser oscillator's own phase 0, which is the middle of a Saw's ramp and of a Saw Down's. So a retriggered falling saw, the classic "third envelope", starts halfway and jumps back to its top part-way through the Note: Key Sync opens at 500 Hz, closes to 172 Hz, then jumps to 1.48 kHz at 0.34 s, the reverse of its words, and Zap Pluck and Wobble do the same.

**Blocked by:** none

**Status:** done (2026-10-30). A retriggered LFO starts each Waveform where it classically starts, a Saw at its foot, a Saw Down at its top, a Square on its upper half, a Sine and a Triangle at the centre rising, in the sound, the Modulation model and the LFO's plot alike; a free LFO is unchanged. Not yet heard by the owner.

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
- [x] An engine test per wave: a retriggered LFO's first value after the Note is the wave's classic start, and the model agrees
- [x] Key Sync rendered offline opens at the Note's start and closes over the LFO's cycle, as its words say
- [x] Every model-against-sound test passes

**Out of scope:**
- A free-running LFO's phase

## How it was built

**Engine** (`src/engine/synthEngine.ts`): an oscillator always starts at its wave's phase 0, so a restart gives the new oscillator its Waveform's series turned to start at the classic place (each term sin 2πn(p + start) written as a sine and a cosine), rather than starting it early or shifting it later. Each LFO oscillator remembers where its cycle started; a change of Waveform while it runs keeps that start, so the sound and the model stay together. The series now cover all five Waveforms; a Sine and a Triangle starting at 0 (every free LFO, and every retriggered one) still play as Web Audio's own, so nothing changes for them. The first oscillator, the free-running one, starts at 0 as before.

**Model** (`src/modulation/lfo.ts`): `LFO_START` holds each Waveform's start as a phase of `lfoShape` (0.5 for the two saws, 0 for the rest); the LFO clock's restart mark starts its count there instead of at 0. The engine passes the same value to the new oscillator and to the clock, so the Timeline, the rings, the Effective values and the LFO's plot start where the sound does.

**The LFO's plot** draws the Modulation model's recent history (`engine.lfoSwingAt`), so it follows with no change of its own. Not checked in the browser: this lane ran no Playwright.

**Square's upper half** (Claude's call, open to the owner): the classic start of a Square is the start of its high half, so a retriggered square LFO on Pitch starts up, on the Cutoff starts open (Stutter's words). That is where the browser's square already started, so a Square, like a Sine and a Triangle, starts where it did.

**A Waveform changed mid-Note** (Claude's call, open to the owner): the LFO keeps the phase its last restart gave it until the next Note. A retriggered Saw switched to a Sine during a Note runs on as a Sine half a cycle along, in the sound and the model alike; the next Note starts it at the Sine's own start.

**The Presets, rendered** (A4, A3 and A2, a Note at 0.3 s on a fresh engine):

- **Key Sync:** the Cutoff at 1.52 kHz at the Note, 1.09 kHz at 0.1 s, 559 Hz at 0.3 s, 287 Hz at 0.5 s, 169 Hz at 0.66 s, then open again at 0.67 s (before: 500 Hz, down to 172 Hz, a jump to 1.48 kHz at 0.34 s). Its words hold.
- **Zap Pluck:** the share of power off the carrier in 20 ms windows: 87 % at the strike, 74 % at 0.1 s, 7 % at 0.3 s (nearly a pure sine), then 85 % again from 0.34 s, 31 dB under the strike, as the falling saw starts its next cycle. "Every strike starts at full FM … and melts to a pure sine as it decays" now holds; the zap returning in the tail is left to [108](./108-preset-claims-and-levels.md).
- **Wobble:** its LFO is a Sine, which starts at the centre rising: the Cutoff at its knob's 300 Hz at the Note, opening to 792 Hz at 83 ms. "Starts its wobble from the top" was untrue and stays so under the owner's decision; it now says the wobble starts at the Cutoff and opens first.

**Words:** Wobble's description (`src/patch/presets.ts`); the Retrigger entry in `CONTEXT.md` names where each Waveform starts; a Since then line on [31](./31-lfo-retrigger.md); [108](./108-preset-claims-and-levels.md) unblocked, with what was found.

**Tests:** `src/engine/synthEngine.browser.test.ts`, "where a retriggered LFO starts (issue 124)": for each of the five Waveforms on Volume at full Depth, the model's value at the Note is the classic start, the sound's tremolo gain is there from 1 to 5 ms in, and the model follows the sound sample by sample after; a free saw left where it was; a retriggered saw switched to a Sine mid-Note, sound and model together; Key Sync rendered, its Harmonics' centre falling over the cycle and the model's Cutoff from its top to its foot. The saw, Saw Down and Key Sync tests failed on the engine before the change. `src/modulation/lfo.test.ts`: `LFO_START` puts each Waveform at its classic start, and the clock restarts at the phase it is given, through a later Rate change.

