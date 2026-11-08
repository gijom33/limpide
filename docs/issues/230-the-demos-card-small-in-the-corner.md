# 230: The Demo's card small in the corner, three and four across

**What to build:** The owner's idea (inbox, 2026-11-04), on a screenshot of the Demo's folded card over LFO 2's controls at about 1000 px wide: "In 3-across and maybe 4-across, let's collapse the info box and place it in the bottom right corner. It's a way not to hide too many things." Since [212](./212-no-room-for-a-card-three-and-four-across.md) the Demo's card keeps no room under the page there, so it lies over the page's bottom edge; folded, it is still 640 px wide and centred, over the middle of LFO & Envelopes. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-05). Built (2026-11-04) on night/2026-11-04, merged into main, released in 1.25.0; accepted by the owner: "OK with the rest of the tickets reviewed", with Claude's calls in it.

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
- [x] At 1440 × 900 and 1920 × 1080, the Demo's card opens folded in the bottom right corner, about 340 × 60, and covers no control (a browser test asks what lies under it)
- [x] Unfolding shows the whole card inside the window; folding brings it back to the corner
- [x] At 1000 × 737 and 1280 × 800 (three across on smaller windows) the same holds, the page scrolling no more for the card than without it (212's test still passes)
- [x] In 2 × 2 and on a 375 px phone the Demo's card is as before (the existing card tests pass unchanged)
- [x] The design audit's state with the Demo playing passes in three and four across
- [x] The words test passes

**Out of scope:**
- The Tour's and a Tutorial's cards
- What the Demo plays, and the card's words when unfolded

## How it was built

- **The corner.** From three across (861 px wide, the 2 × 2 layout's own line), the Demo's card is docked in the window's bottom right corner, 12 px from its edges, whether folded or not; unfolded it is the whole card as before (640 px, 720 px from 1280 px), grown up and to the left from the corner. On a phone and in 2 × 2 it sits at the bottom's middle as before.
- **The small card.** In three and four across the card opens folded each time the Demo starts (Play again too), whatever fold is remembered: 340 px wide and under 64 px tall, its top row (the part's name, ⌃, Stop, ×) and the parts as a thin line under it, each part as long as it plays, the playing one filling (decisions 1 to 4). Every part's name fits its row whole. ⌃ gives the whole card, ⌄ brings it back into the corner. It still moves by its top row and stays where it is put until the Demo is closed; a double-click puts it back (decision 6).
- **What it covers,** measured by the new test: no control at 1280 × 800, 1440 × 900 and 1920 × 1080; at 1000 × 737 only the Envelope Timeline's right end (a Viewer).
- **Tests:** in `dockedCards`, the card's place, size, names and what lies under it at the four windows; unfolding and folding back; a window resized from three across to 2 × 2 and back; the fold not remembered. The test of the remembered fold, at 1440 px before, now runs in 2 × 2 (768 × 1024), where the fold is still remembered; the 2 × 2 and phone tests are otherwise unchanged and pass. The design audit opens the Demo's card a second time, unfolded, so the whole card in the corner is checked too. The tests that press the segments in a wide window (Demo, keyboard, Bead's) unfold the card first; Bead's issue-164 check now drags the card over LFO 1's plot, which the card in the corner leaves clear.
- **Docs:** `docs/bead.md` (the card no longer covers the plots), and a dated line in issues 59, 99, 171 and 204.

## Claude's calls, let stand by the owner in 1.25.0

1. **On the small card the parts are a line that only shows them, not fifteen segments to press:** in 340 px fifteen segments come to about 18 px each, under the design principles' 24 px targets, and a waiver felt wrong for a card the person can unfold. So the line cannot be clicked or reached by Tab; ⌃ gives back the segments. Screen readers hear it as "Part 3 of 15", and the caption is still read out as it changes.
2. **A fold made in the corner is not remembered:** the card opens folded there every time anyway, and remembering it would change how the card opens in 2 × 2 and on a phone, where the remembered fold stays the person's.
3. **The card is 340 px wide whatever the part,** not as wide as each name: a card that grew and shrank with the parts would jump under the pointer. The longest name, Split Octave Bass, fits; a longer one would end in "…", as now.
4. **A window resized across the 2 × 2 line while the Demo plays** takes that layout's card: into three across the card folds into the corner; back to 2 × 2 it takes the remembered fold, at the bottom's middle. Either way a moved card goes back to its place.
5. **The "Demo stopped: you are playing now" card** sits in the same corner in three and four across, at the whole card's width, so it reads on one line and Play again is where the Demo's card was.

**To try:** on a laptop window (three across) and a wide one (four across), play the Demo: the small card in the bottom right corner, over no knob. Watch the line fill part by part; press ⌃ for the whole card, click a segment, ⌄ to send it back to the corner. Drag it by its name, double-click it home. Narrow the window to 2 × 2 while it plays, then widen it again. Play a Note during the Demo: the "you are playing now" card, in the corner.

**Since (2026-11-06, issue 246):** in three and four across the "you are playing now" card opens whole in the corner, whatever fold was made in 2 × 2 (before, a fold made there hid its words); a fold made on it there is the layout's, not remembered. Where storage cannot be written (a private window), a fold made elsewhere lasts the session instead of resetting at each new card.
