# 171: The Demo card's caption under its name

**What to build:** The owner's idea (inbox, 2026-10-31), with a screenshot of the Demo's card: today it reads the part's name ("Strings") with its buttons, then the parts' segments, then the part's caption ("Held chords that shimmer, the shimmer speeding up until it buzzes.") at the bottom. "I would move the text below the preset name and keep the progress line at bottom." Polish of v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement

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
- [ ] At 375, 1100 and 1920 px the card reads name, caption, segments; the segments do not move from part to part
- [ ] Folded, the name and the segments show
- [ ] The Demo spec and the design audit pass; every test passes in Linux's fonts too

**Out of scope:**
- The captions' words; the Tutorial's and the Tour's cards
