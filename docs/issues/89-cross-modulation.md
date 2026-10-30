# 89: Cross-modulation, Osc 2 moving Osc 1's pitch

**What to build:** Osc 2 swings Osc 1's frequency at audio rate (linear FM), with a Cross Mod knob: sidebands fan out around Osc 1's Harmonics as it is turned up, from a growl to a clang. Item 2 of the owner's six Oscillator additions (inbox, 2026-10-29).

**Blocked by:** none

**Status:** done (2026-10-29). An FM knob in Osc 1's Pitch row swings Osc 1's frequency by Osc 2, an index of 4 at full on every Note; the FM Sidebands Preset shows it. Not yet listened to by the owner.

**Since then:** the index is no longer the same on every Note at the top: a Note shrinks it as far as keeps Osc 1's sidebands under the top of what the browser plays, so none fold back; every Preset keeps it whole below F♯5, and all but Clang Alarm, Breathing Bell and Glass Shimmer below C6 ([103](./103-fm-and-ring-fold-back-at-the-top.md), 2026-10-30).

## Agent Brief

**Category:** enhancement
**Summary:** An FM knob sets how far Osc 2 swings Osc 1's frequency.

**Current behavior:**
- The two Oscillators only add in the Mixer.

**Desired behavior:**
- A Cross Mod Parameter (0–100 %, off by default), labelled FM, on Osc 1's tab. Osc 2's wave moves Osc 1's frequency, linearly, by up to four times Osc 2's own frequency at full (a modulation index of 4), the same index on every Note.
- Osc 2 modulates whatever its Mixer level: its tab and Tuning knobs wake up while Cross Mod is up.
- The Sub is not modulated; the Ideal Reference keeps Osc 1's plain Harmonics, so the sidebands show beside them.
- A Preset shows it off.

**Acceptance criteria:**
- [x] Two sines at one pitch with Cross Mod up gain sidebands at the 2nd and 3rd Harmonic, absent at 0 (engine test)
- [x] The index is the same an octave apart (engine test, the sideband's level relative to the fundamental within 1 dB)
- [x] An old Patch loads with Cross Mod off; every existing test passes

**Out of scope:**
- Exponential FM, Osc 1 moving Osc 2, Hard Sync

## Decisions (triage, 2026-10-29)

1. Built with the other five: decided by the owner.
2. Linear FM, its index scaled by Osc 2's frequency, so a Patch sounds alike on every Note (exponential FM would detune the Note as it deepens): Claude's call, open to the owner.
3. Full Cross Mod is an index of 4: Claude's call, open to the owner.
4. Revised while building: the knob is labelled FM (the glossary's word; Cross Mod in its tooltip), a small set-and-forget knob, in Osc 1's Pitch row beside its Octave, the Oscillator it moves. Play-sized beside Osc 2's Pulse Width, it pushed Pulse Width off the Waveform picker's side on laptops and phones; "Cross Mod" was too wide a name for the row: Claude's call, open to the owner. Where the row sits is the owner's decision 4 of [90](./90-osc1-octave.md).

## How it was built

- **The engine** (`src/engine/synthEngine.ts`): Osc 2's output into Osc 1's `frequency` through a gain of Cross Mod × 4 × Osc 2's frequency (over Osc 1's Octave ratio, which scales what reaches it), set with each Note and following its Glide.
- **The knob** `crossMod`, labelled FM, a small set-and-forget one (ADR-0008, decision 4), so not in the Quick Setup. The Ideal keeps plain Osc 1, so the sidebands show beside its circles (the tip says so). The glossary's word is FM.
- Tests: "Cross-modulation (issue 89)" in the engine's browser tests; Preset: FM Sidebands (Intervals).
