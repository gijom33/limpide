# 26: Two LFOs, more destinations

**What to build:** The LFO reaches six destinations instead of three, picked with a selector built like the Patch bar: ‹ and › step through the list, and the name in the middle opens a menu of all six, grouped by stage in the stage's colour. Each LFO has one destination at a time (PRD story 82). There are two LFOs (PRD story 83), each in two rows: its Waveform and destination selectors, then Rate, Depth and its plot. Both may aim at the same destination: their swings add. LFO 2 draws in white, the text colour (its knob arcs, its plot, its share of a ring), starts at Depth 0 (old Patches and links sound as before), and has no C16 default (MIDI Learn maps it). Settled in two grilling rounds, 2026-10-24.

| Destination | Stage | At full Depth | Ring on |
| --- | --- | --- | --- |
| Cutoff | Filter | ±2 octaves (unchanged) | Cutoff |
| Resonance | Filter | its whole range | Resonance |
| Pitch | Osc | ±1 semitone, both Oscillators and the Sub (unchanged) | the piano's pitch marker (issue 21) |
| Osc 2 Pitch | Osc | ±1 octave, Osc 2 only | Osc 2's Semitone |
| Detune | Osc | ±50 cents, Osc 2 only (the Detune knob's range) | Detune |
| Pulse Width | Osc | ±40 points (unchanged) | both Pulse Widths |

Not a destination: Volume (tremolo), which has no clean picture; nor Noise or Osc 2 levels, for now.

**Blocked by:** 21 (done)

**Status:** done, but for MIDI Learn on the new selector (it carries the learn target; not tested by hand). The LFO Waveforms gained a falling saw along the way, and square and saw LFOs are now built unnormalised so they swing exactly ±1, as drawn.

- [x] Destination selector first, on LFO 1; then LFO 2 with the same rows
- [x] Patch: LFO 2 (Rate, Depth, Waveform, destination); the new destinations; Patches and share links with the old three still load unchanged
- [x] Engine: each destination moves what it names by the amount above (engine tests on the rendered sound)
- [x] Modulation model and rings: the reach of the LFO on Resonance, Osc 2 Pitch and Detune (unit tests); rings on those knobs
- [x] Selector: arrows step and wrap, the menu picks, grouped and coloured by stage; keyboard and screen reader reach every destination; MIDI Learn still maps a control to it
- [x] Tips: each destination says what it sounds like

Known limit: a Pulse wave's width is a delay set for the Note's pitch, so an LFO on Osc 2 Pitch also swings Osc 2's Pulse Width a little.
