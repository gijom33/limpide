# One shared Scope scale, with the Oscillator at a −6 dB Nominal Level

Every Scope uses the same scale, linear to ±1, so heights compare directly from Tap to Tap. To make that possible, the Oscillator runs at a Nominal Level of 0.5 (−6 dB) instead of full scale, leaving headroom for resonant peaks. Without Resonance it never exceeds ±0.8. At extreme Resonance a harmonic sitting on the Cutoff can reach about ±1.8, which the Scope draws compressed into a margin beyond ±1 (see ADR-0001). The master volume sits *after* the Amp Tap and is set at 0.45 (divided by √Voices when several play), so even that worst case stays under full scale at the output. Web Audio is floating-point, so the lower internal level costs nothing in sound quality; only the final output can clip.

## Considered Options

- **Per-Scope auto-range** (±1/2/4/8 steps). We built it and dropped it: each Scope's scale differed, so a learner couldn't tell that Resonance had made the Filter Tap louder than the Oscillator Tap.
- **Full-scale Oscillator with a ±2 shared scale**: the common case (no Resonance) would fill only half of every Scope.

## Consequences

- Several sources at full level (Osc 1 + Osc 2 + Sub + Noise), plus Resonance, can exceed any fixed headroom. A Scope draws what exceeds ±1 compressed into a margin, never cut flat: the Viewers never hide it (first it was clamped under an "OVER ±1" label, reversed in f3aa691). The Amp Scope says LIMITING while the safety clipper bends the sound. What you *hear* is protected by a safety soft-clipper after the Amp Tap. It is exactly linear below 0.8 of full scale and bends smoothly so the output never passes 1. A `DynamicsCompressorNode` was rejected because it adds make-up gain to every sound and a few milliseconds of lookahead delay.
- The Amp Tap shows the Voice (or, by default, every Voice summed: ADR-0007) before the master volume, so at full Sustain the Amp Tap equals the Filter Tap.
