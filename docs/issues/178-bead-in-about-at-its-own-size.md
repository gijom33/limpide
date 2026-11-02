# 178: Bead in About at its own size

**What to build:** The owner's idea (inbox, 2026-11-01), with a screenshot of About on a phone: "Let's make Bead its real size and move it to the level of bottom of Limpide's logo." Issue [163](./163-bead-in-about.md) (in 1.20.0) stands Bead beside About's logo at twice its page size (its decision 3, Claude's call), on the line of the wordmark, so it looks large beside the logo's mark and stands lower than the mark's foot. Polish of v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-human · enhancement. Built (2026-11-01) on night/2026-11-01, for the owner to try

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
- [x] Bead's drawn size in About equals its size on the page
- [x] Its foot is within 1 px of the bottom of the logo's mark, at a phone's width and a laptop's
- [ ] The About and mascot specs and the design audit pass; every test passes in Linux's fonts too

## How it was built

Built 2026-11-01, at night, on `night/2026-11-01` (commits `Issue 178: …`).

- **Its size:** Bead in About is drawn at its page size, 44 × 26 px, where 163 drew it at twice that.
- **Its place:** the mark and Bead side by side, centred together over the name (163 did so only under 340 px), Bead's foot on the bottom of the mark's stroke: the stroke ends 0.8 of the mark's 16 units over the foot of its box, so Bead stands 2.2 px over the box's foot.
- **Its button** stays a phone's 44 px tall, as the design audit asks of every target: the drawn Bead is at its foot, the button's room above it empty. Its card, idling and switch are 163's, unchanged.
- **Tests:** the About spec measures, at 393 × 659 and 1440 × 900, Bead's drawn size against Bead's on the page, its foot within 1 px of the mark's lowest point (the path's bottom and half its stroke) and the pair centred within 1 px; the About, mascot and design-audit specs pass in Chromium. Linux's fonts are GitHub's run to check: nothing of the place hangs on a font.

Calls made without the owner (Claude's call, open to the owner):

1. **Centred together** (decision 2): the pair's middle on About's middle, so the mark sits a little left of the name's middle, by half of Bead and the gap. The alternative was the mark over the name's middle, Bead hanging to its right, as 163 had it above 340 px.
2. **The button's height:** 44 px, taller than the drawn Bead, as a phone's touch target; the room is above Bead, so its focus ring is taller than it.

**What to try:** with Bead on, open About on a phone and at a laptop's size: Bead stands at the size it has on the page, its feet on the line of the wave's lowest point, the two centred over "Limpide". Tap it: its card, as before.
