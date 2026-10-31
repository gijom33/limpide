# 141: Bead rides the LFOs

**What to build:** The owner's idea (inbox, 2026-10-31): "I really wanted Bead to sometime \"ride\" the LFOs. Let's make it so if the waveform is suitable to a nice move and rate is slow enough." Today Bead surfs an LFO's plot only as one of its acts during the Demo ([bead.md](../bead.md)); this lets it ride one now and then while the person plays.

**Blocked by:** none

**Status:** ready-for-agent · enhancement. In v1 as Bead's polish, decided by the owner, 2026-10-31 ([131](./131-v1.md), decision 12). The details below are Claude's calls, open to the owner.

## Agent Brief

**Category:** enhancement
**Summary:** Now and then, outside the Demo, Bead jumps onto an LFO's plot and rides its line, when that LFO's shape and speed make a ride worth watching.

**Current behavior:** Bead surfs an LFO's plot only during the Demo, as one of its acts. Otherwise it stays on its section's edge or visits another section now and then.

**Desired behavior:**
- **When it may ride:** an LFO is on (its Depth above 0), its plot is in view and wide enough for Bead (as the Demo's surf already checks), its Waveform is a Sine or a Triangle (a Saw's or a Square's cliff would throw it off rather than carry it), and its Rate is 1 Hz or slower (with Sync, issue 112, the Hz the note value gives).
- **How often:** as one of its visits: when one is due, a rideable LFO is a choice beside the sections in view; it rides for 8 to 18 seconds, then goes home as from a visit.
- **The ride:** the same as the Demo's surf: it jumps onto the plot and rides the line under its middle as the plot draws it.
- **It gets off** with a jump home when the LFO stops being rideable (the Depth to 0, a Waveform or a Rate out of the bounds, the plot out of view), when it is picked up, or when it leaves.
- **Never** while the Demo plays (its acts rule there), while reduced motion is asked for, or in the middle of a funny turn.
- **[bead.md](../bead.md)** lists the new ride beside the Demo's surf.

**Key interfaces:**
- Bead's choice of visits and its perch
- The LFO plot's line, as the Demo's surf reads it
- The Patch's LFO Waveforms, Rates and Depths

**Acceptance criteria:**
- [ ] A unit test of the choice: a Sine or a Triangle at 1 Hz or slower with Depth above 0 is rideable; a Saw, a Square, a Rate over 1 Hz or a Depth of 0 is not
- [ ] An e2e test: with a slow Sine on LFO 1 and a visit due, Bead's foot follows the plot's line; turning the Depth to 0 sends it home
- [ ] No ride while the Demo plays or under reduced motion
- [ ] Bead's frame-cost test still passes
- [ ] Every test passes in Linux's fonts too

**Out of scope:**
- New moves on the ride (tricks belong to [127](./127-more-tricks-for-bead.md))
- Riding the Envelope Timeline or other Viewers
