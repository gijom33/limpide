# 200: Bead's tricks above the top rows

**What to build:** The owner's bug (inbox, 2026-11-02), found trying [142](./142-bead-on-the-line-under-the-tabs.md): "Some animations are still partly hidden below the top rows. It is the case when Bead is on top and does the Las Vegas fountain animation for instance." Where the header stays on screen (under 860 px, the phone and 2 × 2), Bead resting near the top plays tricks that rise into the header's rows and are cut off behind them. Polish of Bead for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · bug. Polish for v1

## Decisions

Decided by the owner, 2026-11-02:

1. **A trick is seen whole:** an animation Bead plays is not partly hidden by the top rows ("some animations are still partly hidden below the top rows").

Claude's calls, open to the owner:

2. **Reproduce first,** at a phone's width and in 2 × 2, with the header shown and slid away: the fountain, then every trick that rises above Bead (the spray, a leap, a word trick's letters), so the fix covers them all and not the fountain alone.
3. **The trick fits under the header, rather than over it:** the header stays on top of everything, as 142 settled for Bead hovering ("under the tabs, not over them"). Where Bead stands too near the top for a trick's height, the trick is drawn lower or smaller, or Bead steps down before it plays; which one is the implementer's choice, the trick's look kept.
4. **Wide windows too:** where nothing sits over the page, the screen's top edge is the limit, checked the same way.

## Agent Brief

**Category:** bug
**Summary:** When Bead stands near the top of what is in view, a trick that rises above it (the fountain, for one) is cut off behind the header's rows.

**Current behavior:** Under 860 px the header stays on screen above the page. Bead resting on an edge just under it plays the fountain, and the spray rises behind the header, partly hidden. Other rising tricks likely do the same.

**Desired behavior:**
- Every trick Bead plays is seen whole, under the header's bottom edge where the header shows, under the screen's top edge where it does not.
- The header still covers Bead and its tricks, never the other way.
- A trick played lower in the page looks as now.

**Key interfaces:**
- Bead's tricks and how far each rises above Bead
- The room between Bead and the header's bottom edge (the header's height less what has slid away)

**Acceptance criteria:**
- [ ] At 375 px and in 2 × 2, Bead on the edge just under the header plays the fountain in full, below the header
- [ ] The same with the header slid away (scrolled down) and back
- [ ] Each other trick that rises above Bead, the same
- [ ] On a wide window, a trick played at the screen's top edge is seen whole
- [ ] Lower in the page, the tricks look and time as before; reduced motion as before
- [ ] A browser test at a phone's width checks the fountain's top against the header's bottom

**Out of scope:**
- Where Bead rests or hovers (181, 142)
- New tricks, or a trick's look away from the top
