# 234: A Tutorial on Pulse Width Modulation

**What to build:** The owner's idea (inbox, 2026-11-05), for the next few days' polish of the learning: "I would also like to have at least one tutorial cover pulse width modulation." Today Pluck sets a Pulse's width by hand (30 %), and two Presets sweep it with LFO 1 (PWM Morph, PWM Bass, "the moving bass of a Juno"), but no Tutorial turns an LFO onto Pulse Width. Polish for v1 ([131](./131-v1.md)), at the owner's word that the next days go to the learning.

**Blocked by:** none (its words lean on [233](./233-a-tutorial-on-each-waves-harmonics.md)'s if that comes first; Claude's call, open to the owner)

**Status:** ready-for-human · enhancement. Built (2026-11-05) on night/2026-11-05, for the owner to try

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

## How it was built

Built on 2026-11-05, test-first, after [233](./233-a-tutorial-on-each-waves-harmonics.md). A new Tutorial, right after Wobble in the order, rebuilds **PWM Bass** from Init in nineteen Steps:

- Osc 1 a Pulse (25 % at first, every fourth line missing), Pulse Width by hand to 10 % (the Scope's needle, every tenth line missing) and back up to 50 % (a square, every other line missing, the gaps sliding along the row as it turns).
- LFO 1's Destination on Pulse Width, its Depth to 80 % (the pulse widening and narrowing by itself, its gaps sliding on the Spectrum, heard as a shimmer), its Rate to 0.8 Hz; the note names it PWM, pulse width modulation.
- The comparison: Osc 2, a saw on the same Note, raised in the Mixer (fuller, but still), its Detune to +7 cents (the two drifting in and out of step, "listen for the likeness"), Detune back to 0 (the drift stops), Osc 2 back down (one Oscillator, still moving).
- Then PWM Bass's thump: the Sub, the 24 dB Slope, the Cutoff at 350 Hz, Resonance, Key Track, the Filter's Velocity, the Filter Envelope's Amount, three of its faders in one Step, and the Amp's Attack, Sustain and Release in one Step.

Wobble's end card now offers PWM Bass, and PWM Bass's offers FM Ladder. The README counts nine Tutorials.

Claude's calls, open to the owner:

1. **The comparison with detune takes four Steps, not one**, since a Step turns one control and the Tutorial must end on PWM Bass exactly (no Detune, Osc 2 silent): in, detuned, Detune back to 0, out. Taking the Detune back while Osc 2 still sounds lets the person hear the drift stop, so each of the four changes something heard.
2. **Pulse Width goes 25 % → 10 % → 50 %**: the Pulse's starting width first (every fourth line missing, as the brief's 25 %), then thinned to a needle, then a square, where LFO 1 sweeps it from.
3. **Nineteen Steps**, Bass having fifteen: the Filter Envelope's three faders (its Release stays as Init has it) and the Amp's three go in one Step each, the drill met in Bass, as Acid and Pluck do with the Filter Envelope's four. The Amp's three in one Step is new.
4. Key Track, a word no Tutorial used before, is said plainly where it comes ("moves the Cutoff with the Note you play"); Detune too ("a fine tuning in cents, hundredths of a piano key").
5. Its menu line: "a pulse whose width an LFO sweeps"; its Listen phrase is a slow bass line at 100 BPM, two Notes in it softer, for the Velocity Step's note.

**To try in the app:** finish Wobble and press its end card's way on, or pick PWM Bass in the Tutorial menu. Hold a Note through the Pulse Width Steps and watch the Scope and the Spectrum's gaps; at the Depth and Rate Steps, hear the shimmer; at the Detune Step, judge whether the likeness with the PWM is clear enough to hear; at the end, the Patch should be PWM Bass. On a phone, check each note reads whole.
