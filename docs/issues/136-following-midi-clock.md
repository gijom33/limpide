# 136: Following a MIDI clock

**What to build:** The second slice of [112](./112-tempo-midi-clock-and-an-arpeggiator.md) (grilling, 2026-10-31, decisions 4, 5 and 13, decided by the owner): the page's tempo follows a MIDI keyboard's or DAW's clock when one sends it, as a plugin follows its host.

**Blocked by:** [112](./112-tempo-midi-clock-and-an-arpeggiator.md)

**Status:** ready-for-agent · enhancement. In v1 ([131](./131-v1.md)).

## Agent Brief

**Category:** enhancement
**Summary:** When any connected MIDI input sends a clock, the page's tempo follows it, smoothed, and a MIDI Start starts the beat count again.

**Current behavior:** the MIDI parser skips real-time bytes (the clock, Start, Stop, keep-alive); the tempo is set only by hand or by Tap (issue 112).

**Desired behavior:**
- A clock (24 ticks a beat) from any connected input sets the page's BPM, smoothed over a few beats so the readout does not flicker.
- While the clock runs, the BPM shows a "MIDI" mark and cannot be set by hand or by Tap; its tip says why.
- When the clock stops (no tick for a while), the last BPM stays and is the owner's again to change.
- A MIDI Start starts the beat count again, so the synced LFOs with Retrigger free start their cycles together with the DAW; a Continue does not.
- While the Demo, the Song, the Tour or a Tutorial plays, the player keeps its own BPM and the clock is ignored until the player stops; then the clock's tempo comes back.

**Key interfaces:**
- The MIDI parser's real-time messages
- The page's tempo and its beat count (issue 112)
- The players' hold on the tempo (issue 112)

**Acceptance criteria:**
- [ ] A unit test: ticks at 120 BPM with a little jitter give a steady 120; a change to 90 is followed within a few beats
- [ ] The parser yields clock, Start, Continue and Stop without breaking running status
- [ ] While a clock runs, the BPM cannot be changed by hand and shows the mark; after it stops, it can
- [ ] A Start resets the beat count; a synced free LFO starts its cycle on it
- [ ] While the Demo plays, a running clock does not change its tempo
- [ ] Every test passes in Linux's fonts too

**Out of scope:**
- Sending a clock (no MIDI output, PRD)
- Song Position Pointer
