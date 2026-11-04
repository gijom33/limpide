# 221: The frame reads the page before it writes

**What to build:** Part (b) of [184](./184-beads-frame-in-parts.md), split by the owner on 2026-11-03: review 18's finding on 1.21.1 ([report](../reviews/2026-11-02/18-performance-expert.md)) that the Viewers write to the page before Bead reads it, so with Bead out the browser works out the page's styles twice a frame. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** [220](./220-bead-keeps-its-covers-as-the-page-changes.md)

**Status:** ready-for-agent · enhancement. Polish for v1

## Decisions

From 184 (Claude's calls, open to the owner, 2026-11-02):

1. **Nothing Bead or a Viewer shows changes.**

Claude's calls, open to the owner (2026-11-03):

2. **A measuring script kept in the repository,** rebuilding review 18's method (idle, the Demo, an 8-Voice chord, at 1×, 1.25× and 4× throttling), so 213 to 222 and later changes measure the same way. The Viewers' colours are [213](./213-viewer-colours-read-once-and-a-silent-scope-skipped.md)'s, not this issue's.

## Agent Brief

**Category:** enhancement
**Summary:** Within a frame, the Viewers write to the page and Bead then reads its layout, forcing the browser to work out the styles a second time.

**Current behavior:** The shared render loop lets each Viewer draw and Bead read and move in turn, reads and writes mixed, so a read after a write forces a fresh style and layout pass.

**Desired behavior:**
- Each frame first reads every layout it needs (Bead's and the Viewers'), then writes.
- No extra style recalculation a frame with Bead out.
- A script in the repository measures the page as review 18 did, and its use is written where the releases' and statistics' tools are described.

**Key interfaces:**
- The shared render loop and its order of reads and writes
- Bead's frame and each Viewer's draw

**Acceptance criteria:**
- [ ] One style recalculation a frame with Bead out, measured by the script, before and after, the figures in the issue
- [ ] The Demo's frame rate at 4× no lower than today
- [ ] The mascot spec, every Viewer test and the design audit pass unchanged

**Out of scope:**
- What Bead or the Viewers show
