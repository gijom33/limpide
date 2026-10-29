# 83: The controls' values on the 2 × 2 layout and on touch screens

**What to build:** Two of the owner's ideas (2026-10-28): "For the 2x2 view, I would hide the actuators values by default just like for the phone view." and "When really on a touch screen, we have a beautiful overlay to show value. In that case, there is no need to replace the actuators (knob or fader) with their value. That is redundant information." On a phone a knob or fader shows only its name; its value takes the name's place while it changes or is hovered. On a touch screen a bubble above the finger also shows the value while it drags, so the value appears twice.

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## Agent Brief

**Category:** enhancement
**Summary:** The 2 × 2 layout shows the controls' values as a phone does; and while a finger drags a control, its name stays under it, the bubble alone showing the value.

**Current behavior:**
- Phones (up to 600 px): under each knob and fader, its name only; the value replaces the name for a moment while the control changes (by hand, keys, MIDI, the Demo, a Patch) or is hovered.
- 2 × 2 (601 to 860 px): every value is printed under its control, as on a laptop.
- On a touch screen, a finger dragging a control raises a value bubble above it, and the value also replaces the name.

**Desired behavior:**
- 2 × 2 behaves as a phone: the name alone under each control, the value in its place while it changes or is hovered.
- While a finger drags a control and its bubble shows, the name stays under the control; changes by keys, MIDI, the Demo or a Patch still swap in the value as now.
- Wide windows are unchanged: the owner turned down a value on hover there (the out-of-scope notes).

**Key interfaces:**
- The rules that show a control's value or its name, by layout and by what is changing it

**Acceptance criteria:**
- [ ] `npx tsc`, `npm run lint`, `npx vitest run` and `npx playwright test` green
- [ ] Playwright at 760 px: a knob's value hidden at rest and shown in its name's place when the arrow keys change it
- [ ] Playwright on a touch phone: while a finger drags a knob, the bubble shows its value and the name stays under the knob
- [ ] The fits-the-screen tests pass at the 2 × 2 widths

**Out of scope:**
- Laptop and wide windows
- The bubble itself

## Decisions (triage, 2026-10-28, decided by the owner)

1. The 2 × 2 layout hides the values as a phone does.
2. While the bubble shows, the name stays: the control is never replaced, only its name was (Claude's reading of the idea, confirmed by the owner).
