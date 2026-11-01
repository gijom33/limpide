# 153: The about line says what it is, and closes

**What to build:** The owner's bug (inbox, 2026-10-31), seen at about 2000 px wide with Init loaded: "This info box remains a screen and I do not know where it comes from and did not figure out how to remove it." The box is a loaded Preset's about line, shown under the Patch name since 1.16.1 ([109](./109-teaching-the-new-oscillator-features.md), decision 3, decided by the owner: "until the first knob is turned"). It works as built, but nothing on it says what it is, it looks like a tooltip stuck open, clicks pass through it so it cannot be closed, and it sits over the Oscillators' and the Filter's headings. A bug of v1's polish ([131](./131-v1.md)).

**Blocked by:** none

**Status:** needs-info · bug. Waiting on the owner for where the box goes (2026-10-31, night): no room beside or above the headings holds it at most widths; decisions 1, 2 and 4 are clear and not yet built.

## Decisions

Claude's call, open to the owner, 2026-10-31 (decision 3 of 109 stands: it still shows on a load and goes on the first change to the sound; these add to it):

1. **It says what it is:** the Preset's name leads the line, in bold ("**Init** · The plain starting point: one saw through an open low-pass Filter."), so it reads as that sound's description, not a stray tip.
2. **It closes:** a small close button (×) at its right end, with a tip and an accessible name ("Close the Preset's description"), and Escape while it shows. The box takes the pointer for its button only; a click elsewhere on it still goes through to the controls beneath, as now.
3. **It covers no heading:** where it would lie over a Section's heading (the Oscillators' and the Filter's at three and four across), it sits in the room beside or above the headings instead, or its width is kept to what leaves them clear; the design audit has the last word.
4. **No timer:** it does not fade by itself, since its words are read while playing ("Turn FM down and watch the rungs fold away").

## Agent Brief

**Category:** bug
**Summary:** A loaded Preset's about line under the Patch name looks like a tooltip stuck open: nothing says what it is, it cannot be closed, and it covers Section headings.

**Current behavior:** Loading a Preset by hand shows its about line in a box under the Patch name, over the page, until the sound changes or another Patch loads. The box has no title, takes no pointer (a click on it reaches the control beneath), has no close button and ignores Escape. At three and four across it lies over the Oscillators' and the Filter's headings.

**Desired behavior:** The box leads with the Preset's name in bold, then its about line. A close button at its right end, and Escape while it shows, take it away, as does the first change to the sound or another load, as now. Only the close button takes the pointer. The box never covers a Section's heading at any width. It is announced as now (the Patch name's accessible text already says the line once).

**Key interfaces:**
- The Patch bar's about line and the hook that shows and hides it
- The header's layouts at every width, and the Sections' headings
- The design audit

**Acceptance criteria:**
- [ ] Loading a Preset shows "Name · about line", the name in bold
- [ ] The close button and Escape take the box away; turning a knob or loading another Patch still does
- [ ] A click on the box away from its button still reaches the control beneath
- [ ] At 375, 700, 1100, 1440 and 2000 px the box covers no Section heading
- [ ] An e2e test covers closing it by button and by Escape; the design audit passes; every test passes in Linux's fonts too

**Out of scope:**
- When the line shows (on a load by the person) and its words

## Questions for the owner

Asked at night, 2026-10-31, before building: decision 3's rooms are not there. Measured on this branch's header (with issues 112 and 119), every Preset's line set on one line in the box's 12 px type with its name in bold is 428 px wide at the least, 783 px for the middle one and 1,425 px for the longest (Kalimba, Portamento). The room between the header and the Sections' headings is 41 px tall at three and four across (one line of the box, 31 px), 29 px at 2 × 2 (not even one line) and 66 px on a phone (two lines at the box's padding, three at a tighter one; the longest take five there, and already reach the Oscillators' heading). Beside the headings, the Oscillators' heading lies right under the box's left end, and the gap between it and the Filter's heading is 222 px at 700 px wide and 241 px at 1,100 px (four or five lines, which would reach the Osc tabs). Narrowing the box cannot leave the Oscillators' heading clear, since the heading is under its left end.

1. **Where does the box go, if not over the headings?** The choices, each measured:
   - (a) **Over the headings' row, as now, made wider:** the box keeps its place under the Patch name; at three and four across it may be as wide as the Oscillators and the Filter together, so it stays one or two lines and never reaches the Osc tabs or the Filter's Mode row. It covers the two headings while it shows; with the name in bold, the × and Escape, it reads as the Preset's description, and the first turn of a knob still takes it away. Acceptance criterion 4 would go.
   - (b) **Under the headings:** it hangs below the Sections' heading row, over their first controls (the Osc tabs, the Filter's Mode and Slope), the ones its words often name. The headings stay clear.
   - (c) **Room that opens:** the Sections move down by the box's height while it shows and back up when it goes. A first turn of a knob would move the page under the pointer, unless the room stays until the pointer is let go.
   - (d) **One line above the headings, as wide as the page:** fits for most Presets at 1,440 px and all at 2,000 px; at 1,100 px and below the long lines need (a), (b) or (c) as well.

   Claude's recommendation: (a). The headings are the one thing on the page not needed while reading the line and playing: every knob and Viewer the words point at stays in view, nothing moves, and the box goes with one click, Escape or the first turn. Decisions 1, 2 and 4 will be built as written, whichever is chosen.
