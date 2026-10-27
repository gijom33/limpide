# 61: The Ideal Reference from every Oscillator

**What to build:** From the owner's questions (2026-10-27): "Why is there no ideal ring at harmonics 2 for the Tremolo Keys patch?" (its Osc 1 is a Triangle, odd Harmonics only; the 2 is Osc 2, a sine an octave up) and "I think the ideal rings should represent the combined impact of all oscillators."

**Blocked by:** none

**Status:** done (2026-10-27)

## Decisions (grilling, 2026-10-27, decided by the owner)

1. **Every Oscillator:** Osc 1, Osc 2 and the Sub, each its Fourier series at its Mixer level. Noise stays out: it has no Harmonics to predict.
2. **Each where its Harmonics fall:** Osc 2 off an octave lands between Osc 1's Harmonics (a fifth shows two ladders); a few cents off with Detune. The Harmonic Markers stay on the fundamental (the Sub's pitch when it plays).
3. **Shapes, and every mark shown** (the owner's own, replacing the grilling's first answer, a combined level): a circle for Osc 1, a square for Osc 2, a triangle for the Sub; on a Harmonic two share, both show, each at its own level. How they add depends on how their waves line up, which theory cannot know.

- [x] `idealPartials` in `src/music/idealReference.ts`, with tests: every source, where it falls, both on a shared Harmonic, the Sub's pitch as the fundamental, in order
- [x] The Spectrum draws each source's marks in its shape, thinned per source where Harmonics crowd, so two on one Harmonic both show
- [x] The Ideal's tooltip and CONTEXT.md
