# 171: The Demo card's caption under its name

**What to build:** The owner's idea (inbox, 2026-10-31), with a screenshot of the Demo's card: today it reads the part's name ("Strings") with its buttons, then the parts' segments, then the part's caption ("Held chords that shimmer, the shimmer speeding up until it buzzes.") at the bottom. "I would move the text below the preset name and keep the progress line at bottom." Polish of v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-02). Built (2026-11-01) on night/2026-10-31 and released; tried by the owner: "Good."

## Decisions

1. **The caption under the part's name, the segments at the bottom.** Decided by the owner, 2026-10-31.

Claude's call, open to the owner:

2. **The card keeps its height from one part to the next:** the caption's room is that of the longest caption at the card's width, so the segments never jump as the Demo moves on (as the part's name already has a fixed width, 2026-10-29).
3. **On a phone,** where the segments take a row of their own, the same order: name and buttons, caption, segments; folded, the card shows the name and the segments.

## Agent Brief

**Category:** enhancement
**Summary:** On the Demo's card the part's caption moves up under its name, and the parts' segments become the card's last row.

**Current behavior:** The Demo's docked card shows the part's name with Fold, Stop and Close, then the segments (each part, the playing one filling), then the caption.

**Desired behavior:** The card shows the name and its buttons, the caption under the name, then the segments along the bottom. Its height holds from part to part (the caption's room fits the longest caption at that width), so the segments stay put. On a phone the same order; folded, the name and the segments.

**Key interfaces:**
- The Demo's docked card and its folded state
- The docked cards' shared shell (issue 139 may unify it with the Tutorial's and the Tour's)

**Acceptance criteria:**
- [x] At 375, 1100 and 1920 px the card reads name, caption, segments; the segments do not move from part to part
- [x] Folded, the name and the segments show
- [ ] ~~The Demo spec and the design audit pass; every test passes in Linux's fonts too (both pass in Chromium on macOS; Linux's fonts are GitHub's run, at the push)~~ (not checked at the time)

**Out of scope:**
- The captions' words; the Tutorial's and the Tour's cards

## How it was built

- The caption moved into the card's top row, between the name with its buttons and the segments, so the card reads name, caption, segments at every width; on a phone ‹ and › stay beside the segments along the bottom.
- Its room holds: every part's caption sits in the caption's one cell, out of sight, the playing one shown, so the row is as tall as the longest caption at the card's width and in the page's fonts. Measured: the segments sit at the same place in the card for every part at 375, 1100 and 1920 px.
- Folded, the card shows the name and the segments; the caption goes out of sight and is still read out as it changes (issue 67).
- Claude's call, open to the owner: with the room held, a short caption (Strings', Kick's) leaves a line or two empty above the segments, and from 601 px up the card is as tall as with the longest caption all the time (about 108 px at 1100 px, 114 at 1920; 145 on a phone).
- Claude's call, open to the owner: the caption now sits in the card's top row, which is the handle the card is dragged by from 601 px up, so a drag that starts on the caption moves the card too.
- The Demo spec's test of the segments staying put now checks the order and that the first segment holds across and down, at 375, 393, 1100, 1440 and 1920 px.

**To try:** start the Demo at a phone's width and on a wide window; let it run, or click a segment to jump from a short caption (Strings) to a long one (Self-Oscillation): the segments stay put. Fold the card: the name and the segments.

**Since then (2026-11-04, issue [230](./230-the-demos-card-small-in-the-corner.md)):** folded in three and four across, the card is small in the window's bottom right corner and its parts are a thin line, not segments to press; unfolded it reads name, caption, segments as above.
