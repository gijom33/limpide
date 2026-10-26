# 41: Hiss at high Resonance and high Cutoff

**What to build:** Find out whether the Filter hisses or aliases at high Resonance with the Cutoff near the top of its range (20 kHz), and if it does, fix it. The idea came from elsewhere ("apparently there is a better way"), so it starts as a diagnosis: reproduce it, measure it, then pick a remedy. From the inbox, 2026-10-25.

**Blocked by:** none

**Status:** to diagnose

Remedies that stay within [ADR-0001](../adr/0001-native-web-audio-nodes-over-custom-dsp.md) (native Web Audio nodes) come first: keeping the Cutoff a margin below the Nyquist frequency, taming the Q as the Cutoff nears it, or running the AudioContext at a higher sample rate. A remedy that needs custom DSP (an oversampled filter in an AudioWorklet) would supersede ADR-0001 and needs a new ADR first. It would also move Limpide toward a native plugin (the roadmap).

- [ ] Record where the claim came from, and what "hissing" means there
- [ ] An engine test that renders a Note at high Resonance and Cutoff and measures the energy that is not the Note's Harmonics (noise, aliasing): red if the hiss is real
- [ ] Heard and seen in the Filter Spectrum, both Slopes, every Mode
- [ ] The remedy, the test green, the Viewers still matching the sound (ADR-0003)
