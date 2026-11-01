# 178: Bead in About at its own size

**What to build:** The owner's idea (inbox, 2026-11-01), with a screenshot of About on a phone: "Let's make Bead its real size and move it to the level of bottom of Limpide's logo." Issue [163](./163-bead-in-about.md) (in 1.20.0) stands Bead beside About's logo at twice its page size (its decision 3, Claude's call), on the line of the wordmark, so it looks large beside the logo's mark and stands lower than the mark's foot. Polish of v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## Decisions

1. **Bead at its own size** (as on the page), **its foot level with the bottom of the logo's mark** (the coloured wave above the word "Limpide"). Decided by the owner, 2026-11-01; replaces 163's decision 3's size and place.

Claude's call, open to the owner:

2. **Still beside the mark, to its right,** the mark and Bead centred together as the logo was; everything else of 163 (its idling, its button and card, hidden with the switch Off) as built.

## Agent Brief

**Category:** enhancement
**Summary:** In About, Bead stands at its page size, its foot on the line of the bottom of the logo's mark, instead of twice as big on the wordmark's line.

**Current behavior:** About shows Bead to the right of the logo at twice its page size, standing on the wordmark's baseline.

**Desired behavior:** Bead at its page size, its foot level with the bottom of the logo's mark, to the mark's right; the two centred together; its button, card and idling unchanged.

**Key interfaces:**
- About's header (the logo's mark, the wordmark, Bead's button)

**Acceptance criteria:**
- [ ] Bead's drawn size in About equals its size on the page
- [ ] Its foot is within 1 px of the bottom of the logo's mark, at a phone's width and a laptop's
- [ ] The About and mascot specs and the design audit pass; every test passes in Linux's fonts too
