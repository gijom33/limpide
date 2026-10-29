# 90: An Octave on Osc 1

**What to build:** Osc 1 can sound up to two octaves below or above the Note played, as Osc 2 already can. Item 3 of the owner's six Oscillator additions (inbox, 2026-10-29). Found while planning it: a pulse's width ignores its Oscillator's own tuning, so Osc 2 a pulse at +2 octaves and 25 % falls silent; fixed with it.

**Blocked by:** none

**Status:** done (2026-10-29). Osc 1 has an Octave (−2 to +2) that moves it and the Sub; Osc 2 counts from the Note played; each pulse keeps its width at any tuning. The Split Octave Bass Preset shows it.

## Agent Brief

**Category:** enhancement
**Summary:** An Octave knob on Osc 1's tab moves Osc 1 and the Sub by whole octaves; each pulse keeps its width whatever its tuning.

**Current behavior:**
- Osc 1 always sounds at the Note played; Osc 2's Octave and Semitone are offsets from it.
- A pulse's width is set from the Note's frequency, not from its Oscillator's: Osc 2's pulse an octave up is twice as wide as its knob says.

**Desired behavior:**
- An Osc 1 Octave Parameter (−2 to +2, whole octaves, 0 by default) on Osc 1's tab, beside Pulse Width. It moves Osc 1 and the Sub, which stays below Osc 1.
- Osc 2's Octave and Semitone are measured from the Note played, as before for every Patch whose Osc 1 is at 0.
- Cycle Lock, the Harmonic Markers and the Ideal Reference count from Osc 1's pitch (the Sub's when it sounds). The piano's pitch marker and Key Track stay on the Note played.
- Each pulse's width is its knob's, at whatever pitch its Oscillator sounds.

**Acceptance criteria:**
- [x] Osc 1 at −1 sounds an octave down, and the Sub an octave below that (engine test)
- [x] Osc 2 a 25 % pulse at +1 and +2 octaves keeps every 4th Harmonic missing (engine test, failing before the fix)
- [x] Cycle Lock's fundamental follows Osc 1's Octave (engine test); the Ideal's ratios follow it (unit test)
- [x] An old Patch loads with Osc 1 at 0; every existing test passes

**Out of scope:**
- A Semitone or Detune on Osc 1

## Decisions (triage, 2026-10-29)

1. Built with the other five: decided by the owner.
2. Osc 1's Octave moves the Sub with it but not Osc 2, whose offsets now count from the Note played (as on a Minimoog's ranges); the glossary's Transpose says so: Claude's call, open to the owner.
3. The pulse width bug is fixed in this issue, since an Octave on Osc 1 would hit it too: Claude's call, open to the owner.
4. Each Oscillator's tab has its own pitch row under its Waveform: Osc 1's Octave and FM on Osc 1's tab, Osc 2's Tuning (Octave, Semitone, Detune, Env Amount) on Osc 2's. Osc 1's Octave and FM did not fit beside Pulse Width on phones and 872 to 1000 px windows, and a third row would have pushed the Filter below a phone's first screen. This ends issue 19's one Tuning row shared under both tabs: decided by the owner (2026-10-29).

## How it was built

- **The Parameter** `osc1Octave` (`src/patch/patch.ts`), a small knob in Osc 1's Pitch row, with FM (decision 4).
- **The rows** (`src/ui/App.tsx`, `src/ui/Tabs.tsx`): each Oscillator tab holds two rows; the Tabs lost their shared row, and the Mixer's panel is marked to fill the tallest panel's height, its faders stretching to it. Tests: the first test of `e2e/oscTabs.spec.ts` and the Tuning test of `e2e/voices.spec.ts`, rewritten for decision 4.
- **The engine** (`src/engine/synthEngine.ts`): Osc 1's and the Sub's `detune` carry the Octave; Cycle Lock's fundamental is multiplied by it. Each Oscillator's pitch ratio to the Note is kept, and its pulse's delay (and PWM swing) is set from its own frequency: the bug, measured at +2 octaves and 25 %, was a 4th Harmonic 8.6 dB above the fundamental where it should be missing.
- **The Ideal** (`src/music/idealReference.ts`) puts Osc 2 at its offset less Osc 1's Octave. The glossary's Transpose and Detune count from the Note played.
- Tests: "Osc 1 Octave (issue 90)" in the engine's browser tests, one Ideal unit test; Preset: Split Octave Bass (Bass).
