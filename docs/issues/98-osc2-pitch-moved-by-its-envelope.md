# 98: What follows Osc 2's pitch when its Envelope or a Glide moves it

**What to build:** From the 1.16.0 review (the inbox, 2026-10-30). Three things are sized for Osc 2's knobs, not for where its pitch is: Osc 2's pulse width and FM's depth while Env Amount sweeps it ([93](./93-filter-envelope-on-osc2-pitch.md)), the Ideal's Osc 2 while Env Amount holds it at Amount × Sustain, and FM's depth (with the pulses' delays) after a knob moves mid-Glide.

**Blocked by:** none

**Status:** ready-for-human · bug. Triaged with the owner on 2026-10-30 (decisions below). Built (2026-10-31): the four decisions; for the owner to listen to a pulse under Env Amount, FM Bass and Poly Mod Zap, and to look at the Ideal on a held Note, before the release.

## What happens

1. **A pulse on Osc 2 under Env Amount.** A pulse's width is a delay sized for its Oscillator's pitch ([90](./90-osc1-octave.md): "each pulse's width is its knob's, at whatever pitch its Oscillator sounds"). Env Amount moves Osc 2's pitch at audio rate but not the delay: a 25 % pulse swept up 12 semitones sounds at 50 % at the Envelope's peak, and at 24 semitones the delay spans a whole cycle and Osc 2 falls silent. An LFO on Osc 2 Pitch had the same gap before 1.16.0. No Preset uses a pulse on Osc 2 with Env Amount.
2. **FM's depth under Env Amount.** FM swings Osc 1 by FM × 4 × Osc 2's frequency as the knobs set it ([89](./89-cross-modulation.md)), so as the Envelope raises Osc 2 the index falls (and rises as it falls below). Two Presets use FM with Env Amount, FM Bass and Poly Mod Zap, and were tuned as it is (the issue first said five; counted at triage).
3. **The Ideal under Env Amount with Sustain above 0.** While a Note is held, Osc 2 rests Amount × Sustain semitones off its knobs; the Ideal places Osc 2's squares, the Ring diamonds and the whole-octave FM marks from the knobs alone.
4. **A knob moved during a Glide** sets FM's depth and the pulses' delays for the pitch at that moment, cutting their slide short, until the next Note.

## Decisions

Decided by the owner at triage, 2026-10-30, unless marked otherwise. All four claims were checked in the engine's code first: each holds.

1. **The pulse keeps its width at any pitch.** One native shaping stage (a WaveShaper, which ADR-0001 allows) takes everything that moves the Oscillator's pitch and corrects the pulse's delay, so the width stays the knob's. It covers Env Amount and the LFOs on Osc 2 Pitch, which also ends [26](./26-two-lfos-more-destinations.md)'s known limit. Covering every pitch movement of both Oscillators the same way (the Pitch and Detune LFOs, the pitch bend) is Claude's call, open to the owner.
2. **FM's index keeps falling as Osc 2 rises,** as analogue cross-modulation does: the depth stays sized from the knobs, the two Presets keep their sound, and FM's tip says so.
3. **The Ideal follows a held Envelope:** while a Note is held, it places Osc 2's marks, the Ring diamonds and the FM marks at Osc 2's resting pitch, Amount × Sustain semitones off its knobs. Back on the knobs once the Note is released: Claude's call, open to the owner.
4. **A knob moved during a Glide** no longer cuts the pulses' delays and FM's depth short: they slide on to the Note's pitch with the Oscillators.

## Agent Brief

**Category:** bug
**Summary:** What is sized for an Oscillator's pitch follows that pitch when an Envelope, an LFO or a Glide moves it, except FM's depth, which stays analogue.

**Current behavior:**
- A pulse's delay is set from the Note and the knobs only, so a pitch moved by Env Amount or an LFO changes the pulse's width; at +24 semitones Osc 2 falls silent.
- The Ideal places Osc 2 from its knobs while a held Note keeps it Amount × Sustain semitones away.
- A knob moved mid-Glide sets the pulses' delays and FM's depth once, at that moment's pitch, while the Oscillators slide on.

**Desired behavior:**
- A pulse sounds at its knob's width whatever moves its Oscillator's pitch, smoothly at audio rate, with native nodes only.
- FM's depth is unchanged by Env Amount (the index falls as Osc 2 rises); FM's tip says that the depth is set by the knobs.
- While a Note is held with Env Amount and Sustain above 0, the Ideal draws Osc 2's marks, the Ring diamonds and the FM marks at the resting pitch; after release, at the knobs.
- After a knob moves during a Glide, the pulses' delays and FM's depth reach the Note's pitch with the Oscillators.

**Key interfaces:**
- The Voice's pulse Oscillators and FM gain, the Ideal Reference, FM's tip

**Acceptance criteria:**
- [x] A 25 % pulse on Osc 2 swept by Env Amount to +12 and +24 semitones measures 25 % throughout and is never silent; the same under an LFO on Osc 2 Pitch
- [x] FM Bass and Poly Mod Zap sound as before (FM's depth unchanged)
- [x] With Sustain above 0 and a Note held, the Ideal's Osc 2, Ring and FM marks sit on the measured Spectrum's peaks
- [x] A regression test: a knob moved mid-Glide leaves the pulse width and FM's index on the Note's pitch at the Glide's end
- [x] FM's tip states that FM's depth follows the knobs, not the Envelope

**Out of scope:**
- FM's index following Osc 2's pitch (decision 2)

## How it was built

- **The pulse** (`createVoiceOscillator` in the engine). The delay is now the width (the knob, plus each LFO's swing of it) times the Note's period, times one cycle's length at the pitch the Oscillator sounds over the Note's. That last factor is a WaveShaper: it takes everything the Oscillator's detune sums to, in cents, and gives 2^(−cents/1200) at audio rate. Env Amount, both LFOs (Pitch, Osc 2 Pitch, Detune), the bend and the tuning knobs all move the pitch through that detune, so the width stays the knob's whatever moves it. The Note's period slides with a Glide, so a knob turned mid-Glide no longer touches it.
- **FM's depth** is unchanged by Env Amount (decision 2): FM Bass, Poly Mod Zap and Thin Pulse render sample for sample as before (rendered on both engines and compared, difference 0). PWM Morph differs by rounding only, at −89 dB. FM's tip now says the depth is set by the knobs, not by Env Amount, and that FM thins as the Envelope takes Osc 2 up.
- **A knob turned mid-Glide** sets FM's depth for where the slide has got to, then slides it on to the Note's with the Oscillators (decision 4). A Note handed over ahead of the clock gets the new knobs' depth at its start too: before, it kept the depth worked out from the knobs as they were when it was handed over (found by the review, a bug older than this issue).
- **The Ideal** (`idealPartials`, now with an options object `{ fmKept, gateOn }`, and `osc2Rest`): while the Note's Gate is on, it places Osc 2, Ring and FM at Env Amount × Sustain semitones off Osc 2's knobs, with FM's index divided by as much (the depth stays the knobs'). The Spectra that draw the Ideal ask the engine whether the newest Note's Gate is on, from the Modulation model's `sounding`, so Hold counts as held.
- **The glossary**: Pulse Width, FM and Ideal Reference say what follows a moved pitch and what does not.
- **Tests.** Engine (browser): a 25 % pulse measured as 25 % (the share of each 50 ms spent on one side) throughout a sweep of Env Amount to +12 and +24, never silent; under an LFO on Osc 2 Pitch; on Osc 1 under a bend; a control at 50 %. FM's depth on the knobs: Osc 2 held a fifth up by Env Amount sounds as Osc 2 tuned a fifth up at FM over the fifth. The Ideal on a held Envelope: Osc 2's squares, Ring's diamonds and FM's circles within 1 dB of the measured peaks. Mid-Glide (the regression tests): a pulse at 25 % and FM's sidebands as the Note's played alone at the Glide's end (the pulse test fails on the engine before this issue); a Note handed over ahead with FM's knob turned before it starts sounds that knob's FM (it failed by 9 dB before the fix). Unit: the Ideal held and released, the Viewer store's held and released answers, FM's tip.
- The Preset level tests straighten the limiter's curve to hear what reaches it. They used to find it as "the shaper with a curve longer than two points", which now also caught the pulse's shaper. They now find it as the one whose curve goes negative.

## Claude's calls, open to the owner

1. **The shaping stage takes the Oscillator's whole detune,** the tuning knobs included, not only what moves it. A pulse's width was already kept across Osc 1's Octave and Osc 2's tuning (90), and now one path keeps it for everything. It follows ±10 octaves off the Note, past what everything together reaches. The delay is capped at one second, so a pulse far below the keyboard (under about 1 Hz) still drifts, as before.
2. **"Held" is the newest Note's Gate on: its key down, or Hold keeping it.** Through the Attack and Decay, the Ideal already draws Osc 2 where it will rest, not where it is on its way. Once released, it is back on the knobs at once, while the Filter Envelope's Release is still bringing Osc 2 down. Under the Hold rhythm, whose Gate opens and closes on each step, the Ideal moves between the two with it.
3. **Known limit: whole octaves under a held Envelope.** Where Osc 2's resting pitch is a whole number of octaves from Osc 1, the Ideal works FM and Ring out from one cycle of the two waves, as if they started their cycles together. They do at a Note's start, but not once the Envelope has moved Osc 2 there, so with waves richer than a Sine those marks can be off. Sines under Ring are unaffected. No Preset rests there: FM Bass and Poly Mod Zap fall to a Sustain of 0, so they rest on their knobs.
4. **A pulse's period still slides through a Glide as an exponential in the period,** where the Oscillators slide as one in frequency, as before this issue: mid-slide the width is a little off, and exact at the Glide's end.

## Review (`/code-review` since 1495f91, 2026-10-31)

Fixed:
- **Spec:** a Note handed over ahead of the clock kept the old knobs' FM depth when a knob turned before it started (above, with its test).
- **Standards:** two comments no longer described the code (Osc ratios in the engine, the kept depth in the Viewer store). The Ideal's growing positional arguments became an options object (CODING_STANDARDS: many positional arguments). "Held" became the glossary's Gate (`gateOn`), which also ends a name the Spectrum already used for something else. The engine's "at once, or over a Glide" moves now share one helper, `moveTo` (one shape, one place). Clearer names for the pulse's nodes and the Ideal's resting ratio. The cycle curve's size is derived from its range and step. The width checks in the tests share one helper.

Noted, not changed:
- The whole-octave limit in the Ideal under a held Envelope (Claude's call 3) falls short of "the marks sit on the measured peaks" there. It is a limit, not a regression.
- "FM Bass and Poly Mod Zap sound as before" rests on a one-off comparison of the two engines' renders, which cannot live in the repository. The committed guard is the test of FM's depth on the knobs, with the Preset level tests.
- No end-to-end test follows the Gate from the page to the Spectrum's marks: the Ideal and the Viewer store are tested, and App's wiring is one line. The Spectrum shows only a count of its marks, not where they are.
- The FM tip's test checks only for its key words.
- The Preset level tests find the limiter by its curve going negative: another shaper whose curve goes negative would need them changed again.
- The Gate is passed through five files to reach the Ideal (App, TapViewers, the Spectrum, the view settings, the Viewer store). That is the way the Ideal reaches the Spectrum today, and bundling what the Ideal needs is left for a later tidy-up.

