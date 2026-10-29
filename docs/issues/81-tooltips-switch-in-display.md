# 81: Tooltips on or off in Display

**What to build:** The owner's idea (2026-10-28): "In the Display menu, add a selector to hide or show the tooltips. On by default."

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## Agent Brief

**Category:** enhancement
**Summary:** A Tooltips switch in the Display panel, on by default and remembered; off, no tooltip opens, while screen readers keep each control's description.

**Current behavior:**
- Every control's tooltip opens after a short pause on hover, at once on keyboard focus, and on a touch screen after a long press; the control carries the tooltip as its accessible description.
- The Display panel has switches for the overlays, the letter keys and the theme, each remembered.

**Desired behavior:**
- Display has a Tooltips switch, on at first, with a tooltip of its own like its neighbours.
- Off: no tooltip opens on hover, focus or long press, anywhere on the page; a long press on a touch screen then does what it does without a tooltip.
- Each control keeps its accessible description, so a screen reader still says what it does.
- The choice is remembered across a reload; unusable storage behaves as on.

**Key interfaces:**
- The tooltip's open rule, which reads the switch
- The Display panel's settings and what is saved

**Acceptance criteria:**
- [ ] `npx tsc`, `npm run lint`, `npx vitest run` and `npx playwright test` green
- [ ] Playwright: with Tooltips off, hovering a knob and focusing a button open no tooltip; the knob still has its description; after a reload the switch is still off; on again, tooltips open
- [ ] The design audit passes with the new switch

**Out of scope:**
- The Tutorial and Demo cards, which are not tooltips
- Any change to what a tooltip says

## Decisions (triage, 2026-10-28, decided by the owner)

1. Off hides tooltips on hover, focus and long press; screen readers keep the descriptions; the switch is on by default and remembered.
