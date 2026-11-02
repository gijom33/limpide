# 186: MIDI Learn reads a knob's mode right

**What to build:** Review 17's finding 1 on 1.21.1 ([report](../reviews/2026-11-02/17-midi-mapping-geek.md)): MIDI Learn and Quick Setup take a briskly turned accelerated Relative encoder (66, 69, 71, 67) for Absolute with Pickup, after which it moves nothing either way; an Absolute fader nudged once from the bottom is learned as Relative; and the MIDI panel has no way to change a learned Mapping's mode.

**Blocked by:** none

**Status:** ready-for-agent · bug. Polish for v1

## Decisions

Claude's call, open to the owner (2026-11-02): in v1 as polish ([131](./131-v1.md)), from the six reviews of 1.21.1.

1. **Read better first:** values all within a few steps of 64 (or of 0 and 127) read as Relative even without a repeat; a value far from them reads as Absolute.
2. **A mode for each Mapping in the MIDI panel** (Absolute or Relative), changed by hand where the guess is wrong.

## Agent Brief

**Category:** bug
**Summary:** MIDI Learn guesses a control's mode wrongly for accelerated encoders and nudged faders, and the guess cannot be corrected.

**Current behavior:** Learn decides Absolute or Relative from the first values it hears; accelerated encoder streams near 64 read as Absolute with Pickup, and a fader's first small move from 0 reads as Relative. The panel lists Mappings with no mode to change.

**Desired behavior:** Learn classifies by the values heard over its window (near 64, or near 0 and 127, as Relative), and each Mapping in the MIDI panel shows its mode with a way to change it, remembered with the Mapping.

**Key interfaces:**
- MIDI Learn and Quick Setup's classification
- The Mapping's stored mode
- The MIDI panel's Mapping list

**Acceptance criteria:**
- [ ] Unit tests: an accelerated encoder's stream learns as Relative; a fader nudged from 0 learns as Absolute
- [ ] An e2e test changes a Mapping's mode in the panel and the knob then answers
- [ ] The C16 layout's Mappings unchanged; every test passes in Linux's fonts too

**Out of scope:**
- Buttons learned on Switches (inbox, the owner's call)
