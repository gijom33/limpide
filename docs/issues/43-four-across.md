# 43: Four across on wide screens

**What to build:** On wide screens, the four sections in one row: Oscillators, Filter, Amp, then LFO & Envelopes as a fourth column, rather than a row under the three stages. The height the bottom row takes today goes to the Viewers. The other end of issue 38, which puts the sections 2 × 2 on narrow windows. From the inbox, 2026-10-26.

**Blocked by:** none

**Status:** done. From 1920 px the chain is four columns, LFO & Envelopes the fourth, in one column as on a phone, its plot reaching down to the Viewers' bottom. LFO & Envelopes now lives inside the chain on every layout: under the stages on a laptop, beside them here, 2 × 2 with them in issue 38's layout (which no longer needs `display: contents`).

Before it, nothing changed above 1330 px but the knob sizes, and `main` stopped growing at 1920 px, so a wider screen got margins at the sides.

- [x] Find the width where a quarter of the screen leaves each stage room for its controls on one line and its Viewers at least as wide as three across gives them at 1440 px: the new layout's range, measured rather than guessed. Three across gives a stage 459 px at 1440; four across gives 460 at 1920, so 1920 is where it starts
- [x] Decide whether `main` may grow past 1920 px in this layout: to 2560 px, where a stage is 620 px, as wide as three across made it at the old 1920 cap, and no wider; past 2560, margins
- [x] LFO & Envelopes as a column: the two LFOs one under the other, the Timeline under them, as in the 2 × 2 layout
- [x] The four sections' Viewers line up, and the whole instrument still fits the screen without scrolling (`e2e/fourAcross.spec.ts` at 1920 × 1080, 2560 × 1440 and 3440 × 1440; the Viewers over 100 px taller than at 1919 px; sizes kept after the window was narrower)
- [x] The design principles' audit at a wide size (1920 × 1080): the laptop's two target waivers
