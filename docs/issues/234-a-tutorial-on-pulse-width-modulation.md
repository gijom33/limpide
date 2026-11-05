# 234: A Tutorial on Pulse Width Modulation

**What to build:** The owner's idea (inbox, 2026-11-05), for the next few days' polish of the learning: "I would also like to have at least one tutorial cover pulse width modulation." Today Pluck sets a Pulse's width by hand (30 %), and two Presets sweep it with LFO 1 (PWM Morph, PWM Bass, "the moving bass of a Juno"), but no Tutorial turns an LFO onto Pulse Width. Polish for v1 ([131](./131-v1.md)), at the owner's word that the next days go to the learning.

**Blocked by:** none (its words lean on [233](./233-a-tutorial-on-each-waves-harmonics.md)'s if that comes first; Claude's call, open to the owner)

**Status:** ready-for-agent · enhancement. The three questions answered by the owner, 2026-11-05, as recommended: "233 and 234 recommendations are okay."

## What it can show

A Pulse at 50 % is a square; narrowed, the Scope's pulse thins to a needle and the Spectrum's gaps move (every 4th Harmonic missing at 25 %, every 10th at 10 %), the sound going nasal and thin. An LFO on Pulse Width sweeps the gaps along the ladder of Harmonics, which the ear hears as a slow, rich shimmer, like two Oscillators slightly detuned, from one Oscillator.

## Decisions

Decided by the owner, 2026-11-05, Claude's recommendations accepted ("233 and 234 recommendations are okay."):

1. **A Tutorial of its own**, ending on PWM Bass's sound: a square, Pulse Width by hand, then LFO 1 onto Pulse Width, its Depth and Rate, then the Sub and the Filter's thump. Pluck already uses a fixed width and stays as it is.
2. **After Wobble**, the first Tutorial to use an LFO, so "an LFO turns a knob for you" is already known and this one moves it onto another knob.
3. **One Step compares it with detune**: Osc 2 a saw a few cents off, heard after the PWM, so the person hears why PWM was the one-Oscillator way to the same movement.

## Agent Brief

**Category:** enhancement
**Summary:** A new Tutorial, after Wobble, that builds PWM Bass's sound: a Pulse's width by hand, then LFO 1 sweeping it, compared with a detuned second Oscillator.

**Current behavior:** Pluck sets a fixed Pulse Width; the PWM Morph and PWM Bass Presets sweep it with LFO 1, but no Tutorial turns an LFO onto Pulse Width.

**Desired behavior:**
- A new Tutorial in the order right after Wobble: from a square, Pulse Width turned by hand (the Scope's pulse thinning, the Spectrum's gaps moving: every 4th Harmonic missing at 25 %), then LFO 1's Destination on Pulse Width, its Depth and Rate, heard as a slow shimmer from one Oscillator.
- One Step brings in Osc 2 a few cents off and asks the person to hear the likeness, then takes it out again: PWM as the one-Oscillator way to that movement.
- It ends on PWM Bass's sound (the Sub and the Filter's thump on each Note), as each Tutorial ends on its Preset's.
- If [233](./233-a-tutorial-on-each-waves-harmonics.md) is built first, its words on the Pulse may be recalled; every word is still said plainly the first time this Tutorial uses it.
- The words follow the Tutorials' word rules and their tests, and the Tutorial plays on a phone as the others do.

**Out of scope:** a change to PWM Bass or PWM Morph, to the LFOs or to Pulse Width's range.
