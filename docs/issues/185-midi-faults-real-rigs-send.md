# 185: MIDI faults real rigs send

**What to build:** Review 17's findings 2 to 4 and review 9's finding 4 on 1.21.1 ([17](../reviews/2026-11-02/17-midi-mapping-geek.md), [9](../reviews/2026-11-02/9-ts-react-webaudio.md)): panic (All Notes Off, All Sound Off) is ignored and Reset All Controllers resets nothing; a C16 on USB and Bluetooth at once is heard twice (a toggle flips on and back off); a lost or doubled clock tick reads as a tempo change and leaves the beats a tick off until the next Start, and a tempo jump passes through in-between readings; a clock's and a Tap's beats are placed on the audio context's time, so a synced LFO trails them by the output latency.

**Blocked by:** none

**Status:** done (2026-11-04). Built (2026-11-02) on night/2026-11-02, released in 1.23.0; accepted by the owner, tried in part and the rest trusted: "All issues waiting on my feedback look fine, I tested some, others trust you."

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

## How it was built (2026-11-02, on night/2026-11-02)

**What was built:**
- **Panic.** All Notes Off (CC 123) releases every Note a Controller holds; the sustain pedal still holds them, as MIDI says. All Sound Off (CC 120) also silences every Voice at once, a long Release and the pedal's Notes included, over a 3 ms dip so it does not click; the Envelope Timeline shows the drop. Reset All Controllers (CC 121) lifts the pedal, centres the bend and forgets every aftertouch. These three are never learned and never taken by a Mapping.
- **A C16 on two ports.** A known Controller listed on more than one port (the C16 on USB and on Bluetooth) is heard on the first one connected; the others' messages are set aside. The MIDI panel's Connected line adds: "The C16 is connected twice (by USB and Bluetooth, say): Limpide follows … alone, so each press counts once."
- **The clock follower.** The last half beat of ticks is checked against where the two beats before were heading, on a curve so that a DAW's ramp is not taken for a fault. A run of ticks one tick late is a lost tick, one tick early a doubled one: the count is mended, the BPM holds and the beats stay on the clock's. Ticks further and further off are a jump: the new tempo is read from its own ticks, so 120 to 90 reads 120, then 90 a beat or two later. The readout waits for the newest three ticks, so a fault is mended before it can move it (about 60 ms).
  - 2026-11-03: a jump's first ticks were mended as a lost or doubled tick before the jump could show (four ticks against eight), and the jump never took the mending back, so a jump in the middle of a beat left the beats a tick or more early until the next Start (about a third of runs at 120 ↔ 90). Ticks that a jump explains as well as a lost or doubled tick are no longer mended; a unit test plays both directions with the jump anywhere in a beat.
- **Latency.** A clock's beats and a Tap's are placed on the context time heard at that moment, read from the output timestamp, so a synced LFO is heard on the beat rather than 10–40 ms (or a Bluetooth headset's much more) behind it.
- **Tests:** unit tests for CC 120, 121 and 123, the two ports, a lost and a doubled tick, the 120 → 90 jump, a Bluetooth-bunched clock and a ramp; an engine test of All Sound Off; unit tests of the output-timestamp mapping and of the store placing a beat by it; a `useMidi` test of the two ports; end-to-end tests of a panic (midiKeyboard) and of the two ports with the panel's line (c16Card). The end-to-end stand-in Controller can now sit on several ports.
- **The record:** issue 136's build notes say what its clock follower does since.

**Claude's calls, open to the owner:**
1. **Every channel is one instrument:** a panic on any channel acts on the Notes of all of them, since Limpide plays every channel alike.
2. **Reset All Controllers leaves the mod wheel's knob** (LFO 1's Depth) where it is: MIDI's recommendation zeroes the mod wheel, but here it turns a knob of the Patch, and a panic should not change the sound's settings.
3. **All Sound Off under the pedal:** the sound stops, but the piano keeps the pedal's Notes lit until the pedal lifts, as the pedal is still down.
4. **Two ports under one name** are both heard: they cannot be told apart by name, and hearing a press twice is better than not at all. "First connected" is the order the browser lists the ports when the page opens.
5. **A rough clock is left as it was:** where the ticks stray by half a tick or more (Bluetooth's bunching, or 4 ms of jitter at 174 BPM and above), a single lost tick cannot be told from the bunching, so none is mended and the readout may still move a BPM or two. A jump is still read straight there. A clean clock (a DAW, USB) gets the mending.
6. **Small jumps** (under a tenth of the tempo, 120 to 110 say) are read the old way, through the fit, as they move the ticks less than a tick in half a beat.

**What to try:**
- With a keyboard or a DAW: hold some Notes and send its panic (or the DAW's "All Notes Off"); they should stop. With a long Release (a pad), All Sound Off should cut it at once.
- The C16 on USB and Bluetooth at once: the MIDI panel should say it follows one; bank D's R2 (LFO 1 Sync) should switch on with one press, and bank B's K1 should move the Cutoff a semitone a click, not two.
- A DAW's clock at 120 into a synced LFO at 1/4 on Volume, beside the DAW's metronome: the LFO's dips should land with the clicks, built-in output and a Bluetooth headset alike. Jump the DAW from 120 to 90: the readout should go straight to 90.

