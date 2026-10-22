# 08: Filter Modes and Slope

**What to build:** Low-pass, high-pass, band-pass and notch Filter Modes, with a 12 dB or 24 dB Slope. The 24 dB Slope uses two cascaded biquads with compensated per-stage Q, so that Resonance feels the same in both Slopes (ADR-0001). The Response Curve and Ghost reflect the mode and Slope.

**Blocked by:** 04

**Status:** done

- [x] Engine test per mode: the pass and stop regions are where expected
- [x] Engine test: 24 dB attenuates about twice as much (in dB) as 12 dB one octave past the Cutoff
- [x] Engine test: the resonance peak height is comparable between Slopes at the same Resonance setting
- [x] Mode (icon picker) and Slope controls on the Filter heading line, with tooltips
- [x] Engine test: for every Mode × Slope the measured attenuation matches the drawn Response Curve within 0.5 dB per Harmonic
- [x] The Envelope Timeline shades each Mode's pass band (passBand, tested)
