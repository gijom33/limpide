# 80: The Amp's Envelope row beside its name, as the Filter's

**What to build:** The owner's bug (2026-10-28): "The envelope actuators are not placed the same way for the FILTER and AMP sections. This should be fixable." The Filter's Envelope row sits beside its ENVELOPE name, its controls on that line; the Amp's sits under its name. Confirmed at 1440, 760 and 390 px wide. The Amp's row moves beside its name, as the Filter's is.

**Blocked by:** none

**Status:** ready-for-agent · bug

## Agent Brief

**Category:** bug
**Summary:** The Amp's Envelope row (four faders, then the Volume knob) sits beside its name at every width, as the Filter's Envelope row (the Amount knob, then four faders) does.

**Current behavior:**
- The Filter's Envelope sub-block has its name on the left and its five controls on the same line.
- The Amp's Envelope sub-block has its name above and its five controls on a line of their own below, at every width.

**Desired behavior:**
- Both Envelope rows look alike: the name beside the controls, on one line, at every layout (phone, 2 × 2, three across, four across).
- The order of the controls stays: the Filter's Amount before its faders, the Amp's Volume after its faders (the signal's order; the Volume's place is the owner's, issue 62).
- The Amp's faders are as wide as the Filter's at each width; nothing else on the page moves, and the page still fits its window where it did.

**Key interfaces:**
- The Amp's Envelope sub-block and the rule that sizes its fader columns

**Acceptance criteria:**
- [ ] `npx tsc`, `npm run lint`, `npx vitest run` and `npx playwright test` green
- [ ] A Playwright test: at a phone, a 2 × 2, a three-across and a four-across width, each Envelope's name is level with its controls, and the Amp's faders are as wide as the Filter's
- [ ] The design audit and the fits-the-screen tests pass unchanged

**Out of scope:**
- The order of either Envelope's controls
- Anything else in the Filter or the Amp

## Decisions (triage, 2026-10-28, decided by the owner)

1. The Amp's row moves beside its name, as the Filter's; the controls' order stays.
