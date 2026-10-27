# 52: MIDI keyboards

**What to build:** A synth player plugs in a keyboard and expects pitch bend, the sustain pedal and the mod wheel to work; today they are ignored, and MIDI Learn can't take pitch bend ([review 2](../reviews/2026-10-26/2-synth-enthusiast.md)). From the inbox, 2026-10-26.

**Blocked by:** none

**Status:** done (2026-10-27)

- [x] Pitch bend bends the pitch (±2 semitones, a Parameter for the range)
- [x] The sustain pedal (CC 64) holds Notes as Hold does
- [x] The mod wheel (CC 1) to something by default (LFO 1 Depth?) until mapped otherwise
- [x] Program change steps to a Preset
- [x] MIDI Learn takes pitch bend
- [x] The Mappings list names a Parameter with its section ("Filter Envelope · Amount", "LFO 2 · Depth")

How it was done:

- The parser reads pitch bend (14 bits, −1 to 1) and Program Change. The surface (`src/midi/controlSurface.ts`) gives a keyboard's own controls their usual jobs while nothing is mapped to them: the bend wheel bends, CC 64 holds (it joins Hold in the Note input, at once), CC 1 turns LFO 1's Depth, Program n loads the n-th Preset (0 is Init). A Mapping on any of them takes over.
- Pitch bend in the engine: one shared source in cents into every Oscillator's detune, as the LFO on Pitch is wired, and a history in the Modulation model, so the Viewers, Cycle Lock and the piano's pitch dot follow the bend (ADR-0003). An engine test renders a Note bent two semitones and finds its fundamental there.
- The range is not a Patch Parameter but a choice in the MIDI panel (2, 7 or 12 semitones, remembered): it belongs to the keyboard, not the sound, and a knob for it would sit in no stage.
- MIDI Learn takes the bend wheel as an Absolute control (number 128, after the 128 CCs; "Pitch bend" in the Mappings).
- The Mappings name Parameters in full ("Filter Envelope Amount", "LFO 2 Depth"), the same names screen readers hear (issue 51).
- While at it: the hidden-tab test sent its MIDI message before the Controller had reconnected after a reload, which made it flaky in WebKit; it now waits.
