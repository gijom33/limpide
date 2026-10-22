# One shared Scope scale, with the Oscillator at a −6 dB Nominal Level

Every Scope uses the same fixed ±1 scale, so heights compare directly from Tap to Tap. To make that possible, the Oscillator runs at a Nominal Level of 0.5 (−6 dB) instead of full scale, leaving headroom for resonant peaks. Without Resonance it never exceeds ±0.8. At extreme Resonance a harmonic sitting on the Cutoff can reach about ±1.8, and the Scope then shows "OVER ±1" (see ADR-0001). The master volume sits *after* the Amp Tap and is set at 0.45, so even that worst case stays under full scale at the output. Web Audio is floating-point, so the lower internal level costs nothing in sound quality; only the final output can clip.

## Considered Options

- **Per-Scope auto-range** (±1/2/4/8 steps). We built it and dropped it: each Scope's scale differed, so a learner couldn't tell that Resonance had made the Filter Tap louder than the Oscillator Tap.
- **Full-scale Oscillator with a ±2 shared scale**: the common case (no Resonance) would fill only half of every Scope.

## Consequences

- Anything that adds sources (Osc 2, Noise) must respect the headroom. A Scope shows "OVER ±1" if a Tap exceeds it, and the trace is clamped.
- The Amp Tap shows the Voice before the master volume, so at full Sustain the Amp Tap equals the Filter Tap.
