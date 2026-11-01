# 179: Bead's tail trails behind

**What to build:** The owner's idea (inbox, 2026-11-01): "Bead's tail should go to left when it goes right. It's good to have it on right when static as that's what the logo looks like." Bead is drawn as the logo's drop, its trailing wave (its tail) on its right; it turns round only in some funny turns, so when it strolls, hops or leaps to the right its tail leads instead of trailing. Polish of Bead in v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## Decisions

1. **Moving, the tail trails:** going right, its tail on its left; going left, on its right. **Still, the tail on its right,** as the logo has it. Decided by the owner, 2026-11-01.

Claude's call, open to the owner:

2. **It turns round as it sets off and as it stops,** with the turn its funny turns already use (its width going through zero), quickly enough that a short step does not look like a spin: under a fifth of a second, and not at all for a step shorter than its own width.
3. **What counts as moving:** a stroll, a hop along, a scoot, a leap or fall between Sections, a ride on an LFO plot (141) and the Demo's surf; a funny turn keeps its own turning; a dance step to a Note (a few pixels) does not turn it; hovering (142) faces as still.
4. **What follows the turn:** everything drawn on it that has a side (its twin by Detune keeps Detune's side of the page, as 174 made it; its props and the water gun's jet follow its facing as they do in the tricks that turn it).

## Agent Brief

**Category:** enhancement
**Summary:** Bead faces the way it moves, so its tail trails behind it, and faces as the logo when still.

**Current behavior:** Bead's facing changes only in a few funny turns; strolling, leaping or riding to the right it keeps its tail on its right, ahead of it.

**Desired behavior:** When Bead sets off to the right it turns round (tail on its left); to the left it faces as drawn (tail on its right); when it stops it faces as drawn. The turn is quick and skipped for small steps and dance steps; funny turns keep their own facing; its twin keeps Detune's side; props and jets follow its facing. Reduced motion: it faces its way with no turning animation.

**Key interfaces:**
- Bead's pose (its turn) and its moves (stroll, gaits, leaps, rides, surf)
- Its drawing (the twin, props, jets)

**Acceptance criteria:**
- [ ] Strolling right: tail on its left; strolling left: on its right; standing still: on its right (unit tests on the pose; a mascot spec check in one browser)
- [ ] A dance step to a Note does not turn it; a funny turn keeps its own turning
- [ ] Its twin stays on Detune's side whichever way it faces
- [ ] The mascot spec and Bead's frame-cost test pass as before
