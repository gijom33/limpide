# 266: Preset and tip words that hold, and Pulse Width as the glossary says

**What to build:** Review 13's findings over every Preset's and tip's words on 1.26.2 (the inbox, 2026-11-07; [report](../reviews/2026-11-07/13-fact-checker.md)), rendered through the engine; all 34 History lines held.

1. **Pulse Width is the share of the cycle spent low,** where the tip and the glossary say high (a 10 % pulse is above 0 for 90 % of the cycle), as the Pulse's Geek formula says.
2. **Slow Beats' swell "a few times a second":** 4 cents beat once every 1.65 s on C4 (0.98 s on A4).
3. **Rolling Fifth's Osc 2 "rolls an octave either side of Osc 1":** its Depth of 0.15 swings it ±1.8 semitones, from 5.2 to 8.8 above the Note.
4. **Square on Square's "every Harmonic of the lower one present":** every fourth rung (4, 8, 12) is missing, since neither square has it.
5. **The LFO plot's tip, "Saw Down drops and ramps down":** a falling saw jumps up and ramps down.
6. **Init's "open low-pass Filter"** is at 2 kHz, taking C4's 16th Harmonic 12 dB down; Deep Sweep's Curve "crosses the whole Spectrum" over 200 Hz to 3.2 kHz, 4 of its 10 octaves.
7. **Perfect Fifth's "rolling once every two or three seconds"** holds only from about G3 to D4: the roll takes 590.7 / f seconds, 1.1 s on C5.
8. **Self-Oscillation's "the Cutoff itself starts to sing":** the Filter sings only on a Harmonic, the one nearest the Cutoff boosted 8.5 dB; nothing sounds between Harmonics, and with no input the Preset is silent.
9. **Counted cycles where the words count hops:** Clang Alarm's "two and a half times a second" and Trill's "six times a second" hop 5 and 12 times; Rave Stab's "six pitches" are eight with its Sub.
10. **Ride's "the recipe of an 808's cymbal"** has no source in the repository, and the 808's cymbal is usually described as six squares through filters, with no Ring or Noise.
11. **The Hold tip says the last tap starts the rhythm over,** but the loop rests about a beat before it starts again.
12. **The LFO Destination tip's Resonance swings "across its range",** but like FM only as far each way as its knob leaves room (Breathing Pad from 0 to 0.6).

**Blocked by:** none

**Status:** ready-for-agent · bug. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes to both").

## Decisions

Decided by the owner (2026-11-07, "Yes to both"):

1. **Pulse Width as the glossary says:** the engine's pulse is high for the share the knob sets, not the words changed to match the engine. Nothing heard changes (a 10 % and a 90 % pulse sound alike); the Scope's picture flips, and then shows what the glossary and synth manuals say. The Pulse's Geek formula, its tests and the PWM Tutorial's words are checked against the new picture.

## Agent Brief

**Category:** bug
**Summary:** Eleven Preset and tip claims reworded to what the engine does, and the engine's pulse turned the right way up for Pulse Width.

**Current behavior:** As the twelve items above say; review 13's report gives each measure.

**Desired behavior:**
- The pulse is high for the share of the cycle Pulse Width sets, at every width and under PWM, with no click when the width moves; the Geek formula and every Pulse test follow.
- Items 2 to 12 each worded to hold, as measured, in the short-words rule of [156](./156-one-line-shorter-words.md); Ride's line either sourced (added to History's sources) or no longer naming the 808.
- The Presets' claim tests cover each changed claim, as the existing claim tests do.

**Key interfaces:**
- The Oscillators' pulse wave
- The Pulse's Geek formula
- The factory Presets' words and their claim tests
- The tips and the glossary
- The PWM Tutorial's words

**Acceptance criteria:**
- [ ] A test: a 10 % pulse is above its middle for 10 % of the cycle; Harmonics' levels unchanged from before
- [ ] The claim tests cover items 2 to 12
- [ ] The Scope's and the Tutorials' tests pass with the pulse the right way up
- [ ] The fact-checker, at the next release, finds these claims true

**Out of scope:** the Presets' levels ([258](./258-preset-levels-across-the-keyboard.md)); Felt Piano's Velocity claim (258's).
