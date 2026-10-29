# 89: Cross-modulation, Osc 2 moving Osc 1's pitch

**What to build:** Osc 2 swings Osc 1's frequency at audio rate (linear FM), with a Cross Mod knob: sidebands fan out around Osc 1's Harmonics as it is turned up, from a growl to a clang. Item 2 of the owner's six Oscillator additions (inbox, 2026-10-29).

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## Agent Brief

**Category:** enhancement
**Summary:** A Cross Mod knob on Osc 2's tab sets how far Osc 2 swings Osc 1's frequency.

**Current behavior:**
- The two Oscillators only add in the Mixer.

**Desired behavior:**
- A Cross Mod Parameter (0–100 %, off by default) on Osc 2's tab. Osc 2's wave moves Osc 1's frequency, linearly, by up to four times Osc 2's own frequency at full (a modulation index of 4), the same index on every Note.
- Osc 2 modulates whatever its Mixer level: its tab and Tuning knobs wake up while Cross Mod is up.
- The Sub is not modulated; the Ideal Reference keeps Osc 1's plain Harmonics, so the sidebands show beside them.
- A Preset shows it off.

**Acceptance criteria:**
- [ ] Two sines at one pitch with Cross Mod up gain sidebands at the 2nd and 3rd Harmonic, absent at 0 (engine test)
- [ ] The index is the same an octave apart (engine test, the sideband's level relative to the fundamental within 1 dB)
- [ ] An old Patch loads with Cross Mod off; every existing test passes

**Out of scope:**
- Exponential FM, Osc 1 moving Osc 2, Hard Sync

## Decisions (triage, 2026-10-29)

1. Built with the other five: decided by the owner.
2. Linear FM, its index scaled by Osc 2's frequency, so a Patch sounds alike on every Note (exponential FM would detune the Note as it deepens): Claude's call, open to the owner.
3. Full Cross Mod is an index of 4; the knob is a play-sized one on Osc 2's tab, Osc 2 being the one that modulates: Claude's call, open to the owner.
