# The Effective Cutoff is computed by a pure model, not read from the audio graph

The Envelope Timeline, Response Curve and Ghost all need the Effective Cutoff *right now*. Web Audio can't report the value of an `AudioParam` driven by automation or by audio-rate connections (such as the LFO). So a pure modulation model, built from the Patch, the Gate history, the Velocity and the time, computes the Effective Cutoff. The same model produces the automation schedule that the engine applies to the real `AudioParam`s, so the picture and the sound come from a single source of truth.

## Considered Options

- **Read `AudioParam.value`**: it doesn't reflect automation or connected modulation consistently across browsers.
- **An AudioWorklet that reports its state back**: it would be accurate, but ADR-0001 rules out custom DSP, and messages from the audio thread arrive late and in bursts.

## Consequences

The Response Curve comes from an unconnected twin `BiquadFilterNode`, set to the model's Effective Cutoff, through its exact `getFrequencyResponse()`. An engine test checks it against the attenuation measured between the Oscillator and Filter Taps, Harmonic by Harmonic.

The LFO is applied in both places: as a real oscillator connected in the graph, and as the same shape in the model, with its phase integrated across every Rate change since it started. An engine test checks that they agree at the LFO's peak and trough, which covers rate, phase and depth together. Glide follows the same rule: the model's slide uses `setTargetAtTime`'s own curve.
