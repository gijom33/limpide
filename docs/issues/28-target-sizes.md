# 28: Target sizes

**What to build:** Everything a pointer can hit is at least 24 × 24 px on a laptop (WCAG 2.5.8) and 44 × 44 px on a phone (Apple's 44 pt), as the design principles require (issue 17 measured today's failures).

**Blocked by:** none

**Status:** done: waived. The owner's decision (2026-10-25): the controls stay compact. Each departure is a waiver with a floor (a target's shorter side) in `e2e/designPrinciples.spec.ts`, listed in the design principles, so none can shrink unseen.

- [x] Laptop: selector options (20 to 22 px): waived, floor 20 px
- [x] Laptop: piano keys (white 20 px, black 12 px wide): waived, floor 12 px; the computer keyboard and MIDI play the same Notes
- [x] Phone: controls at the toolbar height (28 px): waived, floor 28 px
- [x] Phone: selector options (20 px), the logo (24 px), the Preset arrows (18 px), the black piano keys (26 px): waived at those floors
