# 164: Bead never under a card

**What to build:** The owner's bug (inbox, 2026-10-31), on a phone during the Demo on the night branch: "Bead should never be hidden by the info boxes." Bead lives on the Sections' top edges and is drawn under the header and the docked cards (issue 115's brief: "under the header and the cards"), so when the Demo's card, a Tutorial's or the Tour's docks over its edge, Bead disappears behind it. Polish of Bead in v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · bug

## Decisions

1. **Bead is never hidden by a card.** Decided by the owner, 2026-10-31.

Claude's call, open to the owner:

2. **Bead moves, the card stays:** Bead stays drawn under the cards (so it never covers a card's words or buttons), and never stands where a card, a tip or an open panel covers it. When one comes over its spot, it goes, by its usual moves, to the nearest stretch of an edge in view and clear of them; when every edge in view is covered, it hops up onto the card's top edge and stands there until it can go back.
3. **Its room counts the cards:** the stretch of an edge Bead may roam leaves out what a card or a tip covers, as it already leaves out the controls, so a stroll never takes it under one.
4. **On a phone and in 2 × 2,** where Bead keeps in view as the page scrolls, the same: the docked card's top is an edge it may stand on when nothing else is clear.

## Agent Brief

**Category:** bug
**Summary:** Bead disappears behind the Demo's, a Tutorial's or the Tour's docked card when it docks over Bead's edge, on a phone above all.

**Current behavior:** Bead is drawn under the header and the docked cards. On a phone during the Demo, the Demo's card docks over the edge Bead stands on, and Bead is hidden until it happens to move away.

**Desired behavior:** Bead never stands where a docked card, a tip or an open panel covers it. Its room along an edge leaves those out; when one comes over its spot it moves, by its usual moves, to the nearest clear stretch in view; when no edge in view is clear, it stands on the card's top edge until one is. It is still drawn under the cards, so it never covers their words or buttons.

**Key interfaces:**
- Bead's choice of where to stand and roam (its room along an edge, what it leaves out)
- The docked cards' (the Demo's, a Tutorial's, the Tour's) boxes and when they change
- The tips and panels that open over the page

**Acceptance criteria:**
- [ ] On a 375 px phone, during the Demo, Bead is in view and not under the Demo's card at any part
- [ ] The same with a Tutorial's card and the Tour's
- [ ] Bead never covers a card's words or buttons
- [ ] The mascot spec covers it in both browsers; Bead's frame-cost test passes as before

**Out of scope:**
- Bead pointing the way ([151](./151-bead-points-in-the-tour-and-tutorials.md))
