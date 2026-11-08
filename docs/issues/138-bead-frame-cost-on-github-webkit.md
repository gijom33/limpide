# 138: Bead's frame cost on GitHub's WebKit

**What to build:** From the 1.18.0 release (inbox, 2026-10-31): Bead's frame-cost test ("it adds under a millisecond to each frame the Viewers draw") failed in WebKit on GitHub in three of six runs (1.11 to 1.65 ms against 1), both tries each time, while here Bead adds nothing measurable in 1.18.0 or 1.17.0 (−0.6 to −0.3 ms). It held the deploy until a re-run. Either GitHub's runner is slower and the test too tight, or Bead really costs more in WebKit on Linux; the fix depends on which.

**Blocked by:** none

**Status:** done (2026-10-31). The test, not Bead: WebKit's clock cannot measure a fraction of a millisecond, so Bead's frame cost is measured in Chromium only. Claude's call, let stand by the owner in 1.19.0.

## How it was diagnosed

The test's copy, printing its numbers, ran three times in each place (Playwright 1.64.1; Linux in Playwright's image in Docker, held to 4 CPUs like GitHub's runner):

| Where | Frames in 2 s | Work per frame | Bead added |
| --- | --- | --- | --- |
| WebKit, macOS | 120 | 3.0 to 3.6 ms | −0.6 to −0.4 ms |
| WebKit, Linux | 22 to 41 | 4.3 to 7.0 ms | −0.7 to +0.7 ms |
| Chromium, Linux | 117 to 121 | 3.7 to 4.4 ms | −0.03 to +0.09 ms |

- Every WebKit total was a whole number of milliseconds: its `performance.now()` counts whole milliseconds, so each frame callback reads 0, 1, 2 … ms.
- On Linux, WebKit drew a frame about every 60 ms, so a 2 s sample holds some thirty frames, and their average wanders by ±0.7 ms whether Bead is there or not. GitHub's 1.2 ms was that noise past a 1 ms bound.
- Bead's layout reads (`getBoundingClientRect`) cost under 0.04 ms a frame anywhere.
- In Chromium, with a fine clock and 60 frames a second, Bead adds under 0.1 ms on Linux too: it is cheap, as the test meant to show.

The fix: `e2e/mascot.spec.ts`'s frame-cost test skips WebKit and says why; Chromium still holds Bead to under 1 ms.
