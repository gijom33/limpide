# 197: Bead rides the LFOs everywhere, and when dropped on one

**What to build:** The owner's idea (inbox, 2026-11-02): "I never saw Bead ride an LFO yet. Let make it happen even on phone and 2x2. Also if Bead is dragged and dropped near a slow sine or triangle LFO, force it to ride." It builds on [141](./141-bead-rides-the-lfos.md), where a ride is one of Bead's visits, made only three and four across. Polish of v1's Bead ([131](./131-v1.md)).

**Blocked by:** [181](./181-bead-never-over-text.md) and [192](./192-beads-cover-checks-complete.md) merged: built on their own branch, not yet merged, they change where Bead rests and when a visit or ride ends, the code this builds on

**Status:** ready-for-agent · enhancement. Polish for v1

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
