# 133: The Maths Layer complete

**What to build:** From the v1 grilling ([131](./131-v1.md), decision 7, decided by the owner 2026-10-31): "I would also spend energy into making the math layer more valuable, complete." Every Section and every Viewer writes its maths, always the formula the engine computes, never a textbook stand-in. PRD story 99.

**Blocked by:** none

**Status:** needs-triage · enhancement. To grill with the owner before anything is built: which of the gaps below, and how each is shown.

## What the Maths Layer writes today

Each Waveform's Harmonic series, FM's sidebands and Ring's sums and differences (issues 14 and 109); the Filter's response formula and its Q; the Mixer's levels and the Amp's Sustain in dB; the Effective Cutoff's value.

## The gaps, as a starting point (agreed by the owner, 2026-10-31)

- **The Envelopes:** each stage's curve and its time constant.
- **The LFOs:** the period (1 / Rate) and the swing at the current Depth, in its Destination's unit (octaves, cents, dB).
- **Key Track:** how the Cutoff follows the Note.
- **Glide:** its slide curve.
- **Osc 2's tuning:** the Semitone as a ratio, 2^(s/12), and Detune as a beating rate in Hz at the Note played.
- **The Noise:** its slope, white flat, pink −3 dB per octave.
- **The Viewers:** the Scope's period in ms at the Note played; the Spectrum's Harmonics in Hz.

## What a grilling would settle

- Which of these, and in what order.
- Where each one shows: under its control as the readouts do today, in the Viewer, or in the control's tooltip (with [134](./134-history-in-the-tooltips.md)'s History line beside it).
- How much fits on a phone.
- How each formula is held to the engine: a test per formula, as the Harmonic series' are held to the Ideal Reference.
