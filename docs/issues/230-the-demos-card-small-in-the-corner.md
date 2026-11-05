# 230: The Demo's card small in the corner, three and four across

**What to build:** The owner's idea (inbox, 2026-11-04), on a screenshot of the Demo's folded card over LFO 2's controls at about 1000 px wide: "In 3-across and maybe 4-across, let's collapse the info box and place it in the bottom right corner. It's a way not to hide too many things." Since [212](./212-no-room-for-a-card-three-and-four-across.md) the Demo's card keeps no room under the page there, so it lies over the page's bottom edge; folded, it is still 640 px wide and centred, over the middle of LFO & Envelopes. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Polish for v1

## Decisions

Decided by the owner, 2026-11-04:

1. **In three across, the Demo's card is collapsed and sits in the bottom right corner,** so it hides as little as it can.

Claude's calls, accepted by the owner, 2026-11-04 ("Yes, tonight"):

2. **Four across too** (the owner's "maybe"): it is the same layout question as three across, and 212 treats the two alike.
3. **Collapsed is the card's fold, made small:** folded in three and four across, the Demo's card is only as wide as its top row needs (the Demo's part name, ⌃, Stop and ×), the parts' segments a thin line under them, about 340 × 60 px, 12 px from the window's bottom and right edges, as the docked cards keep from the edges now.
4. **It opens folded there,** each time the Demo starts in three or four across, whatever fold was remembered; ⌃ unfolds it to the whole card, which grows up and to the left from the corner, and ⌄ folds it back into the corner. In 2 × 2 and on a phone the card and its remembered fold stay as now.
5. **The Demo's card only:** the Tour's and a Tutorial's cards point at controls and Viewers and keep their place and room as now ([212](./212-no-room-for-a-card-three-and-four-across.md), decision 6).
6. **Still moved by its top row,** as cards can be from 2 × 2 up; a card moved stays where it was put until the Demo is closed.

Measured before writing (2026-11-04, the welcome closed, Chromium): a 340 × 60 card 12 px from the bottom right corner covers only the Envelope Timeline's right end and its section's edge, no control, at 1000 × 737, 1280 × 800 and 1440 × 900 (three across) and 1920 × 1080 (four across, where the corner is the bottom of LFO & Envelopes' column).

## Agent Brief

**Category:** enhancement
**Summary:** In three and four across, the Demo's card folds into a small card in the window's bottom right corner, so it covers no control.

**Current behavior:** In three and four across the Demo's card is docked at the bottom centre, 640 px wide; folded to its top row it is still that wide and lies over LFO 2's controls in LFO & Envelopes. The fold is remembered for each card.

**Desired behavior:**
- In three and four across, the Demo's card opens folded, small (its top row only: the part's name, unfold, Stop, close; the parts' segments as a thin line), in the bottom right corner, 12 px from the edges.
- Unfolding it shows the whole card, grown from the corner; folding it returns it to the small card in the corner.
- Moving it by its top row still works.
- In 2 × 2 and on a phone, the Demo's card, its fold and its room are as now; the Tour's and a Tutorial's cards are unchanged everywhere.
- Every button on the small card keeps its accessible name and the layouts' target sizes (`docs/design-principles.md`), and the part's name fits on one line, shortened as the design principles say where it would not.

**Key interfaces:**
- The docked card's placement and fold
- The Demo's card
- The layouts' widths (phone, 2 × 2, three across, four across)

**Acceptance criteria:**
- [ ] At 1440 × 900 and 1920 × 1080, the Demo's card opens folded in the bottom right corner, about 340 × 60, and covers no control (a browser test asks what lies under it)
- [ ] Unfolding shows the whole card inside the window; folding brings it back to the corner
- [ ] At 1000 × 737 and 1280 × 800 (three across on smaller windows) the same holds, the page scrolling no more for the card than without it (212's test still passes)
- [ ] In 2 × 2 and on a 375 px phone the Demo's card is as before (the existing card tests pass unchanged)
- [ ] The design audit's state with the Demo playing passes in three and four across
- [ ] The words test passes

**Out of scope:**
- The Tour's and a Tutorial's cards
- What the Demo plays, and the card's words when unfolded
