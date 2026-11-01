# 176: A synced Rate shows its note value alone

**What to build:** The owner's bug (inbox, 2026-10-31), on the night branch: "When LFO is synced with clock, the rate knob shows the frequency below it on top of clock period ratio. It leads to longer text and the knobs shift around. This is bad. No need to show the frequency." Issue [112](./112-tempo-midi-clock-and-an-arpeggiator.md) built a synced Rate's readout as "1/4 · 2 Hz" (its decision 10, the Hz beside in small type), so the readout is longer than the knob and the row shifts as it changes. A bug of v1's polish ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · bug

## Decisions

1. **A synced Rate shows its note value alone** ("1/4", "1/8 D", "1/16 T"), no frequency; the knobs do not shift as it changes. Decided by the owner, 2026-10-31; replaces 112's decision 10's "the Hz beside in small type".

Claude's call, open to the owner:

2. **The readout keeps one width** for every note value (the knob's readout already sits on hidden copies of the widest it can show; the synced values join them), so nothing around it moves.
3. **The frequency is still there for who wants it:** in the Rate's tip, and with the Maths Layer on as the period ([169](./169-geek-numbers-lfos-and-key-track.md)), not under the knob.

## Agent Brief

**Category:** bug
**Summary:** A synced LFO's Rate readout shows "1/4 · 2 Hz", longer than its knob, so the row shifts; it should show the note value alone, at a fixed width.

**Current behavior:** With Sync on, the Rate's readout is the note value and the Hz in small type; its width changes with the value, and the knobs beside it move.

**Desired behavior:** With Sync on, the readout is the note value alone; the readout's reserved width covers every note value (and the Hz values with Sync off), so turning the Rate or switching Sync moves nothing. On a phone the value shown while the knob moves is the note value too.

**Key interfaces:**
- The LFO's Rate knob readout and its width reservation
- The Rate's tip

**Acceptance criteria:**
- [ ] Sync on: the Rate reads "1/4", never with Hz
- [ ] Turning the Rate through every note value, and switching Sync, moves no neighbouring control (a layout check in the LFO spec)
- [ ] The LFO spec updated; every test passes in Linux's fonts too
