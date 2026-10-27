# The Amp Tap listens after the Volume and the tremolo

**Status:** accepted · **Date:** 2026-10-27 · **Decided by:** the owner (grilling of [issue 62](../issues/62-volume-knob.md))

Amends [ADR-0006](./0006-shared-scope-scale-with-nominal-level.md)'s consequence "at full Sustain the Amp Tap equals the Filter Tap" (ADR-0006 is frozen, ADR-0010).

The Amp now has a Volume knob (issue 62), and an LFO can aim at Volume for tremolo (issue 53). Both act after the Amp Envelope and before the Amp Tap: a gain per Voice whose level is the knob's, dipped by the LFOs. So the Amp Scope and Spectrum show what you hear: they shrink with the knob and pulse with the tremolo. ADR-0006's shared scale is unchanged; the Amp Tap equals the Filter Tap at full Sustain only when the Volume is at 100 % and no LFO aims at Volume. Every Preset keeps its Volume at 100 %.

## Considered Options

- **The Volume after the Amp Tap**, beside the master: the Amp Tap would keep ADR-0006's equality, but the Viewers would not show the knob or the tremolo, the reason both were wanted.

## Consequences

- The Amp Viewers show the Volume and the tremolo; the Timeline's Amp Envelope is drawn times both.
- The output's level (the master, the safety clipper) is unchanged: Volume can only lower it.
