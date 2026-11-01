# 162: Display's small settings on one row

**What to build:** The owner's idea (inbox, 2026-10-31), with a screenshot of the Display panel at about 1200 px on the night branch: Keys (Play, Off), Tips (On, Off), Bead (On, Off, its picture) and Theme (Dark, Light) each take a row of their own, most of each row empty. "Those could share the same row and not waste that much space." Polish of v1 ([131](./131-v1.md)).

**Blocked by:** none. Issue 150 (night/2026-10-31) shows Bead's switch from the first visit; build on the night branch or after it is merged (Claude's call, open to the owner).

**Status:** ready-for-agent · enhancement

## Decisions

1. **Keys, Tips, Bead and Theme share one row.** Decided by the owner, 2026-10-31.

Claude's call, open to the owner:

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
- [ ] At 1440 and 1920 px the four share one row; on a 375 px phone they wrap two and two at most
- [ ] Tab order and every control's accessible name as before
- [ ] The Display panel specs and the design audit pass; every test passes in Linux's fonts too

**Out of scope:**
- The panel's other groups, or what any setting does
