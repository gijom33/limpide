# 98: What follows Osc 2's pitch when its Envelope or a Glide moves it

**What to build:** From the 1.16.0 review (the inbox, 2026-10-30). Three things are sized for Osc 2's knobs, not for where its pitch is: Osc 2's pulse width and FM's depth while Env Amount sweeps it ([93](./93-filter-envelope-on-osc2-pitch.md)), the Ideal's Osc 2 while Env Amount holds it at Amount × Sustain, and FM's depth (with the pulses' delays) after a knob moves mid-Glide.

**Blocked by:** none

**Status:** ready-for-agent · bug. Triaged with the owner on 2026-10-30 (decisions below).

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
- [ ] A 25 % pulse on Osc 2 swept by Env Amount to +12 and +24 semitones measures 25 % throughout and is never silent; the same under an LFO on Osc 2 Pitch
- [ ] FM Bass and Poly Mod Zap sound as before (FM's depth unchanged)
- [ ] With Sustain above 0 and a Note held, the Ideal's Osc 2, Ring and FM marks sit on the measured Spectrum's peaks
- [ ] A regression test: a knob moved mid-Glide leaves the pulse width and FM's index on the Note's pitch at the Glide's end
- [ ] FM's tip states that FM's depth follows the knobs, not the Envelope

**Out of scope:**
- FM's index following Osc 2's pitch (decision 2)
