# 185: MIDI faults real rigs send

**What to build:** Review 17's findings 2 to 4 and review 9's finding 4 on 1.21.1 ([17](../reviews/2026-11-02/17-midi-mapping-geek.md), [9](../reviews/2026-11-02/9-ts-react-webaudio.md)): panic (All Notes Off, All Sound Off) is ignored and Reset All Controllers resets nothing; a C16 on USB and Bluetooth at once is heard twice (a toggle flips on and back off); a lost or doubled clock tick reads as a tempo change and leaves the beats a tick off until the next Start, and a tempo jump passes through in-between readings; a clock's and a Tap's beats are placed on the audio context's time, so a synced LFO trails them by the output latency.

**Blocked by:** none

**Status:** ready-for-agent · bug. Polish for v1

## Decisions

Claude's call, open to the owner (2026-11-02): in v1 as polish ([131](./131-v1.md)), from the six reviews of 1.21.1.

## Agent Brief

**Category:** bug
**Summary:** Standard MIDI messages and common faults (panic, a doubled port, a lost tick, output latency) are not handled.

**Current behavior:** CC 123 and CC 120 leave Notes sounding; CC 121 leaves the pedal, bend and aftertouch as they were. A Controller connected on two ports at once is heard on both. One missed or doubled clock tick reads as 120 → 118 → 120 and shifts the beat count by a tick; a jump from 120 to 90 BPM reads 114, 103, 94, against issue 136's "straight from one to the other". Beats from a clock or Tap land late by the output latency (10–40 ms built in, more over Bluetooth).

**Desired behavior:** All Notes Off releases every Note (the pedal still holding them, as MIDI says), All Sound Off silences at once, Reset All Controllers resets the pedal, bend and aftertouch. A known Controller seen on two ports is followed on the first connected one, and the MIDI panel says so. A gap of about two ticks counts as a missed tick, not a slower tempo; a tempo jump reads straight from one to the other. Beats are placed on the context's output timestamp, so a synced LFO is heard on the clock's beat.

**Key interfaces:**
- The MIDI parser and control surface
- The connected inputs and the MIDI panel's Connected line
- The clock follower and the tempo store

**Acceptance criteria:**
- [ ] Unit tests for each: CC 120, 121 and 123; two ports of one C16; a lost and a doubled tick; a 120 → 90 jump
- [ ] An engine or unit test that a clock's beat is placed by the output timestamp
- [ ] The midiKeyboard, midiLearn and midiClock specs pass; every test passes in Linux's fonts too

**Out of scope:**
- Song Position Pointer (issue 187)
- MIDI Learn's modes (issue 186)
