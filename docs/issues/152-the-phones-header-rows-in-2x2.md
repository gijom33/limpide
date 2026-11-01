# 152: The phone's header rows in 2 × 2

**What to build:** The owner's idea (inbox, 2026-10-31): "Even in 2x2 use the three rows approachs as for the phone with the same automatic collapsing of two top rows". Polish of v1's layouts ([131](./131-v1.md)).

What is there today: up to 860 px the header is sticky, and scrolling down slides away what sits above the keyboard (issues 29 and 44). On a phone (up to 600 px) it has three rows: the logo with the Patch picker; the playing buttons with the set-up buttons; the keyboard. Scrolling down hides the top two, so only the keyboard stays. In 2 × 2 (601 to 860 px) it has two rows: the logo, the Patch picker and every button squeezed into one row (short Preset names barely fit, issue 105), then the keyboard; scrolling down hides that one row. Issue [112](./112-tempo-midi-clock-and-an-arpeggiator.md) (built on night/2026-10-31) adds the tempo to the set-up buttons and has to pad the header's buttons tighter from 601 to 680 px to make room.

**Blocked by:** [112](./112-tempo-midi-clock-and-an-arpeggiator.md), which changes the header at these widths

**Status:** ready-for-agent · enhancement. Polish for v1.

## Decisions

The idea is the owner's (decided by the owner, 2026-10-31); how it is done is Claude's call, open to the owner:

1. **Three rows from 601 to 860 px,** as on a phone: the logo and the Patch picker (its name as wide as the row allows); the playing buttons on the left and the set-up buttons, the tempo among them, on the right; the keyboard.
2. **The same collapsing:** scrolling down slides the top two rows away so only the keyboard stays; any scroll up brings them back, as on a phone.
3. **What stays 2 × 2's own:** the keyboard keeps its 2 × 2 width and keys (more than a phone's one octave where the width allows), and the buttons keep their words beside or under their icons where they fit; no section strip (every section is on screen at once in 2 × 2, as now).
4. **112's squeeze undone at these widths:** with a row of their own, the buttons no longer need the tighter padding from 601 to 680 px, and the tempo shows as the phone's or as a field beside its Tap, whichever fits (the design audit has the last word).

## Agent Brief

**Category:** enhancement
**Summary:** From 601 to 860 px (the sections 2 × 2), the header takes the phone's three rows, and scrolling down hides the top two as on a phone.

**Current behavior:** From 601 to 860 px the header has two rows: logo, Patch picker, playing and set-up buttons in one row, the keyboard under it. Scrolling down hides the top row. The buttons and the Patch name are squeezed (tighter padding from 601 to 680 px; short Preset names only just fit).

**Desired behavior:** From 601 to 860 px the header has three rows, as on a phone: the logo with the Patch picker; the playing buttons and the set-up buttons (the tempo with them); the keyboard. Scrolling down slides the top two rows away until only the keyboard shows, and any scroll up brings them back, measured as on a phone. The keyboard keeps its 2 × 2 size; the buttons keep their words where they fit; the squeeze from 601 to 680 px goes. Everything that places itself under the header (a Tutorial's card, the jump to a section the Demo follows, the Tour's "bring into view") still lands under it, collapsed or not.

**Key interfaces:**
- The header's layout rules for phones and for the sections 2 × 2 (grid areas, rows)
- The header's collapse on scroll and its measured hide height
- What measures the header's bottom (the docked cards, bringing a control into view)
- The design audit's widths

**Acceptance criteria:**
- [ ] At 601, 700 and 860 px: three header rows, the Patch name wider than today's
- [ ] Scrolling down hides the top two rows; scrolling up brings them back; nothing below moves
- [ ] A Tutorial Step, the Tour and the Demo bring their control into view under the collapsed or the full header
- [ ] The phone (up to 600 px) and three across (from 861 px) unchanged
- [ ] The design audit passes at every width; every test passes in Linux's fonts too

**Out of scope:**
- A section strip in 2 × 2
- The header from 861 px up
