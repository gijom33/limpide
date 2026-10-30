# 102: A Note played during a Release clicks

**What to build:** From the fourteen reviews of 1.16.0 (the inbox, 2026-10-30; review 2, [report](../reviews/2026-10-30/2-synth-enthusiast.md)). Since [94](./94-oscillators-restart-on-each-note.md) each Note restarts the Oscillators, the owner's call so that a Patch sounds the same whatever came before. Its legato fix covers a key still held; a Note played while the last one is still in its Release restarts them mid-sound. Measured offline, not heard: the steepest step is 16 times the steady sine's on Init, 28 times with a 1.5 s Release; a chord struck again bursts to 3.6 times Glass Pad's sustain; a stolen held Voice jumps 18 times.

**Blocked by:** none

**Status:** ready-for-agent · bug. The owner chose the quick dip (decisions below).

## Question for the owner

Which way, when a Note reaches a Voice that is still sounding?

1. **A quick dip (Claude's recommendation):** the Voice fades to silence in about 3 ms, then the Oscillators restart and the Note starts, about 3 ms late. Every Note still starts the same way (issue 94's aim), and the dip is too short to hear as a gap. Many hardware synths do this.
2. **No restart while it sounds:** a Voice still sounding carries on its cycle, as a legato Note does. No click, but a Note played into a Release no longer starts the same way as one played into silence, which is what 94 set out to end.
3. **Leave it:** the click stays, small on most Patches.

## Decisions (triage, 2026-10-30, decided by the owner)

1. The quick dip: a Voice still sounding fades to silence in about 3 ms, then the Oscillators restart and the Note starts, about 3 ms late.

## Agent Brief

**Category:** bug
**Summary:** A Note that reaches a Voice still sounding starts without a click, after a dip of about 3 ms.

**Current behavior:** the Oscillators restart mid-sound when a Note arrives during the last one's Release, or steals a held Voice: a jump up to 28 times the steady slope.

**Desired behavior:**
- A Note reaching a Voice that is still sounding (in its Release, or stolen while held) first takes that Voice to silence over about 3 ms, then restarts the Oscillators and starts its Envelopes, all about 3 ms after the Note was asked for.
- A Note reaching a silent Voice starts at once, as now.
- A legato Note (a key still held, one Voice) does not restart, as now.
- The players' Notes keep their timing relative to each other: the dip is the same for every Note that needs one.

**Key interfaces:**
- The engine's Note On and its restart of the Oscillators

**Acceptance criteria:**
- [ ] An engine test plays a Note during a Release (Init, and a 1.5 s Release) and finds no step bigger than a few times the steady slope
- [ ] The same for a chord struck again on Glass Pad and a stolen held Voice
- [ ] A Note into silence starts within a sample of when it is asked for
- [ ] The legato test still passes

**Out of scope:**
- The handed-over Notes doubling ([101](./101-handed-over-notes-stop-cleanly.md))
