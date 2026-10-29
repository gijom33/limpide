# 80: The Amp's Envelope row beside its name, as the Filter's

**What to build:** The owner's bug (2026-10-28): "The envelope actuators are not placed the same way for the FILTER and AMP sections. This should be fixable." On phones and full-size windows the Filter's Envelope row sits beside its ENVELOPE name, its controls on that line, while the Amp's sits under its name, with wider faders. Confirmed at 1440 and 390 px wide; at 760 px both rows sit under their names, as every row of knobs does on compact windows (601 to 1330 px). The Amp's row places its name as the Filter's does.

**Blocked by:** none

**Status:** done (2026-10-28). The Amp's Envelope row is laid out as the Filter's at every width: its name beside its controls on phones and full-size windows, above them on compact ones, its faders as wide.

## Agent Brief

**Category:** bug
**Summary:** The Amp's Envelope row (four faders, then the Volume knob) places its name as the Filter's Envelope row (the Amount knob, then four faders) does, at every width.

**Current behavior:**
- The Filter's Envelope sub-block has its name on the left and its five controls on the same line.
- The Amp's Envelope sub-block has its name above and its five controls on a line of their own below, at every width; on phones its faders are wider than the Filter's.

**Desired behavior:**
- Both Envelope rows look alike at every width: the name beside the controls where the Filter's is (phones, full-size windows), above them where every row's is (compact windows).
- The order of the controls stays: the Filter's Amount before its faders, the Amp's Volume after its faders (the signal's order; the Volume's place is the owner's, issue 62).
- The Amp's faders are as wide as the Filter's at each width; nothing else on the page moves, and the page still fits its window where it did.

**Key interfaces:**
- The Amp's Envelope sub-block and the rule that sizes its fader columns

**Acceptance criteria:**
- [x] `npx tsc`, `npm run lint`, `npx vitest run` and `npx playwright test` green
- [x] A Playwright test: at phone, compact and full-size widths, the Amp's name sits beside or above its controls as the Filter's does, and its faders are as wide
- [x] The design audit and the fits-the-screen tests pass unchanged

**Out of scope:**
- The order of either Envelope's controls
- Anything else in the Filter or the Amp

## Decisions (triage, 2026-10-28, decided by the owner)

1. The Amp's row moves beside its name, as the Filter's; the controls' order stays.

Claude's calls, open to the owner:

2. Where compact windows put every row's name above its controls, the Amp's stays there too, as the Filter's does: the bug was the two rows differing, not the compact layout.

## How it was built

- The Amp's row is wrapped as the Filter's (`envelope-knobs` around `knobs-envelope` in `src/ui/App.tsx`), so the rule that put a direct `knobs-envelope` child on a line of its own, and the phone's wider Amp fader columns, are gone from `src/styles.css`.
- Test: "the Amp's Envelope row is laid out as the Filter's" in `e2e/envelopes.spec.ts`, at seven widths from 360 to 1920 px.

