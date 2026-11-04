# 186: MIDI Learn reads a knob's mode right

**What to build:** Review 17's finding 1 on 1.21.1 ([report](../reviews/2026-11-02/17-midi-mapping-geek.md)): MIDI Learn and Quick Setup take a briskly turned accelerated Relative encoder (66, 69, 71, 67) for Absolute with Pickup, after which it moves nothing either way; an Absolute fader nudged once from the bottom is learned as Relative; and the MIDI panel has no way to change a learned Mapping's mode.

**Blocked by:** none

**Status:** ready-for-human · bug. Built (2026-11-02) on night/2026-11-02, for the owner to try

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

## Added in triage (2026-11-02)

- From the 1.20.0 code review: a button learned on a Switch (LFO Sync, Legato, Retrigger) never switches it, since Learn reads its 127 and 0 as a knob's Encoder Mode, and the Learn bar says "keep turning…"; 147's press-and-release rule covers only Actions. The owner's answer ([191](./191-the-owners-calls-after-1-21.md), decision 9): each press flips the Switch, built in [223](./223-the-owners-calls-after-1-21-built.md).

## How it was built

Built at night, 2026-11-02, test-first. [ADR-0020](../adr/0020-midi-learn-reads-a-knobs-mode-from-its-whole-turn.md) replaces ADR-0004's detection rule.

- **Learn reads the whole turn** (MIDI Learn and Quick Setup alike): values all within 15 of 64, or of 0 and 127, are Relative, with or without a repeat, so a brisk 66, 69, 71, 67 is Relative. A steady run of single steps one way, or a lone 1 or 126, is Absolute: a fader nudged off an end. A value far from 0 and 64 is Absolute too.
- **The MIDI panel switches a knob's mode:** each knob's Mapping (a Parameter, a choice, the tempo) shows Absolute or Relative under its control, and a click changes it, remembered with the Mapping. Buttons keep their Momentary or Toggle word, and a first-layout knob still to be turned keeps its line.
- The C16 layout's Mappings are unchanged (Relative, 64-centred); the panel shows them as Relative.

Claude's calls, open to the owner:

1. **A lone 1 is a fader, not an encoder's click.** A single value of 1 is a fader nudged off the bottom (the Brief's criterion) or a two's-complement encoder's one click up, and nothing tells them apart. It now reads as Absolute, so an encoder clicked once in Learn is learned Absolute, and the panel puts it right. A lone 127 or 65 is still Relative.
2. **A steady run of single steps is a fader,** wherever it is (40, 41, 42; 0, 1, 2; 62, 63, 64, 65, as before). An encoder speeding up one value at a time (65, 66, 67) reads as Absolute too; one turned briskly jumps by more and reads as Relative.
3. **Two choices in the panel, Absolute and Relative,** as Decision 2 says, not the two kinds of Relative. Switched to Relative, the Mapping takes the kind its knob's last value says: near 0 (1 up, 127 down) two's-complement, otherwise 64-centred, which is also the kind when the knob has sent nothing this visit. Choosing the mode a Mapping already has changes nothing.
4. **Switching resets Pickup** and any step a Relative knob had gathered, for that control.

To try in the app: MIDI Learn on the Cutoff, then turn an endless encoder quickly: the MIDI panel shows its Mapping as Relative and the knob turns the Cutoff. Learn the Resonance from a fader moved a little off the bottom: Absolute. Then click the other mode on either Mapping: the knob answers the new way at once, and still does after a reload.
