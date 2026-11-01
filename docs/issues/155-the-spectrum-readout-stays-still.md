# 155: The Spectrum's readout stays still

**What to build:** The owner's bug (inbox, 2026-10-31), with a screen recording of the night branch: "Let's avoid having the text move around when values change. We could use predefined spacing or another trick (maybe stack values?)". The text is a Spectrum's hover readout, as the cursor moves along the Harmonics ("260 Hz · C4 +2¢ · −43 dB"). A bug of v1's polish ([131](./131-v1.md)).

Why it moves: the readout is drawn on the canvas in the page's proportional font, one line beside the cursor, its box as wide as its text. Every value changes its width ("260 Hz" against "1.04 kHz", "C4" against "C#4 +23¢", "−43 dB" against "silent"), so the values after it slide sideways, the box grows and shrinks, and near the right edge, where the box is held inside the Viewer by its right end, its left end and all its text jump with each change.

**Blocked by:** none

**Status:** ready-for-agent · bug

## Decisions

Claude's call, open to the owner, 2026-10-31, taking up the owner's "maybe stack values?":

1. **Stacked:** three lines, one value each: the frequency, the nearest Note with its cents, the level. Each line keeps its own place, so a value changing moves nothing else.
2. **A box of fixed size:** as wide as the widest each line can be ("20.00 kHz", "C#10 −50¢", "silent" or "−100 dB"), measured once per font, so it never grows or shrinks as the cursor moves.
3. **Digits that keep their width:** each value is drawn right-aligned in its line (the digits, which the canvas cannot make tabular, end at the same place), with its unit at a fixed spot after it.
4. **Its place:** beside the cursor line on the right, flipping to the left side only when it would not fit, and never held against an edge by its own changing width.

## Agent Brief

**Category:** bug
**Summary:** A Spectrum's hover readout jumps sideways as its values change, because it is one line of proportional text in a box as wide as the text.

**Current behavior:** Hovering a Spectrum draws "frequency · Note ± cents · level" in one line beside the cursor, in a box sized to that text. As the cursor moves across the Harmonics the values change width, so the text after them slides, the box resizes, and near the right edge the whole readout jumps.

**Desired behavior:** The readout is a box of fixed size holding three lines (frequency; Note and cents; level), each value right-aligned in its line with its unit after it. The box sits right of the cursor line, or left of it when there is no room, and moves only with the cursor. The text a screen reader or a test reads (the canvas's readout data) is unchanged.

**Key interfaces:**
- The Spectrum Viewer's hover drawing
- The hover readout's text and the canvas's readout data, which tests read
- The Viewers' font and theme colours

**Acceptance criteria:**
- [ ] Moving the cursor along the Harmonics, the box keeps its size and each line's units stay put (a unit test on the layout: the widest and narrowest values give the same box)
- [ ] Near the right edge the box flips left once, and does not jump as values change
- [ ] The readout data a test reads is as before; the Spectrum e2e specs pass unchanged, or are updated only for the box's new place
- [ ] Every Spectrum (the Oscillators', the Filter's, the Amp's) behaves the same; every test passes in Linux's fonts too

**Out of scope:**
- What the readout says, or how it snaps to a peak
