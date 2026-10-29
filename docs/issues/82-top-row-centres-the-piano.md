# 82: The top row centres the piano in three across

**What to build:** The owner's idea (2026-10-28): "When it does not waste real estate, feel free to stack buttons in the top row, with the 3-across in particular. It looks like, by doing that, we could recenter the keyboard." At 1440 px the group left of the piano (the logo, the Patch, Demo, Tutorial, Song, the octave buttons) is wider than the group right of it (Hold, MIDI, Display, About), so the piano sits right of the page's centre.

**Blocked by:** none

**Status:** ready-for-human · enhancement. Built (2026-10-28), for the owner to judge the look: from 1200 px to the four-across width the piano is at the page's centre; below 1200 px, nearer it than before, its keys no smaller.

## Agent Brief

**Category:** enhancement
**Summary:** In the three-across layout the on-screen piano is centred on the page, buttons stacking two high only where that frees width without making the top row taller.

**Current behavior:**
- The top row runs the logo, the Patch picker, Demo, Tutorial and Song, the octave buttons, the piano, then Hold, MIDI, Display and About, each button one high; the piano's centre is right of the page's.

**Desired behavior:**
- In three across (from 861 px up to the four-across width), the piano's centre is the page's centre, within a few pixels.
- Buttons may stack two high (for example Demo, Tutorial and Song; or Hold, MIDI, Display and About) where that frees width; the top row is no taller than now and every button keeps its size and name.
- The phone, 2 × 2 and four-across top rows stay as they are, unless the same stacking centres the piano there too without growing the row.

**Key interfaces:**
- The top row's layout in the three-across widths

**Acceptance criteria:**
- [x] `npx tsc`, `npm run lint`, `npx vitest run` and `npx playwright test` green, with any top-row layout test that measured the old places updated
- [x] A Playwright test: from 1200 to 1800 px, the piano's centre is within 4 px of the page's; at 880, 1000 and 1100 px, within 80 px (140 to 170 before); the top row no taller than 64 px
- [x] The design audit passes: every button keeps a target the principles allow

**Out of scope:**
- What the buttons do, and their names
- The piano's own size

## Decisions (triage, 2026-10-28, decided by the owner)

1. The goal is the piano centred in three across, buttons stacked two high only where it frees width without a taller row; the owner judges the look once built (the issue then goes to ready-for-human to verify).

Claude's calls, open to the owner:

2. Below about 1200 px the logo and the Patch picker alone are wider than what a centred piano leaves them: centring there would shrink the piano's keys (to 10 px at 861 px), which wastes the row ("when it does not waste real estate"). There the piano keeps its size and sits as near the centre as the row allows, 60 to 65 px right of it at 880 to 1000 px.
3. What stacks: the logo over the Patch picker, and Demo and Tutorial over Song, in all of three across. Between 861 and about 1000 px the larger piano makes the top row 64 px tall where it was 52.

## How it was built

- `src/styles.css`, three across (861 to 1919 px): `.header-identity` a column (the logo over the Patch picker); `.header-play` a two-column grid (Demo and Tutorial, then Song). From 1200 px, the keyboard gets an empty column as wide as its octave buttons on the piano's other side, and `--keyboard-w` grows by it, so the piano, not the keyboard, is centred.
- Tests: "the piano sits at the page's centre…" and "the piano keeps its size and comes nearer the centre…" in `e2e/toolbarLayout.spec.ts`.

