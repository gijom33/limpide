# 237: Bead's weather from farther off

**What to build:** The owner's idea (inbox, 2026-11-04): "I would like if, for Bead's umbrella animation, the rain comes from top of screen. Similarly, with the sun melting and clous animations, would be great if there are farther from Bead." Today the umbrella's rain falls from a stretch of sky 120 px over Bead's edge, 80 px either side of it, and the evaporating trick's sun and cloud are drawn just over its head, as part of its picture ([127](./127-more-tricks-for-bead.md)). Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Polish for v1

## Decisions

Decided by the owner, 2026-11-04:

1. **The umbrella's rain comes from the top of the screen.**
2. **The sun and the cloud are farther from Bead.**

Claude's calls, open to the owner:

3. **From the window's top edge,** behind the header, which stays on top ([200](./200-beads-tricks-above-the-top-rows.md)); across the same stretch as now, 80 px either side of Bead.
4. **Rain falls as rain does, fast:** each drop takes about as long as today's to land, so the trick keeps its length, and the first drops leave the top early enough to land as the umbrella's wince starts.
5. **The sun and the cloud twice as far above Bead as today,** inside the window and clear of the header; where there is no room (Bead near the top), as far as fits. The cloud's shower falls that longer way onto Bead, and the steam rises to the sun.
6. **With reduced motion,** as each trick is today.

## Agent Brief

**Category:** enhancement
**Summary:** Bead's umbrella rain starts at the top of the window, and its evaporating trick's sun and cloud sit farther above it.

**Current behavior:** In the umbrella trick, the rain falls from 120 px above Bead's edge and ends on the open umbrella or the ground. In the evaporating trick, the sun and the cloud are drawn just over Bead's head, and the cloud's shower falls from just under it.

**Desired behavior:**
- The umbrella's rain starts at the window's top edge, behind the header, over the same width as now, and still ends on the umbrella's canopy or the ground; the trick lasts as long as now.
- The sun and the cloud are drawn about twice as far above Bead as now, inside the window and clear of the header, nearer where there is no room; the steam rises to the sun and the shower falls from the cloud onto Bead.
- Bead's frame cost stays within its budget with the rain's longer fall.
- Browser tests: the rain's first drops start at the window's top; the sun and cloud sit at their new height and inside the window.

**Out of scope:** the other tricks, the drops' look.
