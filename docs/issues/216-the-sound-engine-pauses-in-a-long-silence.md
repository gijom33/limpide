# 216: The sound engine pauses in a long silence

**What to build:** Part (d) of [182](./182-a-page-at-rest.md), split by the owner on 2026-11-03: review 18's finding on 1.21.1 ([report](../reviews/2026-11-02/18-performance-expert.md)) that the browser's audio engine runs on through any silence. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** [214](./214-the-silent-viewers-rest.md), whose measurements show what is left to save

**Status:** ready-for-agent · enhancement. Polish for v1

## Decisions

From 182:

1. **Measured before and after,** kept only if it shows (Claude's call, open to the owner).
2. **The LFO plots and the modulation rings keep moving with nothing playing,** decided by the owner ("Keep it moving", 2026-11-03). They follow the sound's clock today, which stops while the engine is paused, so while it is, they move on a clock of their own and pick the sound's clock up again without a jump, as Bead's motion already does.

Claude's calls, open to the owner (2026-11-03):

3. **Never in the way of a Note.** The first Note after the pause sounds on time and without a click, from the computer keys, the piano, a Controller and the Demo; where a browser will not resume without a tap (an iPhone's Safari), it is not paused at all.
4. **The page's own pause is not the browser's.** The invitation to tap for sound, and the return to the page after another app ([the iPhone fix](../inbox.md)), stay for when the browser stops the sound, never for this pause.
5. **Built last of the four,** and dropped (written here with the figures) if 213 to 215 already leave the page near rest.

## Agent Brief

**Category:** enhancement
**Summary:** With nothing playing for a while, the audio engine still runs, costing power for silence.

**Current behavior:** Once started, the audio engine runs until the page closes, through any silence.

**Desired behavior:**
- After a long silence (no Voice sounding, nothing playing, no Hold, no Controller's clock followed), the audio engine pauses.
- The next Note, from anywhere, resumes it in time to sound on time and without a click.
- The LFO plots, the rings and Bead go on moving through the pause, without a jump when it ends.
- The page's pause never shows the invitation to tap for sound and is never taken for the browser stopping the sound.
- Not paused where the browser needs a tap to resume.

**Key interfaces:**
- The audio engine's pause and resume
- The sound's clock, as the LFO plots and Bead read it
- How the page tells the browser's stop from its own

**Acceptance criteria:**
- [ ] Idle cost measured before and after on a laptop, the figures in the issue
- [ ] An engine test: the first Note after the pause starts on time, with no click
- [ ] Browser tests: a key, a piano click and the Demo after the pause all sound; the LFO plot moves through it; the invitation does not appear
- [ ] The tests of the browser stopping the sound pass unchanged

**Out of scope:**
- Bead's cost ([184](./184-beads-frame-in-parts.md))
