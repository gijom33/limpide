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

**Status:** done (2026-11-07). Built (2026-11-07) on night/2026-11-07 and merged into main on 2026-11-07, approved by the owner, untried: "Merge the night"; ships with the next release. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes to both").

## Decisions

Decided by the owner (2026-11-07, "Yes to both"):

1. **Pulse Width as the glossary says:** the engine's pulse is high for the share the knob sets, not the words changed to match the engine. Nothing heard changes (a 10 % and a 90 % pulse sound alike); the Scope's picture flips, and then shows what the glossary and synth manuals say. The Pulse's Geek formula, its tests and the PWM Tutorial's words are checked against the new picture.

Decided by the owner (2026-11-08, "Fix first", to 1.27.0's ear stand-in):

2. **Nothing heard changes, beside another Oscillator too:** the pulse keeps the saw's sign, built as before 266 from a saw less its delayed copy, but delayed by the rest of the cycle after the width, so it is still high for the width (decision 1). Piano, Honky-Tonk, Clav and PWM Strings take the width that plays their 1.26.2 wave. Turned over, a pulse beside an in-tune saw had cancelled it at the strike: Piano fell 4.7 dB on C4, Honky-Tonk 7.3 dB on C2, which nobody had chosen. This reverses Claude's call 1 below.

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
- [x] A test: a 10 % pulse is above its middle for 10 % of the cycle; Harmonics' levels unchanged from before
- [x] The claim tests cover items 2 to 12
- [x] The Scope's and the Tutorials' tests pass with the pulse the right way up
- [ ] ~~The fact-checker, at the next release, finds these claims true~~ (the next release's fact-checker, after this was built)

**Out of scope:** the Presets' levels ([258](./258-preset-levels-across-the-keyboard.md)); Felt Piano's Velocity claim (258's).

## How it was built

**Since then (2026-11-08, 1.27.0's release, decision 2):** the engine's pulse is again a saw less its delayed copy, the delay now the low part (one less the width, less each LFO's swing), so it is high for its width and its saw keeps its sign; the Ideal Reference's pulse (Ring's and FM's cycles, FM's sidebands) the same. Piano and Honky-Tonk at 0.65 (were 0.35), Clav at 0.85 and 0.85 (0.15), PWM Strings at 0.6 and 0.4 (0.4 and 0.6): each now within 0.06 dB of its 1.26.2 render on C2, C4, C6 and its chord, PWM Bass, PWM Morph, Thin Pulse, Strings and Shimmer Pad within 0.06 dB as they were (the ear stand-in's renders). A test holds the four on C2, C4 and C6 within 0.5 dB of 1.26.2; it fails on the pulse turned over. After a restart the delay holds the old cycle for the low part, most of a cycle on a narrow pulse, where it held one width: inside the Note's attack. ADR-0001's "a saw minus a delayed copy of itself" holds again.

1. **The pulse, high for its width** (the Decision): the engine still builds it from a saw and a copy of the saw delayed by the width's share of a cycle, but now plays the copy less the saw, not the saw less the copy. It is high from each drop of the saw until the copy's, so a 10 % pulse is above its middle for 10 % of the cycle, at every width and under PWM (the delay moves, the sign never does, so a moving width clicks no more than before). The Harmonics' levels are exactly as before: the wave is the old one turned over. The Ideal Reference's own pulse (for Ring's and FM's cycles) turns with it. The Pulse's Geek formula now says "high for d of each cycle and low for the rest". The Pulse Width tip, the glossary, Thin Pulse's "narrow blip", PWM Morph's "needle" and the Tutorials' "how long each pulse stays up" were already worded this way up and are now true; none changed. Issues 9, 94 and 96 have a dated line.
2. **The words**, each to what review 13 measured, and each with a test that renders it:
   - Slow Beats: "swells and fades, about once every second or two in the middle of the keyboard, faster higher up" (the dips 1.4 to 2 s apart on C4, over 0.85 s on A4, closer on C5).
   - Rolling Fifth: "Osc 2 rolls about two semitones either side of its fifth, from a fourth to nearly a major sixth" (5 to 5.5 and 8.5 to 9 semitones over the Note).
   - Square on Square: "every Harmonic of the lower one present but every fourth, which neither square has" (rungs 4, 8 and 12 under −60 dB, the rest over −30).
   - Init: "a low-pass Filter at 2 kHz" (its Cutoff 2 kHz throughout, the 16th Harmonic over 6 dB under an open Filter's). The Tour's comment says the same.
   - Deep Sweep: "the Response Curve sweeps four octaves, from 200 Hz to 3.2 kHz on C4".
   - Perfect Fifth: "rolling about every two seconds on C4, faster higher up" (the two-cycle pattern comes back after 1.5 to 2.5 s on C4, under two thirds of that on C5).
   - Self-Oscillation: "the Harmonic nearest the Cutoff rings out about 8 dB over the rest" (over 7 dB above Harmonics 1, 2, 4 and 5 on C4, and nothing at 900 Hz between them).
   - Clang Alarm: "between a pure sine and a full metal clang and back two and a half times a second" (a new state each fifth of a second); Trill "there and back six times a second" (its test already heard a new pitch each twelfth of a second; its name now says so).
   - Rave Stab: "a triad a stab of its Notes, their fifths and the Sub under them" (all nine tones of C–E–G).
   - Ride: "a clashing metal cymbal", no longer the 808's recipe.
   - The tips: the LFO plot's "Saw Down jumps up and ramps down"; Hold's "resting a beat after the last tap before starting over"; the Resonance Destination "up to its whole range, but only as far each way as its knob leaves room", as FM's says (Breathing Pad's 30 % swings from 0 to 60 %).
3. **Tests:** the engine's pulse tests (10, 25 and 75 % high for their width, and 90 % and 10 % at an LFO's top and bottom); the claim tests in the Presets' browser tests; the LFO shapes' and Hold's in their unit tests; the Geek formula's. Issue 258's levels hold within 1 dB, unchanged.

**Claude's calls, open to the owner:**

1. ~~**The pulse turned over, not delayed the other way:**~~ (reversed by decision 2, 2026-11-08) playing the copy less the saw keeps the delay a width long. Delaying by the rest of the cycle instead would have kept the sign but made a restart hold the old cycle for most of a cycle rather than a width. One heard change follows, small: a pulse on Osc 2 swinging Osc 1 through FM now swings the other way, so its upper and lower sidebands trade levels (the Ideal Reference follows; no Preset uses a pulse there). A pulse beside a saw or a square on the other Oscillator, in tune, adds with the other sign; detuned, as every factory Preset that does it is, nothing changes on average. The Sub never shares a Harmonic with Osc 1, so PWM Bass is as it was.
2. **Ride's 808 dropped rather than sourced:** its two squares through Ring and Noise are not the 808's six squares, so a source for the 808 would not make the old words true; "a clashing metal cymbal" is a listening word, its fade tested as before.
3. **Rolling Fifth says "nearly a major sixth"**, where the review's wording said "a minor sixth": 8.8 semitones is past a minor sixth (8).
4. **Perfect Fifth loses "(nearly 3:2)"** to stay within five lines on a phone with the longer roll; "2 cents short of 3:2" still says it.
5. **ADR-0001 left as it is:** it says a pulse is "a saw minus a delayed copy of itself"; the decision, a pulse built from a saw and its delayed copy so its width can move, holds, and only the sign has turned. A new ADR for the sign alone seemed more than it needs.

**What to try in the app:**

- Play Thin Pulse and look at the Oscillator Scope: the narrow blip now points up. Turn Pulse Width: the high part widens with the knob. PWM Bass and PWM Morph sound as before.
- Read the words of Slow Beats, Rolling Fifth, Perfect Fifth, Square on Square, Self-Oscillation, Deep Sweep, Clang Alarm, Trill, Rave Stab, Ride and Init, and play each against them.
- Hover the LFO plot, Hold, and the LFO Destination picker for the reworded tips; turn the Synth Geek Layer on and read the Pulse's formula under the hood.
