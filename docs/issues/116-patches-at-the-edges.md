# 116: Patches at the edges

**What to build:** Claude's recommendation for reviews next time (inbox, 2026-10-30), kept by the owner: "a test generating thousands of Patches at the edges (every knob at an end, both LFOs on one target, FM and Ring at full), none giving silence, an error value, a stuck limiter or a slow frame." The reviews of 1.16.0 found FM's DC offset and the fold-back by hand ([103](./103-fm-and-ring-fold-back-at-the-top.md)); a generated sweep finds such things before a reviewer does. Claude's call, open to the owner.

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## Agent Brief

**Category:** enhancement
**Summary:** A test renders many generated Patches at their extremes and fails on any that is silent where it should sound, holds an error value, pins the limiter, or draws a frame too slowly.

**Desired behavior:**
- A generator makes Patches from the edges of every Parameter (each knob at its ends and middle, each choice), combining them so that every pair of Parameters meets at their ends at least once, plus the known hard cases (both LFOs on one Destination, FM and Ring at full, the Sub two octaves down, every Voice count).
- Each Patch is rendered offline on a low, a middle and a high Note, and the test fails on: no sound where Osc 1 or another source is up and the Filter open; any NaN or Infinity; the limiter working on most of the Note; an offset larger than the sound's own level.
- A smaller set draws every Viewer once per Patch and fails on a frame over the budget the existing draw-cost test uses.
- A failure names the Patch, in a form that can be pasted into a Share link.
- A seed fixes the generated set, so a failure reproduces.

**Acceptance criteria:**
- [ ] The test runs in the engine project in under five minutes on a laptop
- [ ] It finds 1.16.0's FM offset when 103's fix is reverted (or the offset check is shown failing on FM Ladder)
- [ ] Every Patch it reports today is answered: fixed, or listed as allowed with the reason

**Out of scope:**
- Judging how a Patch sounds (the ear stand-in's job)
