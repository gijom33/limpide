# 14: Maths Layer

**What to build:** A toggle reveals the quantities behind the sound: Q next to Resonance, dB readouts, the Harmonic formula for the current Waveform next to the Ideal Reference, the Response Curve formula, and Effective Cutoff numbers on the Envelope Timeline. It is off by default and remembered.

**Blocked by:** 04, 05

**Status:** done. "Maths" is a fifth toggle in the Display panel's Show group, off by default and remembered with the others. On, Resonance reads as the Filter's Q ("Q 0.71", "Q 0.84 ×2" with two stages at 24 dB) and the Mixer's levels and the Amp's Sustain read in dB, in the control's own value line (sized for it while the layer is on, so nothing moves); the Oscillator Spectrum shows the Harmonic formula of Osc 1's Waveform and the Filter Spectrum the Response Curve's formula for the Mode and Slope, in a corner chip; the Timeline prints the Effective Cutoff beside its dot. The content is data in `src/music/maths.ts`, tested against the series the Viewers draw.

- [x] Resonance → Q mapping exposed and tested
- [x] Formula content defined as data per Waveform and Filter Mode
- [x] Toggle remembered across sessions
