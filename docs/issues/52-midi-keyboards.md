# 52: MIDI keyboards

**What to build:** A synth player plugs in a keyboard and expects pitch bend, the sustain pedal and the mod wheel to work; today they are ignored, and MIDI Learn can't take pitch bend ([review 2](../reviews/2026-10-26/2-synth-enthusiast.md)). From the inbox, 2026-10-26.

**Blocked by:** none

**Status:** to do. **Before the LinkedIn post:** no

- [ ] Pitch bend bends the pitch (±2 semitones, a Parameter for the range)
- [ ] The sustain pedal (CC 64) holds Notes as Hold does
- [ ] The mod wheel (CC 1) to something by default (LFO 1 Depth?) until mapped otherwise
- [ ] Program change steps to a Preset
- [ ] MIDI Learn takes pitch bend
- [ ] The Mappings list names a Parameter with its section ("Filter Envelope · Amount", "LFO 2 · Depth")
