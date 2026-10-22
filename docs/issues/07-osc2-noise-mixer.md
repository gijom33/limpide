# 07: Second Oscillator, Noise and Mixer

**What to build:** Osc 2 with its own Waveform, octave and semitone offset, and Detune in cents. A Noise source. A Mixer with a level per source feeding the Filter. Detune shows beating in a 4-cycle Scope, and Noise shows as a flat floor in the Spectrum.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Patch Parameters added, with migration defaults for older Patches
- [ ] Engine test: Osc 2 at +1 octave adds energy at 2× the fundamental; Noise raises the broadband floor
- [ ] Harmonic Markers stay anchored to Osc 1's fundamental
- [ ] Mixer block in the signal-flow layout
