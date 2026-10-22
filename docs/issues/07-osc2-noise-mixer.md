# 07: Second Oscillator, Noise and Mixer

**What to build:** Osc 2 with its own Waveform, octave and semitone offset, and Detune in cents. A Noise source. A Mixer with a level per source feeding the Filter. Detune shows beating in a 4-cycle Scope, and Noise shows as a flat floor in the Spectrum.

**Blocked by:** 03

**Status:** done

- [x] Patch Parameters added with defaults that keep the old sound (Osc 2 and Noise at 0%). Migration of saved Patches belongs to ticket 12, since nothing is saved yet
- [x] Engine test: Osc 2 at +1 octave adds energy at 2× the fundamental; Noise raises the broadband floor
- [x] Harmonic Markers stay anchored to Osc 1's fundamental
- [x] Mixer in the signal-flow layout, as the last section of the Oscillators stage, because its output is the Oscillator Tap
- [x] Output safety soft-clipper (ADR-0006); Cycle Lock holds with Noise and follows a detuned mix smoothly
