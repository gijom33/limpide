# 133: The Maths Layer complete

**What to build:** From the v1 grilling ([131](./131-v1.md), decision 7, decided by the owner 2026-10-31): "I would also spend energy into making the math layer more valuable, complete." Every Section and every Viewer writes its maths, always the formula the engine computes, never a textbook stand-in. PRD story 99.

**Blocked by:** its four slices, [167](./167-geek-numbers-osc2-and-noise.md), [168](./168-geek-numbers-envelopes-and-glide.md), [169](./169-geek-numbers-lfos-and-key-track.md) and [170](./170-geek-numbers-viewers.md)

**Status:** ready-for-human · enhancement. Grilled with the owner, 2026-10-31; built in four slices (decision 5), each ready for an agent. Done when the four are. The layer is renamed the Synth Geek Layer by [165](./165-the-synth-geek-layer.md).

## Decisions (grilling, 2026-10-31, decided by the owner)

Claude's recommendations, each accepted ("ok"):

1. **All seven gaps** below come in: every control and Viewer writes what the engine computes.
2. **Two places, two jobs:** a live number beside the control or on the Viewer (as "Q 1.32" today), changing as one plays; and the formula in the control's tip under "Under the hood", above History ([134](./134-history-in-the-tooltips.md)). A gap with no live number has its formula only.
3. **On a phone** the live number shows where a value shows today (in the name's place while the control moves); formulas stay in the touch-and-hold tip.
4. **Held to the engine:** every live number has a test against the engine's own output, as the Harmonic series is held to the Ideal Reference.
5. **Four slices,** each its own issue: Osc 2's tuning and the Noise ([167](./167-geek-numbers-osc2-and-noise.md)); the Envelopes and Glide ([168](./168-geek-numbers-envelopes-and-glide.md)); the LFOs and Key Track ([169](./169-geek-numbers-lfos-and-key-track.md)); the Viewers ([170](./170-geek-numbers-viewers.md)).
6. **The Note the numbers use:** the last Note played; before any, A4 (440 Hz), said ("at A4").
7. **Osc 2's tuning:** Semitone shows its ratio ("×1.498" at +7), Octave ×2, ×4, ½; Detune its beating rate at the Note ("2.1 Hz beats"); the formulas 2^(s/12) and Δf = f·(2^(c/1200) − 1) under the hood.
8. **The LFOs:** under Rate its period ("0.50 s"); under Depth the swing in the Destination's own unit ("±1.2 st" on Pitch, "±0.8 oct" on the Cutoff, "±6 dB" on Volume, "±12 %" on Pulse Width); a synced Rate its period at the tempo.
9. **The Envelopes:** Attack a straight rise; Decay and Release curves with a time constant τ (the time to go 63 % of the way), the faders' readouts gaining it ("300 ms · τ 65 ms"); the tip explains τ and the curve.
10. **Key Track** shows the Cutoff at the Note played ("Cutoff here: 2.83 kHz"), the Effective Cutoff's figure; **Glide** has its curve's formula in its tip, no live number.
11. **The Viewers:** each Scope the period and frequency of the Note in a corner ("3.82 ms · 261.6 Hz"); the Spectrum's hover readout adds the Harmonic's number ("n = 3") when on one; the Oscillator Spectrum's corner gives the Noise's slope while it is up ("pink: −3 dB/oct"), the Noise's formula under the hood.

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
