# 04: Filter Response Curve and Ghost

**What to build:** The Filter Tap's Spectrum shows the Filter's real Response Curve (including the Resonance peak) at the Effective Cutoff, and a Ghost shading the energy present at the Oscillator Tap that the Filter removed. Turning Cutoff or Resonance moves the curve and Ghost live. This introduces the Modulation model (ADR-0003); at this stage the Effective Cutoff is the Cutoff. Velocity on the Cutoff moved to ticket 10, which adds that amount Parameter.

**Blocked by:** 02

**Status:** done

- [x] Modulation model returns the Effective Cutoff, tested
- [x] `filterResponse(frequencies)` delegates to the real biquads
- [x] Engine test: `filterResponse` agrees with the measured attenuation between the Oscillator and Filter Taps
- [x] Ghost region computed from the two Taps' spectra, only at Harmonic columns so that valley leakage never shades, tested with synthetic spectra. Resonance gain is shown separately, as a boost
- [x] Ideal rings × Response Curve on the Filter Tap: where each Harmonic should land after the Filter
- [x] Response Curve and Ghost drawn, following knob changes
