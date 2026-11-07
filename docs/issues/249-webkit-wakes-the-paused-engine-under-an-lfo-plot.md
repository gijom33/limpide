# 249: WebKit wakes the paused engine under an LFO plot

**What to build:** Found by the night of 2026-11-05, in its full run of the browser tests on the Mac: `enginePause.spec.ts`'s "an LFO plot goes on moving through the pause" ([216](./216-the-sound-engine-pauses-in-a-long-silence.md), the owner) fails in WebKit part of the time. The page pauses the sound engine in a long silence, and an LFO with Depth goes on drawing its plot; once the plot has moved, the test finds the engine `running` where it expects `suspended`. It failed 4 times in 5 at main's commit 7e22fcb, before the night built anything, and 2 in 4 at the night's tip; it passes in Chromium on the Mac, and in both browsers on GitHub (1.25.0's runs). Either the LFO plot's drawing wakes the engine in WebKit, which would undo 216's saving for anyone on Safari with an LFO on, or the test reads the state before WebKit has settled: which one is the first thing to find.

**Blocked by:** none

**Status:** done (2026-11-07). Built (2026-11-06) on night/2026-11-06 and merged into main on 2026-11-07, approved by the owner, untried: "It's fine, I trust you. Merge and push."; released in 1.26.1

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
- [x] The cause stated in the issue, with the loop and its rate before the fix.
- [x] The test green 20 in 20 in WebKit on the Mac, and still green in Chromium.
- [x] If the page was mended, a test that fails without the mend.

**Out of scope:**
- 216's other wake rules; the Viewers' rest (214).

## How it was built

- **The loop (decision 1):** the test alone in WebKit on the Mac passed 10 in 10; its whole file, five times over with four workers, failed it 2 in 5, as the night of 2026-11-05 saw. A throwaway copy of the file logged every `resume` and `suspend` call, with its caller, and every change of the AudioContext's state.
- **The cause: the test read too early; the page wakes nothing it should not.** Turning Depth (five PageUp keys) wakes the sound, as a knob does in 216: each key is one of the page's waking gestures, and the change reaches the engine's `applyPatch`, which wakes it too. In WebKit the resume settles some 30 to 60 ms after the keys, and until then the state still reads `suspended`. In the failing run the test's wait for the next pause read that stale `suspended` at once and went on, so it never waited for the second pause: the plot then moved with the sound running (keys at 3.27 s, `running` at 3.33 s, no suspend after). In the passing runs the first read already saw `running`, the second pause came about 3 s later (7.2 s), and the plot moved through it, so the plot itself never woke the engine.
- **The mend (decision 3):** the test waits, inside the page, for the state to read `running` after the Depth turn (at most five seconds, then it fails saying the turn did not wake the sound), and only then waits for the pause. A comment in the test says why. The page is unchanged.
- **Tests:** in WebKit on the Mac, the test 20 in 20 alone and 20 in 20 in its file (120 in 120 for the file, with four workers, at a load of 34 to 58); the file in Chromium 18 in 18; `tsc` and the lint clean.
- **Claude's call, open to the owner:** "says so in its name's source" was read as the test's source: a comment that names issue 249. The test's name stays "(issue 216, the owner)", as the owner gave it.

**To try:** nothing changes in the app. In Safari, with an LFO's Depth up and the page left silent for 30 s, the sound pauses (the Viewers rest) while the LFO's plot goes on moving, as before.
