# 96: FM's sidebands in the Ideal

**What to build:** With FM up, the Ideal draws Osc 1 as FM makes it, its sidebands included, not plain Osc 1. Today it keeps plain Osc 1 under FM (issue 89's choice, so the sidebands stood out beside its circles), and the owner asked why FM shows no more marks. The owner's ask (inbox, 2026-10-29).

**Blocked by:** none

**Status:** done (2026-10-29). Under FM the Ideal draws Osc 1's sidebands: exactly (the Bessel functions) while Osc 2 is a Sine, from one cycle of the swung wave while Osc 2 is whole octaves from Osc 1, plain Osc 1 otherwise. Within 0.02 dB of the sound in both engine tests. Not yet seen by the owner.

## Agent Brief

**Category:** enhancement
**Summary:** Draw Osc 1's partials under FM: exactly when Osc 2 is a Sine, from the waves when Osc 2 is a whole number of octaves from Osc 1, plain Osc 1 otherwise.

**Current behavior:**
- The Ideal draws Osc 1's plain Harmonics whatever FM is.

**Desired behavior:**
- FM swings Osc 1's frequency by 4 × FM × Osc 2's frequency at Osc 2's wave, so each Harmonic n of Osc 1 is modulated with an index of 4 × FM × n.
- With Osc 2 a Sine, at any tuning: each Harmonic n of Osc 1 gives partials at n × Osc 1 + k × Osc 2 (k = …, −1, 0, 1, …), at its level times the Bessel function J_k of its index (the classic FM result), a negative frequency folded back.
- With Osc 2 another Waveform, a whole number of octaves from Osc 1: both start their cycles together (issue 94), so the FM'd wave repeats and its partials are worked out from one cycle of it.
- Otherwise the Ideal keeps plain Osc 1, as today.
- Osc 1's marks keep their circle. Ring and the Sub are drawn as before.

**Acceptance criteria:**
- [x] Two Sines a fifth apart with FM: each sideband the sound makes within 0.5 dB of the Ideal's mark (engine test; within 0.00)
- [x] A Saw modulated by a Square in tune: each Harmonic within 1 dB of the Ideal's mark (engine test; within 0.02)
- [x] FM at 0 draws plain Osc 1, as before (unit test)

**Out of scope:**
- FM's effect on Ring's marks (Ring keeps multiplying plain Osc 1)
- The sidebands of any other tuning with a non-Sine Osc 2

## Decisions

1. Draw FM's sidebands, decided by the owner (of two: draw them, or keep plain Osc 1).
2. The three cases (exact for a Sine, from the waves in whole octaves, plain otherwise): Claude's call, open to the owner.

## How it was built

- **The index** `FM_INDEX` (4) now lives with the Ideal (`src/music/idealReference.ts`) and the engine imports it, so the two cannot drift.
- **Osc 2 a Sine** (`fmPartials`): each Harmonic n of Osc 1 (its engine level; a pulse as the engine builds it, a swung saw less its copy one width behind) gives n × Osc 1 + k × Osc 2 at |J_k(n × index)|, a negative frequency folded back. `besselJ` is Miller's backward recurrence, normalised; unit-tested against tabled values.
- **Whole octaves** (`fmCycle`): Osc 1's phase is its own plus the running sum of Osc 2's wave times the index, one cycle sampled as `ringProduct` samples Ring's, and Fourier-transformed.
- **The tip** for FM says where the circles fan out and where they stay plain; the glossary's Ideal Reference says the same.
- Tests: "FM’s sidebands in the Ideal (issue 96)" in the engine's browser tests, "FM in the Ideal (issue 96)" in the Ideal's unit tests.
