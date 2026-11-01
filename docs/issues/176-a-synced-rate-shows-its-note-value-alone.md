# 176: A synced Rate shows its note value alone

**What to build:** The owner's bug (inbox, 2026-10-31), on the night branch: "When LFO is synced with clock, the rate knob shows the frequency below it on top of clock period ratio. It leads to longer text and the knobs shift around. This is bad. No need to show the frequency." Issue [112](./112-tempo-midi-clock-and-an-arpeggiator.md) built a synced Rate's readout as "1/4 · 2 Hz" (its decision 10, the Hz beside in small type), so the readout is longer than the knob and the row shifts as it changes. A bug of v1's polish ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-human · bug. Built (2026-11-01) on night/2026-10-31, for the owner to try

## Decisions

1. **A synced Rate shows its note value alone** ("1/4", "1/8 D", "1/16 T"), no frequency; the knobs do not shift as it changes. Decided by the owner, 2026-10-31; replaces 112's decision 10's "the Hz beside in small type".

Claude's call, open to the owner:

2. **The readout keeps one width** for every note value (the knob's readout already sits on hidden copies of the widest it can show; the synced values join them), so nothing around it moves.
3. **The frequency is still there for who wants it:** in the Rate's tip, and with the Synth Geek Layer on as the period ([169](./169-geek-numbers-lfos-and-key-track.md)), not under the knob.

## Agent Brief

**Category:** bug
**Summary:** A synced LFO's Rate readout shows "1/4 · 2 Hz", longer than its knob, so the row shifts; it should show the note value alone, at a fixed width.

**Current behavior:** With Sync on, the Rate's readout is the note value and the Hz in small type; its width changes with the value, and the knobs beside it move.

**Desired behavior:** With Sync on, the readout is the note value alone; the readout's reserved width covers every note value (and the Hz values with Sync off), so turning the Rate or switching Sync moves nothing. On a phone the value shown while the knob moves is the note value too.

**Key interfaces:**
- The LFO's Rate knob readout and its width reservation
- The Rate's tip

**Acceptance criteria:**
- [x] Sync on: the Rate reads "1/4", never with Hz
- [x] Turning the Rate through every note value, and switching Sync, moves no neighbouring control (a layout check in the LFO spec)
- [ ] The LFO spec updated; every test passes in Linux's fonts too

## How it was built

- **The readout:** with Sync on, the Rate knob reads the note value alone ("1/4", "4 bars D", "1/16 T"), under the knob and in the bubble over a finger on a phone. Its hidden sizers now hold the longest readouts of every Parameter the knob turns, the Hz and the note values together, so its width stays the same as it turns and as Sync switches (decision 2). The small-type detail beside a value is gone from the knobs.
- **Where the Hz went (decision 3):** the synced Rate's tip ends with it at the tempo ("At 120 BPM, 1/4 is 2 Hz."), following the tempo as it changes. The Synth Geek Layer's period waits for [169](./169-geek-numbers-lfos-and-key-track.md).
- **A screen reader still hears the Hz** (Claude's call, open to the owner): the Rate's spoken value is "1/4, 2 Hz", and the LFO plot's description keeps both, as before; neither takes any room on screen.
- **Tests:** in the LFO spec, a synced Rate reads "1/4", then turns from "4 bars D" through all 24 note values, each without Hz, and Sync switches off and on, with the Rate's Hz at both ends: the readout's width and the place of every neighbour (Depth, Retrig, Sync, the plot, LFO 2's Depth and Rate) never change (red before the fix; the width check red without the shared sizers). The tempo spec reads "1/8" and the tip's "At 120 BPM, 1/8 is 4 Hz."; a tips unit test for the synced Rate's tip.
- **Since then** (2026-11-01, found building [issue 160](./160-steps-in-each-controls-own-unit.md)): the Synth Geek Layer's sizers ("−99.9 dB", "Q 15.8 ×2") were kept with the layer off too, its context holding null rather than undefined; now only while it is on, as meant. The smoke spec's "no dB readouts over the Viewers" caught it.
- **Tests run:** `npx tsc`, `npm run lint`, the tempo and tips unit tests (44 passed); in Chromium the LFO and tempo specs (19 passed) and the knob, Maths and tooltip specs (30 passed). Linux's fonts are GitHub's run; the layout check compares the page with itself, so it holds in any font.
- **To try:** turn an LFO's Depth up, switch its Sync on and turn the Rate from end to end: the readout shows "1/4", "1/8 D" and so on, never Hz, and Depth, Retrig, Sync and the plot do not move; switch Sync off and on again, the same. Hover the Rate for its Hz at the tempo.
