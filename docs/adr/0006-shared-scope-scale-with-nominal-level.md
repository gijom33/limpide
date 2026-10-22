# One shared Scope scale, with the Oscillator at a −6 dB Nominal Level

Every Scope uses the same fixed ±1 scale, so heights compare directly from Tap to Tap. To make that possible, the Oscillator runs at a Nominal Level of 0.5 (−6 dB) instead of full scale, leaving headroom for resonant peaks (worst case about ±0.7 at the Filter Tap). The master volume sits *after* the Amp Tap and makes up the level, so the output is as loud as before. Web Audio is floating-point, so the lower internal level costs nothing in sound quality; only the final output can clip.

## Considered Options

- **Per-Scope auto-range** (±1/2/4/8 steps). We built it and dropped it: each Scope's scale differed, so a learner couldn't tell that Resonance had made the Filter Tap louder than the Oscillator Tap.
- **Full-scale Oscillator with a ±2 shared scale**: the common case (no Resonance) would fill only half of every Scope.

## Consequences

- Anything that adds sources (Osc 2, Noise) must respect the headroom. A Scope shows "OVER ±1" if a Tap exceeds it, and the trace is clamped.
- The Amp Tap shows the Voice before the master volume, so at full Sustain the Amp Tap equals the Filter Tap.
