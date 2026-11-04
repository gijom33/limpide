# 212: No room kept for a card in three and four across

**What to build:** The owner's bug (inbox, 2026-11-03), on the Demo's card at the bottom of the window, the page keeping room for it under its last section: "It's not gret to have a box overlay and hide stuff but it's worse to have to scroll in this 3-across and 4-across modes. They are meant to show everything." Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · bug. Polish for v1

## Decisions

Decided by the owner, 2026-11-03:

1. **In three and four across, a docked card never makes the page scroll.** It sits over the page's bottom edge instead, as it already does on a window the page fits.

Claude's calls, open to the owner:

2. **Every docked card, not the Demo's alone:** a Tutorial's and the Tour's keep room at every width today, so they make three and four across scroll too.
3. **A phone and 2 × 2 keep the room as now:** those pages scroll anyway, and the room lets the last section come out from under the card.
4. **A control the keyboard reaches under the card still comes clear of it** where the page can scroll; where it cannot, the card can be folded or moved, as now.
5. **A window too short for three or four across,** where the page scrolls without any card, is not changed by this issue: it scrolls as much as it must, and no more for the card.

## Agent Brief

**Category:** bug
**Summary:** In the three and four across layouts, a docked card (the Demo's, a Tutorial's, the Tour's) adds room under the page's last section, so a page meant to be seen whole has to be scrolled.

**Current behavior:** The Demo's card keeps room under the page wherever the page is taller than the window at all, even by a little, and then adds the card's whole height to the scroll. A Tutorial's and the Tour's cards keep room always, at every width. In three and four across the owner had to scroll to the card's room to see the last section's bottom.

**Desired behavior:**
- In three and four across, no docked card adds room under the page; the card lies over the page's bottom edge.
- The page scrolls only as much as it would with no card open.
- On a phone and in 2 × 2, the room is kept as now.
- A Tutorial Step's control or Viewer under the card is still brought clear of it where the page can scroll; folding or moving the card still uncovers what is under it.

**Key interfaces:**
- The docked card's room under the page
- The layouts' widths (phone, 2 × 2, three across, four across)

**Acceptance criteria:**
- [ ] In three and four across, on a window the page fits, opening the Demo, a Tutorial or the Tour leaves the page unscrollable
- [ ] On a window a little shorter than the page, opening a card does not add to the scroll
- [ ] On a 375 px phone and in 2 × 2, the room under the last section is kept for each card
- [ ] A Tutorial's Steps still show their control and Viewer above the card where the page can scroll

**Out of scope:**
- Where the card sits, its size, folding and moving
