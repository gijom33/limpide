# 08: Filter Modes and Slope

**What to build:** Low-pass, high-pass, band-pass and notch Filter Modes, with a 12 dB or 24 dB Slope. The 24 dB Slope uses two cascaded biquads with compensated per-stage Q, so that Resonance feels the same in both Slopes (ADR-0001). The Response Curve and Ghost reflect the mode and Slope.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Engine test per mode: the pass and stop regions are where expected
- [ ] Engine test: 24 dB attenuates about twice as much (in dB) as 12 dB one octave past the Cutoff
- [ ] Engine test: the resonance peak height is comparable between Slopes at the same Resonance setting
- [ ] Mode and Slope controls
