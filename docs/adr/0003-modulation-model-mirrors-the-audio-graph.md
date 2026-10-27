# The Effective Cutoff is computed by a pure model, not read from the audio graph

**Status:** accepted · **Date:** 2026-10-21 · **Decided by:** Claude, accepted by the owner

The Envelope Timeline and the Response Curve need the Effective Cutoff *right now*. Web Audio can't report the value of an `AudioParam` driven by automation or by audio-rate connections (such as the LFO). So a pure modulation model, built from the Patch, the Gate history, the Velocity and the time, computes the Effective Cutoff. The same model produces the automation schedule that the engine applies to the real `AudioParam`s, so the picture and the sound come from a single source of truth.

## Considered Options

- **Read `AudioParam.value`**: it doesn't reflect automation or connected modulation consistently across browsers.
- **An AudioWorklet that reports its state back**: it would be accurate, but ADR-0001 rules out custom DSP, and messages from the audio thread arrive late and in bursts.

## Consequences

The Response Curve comes from unconnected twin `BiquadFilterNode`s (one per Filter stage, so the 24 dB Slope is drawn as heard), set to the model's Effective Cutoff, through its exact `getFrequencyResponse()`. An engine test checks it against the attenuation measured between the Oscillator and Filter Taps, Harmonic by Harmonic.

Each of the two LFOs is applied in both places: as a real oscillator connected in the graph, and as the same shape in the model, with its phase integrated across every Rate change since it started. The model keeps that integration as running cycle counts, so it can forget old Rate changes (and old Gate events and Patches, kept by age, not count) without moving the past the Timeline draws. An engine test checks that they agree at the LFO's peak and trough, which covers rate, phase and depth together. Glide follows the same rule: the model's slide uses `setTargetAtTime`'s own curve.
