# 138: Bead's frame cost on GitHub's WebKit

**What to build:** From the 1.18.0 release (inbox, 2026-10-31): Bead's frame-cost test ("it adds under a millisecond to each frame the Viewers draw") failed in WebKit on GitHub in three of six runs (1.11 to 1.65 ms against 1), both tries each time, while here Bead adds nothing measurable in 1.18.0 or 1.17.0 (−0.6 to −0.3 ms). It held the deploy until a re-run. Either GitHub's runner is slower and the test too tight, or Bead really costs more in WebKit on Linux; the fix depends on which.

**Blocked by:** none

**Status:** needs-info · bug. The fact wanted: Bead's cost measured in WebKit on Linux (Playwright's Linux image in Docker), diagnosed in the owner's main session, not by the night shift. Claude's call, open to the owner.
