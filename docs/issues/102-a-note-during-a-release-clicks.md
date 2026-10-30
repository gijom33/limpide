# 102: A Note played during a Release clicks

**What to build:** From the fourteen reviews of 1.16.0 (the inbox, 2026-10-30; review 2, [report](../reviews/2026-10-30/2-synth-enthusiast.md)). Since [94](./94-oscillators-restart-on-each-note.md) each Note restarts the Oscillators, the owner's call so that a Patch sounds the same whatever came before. Its legato fix covers a key still held; a Note played while the last one is still in its Release restarts them mid-sound. Measured offline, not heard: the steepest step is 16 times the steady sine's on Init, 28 times with a 1.5 s Release; a chord struck again bursts to 3.6 times Glass Pad's sustain; a stolen held Voice jumps 18 times.

**Blocked by:** none

**Status:** needs-triage · bug. A question for the owner below.

## Question for the owner

Which way, when a Note reaches a Voice that is still sounding?

1. **A quick dip (Claude's recommendation):** the Voice fades to silence in about 3 ms, then the Oscillators restart and the Note starts, about 3 ms late. Every Note still starts the same way (issue 94's aim), and the dip is too short to hear as a gap. Many hardware synths do this.
2. **No restart while it sounds:** a Voice still sounding carries on its cycle, as a legato Note does. No click, but a Note played into a Release no longer starts the same way as one played into silence, which is what 94 set out to end.
3. **Leave it:** the click stays, small on most Patches.
