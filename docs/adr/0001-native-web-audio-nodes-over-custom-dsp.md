# Native Web Audio nodes, not custom DSP in an AudioWorklet

The Voice is built from native Web Audio nodes: `OscillatorNode` with built-in or `PeriodicWave` waveforms, `AudioBufferSourceNode` for Noise, `BiquadFilterNode` for the Filter (two in series for the 24 dB Slope), and `GainNode` for the Mixer and Amp. The main reason is honesty of the viewers. `BiquadFilterNode.getFrequencyResponse()` gives the *exact* gain curve of the filter we actually hear, so the Response Curve and Ghost can never disagree with the sound. Native oscillators are also band-limited, so the Spectrum shows clean Harmonics instead of aliasing that we would have to explain away.

## Considered Options

- **Custom DSP in an AudioWorklet** (for example a Moog-style ladder filter). It has more character and self-oscillates, but we would have to derive and maintain its frequency response analytically, and the drawn curve would only approximate the sound.
- **A synthesis library such as Tone.js.** Convenient, but it wraps the nodes we need to reach (biquads, analysers) and adds a dependency without making the viewers easier to build.

## Consequences

- The Filter has biquad character, not ladder character. High Resonance peaks sharply but doesn't "sing" like analogue hardware.
- A resonant biquad boosts its peak by 10^(Q/20), up to 16× at maximum Resonance, which clipped the output. A gain stage after the Filter cuts the level by the cube root of that boost (at most −8 dB). Together with the Nominal Level in ADR-0006, this keeps every Tap within about ±0.7, much as analogue ladder filters lose level as resonance rises. The Filter Tap sits after this gain stage, so the Response Curve must include it.
- Two cascaded biquads at the same Q stack their resonance peaks. The 24 dB Slope must use a reduced per-stage Q so that Resonance feels the same in both Slopes.
- Waveforms other than the built-ins, such as pulse with arbitrary Pulse Width, are built as `PeriodicWave`s from their Fourier series. The same series also feeds the Ideal Reference.
