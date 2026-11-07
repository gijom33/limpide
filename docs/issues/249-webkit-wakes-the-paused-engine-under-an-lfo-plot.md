# 249: WebKit wakes the paused engine under an LFO plot

**What to build:** Found by the night of 2026-11-05, in its full run of the browser tests on the Mac: `enginePause.spec.ts`'s "an LFO plot goes on moving through the pause" ([216](./216-the-sound-engine-pauses-in-a-long-silence.md), the owner) fails in WebKit part of the time. The page pauses the sound engine in a long silence, and an LFO with Depth goes on drawing its plot; once the plot has moved, the test finds the engine `running` where it expects `suspended`. It failed 4 times in 5 at main's commit 7e22fcb, before the night built anything, and 2 in 4 at the night's tip; it passes in Chromium on the Mac, and in both browsers on GitHub (1.25.0's runs). Either the LFO plot's drawing wakes the engine in WebKit, which would undo 216's saving for anyone on Safari with an LFO on, or the test reads the state before WebKit has settled: which one is the first thing to find.

**Blocked by:** none

**Status:** ready-for-agent · bug. Found 2026-11-06; it does not hold a release, as GitHub's runs pass. In v1, as a bug in 216's pause (Claude's call, open to the owner).

## Decisions

Claude's calls, open to the owner (2026-11-06, triage):

1. **The cause is found first, with a loop that goes red:** the test run alone in WebKit on the Mac, many times, until it fails at a known rate; then whether the engine was woken (by what, and when) or only read before WebKit settled.
2. **If the page wakes the engine, the page is mended:** an LFO plot moving in a long silence must not wake the sound in any browser, as 216 means; the test stays as it is.
3. **If only the test reads too early, the test is mended:** it waits for the state the page settles in, inside the page, and says so in its name's source.

## Agent Brief

**Category:** bug
**Summary:** In WebKit on the Mac, the paused sound engine is found running once an LFO plot has moved in a long silence, part of the time; find whether the page wakes it or the test reads it too early, and mend that one.

**Current behavior:** The test "an LFO plot goes on moving through the pause (issue 216, the owner)" fails in WebKit on the Mac 2 to 4 times in 5: after the plot moves, the engine reads `running` where `suspended` is expected. It passes in Chromium on the Mac and in both browsers on GitHub.

**Desired behavior:**
- The cause named, from a loop that goes red at a known rate (decision 1).
- The page mended if it wakes the engine (decision 2), or the test if it reads too early (decision 3).
- The test passes 20 times in 20 in WebKit on the Mac, alone and in its file.

**Key interfaces:**
- 216's pause in a long silence and what may wake the engine (a Note, a knob, a Show; not a Viewer).
- The LFO plot's drawing while the sound rests.

**Acceptance criteria:**
- [ ] The cause stated in the issue, with the loop and its rate before the fix.
- [ ] The test green 20 in 20 in WebKit on the Mac, and still green in Chromium.
- [ ] If the page was mended, a test that fails without the mend.

**Out of scope:**
- 216's other wake rules; the Viewers' rest (214).
