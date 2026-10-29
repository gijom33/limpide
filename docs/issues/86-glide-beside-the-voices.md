# 86: Glide always right of the Voices

**What to build:** The owner's bug (2026-10-28): "Glide should always be on right side of voices number." At some three-across widths the Amp's Voices row puts its name beside the numbers 1 to 8, and Glide no longer fits after them: it drops to a line of its own under the numbers (reproduced at 1075 px wide; beside them at 1000 to 1050 px and 1100 px up).

**Blocked by:** none

**Status:** ready-for-agent · bug

## Agent Brief

**Category:** bug
**Summary:** The Glide knob sits right of the Voices numbers at every width.

**Current behavior:**
- The Amp's heading row holds the VOICES name, the numbers 1 to 8 and the Glide knob. Depending on the width, the name sits above or beside the numbers; where it sits beside them and the row is narrow (around 1060 to 1090 px wide), Glide wraps under the numbers.

**Desired behavior:**
- At every width, Glide's left edge is right of the numbers' right edge, on the same line.
- Where the row is too narrow for the name beside the numbers and Glide after them, the name goes above the numbers rather than Glide going below.

**Key interfaces:**
- The Amp's Voices row: its name, its choice of 1 to 8, and the Glide knob

**Acceptance criteria:**
- [ ] `npx tsc`, `npm run lint`, `npx vitest run` and `npx playwright test` green
- [ ] A Playwright test sweeping widths from a phone's to a wide screen's (every 15 px or so across the three-across range) finds Glide right of the numbers and level with them each time

**Out of scope:**
- The Voices choice itself and Glide's behaviour

## Decisions (triage, 2026-10-28, decided by the owner)

1. Glide is always right of the Voices numbers; the owner's words are the spec.
