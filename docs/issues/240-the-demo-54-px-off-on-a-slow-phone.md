# 240: The Demo 54 px off on a slow phone

**What to build:** From 1.24.0's branch run and its re-run (inbox, 2026-11-05; [232](./232-1-24-0-red-on-githubs-linux-webkit.md)): on GitHub's Linux WebKit, with one test worker to a job, the Demo on a 393 px phone lands the Filter 54 px below the section strip (once 168 px) instead of just under it, in three tests (the page following the knob, a person's scroll stopping the following, Page Down), on every attempt. They passed in 232's last probe, and on the Mac's WebKit and in Chromium everywhere. Skipped on GitHub's WebKit alone to ship 1.24.0 (decided by the owner: "Skip and ship"). Polish for v1 ([131](./131-v1.md)): a slow phone may land the Filter a little low, still in view.

**Blocked by:** none

**Status:** done (2026-11-05) · bug, in the tests, not the app: fixed in main, released in 1.25.0; the three tests run again on GitHub's WebKit. Diagnosed and fixed by day at the owner's word ("Yes for 1 and 2").

## Hypotheses, ranked

1. **The header's slide ends after the Demo has aimed.** On a phone, scrolling down slides the header up until only the piano shows; at 8 to 25 frames a second the slide may end after the Demo's scroll has landed, so the strip rises and nothing aims again. 54 px would be the slid rows' height. *Prediction:* logging the strip's top through the scroll shows it rising after the landing; aiming again once the header has settled makes the three pass. The phone header's own slide test fails there too (skipped since 232).
2. **The page's layout still moving at the first scroll** (a font or an image arriving late on a cold WebKit). *Prediction:* the Filter's top moves after the Demo's scroll starts; a test run after another test passes (as in the probe where one ran before).

## How to test them

A throwaway branch `release/probe-N` whose workflow runs only `e2e/demo.spec.ts` in WebKit with one worker, the skips taken off, logging the strip's and the Filter's tops each frame; deleted after.

## What was found (2026-11-05)

Five probes on GitHub (7 to 11), each a throwaway branch deleted after.

- **Not the header's slide (hypothesis 1, refuted), nor the layout moving (2, refuted).** Logged every frame (probe 7): the header slides away during the Demo's first scroll and the Filter lands 8 px under the strip, as on the Mac.
- **The Demo's scroll slows on purpose below 20 frames a second.** Its time counts at most 50 ms a frame, as Bead's motion does, so the two slow together and Bead still lands before the page stops ([224](./224-tests-steady-on-githubs-webkit.md)). At GitHub's 8 to 10 frames a second, after 2.4 s with no frame at all, the 1.4 s scroll lands 3 to 6 s after the Demo starts. The knob test gave it 5 s and read it 54 px short, still moving.
- **The tests' fixed waits ran into the Demo's next part.** Logging why each of the Demo's scrolls starts and stops (probe 9): after a person's scroll or Page Down, the following did stop; 7.6 s in, the next part began and followed its knob, as it should. The tests waited a fixed 4 to 4.5 s they took to be "still in the intro", which on the slow machine was not. The page never moved within the part.

## The fix

In the tests only (`e2e/demo.spec.ts`, "on a phone"): the landing is given 12 s and read every 100 ms (on a slow device the next part's scroll can leave soon after); "the page stays put" is checked while the part playing at the person's scroll plays on, up to the same 4 to 4.5 s, read from the Demo card's "Part N of M". Proved on GitHub (probe 11): the three tests, four times each, green in WebKit and in Chromium.

**A lead for 232's seven skips** (Claude's call, open to the owner, not built): most of them time Bead or the Demo's scroll in milliseconds, which the same deliberate slowing stretches; read against the frame rate or the Demo's parts, as here, several may run again on GitHub.
