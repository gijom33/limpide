# 99: The Demo card's segments big enough to press

**What to build:** From the 1.16.0 review (the inbox, 2026-10-30). The Demo card shows each part as a segment sized by its length, and pressing one plays from that part; a short part's segment is as narrow as 4 px, under the design principles' targets (24 px on a laptop, 44 px on a phone), with no waiver, and the design audit never opens the card.

**Blocked by:** none

**Status:** done (2026-10-30). The Demo card's segments have a row of their own under the name and the buttons at every width: from 601 px up each is at least 24 × 24 px, still as wide as its part is long; on phones they are 44 px tall with Previous part and Next part buttons of 44 × 44 px beside them. The design audit opens the card.

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
- [x] The design audit, with the Demo card open, finds every segment at least the target size, at a phone's width and a laptop's
- [x] Pressing the shortest part's segment plays from it
- [x] The bar still reads as segments sized by their parts

**Out of scope:**
- The Demo's parts and their order

## Decisions (2026-10-30, decided by the owner)

Found while building: the brief cannot be met as written. The Demo has 15 parts (the shortest, Self-Oscillation, 3.75 s of 172.5 s), and the row the segments share with the name and buttons is 351 px on a 375 px phone (fifteen 44 px targets need 660 px, fifteen 24 px ones 360 px), 333 px in the 640 px card (690 and 1024 px wide), and 395 px in the 720 px card (1440 px and up).

1. From 601 px up, the segments move to a row of their own under the part's name and the buttons, as on phones (about 606 px): each segment at least 24 px wide and 24 px tall, its width still set by its part's length, so only the shortest part is drawn wider than its share. This changes the one-row card decided on 2026-10-29.
2. On phones the segments stay pressable, 44 px tall and as wide as their row allows (about 22 px at the least), with "Previous part" and "Next part" buttons of 44 × 44 px beside them; WCAG 2.5.5 and 2.5.8 accept a full-size control doing the same. The design audit opens the Demo card and waives the segments on phones alone, naming these buttons as the reason.

## How it was built

- **The card** (`src/ui/DemoBar.tsx`, `src/styles.css`): the segments sit in a row of their own under the name and the buttons at every width, after them in the DOM too, so Tab meets the name's buttons, then the parts, as they stand on screen. From 601 px up each segment is at least 24 px wide and 24 px tall, its width set by its part's length: in the 640 and 720 px cards only Self-Oscillation is drawn wider than its share (24 px for 12 to 14); in the narrower card from 601 to 663 px the 4-bar parts are held at 24 px too. The name takes the rest of its row, ending in an ellipsis, so the segments still never move with it. The parts keep issue 104's keyboard: one Tab stop, the arrows, Home and End, Enter or Space.
- **Phones:** the segments are 44 px tall, with Previous part and Next part (‹ and ›, 44 × 44 px) at either end of their row; each is a button, named for screen readers, pressed by Enter or Space like any other, and greyed out with `aria-disabled` past the first or last part, so it keeps the focus. Between them the segments are 8 to 18 px wide at 375 px.
- **The same footprint at 1440 × 900:** to fit the new row without covering more of LFO 2 (review 3), the card has no gap of its own (the segments' row brings the space above and below the bar), its buttons are the page's 28 px from 601 px up (36 before) and its edges 8 px top and bottom (12 before). It is 91.8 px tall at 1440 and 1920, 88.8 px at 690, as before, and covers the same controls (LFO 2's Depth, Rate and Retrigger, the Envelope Timeline) by the same amount; the Verdana check gives the same. Folded, it is 8 px taller than before (the segments are part of its top row). On phones it is 14 px taller (128 px at 375), where the page keeps room below its last section.
- **The design audit** (`e2e/designPrinciples.spec.ts`): the Demo card is the last state opened (it loads its Presets), closed by its Stop. The segments pass at the laptop, foldable and wide sizes; on phones a waiver (floor 7.5 px) names Previous part and Next part as the full-size way along the parts, and `docs/design-principles.md` lists it with the other waivers. With the Demo playing, the audit also found a held piano key's octave name (C2) at 3.3:1 in the light theme: there a held key is now mixed darker, as a chosen Oscillators option already is, so it reads at 4.5:1 (Claude's call, open to the owner).
- **Tests** (`e2e/demo.spec.ts`): "from 601 px up every part's segment is at least 24 × 24 px…" at 601, 690 and 1440 px (every segment's size, one row under the buttons, widths in proportion, the shortest part played by a click, no Previous or Next); "on a phone the segments are 44 px tall, with Previous part and Next part…" (sizes, places, a click and Enter and Space on each, the greyed-out ends, Tab order outside WebKit). Both failed before the change.
- **Tests run:** `npx vitest run` (834 passed); in Chromium and WebKit the specs that touch the card (about, the design audit, docked cards, Display, Demo, header, keyboard, section strip, Song, Tutorial, welcome, piano), all passing in the last run (one Tutorial test in WebKit failed once under load and passed on its rerun); the Demo, docked-card and design-audit specs again with Verdana forced, all passing.
- **Claude's calls, open to the owner:**
  1. Decision 2's "about 22 px at the least" cannot hold while the segments show their parts' lengths: with Previous and Next beside them the segments have 255 px of the 351 px row, so in proportion the shortest is under 5 px; the floor here is 8 px (only Self-Oscillation drawn wider than its share, as from 601 px up), giving 8 to 18 px. Segments of about 22 px would need equal widths (losing the lengths on phones), or Previous and Next moved up beside the name (segments 12 to 26 px, the name down to about 95 px).
  2. Previous part and Next part show on phones only: from 601 px up every segment is already a target of the principles' size, and the keyboard has the arrows.
  3. The card's buttons 28 px tall from 601 px up, its edges and gap tightened, so it covers no more than before at 1440 × 900. The Tutorial card keeps its 36 px buttons.
