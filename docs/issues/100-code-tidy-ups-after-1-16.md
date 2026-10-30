# 100: Code tidy-ups after 1.16

**What to build:** The 1.16.0 review's code findings (the inbox, 2026-10-30), nothing visible changed, as [70](./70-code-tidy-ups-after-1-14.md) did after 1.14.

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## Agent Brief

**Category:** enhancement
**Summary:** Close the gaps the review found in the Oscillator work's code, behaviour unchanged.

**Current behavior and what to change:**
- **Model against sound (ADR-0003):** no test compares the engine with the Modulation model for an LFO on FM or for the Filter Envelope on Osc 2's pitch; add one each, as the other Destinations have.
- **One place for Osc 2's tuning:** Osc 2's cents are worked out in three places (the Modulation model, the engine, the Ideal), and the model's Envelope term is reached only by its test. One answer, which the others call.
- **FM's name:** the glossary says FM and to avoid Cross Mod; the code says `crossMod`, `cross`, `crossDepth`, `tuneCross`. Rename what is internal; the Patch field stays as it is, since saved Patches and Share links carry it (say so beside it).
- **FM's index** belongs beside FM's Parameter, not in the Ideal's module.
- **The Ideal:** its description still says Osc 1 and the Sub only; Ring's and FM's partials share one shape (whole-octave cycles, else a power map) written twice; the Spectrum lists the Ideal's sources and picks each mark's shape by hand rather than from one list.
- **Written twice:** the knob's and the fader's release handling; the Demo bar's fill and its segments' fill in the styles.
- **Names:** each Oscillator's pitch over the Note is `ratios`; a style selects on an accessible name.

**Acceptance criteria:**
- [ ] The two new model-against-sound tests pass
- [ ] Osc 2's tuning has one source; the others call it
- [ ] No internal name says Cross Mod; the Patch field's name is explained where it is defined
- [ ] Every existing test passes, unchanged in what it checks

**Out of scope:**
- Any change to how anything sounds or looks
- Renaming the Patch field (it would break saved Patches and Share links)
