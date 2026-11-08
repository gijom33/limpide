# Review 13: the fact-checker, on 1.27.0

Checked: the words that changed in `git diff v1.26.2...main`. That means every Preset description changed in `src/patch/presets.ts` (issues 258, 266 and 267), every changed tip in `src/ui/tips.ts`, the Tour's new and reworded lines in `src/tutorial/tour.ts`, the Pulse's and Detune's formulas "Under the hood" in `src/music/geek.ts`, and the `CONTEXT.md` lines that make a claim about sound. Beside them, the pulse wave that issue 266 turned over, against the Pulse Width tip, the glossary, the Pulse's Geek formula and the words that describe its picture. No History line is new or changed: `src/ui/history.ts` and `docs/research/134-history-in-the-tooltips.md` are as they were in v1.26.2. Only an issue's acceptance list changed (134). Sound claims were rendered offline in Chromium from a temporary engine test (`zzReview13`, run with `npx vitest run --project engine`, since deleted), with the safety limiter made straight, as in the last run. The claim tests in `src/patch/presets.browser.test.ts` were run as well (the issue 258, 266 and 267 blocks, "the Presets do what their words say" and issue 125's), and all 85 passed. Unless a line says otherwise, a Note is C4 at Velocity 1, on the Preset as shipped.

## False claims

1. **The Tour's last card** ("Your turn") says: "Now play the piano’s keys, or press the ringed Song for a tune to play over." You cannot play over the Song. A Note played by hand ends it (`shows.ts`: `onHeld` → `stop('song')`; the glossary's Song: "A Note, the Demo or the Song button stops it"). The card's second line holds ("As the Song plays, flip the Presets with › … or turn a knob, and hear the sound change under the tune"), because changing a Patch does not stop it. Wording that holds: "Now play the piano’s keys, or press the ringed Song for a tune to shape the sound under."
2. **The C16's positions notice** (`CONTROLLER_TIPS.c16.positions`) says: "The C16’s knobs are sending positions, so they turn the wrong way below the middle". Read as Relative #1 (`relativeDelta`: value − 64), a position below 64 is always a step down and one above 64 always a step up, whichever way the knob turns. So below the middle a knob turned up moves its control down, and above the middle a knob turned down moves it up. Each half is wrong for one direction. This is not a sound claim, but it is a changed tip. Wording that holds: "so below the middle they only turn things down, and above it only up".

## Loose claims

1. **Zap Pluck**: "every strike starts at full FM, a bright metallic zap, and melts to a pure sine as it decays … A 24 dB Filter at 2.5 kHz keeps the high Notes from biting." The share of power off the carrier was measured in 20 ms windows, over Harmonics 1 to 15:
   - C4: 88 % at the strike, 95 % at 50 ms, 25 % at 0.3 s, 1.6 % at 0.45 s. C5: 83 %, 92 %, 20 % and 3 %. The claim holds on both.
   - C6: 19 % at the strike. The zap is mostly gone.
   - C7: 0.13 % at the strike. It is a pure sine from the start.

   The Filter does what the new sentence says, but on the top Notes it also takes the zap that the first sentence promises "every strike". Wording that holds: "… keeps the high Notes from biting, and by C7 leaves a near-sine". Or keep the line and accept it as a choice issue 267 made (its call 3 asks the owner's ear).
2. **Fast Beats and Detune's new readout**: Fast Beats' words have not changed ("the beating is so fast it becomes roughness"), but Detune's new formula says "past 20 a second, beats blur into roughness". On C4 the readout gives 6.12 Hz beats, which matches the render (6.11 Hz on the fundamental). The roughness comes from the upper Harmonics, which beat 12, 18 and 24 times a second and faster. So the two texts now read against each other on the middle of the keyboard. This is minor. A wording that agrees with both: "the upper Harmonics beat so fast they become roughness".

## Checked and true

- **The pulse, turned over** (issue 266). Rendered on C3, through Osc 1 and through Osc 2 alike, as the share of each cycle above the wave's middle: 10 % → 10.3 %, 25 % → 25.0 %, 50 % → 49.7 %, 75 % → 74.8 %, 90 % → 89.7 %. A 10 % pulse peaks at +0.23 and dips to −0.04, so the narrow part points up.
  - The Pulse Width tip ("How much of each cycle the pulse spends high") holds now, and so does the glossary ("spent high").
  - The Pulse's Geek formula holds: "high for d of each cycle and low for the rest", and aₙ = 4 sin(π n d) / (π n). Harmonics 2, 3, 4, 5 and 10 against the 1st match |sin(π n d) / (n sin(π d))| within 0.01 dB at 10, 25, 50, 75 and 90 %. The missing ones (4th at 25 %, 10th at 10 %, the evens at 50 %) are at −66 to −88 dB.
  - The words that describe the picture now hold: Thin Pulse's "narrow blip", PWM Morph's "needle", and the Tutorials' "stays up a quarter of the time", "how long each pulse stays up" and "up half the time".
- **Detune's beats readout and formula** (Δf = |p f₁ − q f₂|, the lowest pair within a quarter-tone; the glossary's Synth Geek Layer line). Readout against the render on C4, as the strongest swing of a low Harmonic's level over 8 s:

  | Patch | Readout | Rendered |
  |---|---|---|
  | Slow Beats | 0.61 Hz | 0.61 Hz |
  | Honky-Tonk | 2.12 Hz | 2.12 Hz |
  | Two saws, Osc 2 an octave down at +10 cents (the "1/2" case) | 1.52 Hz | 1.51 Hz, on the 1st Harmonic |
  | Two saws a fifth apart (the "3/2" case) | 0.89 Hz | 0.89 Hz, on the 3rd Harmonic; the 1st and 2nd do not beat |
  | Two squares a fifth apart | "no beats" | right: their Harmonics never meet |
  | Fast Beats | 6.12 Hz | 6.11 Hz |

  "1/1 in unison, 1/2 an octave down, 3/2 a fifth up" is the right way round (f₂ / f₁ ≈ p / q).
- **Presets reworded by issue 266**, held by their claim tests: Slow Beats, Rolling Fifth (5.2 to 8.8 semitones over the Note: "a fourth to nearly a major sixth"), Square on Square, Init ("at 2 kHz": Key Track 0 by default, so on every Note), Deep Sweep, Perfect Fifth (590.7 / f s: 2.26 s on C4, faster higher up), Clang Alarm, Trill and Rave Stab. Self-Oscillation, measured on C2 to C6: the 3rd Harmonic, nearest the Cutoff under full Key Track, stands 8.3 to 8.5 dB over Harmonics 1, 2, 4 and 5 on every one ("about 8 dB" holds). Ride's "a clashing metal cymbal" is a listening word. Its fade holds: −20.5 dBFS at the strike, −42 at 1 s, −52.7 at 1.5 s.
- **Presets reworded by issue 258**:
  - Resonant Ring: the ring sits at the Cutoff, and Key Track carries it. The Harmonic most boosted against an open Filter sits just under the key-tracked Cutoff on every Note: 523 Hz against 531 on C2, 785 against 862 on C3, 1308 against 1400 on C4, 2093 against 2274 on C5, and 3140 against 3695 on C6, each 17 to 21 dB up.
  - Vowel: Key Track 0.7 is "most of the way", and its claim tests and issue 258's levels hold. One aside: with its LFO stopped, only one to three Harmonics are within 10 dB of the loudest (C4: the 3rd alone). Its unchanged "a few Harmonics" relies on the LFO's movement.
  - Felt Piano: "louder, hardly brighter". At Velocity 1 against 0.35 it is 9.2, 9.4 and 11.1 dB louder on C2, C4 and C6, with its Harmonic centroid unchanged (1.00 to 1.03 times the Note).
  - Kick and Tom: on Pink Noise, their Filters and Envelopes unchanged. The Tom settles at about 120 Hz against the Kick's 55, which holds "an octave above".
- **The tips**:
  - The LFO plot's "Saw Down jumps up and ramps down" (`lfoShape`: −saw).
  - Hold's "resting a beat after the last tap before starting over" (`rhythm()`: the last tap's beat, then a beat of rest, rounded to the next beat).
  - The Resonance Destination's "up to its whole range, but only as far each way as its knob leaves room" (`LFO_LAWS`: perDepth 1, room min(R, 1 − R)).
  - Glow's default of Scopes (`rememberedSettings`).
  - The Timeline's and the Envelope Timeline's aftertouch line, dashed as LFO 1's (`timeline.ts`).
  - The Geek overlay's "the Mixer’s levels (Ring’s aside), the Sustain and the Volume in dB" (`GAINS`).
- **The Tour**: "On a computer the letter keys play too, from A" (KeyA is C), the Song's card as its way out, and the Tutorials card's "start with Sub Ladder".
- **CONTEXT.md**: Pulse Width ("spent high") now matches the engine. The Synth Geek Layer's Detune line matches the readout above. The changed Glow, Envelope Timeline and Tour lines match the code. The MIDI lines (Mapping, MIDI Learn, Pickup) make no claim about sound.
- **History**: no line is new or changed since v1.26.2, so nothing to check against the research file. The last run found all 34 lines true.

Not checked: issue 266's own call 1, that a pulse on Osc 2 modulating Osc 1 through FM now swaps its upper and lower sidebands, with the Ideal following. No Preset or tip claims it.

Counts: 2 false (both outside the sound, in the Tour and the C16 notice), 2 loose (Zap Pluck's top Notes, Fast Beats beside the new readout). The rest of the changed words held: about 35 Presets' words, 8 tips, 2 formulas and 5 glossary lines.

## For the inbox

1. The Tour's last card offers the Song as "a tune to play over", but playing a Note stops the Song, so the tune can be shaped under, not played over (review 13).
2. The C16's positions notice says its knobs "turn the wrong way below the middle", but read as Relative #1 they only turn things down below the middle and only up above it (review 13).
3. Zap Pluck promises a zap on "every strike", but its new 2.5 kHz Filter leaves 19 % of the strike off the carrier on C6 and 0.1 % on C7, where it is a sine from the start (review 13).
4. Fast Beats says its beating "becomes roughness", while Detune's new readout shows 6.12 Hz beats on C4 and its formula puts roughness past 20 a second (review 13).
