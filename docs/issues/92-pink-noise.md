# 92: Pink Noise

**What to build:** Noise can be pink as well as white: equal energy per octave, falling 3 dB an octave in the Spectrum, a softer rush than white's hiss. Item 5 of the owner's six Oscillator additions (inbox, 2026-10-29).

**Blocked by:** none

**Status:** done (2026-10-29). A Noise colour choice, White or Pink, in the Mixer's name column (two swatches); pink falls 3 dB an octave at white's RMS. The Pink Surf Preset shows it. Not yet listened to by the owner.

## Agent Brief

**Category:** enhancement
**Summary:** A Noise colour choice, white or pink, in the Mixer.

**Current behavior:**
- Noise is white: equal energy at every frequency.

**Desired behavior:**
- A Noise choice, White (the default) or Pink, in the Mixer, Learnable by MIDI.
- Pink Noise falls 3 dB per octave, at the same overall loudness (RMS) as white, repeatable from render to render and looping without a click.
- The glossary's Noise says it comes in two colours.
- A Preset shows it off.

**Acceptance criteria:**
- [x] Pink Noise is about 10 dB quieter than at a frequency ten times lower, white about the same (engine test)
- [x] White and pink are within 1 dB of each other in RMS (engine test)
- [x] An old Patch loads with white Noise; every existing test passes

**Out of scope:**
- Other colours (brown, blue), or Noise as an LFO shape

## Decisions (triage, 2026-10-29)

1. Built with the other five: decided by the owner.
2. Pink at the same RMS as white, so switching changes the colour and not the level: Claude's call, open to the owner.

## How it was built

- **The buffer** (`pinkBuffer` in `src/engine/synthEngine.ts`): the white loop through Paul Kellet's filter, run twice so the second pass's end leads into its start, its offset taken out and its RMS matched to white's. At white's RMS its peaks reach about 3.9 times the RMS, so at full fader about 1.1 at the Oscillator Tap; several full sources already pass ±1 there, and the Scope squeezes what does.
- **The engine**: each Voice runs both colours and lets the Patch's through.
- **The choice** `noiseColour`, Learnable by MIDI, two swatches (white and pink) under the Sub's choices. The glossary's Noise names both colours.
- **Contrast**: the first words on a choice in the Oscillators stage showed the stage's green too light under the page colour in the light theme (3.28:1); chosen segments there are now mixed 75 % with the text colour (4.72:1).
- Tests: "Pink Noise (issue 92)" in the engine's browser tests (a decade down 10 dB within 1.6, white level within 2; RMS within 1 dB); Preset: Pink Surf (Movement & Effects).
