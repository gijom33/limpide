# 98: What follows Osc 2's pitch when its Envelope or a Glide moves it

**What to build:** From the 1.16.0 review (the inbox, 2026-10-30). Three things are sized for Osc 2's knobs, not for where its pitch is: Osc 2's pulse width and FM's depth while Env Amount sweeps it ([93](./93-filter-envelope-on-osc2-pitch.md)), the Ideal's Osc 2 while Env Amount holds it at Amount × Sustain, and FM's depth (with the pulses' delays) after a knob moves mid-Glide.

**Blocked by:** none

**Status:** needs-triage · bug. Questions for the owner below.

## What happens

1. **A pulse on Osc 2 under Env Amount.** A pulse's width is a delay sized for its Oscillator's pitch ([90](./90-osc1-octave.md): "each pulse's width is its knob's, at whatever pitch its Oscillator sounds"). Env Amount moves Osc 2's pitch at audio rate but not the delay: a 25 % pulse swept up 12 semitones sounds at 50 % at the Envelope's peak, and at 24 semitones the delay spans a whole cycle and Osc 2 falls silent. An LFO on Osc 2 Pitch had the same gap before 1.16.0. No Preset uses a pulse on Osc 2 with Env Amount.
2. **FM's depth under Env Amount.** FM swings Osc 1 by FM × 4 × Osc 2's frequency as the knobs set it ([89](./89-cross-modulation.md)), so as the Envelope raises Osc 2 the index falls (and rises as it falls below). Five Presets use FM with Env Amount and were tuned as it is.
3. **The Ideal under Env Amount with Sustain above 0.** While a Note is held, Osc 2 rests Amount × Sustain semitones off its knobs; the Ideal places Osc 2's squares, the Ring diamonds and the whole-octave FM marks from the knobs alone.
4. **A knob moved during a Glide** sets FM's depth and the pulses' delays for the pitch at that moment, cutting their slide short, until the next Note.

## Questions for the owner

1. Fix the pulse (1) by making the width follow the Envelope's pitch at audio rate, which needs a shaping stage on the delay (ADR-0001 allows native nodes only), or by keeping the gap and saying so in Env Amount's tip?
2. Should FM's index stay fixed as Env Amount moves Osc 2 (the depth following it), or keep today's falling index, which the five Presets were tuned with?
3. Should the Ideal place Osc 2 at its resting pitch (Amount × Sustain) while a Note is held, or stay on the knobs as it does for the LFOs?
4. Item 4 is a plain bug: fix it (the slide carries on to its Note after a knob moves).
