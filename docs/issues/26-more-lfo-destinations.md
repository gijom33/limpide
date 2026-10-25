# 26: More LFO destinations

**What to build:** The LFO reaches six destinations instead of three, picked with a selector built like the Patch bar: ‹ and › step through the list, and the name in the middle opens a menu of all six, grouped by stage in the stage's colour. One destination at a time (PRD story 82). Settled in a grilling round, 2026-10-24.

| Destination | Stage | At full Depth | Ring on |
| --- | --- | --- | --- |
| Cutoff | Filter | ±2 octaves (unchanged) | Cutoff |
| Resonance | Filter | its whole range | Resonance |
| Pitch | Osc | ±1 semitone, both Oscillators and the Sub (unchanged) | the piano's pitch marker (issue 21) |
| Osc 2 Pitch | Osc | ±1 octave, Osc 2 only | Osc 2's Semitone |
| Detune | Osc | ±50 cents, Osc 2 only (the Detune knob's range) | Detune |
| Pulse Width | Osc | ±40 points (unchanged) | both Pulse Widths |

Not a destination: Volume (tremolo), which has no clean picture; nor Noise or Osc 2 levels, for now.

**Blocked by:** 21

**Status:** not started

- [ ] Patch: the new destinations; Patches and share links with the old three still load unchanged
- [ ] Engine: each destination moves what it names by the amount above (engine tests on the rendered sound)
- [ ] Modulation model and rings: the reach of the LFO on Resonance, Osc 2 Pitch and Detune (unit tests); rings on those knobs
- [ ] Selector: arrows step and wrap, the menu picks, grouped and coloured by stage; keyboard and screen reader reach every destination; MIDI Learn still maps a control to it
- [ ] Tips: each destination says what it sounds like
- [ ] Quick look at the selector in the page before building it test-first
