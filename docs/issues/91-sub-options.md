# 91: The Sub one or two octaves down, square or sine

**What to build:** The Sub can sit two octaves below Osc 1 as well as one, and be a sine as well as a square: a rounder, deeper weight for basses. Item 4 of the owner's six Oscillator additions (inbox, 2026-10-29).

**Blocked by:** none

**Status:** done (2026-10-29). The Sub's Octave (−1 or −2) and Waveform (square or sine) are two choices on the Oscillators' Sub & Noise tab; the Sine Sub Two Down Preset shows them.

## Agent Brief

**Category:** enhancement
**Summary:** Two choices for the Sub, its Octave (−1 or −2) and its Waveform (square or sine), beside its fader.

**Current behavior:**
- The Sub is always a square an octave below Osc 1.

**Desired behavior:**
- A Sub Octave choice, −1 (the default) or −2, and a Sub Waveform choice, square (the default) or sine, in the Mixer, each Learnable by MIDI.
- Cycle Lock, the Harmonic Markers and the Ideal Reference count from the Sub's pitch while it sounds, one or two octaves down; the Ideal draws its sine or square series.
- A Preset shows it off.

**Acceptance criteria:**
- [x] The Sub at −2 sounds two octaves below Osc 1; as a sine it has no 3rd Harmonic (engine tests)
- [x] Cycle Lock's fundamental is a quarter of Osc 1's with the Sub at −2 (engine test); the Ideal follows both choices (unit test)
- [x] An old Patch loads with a square an octave down; every existing test passes

**Out of scope:**
- More Sub Waveforms, or a Sub on Osc 2

## Decisions (triage, 2026-10-29)

1. Built with the other five: decided by the owner.
2. Choices, not knobs, since each has two values, in the Mixer's name column under LEVELS with the Noise's colour (a row under the faders took their height): Claude's call, open to the owner. Superseded by decision 3.
3. The Sub's and the Noise's choices on a Sub & Noise tab of their own, between Osc 2 and the Mixer, so no tab is taller than two rows and the Mixer is its faders alone: decided by the owner (layout B of three; the others were a Mod tab for FM and Env Amount, or both new tabs).

## How it was built

- **The choices** `subOctave` and `subWaveform` (`src/patch/patch.ts`), Learnable by MIDI (their names in `src/midi/mappings.ts` and the Tutorials'), on the Sub & Noise tab (decision 3), its Octave above its Waveform, the Noise's Colour under them, their captions one width so the choices line up: −1 and −2, and the Sub's two Waveforms as icons. The Mixer keeps LEVELS alone in its name column; five faders beside it are as wide as the Envelopes' where they fit, never under 40 px (`src/styles.css`).
- **The engine** (`src/engine/synthEngine.ts`): each Voice builds both Sub waves once and switches between them; the second octave is in the Sub's `detune`. Cycle Lock counts from the Sub at either octave.
- **The Ideal** (`src/music/idealReference.ts`): the root is 2 or 4 Harmonics up from the Sub, the Sub's series its own Waveform's; `idealReference` is now built from `idealPartials`, so it follows both.
- Tests: "the Sub’s Octave and Waveform (issue 91)" in the engine's browser tests and the Ideal's unit tests; Preset: Sine Sub Two Down (Shapes).
