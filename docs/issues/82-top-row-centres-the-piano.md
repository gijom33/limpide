# 82: The top row centres the piano in three across

**What to build:** The owner's idea (2026-10-28): "When it does not waste real estate, feel free to stack buttons in the top row, with the 3-across in particular. It looks like, by doing that, we could recenter the keyboard." At 1440 px the group left of the piano (the logo, the Patch, Demo, Tutorial, Song, the octave buttons) is wider than the group right of it (Hold, MIDI, Display, About), so the piano sits right of the page's centre.

**Blocked by:** none

**Status:** ready-for-human · enhancement. Built on the branch `issue-82-piano-centred` (2026-10-28), held back from 1.15.0 for the owner to judge: it changes two earlier decisions, so the owner decides.

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
- [ ] `npx tsc`, `npm run lint`, `npx vitest run` and `npx playwright test` green, with any top-row layout test that measured the old places updated
- [ ] A Playwright test: at several three-across widths (1000, 1280, 1440, 1600 px), the piano's centre is within a few pixels of the page's, and the top row is no taller than before
- [ ] The design audit passes: every button keeps a target the principles allow

**Out of scope:**
- What the buttons do, and their names
- The piano's own size

## Decisions (triage, 2026-10-28, decided by the owner)

1. The goal is the piano centred in three across, buttons stacked two high only where it frees width without a taller row; the owner judges the look once built (the issue then goes to ready-for-human to verify).

## Held back from 1.15.0 (2026-10-28)

The build centres the piano from 1200 px to the four-across width, and brings it nearer the centre below (60 to 65 px off at 880 to 1000 px, from 140 to 170), by stacking the logo over the Patch picker and Demo and Tutorial over Song, and balancing the octave buttons with an empty column from 1200 px. The full suite then failed two older tests, each an earlier decision:

- Issue 44's "one order everywhere" (`e2e/header.spec.ts`): Demo, Tutorial and Song left to right in one row at 1440 px. Stacking buttons is the owner's new idea, so that test would follow it.
- Ticket 15's Limpide name on the header line (`e2e/brand.spec.ts`): stacking the logo was Claude's call, not the owner's ("stack buttons"), and it moves the name off the line.

For the owner: is the logo over the Patch picker acceptable (the piano centred from 1200 px), or should only buttons stack (the piano still about 70 px off centre at 1440, from 130)? Below about 1200 px, centring would shrink the piano's keys; the build keeps their size there.

