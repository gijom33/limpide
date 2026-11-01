# 153: The about line says what it is, and closes

**What to build:** The owner's bug (inbox, 2026-10-31), seen at about 2000 px wide with Init loaded: "This info box remains a screen and I do not know where it comes from and did not figure out how to remove it." The box is a loaded Preset's about line, shown under the Patch name since 1.16.1 ([109](./109-teaching-the-new-oscillator-features.md), decision 3, decided by the owner: "until the first knob is turned"). It works as built, but nothing on it says what it is, it looks like a tooltip stuck open, clicks pass through it so it cannot be closed, and it sits over the Oscillators' and the Filter's headings. A bug of v1's polish ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · bug

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
