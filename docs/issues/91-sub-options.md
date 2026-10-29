# 91: The Sub one or two octaves down, square or sine

**What to build:** The Sub can sit two octaves below Osc 1 as well as one, and be a sine as well as a square: a rounder, deeper weight for basses. Item 4 of the owner's six Oscillator additions (inbox, 2026-10-29).

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## Agent Brief

**Category:** enhancement
**Summary:** Two choices for the Sub, its Octave (−1 or −2) and its Waveform (square or sine), beside its fader.

**Current behavior:**
- The Sub is always a square an octave below Osc 1.

**Desired behavior:**
- A Sub Octave choice, −1 (the default) or −2, and a Sub Waveform choice, square (the default) or sine, in the Mixer under the faders, each Learnable by MIDI.
- Cycle Lock, the Harmonic Markers and the Ideal Reference count from the Sub's pitch while it sounds, one or two octaves down; the Ideal draws its sine or square series.
- A Preset shows it off.

**Acceptance criteria:**
- [ ] The Sub at −2 sounds two octaves below Osc 1; as a sine it has no 3rd Harmonic (engine tests)
- [ ] Cycle Lock's fundamental is a quarter of Osc 1's with the Sub at −2 (engine test); the Ideal follows both choices (unit test)
- [ ] An old Patch loads with a square an octave down; every existing test passes

**Out of scope:**
- More Sub Waveforms, or a Sub on Osc 2

## Decisions (triage, 2026-10-29)

1. Built with the other five: decided by the owner.
2. Choices, not knobs, since each has two values, placed in the Mixer beside the Sub's fader with the Noise's colour: Claude's call, open to the owner.
