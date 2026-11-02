# 192: Bead's cover checks, complete

**What to build:** The 1.20.0 code review's findings on where Bead stands (inbox, 2026-11-01): the hover line taken without checking covers, so Bead can hover under a phone's description box; the clear stretch checked for its 44 px box only, while the left Detune twin and a left-facing tail reach 24 px beyond it; a "Demo stopped" card lingering 6 s after a Tour or Tutorial starts, Bead standing on it though the newer card may lie over it; a ride's LFO kept when the window turns stacked mid-ride; the throw's walls taken from the window, not the page, below 320 px. A bug of v1's polish ([131](./131-v1.md)); with [181](./181-bead-never-over-text.md) (never over text), best built together.

**Blocked by:** none

**Status:** ready-for-agent · bug. Polish for v1

## Decisions

Claude's call, open to the owner (2026-11-02): in v1 as polish ([131](./131-v1.md)), from the inbox's lines of the 1.20.0 and 1.21.0 reviews and checks.

## Agent Brief

**Category:** bug
**Summary:** Bead's checks against what covers it miss a few cases: the fallback hover line, its twin and tail, a lingering card, a layout change mid-ride, and walls below 320 px.

**Current behavior:** With every edge covered and no card docked, Bead falls back to the hover line without checking covers, and hovers under a phone's page-wide description box (z 9 under 40). The clear stretch is checked for the 44 px box only; the Detune twin (−16 px) and a left-facing tail reach up to 24 px outside it. A "Demo stopped" card stays 6 s after a Tour or Tutorial starts, and Bead stands on the first docked card it finds. A ride's LFO stays chosen when the window turns stacked mid-ride. Below 320 px the throw bounces off a wall inside the page.

**Desired behavior:** Every place Bead takes is checked against every cover for its whole drawing, twin and tail included; with nothing clear, it waits off-screen at its edge rather than under a cover. The "Demo stopped" card goes when a Tour or Tutorial starts, and Bead stands on the topmost docked card. A layout change ends a ride. The throw's walls are the page's.

**Key interfaces:**
- Bead's place rules and its covers list
- Its drawn box, twin and tail
- The docked cards
- The ride and the throw

**Acceptance criteria:**
- [ ] Unit tests for each case: the hover line covered, the twin or tail under a cover, two docked cards, a layout change mid-ride, a throw below 320 px
- [ ] The mascot spec passes in both browsers; every test passes in Linux's fonts too

**Out of scope:**
- Text under Bead (issue 181)
- Bead's frame cost (issue 184)
