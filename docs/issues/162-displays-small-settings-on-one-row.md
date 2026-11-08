# 162: Display's small settings on one row

**What to build:** The owner's idea (inbox, 2026-10-31), with a screenshot of the Display panel at about 1200 px on the night branch: Keys (Play, Off), Tips (On, Off), Bead (On, Off, its picture) and Theme (Dark, Light) each take a row of their own, most of each row empty. "Those could share the same row and not waste that much space." Polish of v1 ([131](./131-v1.md)).

**Blocked by:** none. Issue 150 (night/2026-10-31) shows Bead's switch from the first visit; build on the night branch or after it is merged (Claude's call, let stand by the owner in 1.20.0).

**Status:** done (2026-11-02). Built (2026-11-01) on night/2026-10-31 and released; tried by the owner: "Cool."

## Decisions

1. **Keys, Tips, Bead and Theme share one row.** Decided by the owner, 2026-10-31.

Claude's call, let stand by the owner in 1.20.0:

2. **Each keeps its heading above its choice,** as the panel's other groups do, the four side by side with the panel's group spacing; the row wraps to two (two and two) only where the panel is too narrow, never to one a row.
3. **The order stays:** Keys, Tips, Bead, Theme.

## Agent Brief

**Category:** enhancement
**Summary:** The Display panel's four small settings (Keys, Tips, Bead, Theme) stand side by side on one row instead of four rows.

**Current behavior:** The Display panel gives Keys, Tips, Bead and Theme a full-width row each, separated by rules, though each holds only two choices; the panel is four rows taller than it needs.

**Desired behavior:** The four stand side by side in one row, each with its heading above its choice, Bead's picture beside its switch; where the panel is too narrow for four, they wrap two and two. The panel is shorter by about three rows; nothing else in it moves. Tab order and the controls' names are unchanged.

**Key interfaces:**
- The Display panel's layout and its groups
- The design audit's widths (the panel on a phone, in 2 × 2, three and four across)

**Acceptance criteria:**
- [x] At 1440 and 1920 px the four share one row; on a 375 px phone they wrap two and two at most
- [x] Tab order and every control's accessible name as before
- [ ] ~~The Display panel specs and the design audit pass; every test passes in Linux's fonts too (pass in Chromium on macOS; Linux's fonts are GitHub's run, after a push)~~ (not checked at the time)

**Out of scope:**
- The panel's other groups, or what any setting does

## How it was built

- **The row:** the four groups sit in one row of their own inside the panel's toolbar. It wraps as a group does, and the four wrap among themselves only where the panel is narrower than they are: two and two on a phone (375 and 320 px), one row on a foldable (690 px), at 872, 1440 and 1920 px. The row draws the divider before Keys and drops the one before a group that starts a line, as the toolbar does. On a phone and a foldable the panel is about three rows shorter (527 to 317 px tall at 690 px). The DOM order is the same, so the tab order and every control's name are unchanged; Bead's picture stays beside its switch.
- **Claude's call, let stand by the owner in 1.20.0:** the four wrap as one, so where they do not fit beside Show they go to the next line together rather than one at a time: at 1920 px they now sit on the second line (before, Keys, Tips and Bead were on the first and Theme alone on the second), and at 872 px on a line of their own, under Show.
- **Tests:** a spec in `e2e/displayPanel.spec.ts` holds the four on one line at 1920, 1440, 872 and 690 px, and two and two (Keys with Tips, Bead with Theme) at 375 and 320 px. The Display panel, tooltip and toolbar specs and the design audit (every width, both themes) pass in Chromium.
- **To try:** open Display on a phone or a narrow window (under 860 px): Keys and Tips, Bead and Theme side by side; on the laptop, the four together on one line. Tab through them: the order is as before.
