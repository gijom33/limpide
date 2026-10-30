# 99: The Demo card's segments big enough to press

**What to build:** From the 1.16.0 review (the inbox, 2026-10-30). The Demo card shows each part as a segment sized by its length, and pressing one plays from that part; a short part's segment is as narrow as 4 px, under the design principles' targets (24 px on a laptop, 44 px on a phone), with no waiver, and the design audit never opens the card.

**Blocked by:** none

**Status:** ready-for-agent · bug

## Agent Brief

**Category:** bug
**Summary:** Every Demo segment is a press target of the design principles' size, its drawn width still its part's length.

**Current behavior:**
- A segment's press area is its drawn bar: a short part's is a few pixels wide and as tall as the thin bar.

**Desired behavior:**
- Each segment's press area meets the design principles' target size on every layout (24 px on a laptop, 44 px on a phone), while the bar drawn still shows each part's length and its fill.
- Pressing anywhere in a segment's area plays from that part, as today.
- The design audit opens the Demo card, so it checks the segments with every other control.

**Key interfaces:**
- The Demo card's bar of parts
- The design audit's list of states it opens

**Acceptance criteria:**
- [ ] The design audit, with the Demo card open, finds every segment at least the target size, at a phone's width and a laptop's
- [ ] Pressing the shortest part's segment plays from it
- [ ] The bar still reads as segments sized by their parts

**Out of scope:**
- The Demo's parts and their order
