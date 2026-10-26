# 41: Hiss at high Resonance and high Cutoff

**What to build:** Find out whether the Filter hisses or aliases at high Resonance with the Cutoff near the top of its range (20 kHz), and if it does, fix it. The idea came from elsewhere ("apparently there is a better way"), so it starts as a diagnosis: reproduce it, measure it, then pick a remedy. From the inbox, 2026-10-25.

**Blocked by:** none

**Status:** diagnosed, not reproduced (2026-10-26): the engine adds no hiss. Kept as a regression test; open only for where the claim came from.

Remedies that stay within [ADR-0001](../adr/0001-native-web-audio-nodes-over-custom-dsp.md) (native Web Audio nodes) come first: keeping the Cutoff a margin below the Nyquist frequency, taming the Q as the Cutoff nears it, or running the AudioContext at a higher sample rate. A remedy that needs custom DSP (an oversampled filter in an AudioWorklet) would supersede ADR-0001 and needs a new ADR first. It would also move Limpide toward a native plugin (the roadmap).

- [ ] Record where the claim came from, and what "hissing" means there
- [x] An engine test that renders a Note at high Resonance and Cutoff and measures the energy that is not the Note's Harmonics (noise, aliasing): red if the hiss is real. `betweenHarmonicsDb` in `src/test/measure.ts` (Blackman–Harris windowed, 8 bins either side of each Harmonic); the tests in `synthEngine.browser.test.ts` hold it 60 dB under the Harmonics at full Resonance and a 16 or 20 kHz Cutoff, both Slopes, and a control case with a little Noise in the Mixer shows they go red when there is hiss
- [x] Measured, both Slopes, every Mode (A2, A4, A5; Cutoff 2 to 20 kHz; Resonance 0 to full). Not listened to: the measurements leave nothing to hear
- [x] The remedy: none needed, ADR-0001 stands

## What was measured (2026-10-26)

- **Low-pass:** everything between the Harmonics stays 70 to 93 dB under them, in every setting. Full Resonance near the top raises it by about 10 dB on A2 (−82 to −72 dB), all of it right at the Cutoff: the resonant peak's skirt, not noise, and no aliasing (no folded spikes).
- **High-pass and band-pass** at a high Cutoff come to about −50 dB, but only where the Filter has taken nearly everything away (the output peaks at 0.00 to 0.03): quieter still in absolute terms. Some of it is above 20 kHz.
- **Notch:** −81 to −93 dB throughout.
- **What one hears there** is the resonant peak lifting the saw's top Harmonics, between 10 and 20 kHz: a bright sizzle made of the Harmonics themselves, as a resonant low-pass should sound. The output's safety limiter is already oversampled 4×, and at these levels stays in its linear range.
