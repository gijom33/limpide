# 41: Hiss at high Resonance and high Cutoff

**What to build:** Find out whether the Filter hisses or aliases at high Resonance with the Cutoff near the top of its range (20 kHz), and if it does, fix it. The idea came from elsewhere ("apparently there is a better way"), so it starts as a diagnosis: reproduce it, measure it, then pick a remedy. From the inbox, 2026-10-25.

**Blocked by:** none

**Status:** closed by the owner (2026-10-27): no issue. "Hiss" was the wrong word for what was heard. Before that: diagnosed, not reproduced; the engine adds no hiss, and the one case the article raises that could apply, fast modulation at high Resonance, neither blows up nor leaves full scale. Kept as regression tests.

Remedies that stay within [ADR-0001](../adr/0001-native-web-audio-nodes-over-custom-dsp.md) (native Web Audio nodes) come first: keeping the Cutoff a margin below the Nyquist frequency, taming the Q as the Cutoff nears it, or running the AudioContext at a higher sample rate. A remedy that needs custom DSP (an oversampled filter in an AudioWorklet) would supersede ADR-0001 and needs a new ADR first. It would also move Limpide toward a native plugin (the roadmap).

- [x] Record where the claim came from, and what "hissing" means there: [Zero-delay feedback filters](https://synthengineer.com/blog/zero-delay-feedback-filters) (synthengineer.com), shared by the owner's friend on 2026-10-26. It never mentions hiss. It argues for zero-delay feedback (topology-preserving transform, after Zavalishin) over filters with a unit delay in their feedback loop: those mistune near the Nyquist frequency, can blow up at high resonance, and click under fast cutoff modulation. See below for what applies here
- [x] An engine test that renders a Note at high Resonance and Cutoff and measures the energy that is not the Note's Harmonics (noise, aliasing): red if the hiss is real. `betweenHarmonicsDb` in `src/test/measure.ts` (Blackman–Harris windowed, 8 bins either side of each Harmonic); the tests in `synthEngine.browser.test.ts` hold it 60 dB under the Harmonics at full Resonance and a 16 or 20 kHz Cutoff, both Slopes, and a control case with a little Noise in the Mixer shows they go red when there is hiss
- [x] Measured, both Slopes, every Mode (A2, A4, A5; Cutoff 2 to 20 kHz; Resonance 0 to full). Not listened to: the measurements leave nothing to hear
- [x] The remedy: none needed, ADR-0001 stands

## What was measured (2026-10-26)

- **Low-pass:** everything between the Harmonics stays 70 to 93 dB under them, in every setting. Full Resonance near the top raises it by about 10 dB on A2 (−82 to −72 dB), all of it right at the Cutoff: the resonant peak's skirt, not noise, and no aliasing (no folded spikes).
- **High-pass and band-pass** at a high Cutoff come to about −50 dB, but only where the Filter has taken nearly everything away (the output peaks at 0.00 to 0.03): quieter still in absolute terms. Some of it is above 20 kHz.
- **Notch:** −81 to −93 dB throughout.
- **What one hears there** is the resonant peak lifting the saw's top Harmonics, between 10 and 20 kHz: a bright sizzle made of the Harmonics themselves, as a resonant low-pass should sound. The output's safety limiter is already oversampled 4×, and at these levels stays in its linear range.

## The zero-delay feedback article, against our Filter (2026-10-26)

- **Most of it is about a different filter.** Its critique targets the naive digital filters with a unit delay inside the feedback loop (the Chamberlin state-variable filter, a naive ladder). `BiquadFilterNode` is not one: it is the analogue response taken through the bilinear transform with the Cutoff prewarped, so the resonant peak lands exactly on the Cutoff, up to the Nyquist frequency. A linear zero-delay state-variable filter is the same transform of the same analogue filter: with the Cutoff and Resonance held still, both have the same response, sample for sample in theory. Its "frequency warping" is shared by both, and prewarping only pins the Cutoff.
- **Stability at a held setting:** a biquad with fixed coefficients is stable at any finite Q; ours stops at a 24 dB peak.
- **Self-oscillation and saturation** (tanh in the loop, the ladder's "singing") are character, not hiss, and ADR-0001 already gives them up knowingly.
- **What could apply: fast modulation.** A biquad's state is not the circuit's state, so moving its coefficients quickly at high Q can click or overshoot, where a zero-delay filter glides. Our Cutoff and Q move at audio rate (the LFOs and the Filter Envelope reach `detune` and `Q`). The measurements above are all at held settings, so this case is untested.

## Fast modulation (2026-10-27)

An engine test now drives the worst case the knobs allow: LFO 1 at 20 Hz and full Depth on the Cutoff, a Filter Envelope at full Amount snapping shut in 50 ms on a Note every eighth of a second, full Resonance, both Slopes, a low and a high Note. Every sample stays finite and inside full scale: the biquads never blow up. Whether a trained ear hears the zipper or overshoot a zero-delay filter would avoid is a listening question, not a measured one; the owner can judge it on Wobble or Acid with Resonance turned up. Nothing measured calls for custom DSP, so ADR-0001 stands.
