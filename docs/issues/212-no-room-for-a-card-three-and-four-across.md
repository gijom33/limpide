# 212: No room kept for a card in three and four across

**What to build:** The owner's bug (inbox, 2026-11-03), on the Demo's card at the bottom of the window, the page keeping room for it under its last section: "It's not gret to have a box overlay and hide stuff but it's worse to have to scroll in this 3-across and 4-across modes. They are meant to show everything." Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-04). Built (2026-11-03) on night/2026-11-03, merged into main, released in 1.24.0; accepted by the owner, tried in part and the rest trusted: "All issues waiting on my feedback look fine, I tested some, others trust you."

## Decisions

Decided by the owner, 2026-11-03:

1. **In three and four across, a docked card never makes the page scroll** (narrowed to the Demo's card by decision 6). It sits over the page's bottom edge instead, as it already does on a window the page fits.

Claude's calls, let stand by the owner in 1.23.0:

2. **Every docked card, not the Demo's alone** (superseded by decision 6): a Tutorial's and the Tour's keep room at every width today, so they make three and four across scroll too.
3. **A phone and 2 × 2 keep the room as now:** those pages scroll anyway, and the room lets the last section come out from under the card.
4. **A control the keyboard reaches under the card still comes clear of it** where the page can scroll; where it cannot, the card can be folded or moved, as now.
5. **A window too short for three or four across,** where the page scrolls without any card, is not changed by this issue: it scrolls as much as it must, and no more for the card.

Decided by the owner, 2026-11-03, answering question 1 below (relayed to the night by the owner's day session):

6. **The Demo's card alone** ("Yes, Demo only"): in three and four across only the Demo's card stops keeping room; the Tour's and a Tutorial's cards keep room as now, so the page scrolls to what they point at.

## Agent Brief

**Category:** bug
**Summary:** In the three and four across layouts, the Demo's docked card adds room under the page's last section, so a page meant to be seen whole has to be scrolled.

**Current behavior:** The Demo's card keeps room under the page wherever the page is taller than the window at all, even by a little, and then adds the card's whole height to the scroll. A Tutorial's and the Tour's cards keep room always, at every width. In three and four across the owner had to scroll to the card's room to see the last section's bottom.

**Desired behavior:**
- In three and four across, the Demo's card adds no room under the page; it lies over the page's bottom edge, and the page scrolls only as much as it would with no card open.
- The Tour's and a Tutorial's cards keep room as now, at every width, so the page scrolls to what they point at (decision 6).
- On a phone and in 2 × 2, the room is kept as now for every card.
- A Tutorial Step's control or Viewer under the card is still brought clear of it where the page can scroll; folding or moving the card still uncovers what is under it.

**Key interfaces:**
- The docked card's room under the page
- The layouts' widths (phone, 2 × 2, three across, four across)

**Acceptance criteria:**
- [x] In three and four across, on a window the page fits, opening the Demo leaves the page unscrollable
- [x] On a window a little shorter than the page, opening the Demo does not add to the scroll
- [x] In three and four across, the room under the last section is still kept for a Tutorial's and the Tour's cards
- [x] On a 375 px phone and in 2 × 2, the room under the last section is kept for each card
- [x] A Tutorial's Steps still show their control and Viewer above the card where the page can scroll

**Out of scope:**
- Where the card sits, its size, folding and moving

## Questions for the owner

Tried on the night of 2026-11-03: no room under the page for any docked card in three and four across (the windows wider than 2 × 2). The Demo's card then behaves as asked. But the Tour's and a Tutorial's cards point at Viewers and controls, and in three and four across some of these sit at the page's bottom, under the card; with no room, the page cannot scroll them clear:

- 1280 × 800: the Tour's LFO card covers the Envelope Timeline it talks about, wholly (the card is tall), and its first card covers the bottom of the Oscillator Scope by 16 px.
- 1920 × 1080: the Tour's first card covers the bottom of the Oscillator Scope by 5 px.
- 1440 × 900: with a Tutorial open, the keyboard's focus on the LFO 1 Destination stays under the card (issue 104 had it brought clear).

Folding or moving the card uncovers them (decision 4), but the Tour is the newcomer's first look, and it would hide what it shows. The Demo's card points at nothing, so it has no such trouble.

1. **In three and four across, should the Tour's and a Tutorial's cards still keep room, so the page scrolls to show what they point at?**
   - (a) Yes, as now: only the Demo's card stops keeping room there (decision 2 narrowed to the Demo).
   - (b) No: no card keeps room; the Tour and Tutorials may cover what they point at, the person folds or moves the card.
   - (c) Room only while what the card points at is under it: the page scrolls just enough for that card or Step, and not at all for the others.

   Recommended: (a). It fixes what you met (the Demo), keeps the Tour and Tutorials showing what they talk about, and is the smallest change; (c) can come later if their scroll bothers you too.

## How it was built

- **The Demo's room.** The Demo's card keeps room under the page only on a phone and in 2 × 2, and there only where the page is taller than its window, as before. In three and four across it keeps none: the card lies over the page's bottom edge, and the page scrolls only as much as it would with no card open, whether it fits the window or is a little taller than it (decisions 1, 5, 6). The option that asks for this kind of room is now named "when stacked", what it means.
- **The Tour's and a Tutorial's cards** keep room at every width, as before (decision 6), so the page still scrolls what they point at clear of them.
- **Tests** (dockedCards): in three across (1440 × 900) and four across (1920 × 1080), on a window the page fits, the Demo leaves the page unscrollable; at 1440 × 800, a window a little shorter than the page, the Demo adds nothing to the scroll (this one failed before the fix); in three and four across the page still keeps room for the Tutorial's and the Tour's cards; on a 375 px phone and in 2 × 2 it keeps room for all three cards. A Tutorial's Steps brought clear of the card (issues 104, 105) are unchanged and their tests pass.

## Claude's calls, let stand by the owner in 1.24.0

1. **The line is the 2 × 2 layout's own breakpoint:** from the first width that shows three across, the Demo keeps no room; up to it, as before. A window resized across the line takes the new rule at once.
2. **A tall tablet in 2 × 2 that the page fits** still gets no room for the Demo, as before: the card then sits over the bottom edge there too.

## Review (`/code-review` since 71ffeff, 2026-11-03)

Fixed: the room option's name, which no longer said what it means; the new tests' repeated steps put in one helper and one list of the wide layouts; the card's top and the page's bottom read in one step in the page; About opened by its exact name; decision 1 marked as narrowed by decision 6.

Noted, not changed: the "a little shorter" case is tested in three across only (four across takes the same rule); the issue's title still says "a card", kept so its name matches the inbox's.

## What to try

- In three or four across (a laptop or desktop window), play the Demo: no scroll bar appears for its card, on a window the page fits or one a little shorter; the card sits over the page's bottom edge.
- Open the Tour or a Tutorial on the same window: the page still lets you scroll the last section clear of the card.
- On a phone or in 2 × 2, all three cards still leave room under the last section.
