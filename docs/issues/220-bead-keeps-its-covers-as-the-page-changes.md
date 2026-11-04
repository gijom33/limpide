# 220: Bead keeps its covers as the page changes

**What to build:** Part (a) of [184](./184-beads-frame-in-parts.md), split by the owner on 2026-11-03: review 18's finding 4 on 1.21.1 ([report](../reviews/2026-11-02/18-performance-expert.md)) that Bead costs 0.6 to 0.9 ms and an extra style recalculation a frame, mostly from looking up every panel and tooltip on the page each frame (5 fps of the Demo at 4× throttling). Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Polish for v1

## Decisions

From 184 (Claude's calls, open to the owner, 2026-11-02):

1. **Nothing Bead does changes:** a speed-up, its behaviour held by the mascot spec as it is.
2. **Measured on a quiet machine,** before and after: Bead's frame-cost test failed under load before (1.0 to 1.9 ms against 1 ms), so a loaded machine says nothing.

## Agent Brief

**Category:** enhancement
**Summary:** Each frame, Bead searches the whole page for the panels, tips and cards it must keep clear of, and reads their boxes.

**Current behavior:** Every frame Bead looks up every open panel, tooltip and docked card on the page and reads where each is.

**Desired behavior:**
- Bead keeps its list of what covers the page up to date as panels, tips and cards open and close, rather than searching each frame.
- Their boxes are read again only on a scroll, a resize or a change to the page's layout, not every frame.
- Bead stays clear of them exactly as now, the moment one opens.

**Key interfaces:**
- What Bead must keep clear of (panels, tips, docked cards, text)
- Bead's frame

**Acceptance criteria:**
- [ ] Bead's frame cost measured idle and in the Demo, before and after, on a quiet machine, the figures in the issue; under 0.3 ms idle
- [ ] A panel, a tip or a card opening moves Bead off what it covers as before (the mascot spec, unchanged, in both browsers)
- [ ] Bead's frame-cost test passes on a quiet machine

**Out of scope:**
- The render loop's order of reads and writes ([221](./221-the-frame-reads-the-page-before-it-writes.md))
- Bead's choices as functions ([222](./222-beads-choices-as-functions-with-tests.md))
