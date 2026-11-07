# 197: Bead rides the LFOs everywhere, and when dropped on one

**What to build:** The owner's idea (inbox, 2026-11-02): "I never saw Bead ride an LFO yet. Let make it happen even on phone and 2x2. Also if Bead is dragged and dropped near a slow sine or triangle LFO, force it to ride." It builds on [141](./141-bead-rides-the-lfos.md), where a ride is one of Bead's visits, made only three and four across. Polish of v1's Bead ([131](./131-v1.md)).

**Blocked by:** none (181 and 192, which change the code this builds on, were merged into main on 2026-11-02)

**Status:** done (2026-11-03). Built (2026-11-02) on night/2026-11-02, merged into main, released in 1.23.0; tried by the owner: "All good."

## Decisions

Decided by the owner, 2026-11-02:

1. **A ride is seen:** the owner has never seen one ("I never saw Bead ride an LFO yet").
2. **On every layout,** a phone and 2 × 2 too ("Let make it happen even on phone and 2x2"). This reverses 141's call that Bead rides only three and four across.
3. **Dropped near a slow Sine or Triangle LFO, Bead rides it** ("force it to ride").

Claude's calls, open to the owner:

4. **A ride comes first:** when a visit is due and an LFO can be ridden, Bead rides it rather than drawing it at random among the sections in view, as 141 does. Rides still last 8 to 18 seconds, and the next visit still comes 20 to 40 seconds after. Today a ride needs an LFO turned on, Sine or Triangle, at 1 Hz or slower, its plot in view, and then wins only one draw among the sections; that is likely why the owner never saw one.
5. **"Slow" is 141's bound:** Depth above 0, a Sine or a Triangle, 1 Hz or slower (with Sync, the Hz its note value gives at the tempo). The same rule decides a ride by itself and a ride on a drop.
6. **On a phone and in 2 × 2,** where Bead makes no visits, a ride is its own: every 15 to 40 seconds, if an LFO can be ridden and its plot is in view and clear of the cards, Bead goes onto it as it goes up and down there (falling like rain, or flying on its tail) and rides. When the ride ends, it goes back to its edge the same way; when the plot scrolls out of view, it takes off and hovers, as when its edge goes under the tabs (142).
7. **"Near" a plot** is a drop with Bead's box over the plot, or within one Bead's width (44 px) of it. Dropped there, Bead lands on the line and rides for 8 to 18 seconds, whatever visit is due, and gets off by 141's rules. Dropped near a fast LFO, a Saw or a Square, or one at Depth 0, it lands as it does now.
8. **Never while the Demo plays or under reduced motion,** a drop included, as in 141; a funny turn under way plays to its end first.

## Agent Brief

**Category:** enhancement
**Summary:** Bead's LFO rides become easy to see: they come first when due, they happen on a phone and in 2 × 2 too, and dropping Bead near a slow Sine or Triangle LFO puts it on the ride.

**Current behavior:** Outside the Demo, Bead rides an LFO's plot only three and four across, and only as one random choice among its visits when a visit is due, with an LFO on, a Sine or a Triangle at 1 Hz or slower, its plot in view and clear of the cards. On a phone and in 2 × 2 it makes no visits, so it never rides. Dropped after a throw, it lands on the first edge it comes down onto, even onto an LFO's plot.

**Desired behavior:**
- When a visit is due and an LFO can be ridden (decision 5), Bead rides it first; the ride's length and the wait after it are as now.
- On a phone and in 2 × 2, every 15 to 40 seconds, when an LFO can be ridden and its plot is in view and clear of the cards, Bead goes onto the plot the way it moves up and down there, rides, and goes back to its edge after. A plot scrolling out of view ends the ride as an edge under the tabs does.
- Dropped with its box over a plot that can be ridden, or within 44 px of it, Bead lands on the line and rides for 8 to 18 seconds. Near any other plot it lands as now.
- The ride ends by 141's rules (the LFO no longer ridable, the plot out of view or covered, picked up, sent away, the Demo starting, reduced motion).
- Never during the Demo or under reduced motion.
- The page about Bead lists the rides on every layout and the ride on a drop.

**Key interfaces:**
- The choice of what can be ridden (141's), and Bead's choice of visits
- Bead's movement on a phone and in 2 × 2 (falling, flying on its tail, hovering)
- The throw and its landing
- The LFO plot's line, as the ride reads it

**Acceptance criteria:**
- [ ] A unit test of the choice: with a visit due and an LFO to ride, the ride is chosen
- [ ] A unit test of "near": a drop over the plot or within 44 px rides; farther, or near a fast LFO, a Saw, a Square or Depth 0, lands as now
- [ ] e2e, on a phone's width and in 2 × 2: with a slow Sine on LFO 1 and its plot in view, Bead rides it, its foot within 4 px of the line, and goes back to its edge after
- [ ] e2e, three across: Bead thrown and dropped on LFO 1's plot (a slow Triangle) rides it; dropped on a Saw's plot, it does not
- [ ] No ride during the Demo or under reduced motion, a drop included
- [ ] Bead's frame-cost test passes as before; every test passes in Linux's fonts too

**Out of scope:**
- New moves on the ride (127's tricks)
- Riding the Envelope Timeline or the other Viewers
- Changing which LFOs can be ridden (decision 5 keeps 141's bound)

## How it was built

- **A ride comes first** (decision 4): when a visit is due three or four across, a pure choice of visits takes a ride whenever an LFO can be ridden (141's bound, unchanged), at random between the two LFOs if both can; only with none does it draw among the sections in view. Rides still last 8 to 18 seconds, the next visit 20 to 40 seconds after.
- **On a phone and in 2 × 2** (decisions 2 and 6): every 15 to 40 seconds (the first 15 to 35 seconds after Bead comes), if an LFO can be ridden and its plot is in view under the header and the tabs, with room over it for Bead, and clear of the cards, Bead goes onto the line by its usual moves between lines (falling like rain onto a lower plot, flying up on its tail to a higher one), rides, and goes back the same way to the edge it left, or, that edge gone from view, to the nearest. Its plot scrolling under the tabs, or out of the window, ends the ride: Bead then goes to the nearest edge in view, or hovers under the tabs, as when its edge goes under them (142). Turning the window to the stacked layout no longer ends a ride, only a visit to a section.
- **Dropped near a plot** (decisions 3 and 7): let go with its box over the plot of an LFO it may ride, or within 44 px of it, that plot one it would ride by itself (in view, wide enough, clear of the cards), Bead gives up its throw, drops onto the line at the nearest spot along it (or flies up to it if held under the line), and rides for 8 to 18 seconds whatever visit was due. Near a Saw's, a Square's, a fast LFO's or a Depth 0 plot, or a plot half under the tabs or the window's foot, it is thrown as before; so it is while being sent away or pointing the way in a Tutorial or the Tour. It works on every layout. Its ride ends by 141's rules.
- **Never during the Demo or under reduced motion** (decision 8), a drop included: the choice of what can be ridden gives nothing then, and under reduced motion Bead cannot be picked up at all. A ride never starts in the middle of a funny turn.
- `docs/bead.md` lists the rides on every layout and the ride on a drop; CONTEXT.md's Bead entry says so.

Claude's calls, open to the owner:

1. **The plot's own tip does not keep Bead off its line.** Dropping Bead on a plot leaves the pointer resting there, and the plot's tip opened over it a third of a second later; as a cover (164), it ended the ride at once, so a drop would never have been seen to ride. Now the ridden plot's own tip is ignored, for a drop and a ride by itself alike; Bead rides on, drawn under the tip as under any cover. Any other tip, card or panel over the plot still ends the ride.
2. **Dropped beside the plot,** Bead goes to the nearest spot along the line rather than to one at random.
3. **With no plot to ride when one is due** on a phone or in 2 × 2, Bead waits another 15 to 40 seconds before looking again.

**Tests:** unit tests of the choice of what can be ridden (141's, unchanged: none during the Demo or under reduced motion, which a drop uses too), of the visit (a ride first, whatever the draw), of "near" (over the plot, 44 px over, beside and off a corner; 45 px and a corner 56 px off are too far; a Saw's or Depth 0 plot never), of a ride outlasting the window turning stacked, and of the drop's move onto the line from over it and from under it. In the browser: on a phone's width and in 2 × 2, LFO 1 a Sine at half a hertz with its plot in view, Bead rides it with its foot within 4 px of the line, then goes back to the LFO & Envelopes edge; three across, dropped on LFO 1's plot (a slow Triangle) it rides it, and dropped on LFO 2's (a Saw as slow, on) it is thrown home. The last criterion, Linux's fonts, is for GitHub's run to show.

**To try:** on a phone or a window under 860 px, turn LFO 1's Depth up and its Rate to 1 Hz or slower, keep a Sine or a Triangle, scroll until its plot shows under the tabs, and wait: within 15 to 40 seconds Bead goes onto the plot and rides it, then goes back. Scroll the plot under the tabs mid-ride. On a wide window, the same: the next visit is a ride. Then pick Bead up and drop it on the plot, or just beside it, mid-ride or not; and drop it on a Saw's plot (LFO 2 on, a Saw), where it is thrown as before. During the Demo, a drop on the plot is a throw.

**Since then (2026-11-05, [245](./245-beads-frame-read-decide-draw.md)):** the browser test of its LFO rides on a phone and in 2 × 2 left `e2e/mascot.spec.ts` for the node tests of Bead's frame, on readings of the page, as [232](./232-1-24-0-red-on-githubs-linux-webkit.md) records.

**Since then (2026-11-07, [250](./250-tidy-ups-after-1-26.md))**: the drop on LFO 2's Saw, thrown home, is tested in Bead's frame's unit tests only; the browser spec keeps the ride's wiring.
