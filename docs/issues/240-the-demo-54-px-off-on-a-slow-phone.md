# 240: The Demo 54 px off on a slow phone

**What to build:** From 1.24.0's branch run and its re-run (inbox, 2026-11-05; [232](./232-1-24-0-red-on-githubs-linux-webkit.md)): on GitHub's Linux WebKit, with one test worker to a job, the Demo on a 393 px phone lands the Filter 54 px below the section strip (once 168 px) instead of just under it, in three tests (the page following the knob, a person's scroll stopping the following, Page Down), on every attempt. They passed in 232's last probe, and on the Mac's WebKit and in Chromium everywhere. Skipped on GitHub's WebKit alone to ship 1.24.0 (decided by the owner: "Skip and ship"). Polish for v1 ([131](./131-v1.md)): a slow phone may land the Filter a little low, still in view.

**Blocked by:** none

**Status:** needs-info · bug. Diagnose on GitHub's runs (232's method) before anything is built.

## Hypotheses, ranked

1. **The header's slide ends after the Demo has aimed.** On a phone, scrolling down slides the header up until only the piano shows; at 8 to 25 frames a second the slide may end after the Demo's scroll has landed, so the strip rises and nothing aims again. 54 px would be the slid rows' height. *Prediction:* logging the strip's top through the scroll shows it rising after the landing; aiming again once the header has settled makes the three pass. The phone header's own slide test fails there too (skipped since 232).
2. **The page's layout still moving at the first scroll** (a font or an image arriving late on a cold WebKit). *Prediction:* the Filter's top moves after the Demo's scroll starts; a test run after another test passes (as in the probe where one ran before).

## How to test them

A throwaway branch `release/probe-N` whose workflow runs only `e2e/demo.spec.ts` in WebKit with one worker, the skips taken off, logging the strip's and the Filter's tops each frame; deleted after.
