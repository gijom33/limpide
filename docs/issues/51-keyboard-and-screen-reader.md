# 51: Keyboard and screen reader

**What to build:** A sound can be made and changed without the mouse, and every knob is a named slider ([review 6](../reviews/2026-10-26/6-accessibility.md)). What stops keyboard and screen-reader visitors, ranked. From the inbox, 2026-10-26.

**Blocked by:** none

**Status:** to do. **Before the LinkedIn post:** no

- [ ] Focus returns to the control that opened a panel when it closes (a Preset loaded, Escape in the Patch or Display panel, the welcome's Explore or Play the Demo), not to the page body (WCAG 2.4.3)
- [ ] Import file reachable by keyboard: a real button, not a hidden input in a label (WCAG 2.1.1)
- [ ] Space on a focused button or option: today it freezes the Viewers (deliberate, `App.tsx:552`), against the button and radio patterns (WCAG 2.1.1). A decision for the owner: Space presses what has focus and Freeze keeps Space only when nothing does, or another key for Freeze
- [ ] The Viewers' text alternatives: canvases with a role so their labels are read, the Timeline in the accessibility tree, the LFO plots described (WCAG 1.1.1)
- [ ] Arrow keys within a radio group, one Tab stop per group
- [ ] Home, End, Page Up and Page Down on knobs and faders
- [ ] The new Preset announced after Next or Previous (WCAG 4.1.3)
- [ ] Distinct slider names across the two Envelopes and the two LFOs (WCAG 2.4.6)
- [ ] The letter keys that play Notes can be turned off (WCAG 2.1.4)
