# 93: The Filter Envelope on Osc 2's pitch

**What to build:** The Filter Envelope can also move Osc 2's pitch, as a Prophet-5's Poly Mod does: zaps, brassy attacks and, with Cross Mod or Ring, sweeping clangs. Item 6 of the owner's six Oscillator additions (inbox, 2026-10-29).

**Blocked by:** none

**Status:** done (2026-10-29). An Env Amount knob in Osc 2's Tuning (−24 to +24 semitones) lets the Filter Envelope move Osc 2's pitch, in the sound and the model; the Poly Mod Zap Preset shows it. Not yet listened to by the owner.

## Agent Brief

**Category:** enhancement
**Summary:** An Env Amount knob in Osc 2's Tuning: how many semitones the Filter Envelope moves Osc 2 at its peak.

**Current behavior:**
- The Filter Envelope moves only the Cutoff.

**Desired behavior:**
- An Osc 2 Env Amount Parameter (−24 to +24 semitones, 0 by default) in Osc 2's Tuning: Osc 2's pitch moves by the Amount times the Filter Envelope's level, on top of its Tuning and the LFOs.
- The Modulation model has it too (ADR-0003): Osc 2's tuning at a moment includes it.
- A Preset shows it off.

**Acceptance criteria:**
- [x] With the Amount at +12, Osc 2 sounds an octave up at the Envelope's peak and at its own pitch once the Envelope has settled at a Sustain of 0 (engine test)
- [x] The model's Osc 2 tuning adds the Amount times the Envelope's level (unit test)
- [x] An old Patch loads with it at 0; every existing test passes

**Out of scope:**
- A third Envelope, or the Filter Envelope on Osc 1 or on Pulse Width
- A modulation ring or a Timeline line for it

## Decisions (triage, 2026-10-29)

1. Built with the other five: decided by the owner.
2. The Filter Envelope, not a third one, on Osc 2 alone, in semitones up to two octaves each way: Claude's call, open to the owner.
3. No ring and no Timeline line for now: the ring and the Timeline show the LFOs' and the Filter's movement; whether the Envelope's pitch sweep belongs there is the owner's call later: Claude's call, open to the owner.

## How it was built

- **The engine** (`src/engine/synthEngine.ts`): the Voice's Filter Envelope source also feeds a gain of the Amount × 100 cents into Osc 2's `detune`.
- **The model** (`osc2Cents` in `src/modulation/modulationModel.ts`) takes the Filter Envelope's level and adds it.
- **The knob** `osc2EnvAmount`, small, last in Osc 2's Tuning row, greyed out while Osc 2 is not heard. Its pulse width follows Osc 2's knobs, not the Envelope's sweep, as it ignores the LFOs on Osc 2 Pitch.
- Tests: "the Filter Envelope on Osc 2’s pitch (issue 93)" in the engine's browser tests, one model unit test; Preset: Poly Mod Zap (Leads).
