# 104: Keyboard and screen readers after 1.16

**What to build:** From the fourteen reviews of 1.16.0 (the inbox, 2026-10-30; review 6, [report](../reviews/2026-10-30/6-accessibility.md), with review 12 on the header's order). Four gaps:

- Enter or Space on a Demo segment, or an arrow key on the Demo card, stops the Demo instead of jumping, and focus falls to the page (WCAG 2.1.1, 2.4.3). The segments' size is [99](./99-demo-segments-as-targets.md).
- At 860 px and below the header's Tab order is not the screen's: after Next Preset, focus goes down to the octave buttons, up to Hold, MIDI, Display and About on the right, then left to Demo, Tutorial and Song (WCAG 2.4.3). From 861 px up it matches. Issue 44's "one order, focus follows" no longer holds since the header relayout of 2026-10-29.
- At 1440 × 900 the docked Tutorial card hides 13 of 71 Tab stops (LFO 1's Destination, all of LFO 2), and the page cannot scroll them clear (WCAG 2.4.11); picking a Tutorial and each Next drop focus to the page (2.4.3).
- Greyed-out controls (Pulse Width on a Saw, a silent Osc 2's tuning, the Filter Envelope at Amount 0, an LFO's Rate at Depth 0) say nothing to a screen reader (WCAG 1.3.1).

**Blocked by:** none

**Status:** ready-for-agent · bug

## Agent Brief

**Category:** bug
**Summary:** Everything the pointer can do on the Demo card and the Tutorial card works from the keyboard, focus follows the screen at every width, and a greyed-out control says why.

**Current behavior:** as listed above.

**Desired behavior:**
- **Demo card:** Enter or Space on a segment plays from its part, as a click does, and focus stays on that segment; arrow keys move between segments without stopping the Demo. Keys meant for the piano still play while focus is elsewhere.
- **Header:** at every width, Tab reaches the header's controls in the order they stand on screen, left to right, then top to bottom. The look of each layout stays exactly as it is now.
- **Tutorial card:** at every layout, a focused control is never hidden by the docked card: the page can scroll it clear (room below the last section, or scrolling on focus). Picking a Tutorial puts focus on its card; Next keeps focus on the card's Next (or the Step's control), never the page.
- **Greyed-out controls:** each still turns, and tells a screen reader that it does nothing now and why ("no effect while Osc 2 is silent"), through its accessible description. Its look stays as it is.

**Key interfaces:**
- The Demo card's segments
- The header's groups at the phone and 2 × 2 widths
- The docked Tutorial card and its Next
- What greys a control out

**Acceptance criteria:**
- [ ] A keyboard-only test plays the Demo from a chosen segment with Enter and Space, and moves along with the arrows, without stopping it
- [ ] The header test checks Tab order against the controls' positions on screen at the phone, 2 × 2, laptop and wide sizes, and its name says what it checks
- [ ] At 1440 × 900 with the Tutorial card docked, every Tab stop can be focused and is unobscured; picking a Tutorial and pressing Next keep focus out of the page body
- [ ] Each greyed-out control's accessible description names why it is inactive, and loses it when active again
- [ ] The design audit and the screenshots of every layout are unchanged

**Out of scope:**
- The segments' size (99)
- The greyed-out controls' contrast: kept at the design principles' 30 %, since they still turn and now say why (Claude's call, open to the owner)
- The review's other notes (the welcome's focus on the build link, the Display panel left open after Tab, the Viewers' descriptions): left in its report for a later pass
