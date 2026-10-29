# 92: Pink Noise

**What to build:** Noise can be pink as well as white: equal energy per octave, falling 3 dB an octave in the Spectrum, a softer rush than white's hiss. Item 5 of the owner's six Oscillator additions (inbox, 2026-10-29).

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## Agent Brief

**Category:** enhancement
**Summary:** A Noise colour choice, white or pink, in the Mixer.

**Current behavior:**
- Noise is white: equal energy at every frequency.

**Desired behavior:**
- A Noise choice, White (the default) or Pink, in the Mixer under the faders, Learnable by MIDI.
- Pink Noise falls 3 dB per octave, at the same overall loudness (RMS) as white, repeatable from render to render and looping without a click.
- The glossary's Noise says it comes in two colours.
- A Preset shows it off.

**Acceptance criteria:**
- [ ] Pink Noise is about 10 dB quieter than at a frequency ten times lower, white about the same (engine test)
- [ ] White and pink are within 1 dB of each other in RMS (engine test)
- [ ] An old Patch loads with white Noise; every existing test passes

**Out of scope:**
- Other colours (brown, blue), or Noise as an LFO shape

## Decisions (triage, 2026-10-29)

1. Built with the other five: decided by the owner.
2. Pink at the same RMS as white, so switching changes the colour and not the level: Claude's call, open to the owner.
