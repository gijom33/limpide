# 193: Tempo and step slips

**What to build:** The 1.20.0 code review's findings on the tempo, LFO Sync and the steps (inbox, 2026-11-01): a Relative knob moves the BPM 2 a click, so from an even BPM it never reaches an odd one; a C16 knob mapped by Learn or Quick Setup takes a fast turn's 66 as 2 steps, not a third; thirds of a step gathered on the Hz before Sync came on are still there when it goes off; the beat lines show with Retrigger on Note, where the cycle follows the Notes; the Wobble Tutorial's "Set LFO 1's Rate to 3 Hz" cannot be done once Sync is on; a synced Rate's Hz reads "2 Hz" where unsynced it reads "2.00 Hz". A bug of v1's polish ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · bug. Polish for v1

## Decisions

Claude's call, open to the owner (2026-11-02): in v1 as polish ([131](./131-v1.md)), from the inbox's lines of the 1.20.0 and 1.21.0 reviews and checks.

## Agent Brief

**Category:** bug
**Summary:** Six small slips in how the tempo, a synced Rate and Relative steps behave.

**Current behavior:** A Relative knob moves the BPM 2 a click (the least travel a click is 1 % of 200 BPM), and a test named "a BPM a step" asserts 2. A C16 knob mapped through Learn or Quick Setup reads its fast-turn step from the Mapping's tag, so a fast 66 is 2 steps. Thirds of a step gathered before Sync came on remain after it goes off, so the first 66 can jump a step. The LFO plot and the Timeline draw beat lines whenever Sync is on, Retrigger on Note included. In the Wobble Tutorial, the 3 Hz Step cannot be made once the person switches Sync on, the knob then turning the note value. A synced Rate's Hz reads "2 Hz" (tip, spoken value, plot label) where unsynced it reads "2.00 Hz".

**Desired behavior:** A Relative click moves the BPM 1. A C16 knob's fast turn counts a third whatever made its Mapping (read from the input it came from). Gathered thirds are cleared when Sync changes. Beat lines show only when the cycle follows the beat (Sync on, Retrigger free). The Wobble Tutorial's Step is made either way, or turns Sync off first. A Rate's Hz reads the same, synced or not.

**Key interfaces:**
- The control surface's Relative steps and fast-turn thirds
- The tempo's step
- The LFO plot's and the Timeline's beat marks
- The Wobble Tutorial's Steps
- The Rate's readout

**Acceptance criteria:**
- [ ] Unit tests for each of the six
- [ ] The midiLearn, c16 and tutorial specs pass; every test passes in Linux's fonts too

**Out of scope:**
- The BPM's keyboard steps (issue 191, question 11)
