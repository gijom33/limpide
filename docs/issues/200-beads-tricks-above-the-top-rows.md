# 200: Bead's tricks above the top rows

**What to build:** The owner's bug (inbox, 2026-11-02), found trying [142](./142-bead-on-the-line-under-the-tabs.md): "Some animations are still partly hidden below the top rows. It is the case when Bead is on top and does the Las Vegas fountain animation for instance." Where the header stays on screen (under 860 px, the phone and 2 × 2), Bead resting near the top plays tricks that rise into the header's rows and are cut off behind them. Polish of Bead for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-03). Built (2026-11-02) on night/2026-11-02, merged into main, released in 1.23.0; tried by the owner: "All good."

## Decisions

Decided by the owner, 2026-11-02:

1. **A trick is seen whole:** an animation Bead plays is not partly hidden by the top rows ("some animations are still partly hidden below the top rows").

Claude's calls, let stand by the owner in 1.22.0:

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
- [ ] ~~At 375 px and in 2 × 2, Bead on the edge just under the header plays the fountain in full, below the header~~ (not checked at the time)
- [ ] ~~The same with the header slid away (scrolled down) and back~~ (not checked at the time)
- [ ] ~~Each other trick that rises above Bead, the same~~ (not checked at the time)
- [ ] ~~On a wide window, a trick played at the screen's top edge is seen whole~~ (not checked at the time)
- [ ] ~~Lower in the page, the tricks look and time as before; reduced motion as before~~ (not checked at the time)
- [ ] ~~A browser test at a phone's width checks the fountain's top against the header's bottom~~ (not checked at the time)

**Out of scope:**
- Where Bead rests or hovers (181, 142)
- New tricks, or a trick's look away from the top

## How it was built

Reproduced first in a browser at 375 px, 800 px (2 × 2) and 1440 px, every rising trick cued in turn. On a phone, Bead on an edge just under the tabs, the fountain show's jets went 40 px behind the header, the puddle's splash over 100 px; Bead hovering under the header in 2 × 2 had only a few pixels over its head. On a wide window the page's top was the limit and the tricks stayed under the window's top.

- **The droplets** (the fountain, the fountain show's arcs, the puddle's and a landing's splash, the burp, the bubble's pop, steam) keep under what is over the page: the header's foot on a phone and in 2 × 2, the window's top elsewhere. A droplet that would go higher is flung slower the same way, so the fountain near the top is lower and smaller, its shape kept. The umbrella's rain starts under the header too.
- **The drawing:** where the room over Bead is short, its hops and lifts go lower; a trick whose drawing is still too tall there (the umbrella, the bubble, the evaporating cloud) is drawn smaller about its foot while it plays. Its droplets and the fishing line leave from where the smaller drawing is.
- **Lower in the page** nothing changes: the room is ample, so none of this applies. Reduced motion is as before (no tricks).
- A browser test at 375 px scrolls Bead's edge up under the tabs (the header slid away), cues the fountain show and the fountain, and checks every frame that nothing of Bead or its droplets is above the header's foot. The tests' own build gains a cue for a trick, as the players' Note log of 198.

Claude's calls, let stand by the owner in 1.22.0:

1. **Lower and smaller, not stepping down:** the trick fits the room where Bead is; Bead never moves away to play it, since where it rests and hovers is out of scope (181, 142). The cost: hovering a few pixels under the header in 2 × 2, a fountain is only a little spurt.
2. **The header is the limit on a phone, not the section tabs:** Bead is drawn over the tabs (142), so a trick may rise over them; only the header hides it.
3. **Droplets already in the air** when the header slides back down may pass behind it for a moment: the limit is taken as each droplet leaves.

To try, on a phone or a window under 860 px: scroll until Bead's edge is just under the tabs (or the header in 2 × 2), and wait for its tricks, the fountain show above all, or finish a Tutorial for the fountain. Then scroll up so the header comes back, and try the same lower in the page, where the tricks should look as they did.

**Since then (2026-11-05):** [237](./237-beads-weather-from-farther-off.md) has the umbrella's rain start at the window's top, behind the header where it stays on top, rather than under it; the evaporating trick's sun and cloud go up only as far as fits under the header or the window's top.

**Since then (2026-11-05, [237](./237-beads-weather-from-farther-off.md), decision 11):** the rain is near Bead again, each drop from its own height, 60 to 120 px over its edge and under what is over the page; Bead winces as it starts.
