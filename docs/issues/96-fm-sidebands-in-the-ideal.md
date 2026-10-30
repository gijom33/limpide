# 96: FM's sidebands in the Ideal

**What to build:** With FM up, the Ideal draws Osc 1 as FM makes it, its sidebands included, not plain Osc 1. Today it keeps plain Osc 1 under FM (issue 89's choice, so the sidebands stood out beside its circles), and the owner asked why FM shows no more marks. The owner's ask (inbox, 2026-10-29).

**Blocked by:** none

**Status:** ready-for-agent · enhancement

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
- [ ] Two Sines a fifth apart with FM: each sideband the sound makes within 0.5 dB of the Ideal's mark (engine test)
- [ ] A Saw modulated by a Square in tune: each Harmonic within 1 dB of the Ideal's mark (engine test)
- [ ] FM at 0 draws plain Osc 1, as before (existing unit tests)

**Out of scope:**
- FM's effect on Ring's marks (Ring keeps multiplying plain Osc 1)
- The sidebands of any other tuning with a non-Sine Osc 2

## Decisions

1. Draw FM's sidebands, decided by the owner (of two: draw them, or keep plain Osc 1).
2. The three cases (exact for a Sine, from the waves in whole octaves, plain otherwise): Claude's call, open to the owner.
