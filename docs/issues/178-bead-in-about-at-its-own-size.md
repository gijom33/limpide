# 178: Bead in About at its own size

**What to build:** The owner's idea (inbox, 2026-11-01), with a screenshot of About on a phone: "Let's make Bead its real size and move it to the level of bottom of Limpide's logo." Issue [163](./163-bead-in-about.md) (in 1.20.0) stands Bead beside About's logo at twice its page size (its decision 3, Claude's call), on the line of the wordmark, so it looks large beside the logo's mark and stands lower than the mark's foot. Polish of v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-human · enhancement. Built (2026-11-01) on night/2026-11-01 and shipped in 1.21.0; decisions 3 and 4 (the owner's, 2026-11-02) built the same day on main, for the owner to try: the logo and the name centred as before, Bead to the right of the name, on its baseline

## Decisions

1. **Bead at its own size** (as on the page), **its foot level with the bottom of the logo's mark** (the coloured wave above the word "Limpide"). Decided by the owner, 2026-11-01; replaces 163's decision 3's size and place.
   **Since then (2026-11-02):** decision 4 puts its foot on the name's baseline instead.

Claude's call, open to the owner:

2. **Still beside the mark, to its right,** the mark and Bead centred together as the logo was; everything else of 163 (its idling, its button and card, hidden with the switch Off) as built.

**Since then (2026-11-02, the owner's bug, inbox):** decision 3 replaces "centred together".

Decided by the owner, 2026-11-02, on 1.21.0's About on an iPhone: "Bead should not modify logo alignment. Move it to right."

3. **The logo keeps its own centring:** the mark centred over the name as it is with Bead away or switched off; Bead stands to the mark's right, outside that centring, its foot still on the mark's lowest point (decision 1). Where About is too narrow for it there, it may overhang the mark's right but never moves the mark.

Decided by the owner, 2026-11-02, while decision 3 was built: "Move Bead on right side of “Limpide” word."

4. **Bead to the right of the name,** the word "Limpide", not of the mark: its foot on the name's baseline (replacing decision 1's place), the name and the mark each centred as without Bead, and Bead adding no height, so nothing moves when it is switched on or off.

## Agent Brief

**Category:** enhancement
**Summary:** In About, Bead stands at its page size, its foot on the line of the bottom of the logo's mark (since decision 4, on the name's baseline, to its right), instead of twice as big on the wordmark's line.

**Current behavior:** About shows Bead to the right of the logo at twice its page size, standing on the wordmark's baseline.

**Desired behavior:** Bead at its page size, its foot level with the bottom of the logo's mark, to the mark's right; the two centred together (since decision 3, the mark centred alone, Bead to its right; since decision 4, Bead to the right of the name, its foot on the name's baseline, the mark and the name each centred as without it, adding no height); its button, card and idling unchanged.

**Key interfaces:**
- About's header (the logo's mark, the wordmark, Bead's button)

**Acceptance criteria:**
- [x] Bead's drawn size in About equals its size on the page
- [x] Its foot is within 1 px of the bottom of the logo's mark (since decision 4, of the name's baseline), at a phone's width and a laptop's
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

### Decisions 3 and 4, built (2026-11-02, on main)

- **The place:** the name sits in the middle of three columns whose outer two share one width, so it is centred as without Bead; Bead's button stands in the right column, a gap of `--space-3` from the name, its bottom on the name's baseline (a button with no text of its own has its bottom as its baseline). Its 44 px height is taken back by its top margin, so the row is as tall as the name. The mark, alone in its row, is centred as before.
- **Tests:** the About spec's Bead test checks, at 393 and 1440 px: Bead at its page size, right of the name, its foot within 1 px of the name's baseline (an empty inline block measures it), the name and the mark each centred within 1 px, and the row no taller than the name; red before the change. The About spec and the design audit pass in Chromium and WebKit (70), and the mascot spec's About test in both. Seen at 375 px: the name's middle and About's on 188 px, Bead 12 px right of the name; with Bead on or off, the name at the same place.
- **To try:** open About on the iPhone: the wave and "Limpide" centred, Bead standing on the word's line, to its right.

(Superseded the same day by decision 4, kept for the record:)


- **The place:** the mark alone is centred over the name; Bead's button hangs to its right (absolutely placed, a gap of `--space-3` from the mark), its foot level with the mark's bottom as before, so the logo sits where it does with Bead away or switched off.
- **Tests:** the About spec's Bead test now checks the mark centred alone within 1 px (red before the change, at 393 px), with Bead to its right at its page size and its foot on the mark's bottom; it fits from 280 px with no sideways scroll. The About spec and the design audit pass in Chromium and WebKit (70), and the mascot spec's About test in both. Seen at 375 px: the mark's middle on About's middle (188 px), Bead 12 px right of it.
- **To try:** open About on the iPhone: the wave over "Limpide" is centred, Bead beside it on the right.

- **The narrowest windows** (1.21.1's code review and branch run, 2026-11-02): the grid's outer columns shrink alike, so the name stays centred down to 280 px (it sat 6.8 px left there). Below 340 px the name is set at 24 px, not 30, and Bead's gap is 8 px, not 12 (Claude's call, open to the owner): in Linux's wider type the centred name otherwise left Bead 9 px past About's padding at 280 px; measured with the name 0.12em wider than macOS sets it, Bead keeps 6 px of room there.
