# 04: Filter Response Curve and Ghost

**What to build:** The Filter Tap's Spectrum shows the Filter's real Response Curve (including the Resonance peak) at the Effective Cutoff, and a Ghost shading the energy present at the Oscillator Tap that the Filter removed. Turning Cutoff or Resonance moves the curve and Ghost live. This introduces the Modulation model (ADR-0003); at this stage the Effective Cutoff is the Cutoff plus Velocity.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Modulation model returns the Effective Cutoff, tested
- [ ] `filterResponse(frequencies)` delegates to the real biquads
- [ ] Engine test: `filterResponse` agrees with the measured attenuation between the Oscillator and Filter Taps
- [ ] Ghost region computed from the two Taps' spectra, tested with synthetic spectra
- [ ] Response Curve and Ghost drawn, following knob changes
