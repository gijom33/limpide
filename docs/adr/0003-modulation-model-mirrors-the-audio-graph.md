# The Effective Cutoff is computed by a pure model, not read from the audio graph

The Envelope Timeline, Response Curve and Ghost all need the Effective Cutoff *right now*. Web Audio can't report the value of an `AudioParam` driven by automation or by audio-rate connections (such as the LFO). So a pure modulation model, built from the Patch, the Gate history, the Velocity and the time, computes the Effective Cutoff. The same model produces the automation schedule that the engine applies to the real `AudioParam`s, so the picture and the sound come from a single source of truth.

## Considered Options

- **Read `AudioParam.value`**: it doesn't reflect automation or connected modulation consistently across browsers.
- **An AudioWorklet that reports its state back**: it would be accurate, but ADR-0001 rules out custom DSP, and messages from the audio thread arrive late and in bursts.

## Consequences

The Response Curve comes from an unconnected twin `BiquadFilterNode`, set to the model's Effective Cutoff, through its exact `getFrequencyResponse()`. An engine test checks it against the attenuation measured between the Oscillator and Filter Taps, Harmonic by Harmonic.

The LFO is applied in both places: as an audio-rate connection in the graph and as the same formula in the model. Engine tests have to check that the two stay in agreement.
