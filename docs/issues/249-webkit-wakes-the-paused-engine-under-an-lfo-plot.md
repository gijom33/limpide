# 249: WebKit wakes the paused engine under an LFO plot

**What to build:** Found by the night of 2026-11-05, in its full run of the browser tests on the Mac: `enginePause.spec.ts`'s "an LFO plot goes on moving through the pause" ([216](./216-the-sound-engine-pauses-in-a-long-silence.md), the owner) fails in WebKit part of the time. The page pauses the sound engine in a long silence, and an LFO with Depth goes on drawing its plot; once the plot has moved, the test finds the engine `running` where it expects `suspended`. It failed 4 times in 5 at main's commit 7e22fcb, before the night built anything, and 2 in 4 at the night's tip; it passes in Chromium on the Mac, and in both browsers on GitHub (1.25.0's runs). Either the LFO plot's drawing wakes the engine in WebKit, which would undo 216's saving for anyone on Safari with an LFO on, or the test reads the state before WebKit has settled: which one is the first thing to find.

**Blocked by:** none

**Status:** needs-triage · bug. Found 2026-11-06; it does not hold a release, as GitHub's runs pass (Claude's call, open to the owner).
