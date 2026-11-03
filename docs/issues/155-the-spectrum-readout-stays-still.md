# 155: The Spectrum's readout stays still

**What to build:** The owner's bug (inbox, 2026-10-31), with a screen recording of the night branch: "Let's avoid having the text move around when values change. We could use predefined spacing or another trick (maybe stack values?)". The text is a Spectrum's hover readout, as the cursor moves along the Harmonics ("260 Hz · C4 +2¢ · −43 dB"). A bug of v1's polish ([131](./131-v1.md)).

Why it moves: the readout is drawn on the canvas in the page's proportional font, one line beside the cursor, its box as wide as its text. Every value changes its width ("260 Hz" against "1.04 kHz", "C4" against "C#4 +23¢", "−43 dB" against "silent"), so the values after it slide sideways, the box grows and shrinks, and near the right edge, where the box is held inside the Viewer by its right end, its left end and all its text jump with each change.

**Blocked by:** none

**Status:** done (2026-11-02). Built (2026-10-31) on night/2026-10-31 and released; tried by the owner: "Perfect."

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
- [x] Moving the cursor along the Harmonics, the box keeps its size and each line's units stay put (a unit test on the layout: the widest and narrowest values give the same box)
- [x] Near the right edge the box flips left once, and does not jump as values change
- [x] The readout data a test reads is as before; the Spectrum e2e specs pass unchanged, or are updated only for the box's new place
- [ ] Every Spectrum (the Oscillators', the Filter's, the Amp's) behaves the same; every test passes in Linux's fonts too

**Out of scope:**
- What the readout says, or how it snaps to a peak

## How it was built (2026-10-31, on night/2026-10-31)

**What was built:**
- **The text** (`src/viewers/readout.ts`): `hoverReadoutLines` gives the three lines, each a value and what follows it (Hz or kHz; the Note's cents; dB, or nothing after "silent"). `hoverReadout`, the canvas's readout data, joins them as before, so its text is unchanged.
- **The layout** (`src/viewers/readoutBox.ts`): `readoutColumns` measures, with the Viewer's font, the widest every value and unit can be (each digit and Note letter tried as its widest glyph: "23.99", "F#10", "F#-3", "−100", "silent"; "kHz", "−50¢"), and `readoutBox` places the box and its text: each value right-aligned at one place, its unit at a fixed place after it. The box sits right of the cursor line, or left of it where it would pass the Viewer's right edge.
- **The drawing** (`src/viewers/spectrum.ts`): the columns are measured once per font and kept; the box is drawn where the old one line was (20 px from the top), 37 px tall. Every Spectrum (the Oscillators', the Filter's, the Amp's) draws through it.
- **Tests:** `src/viewers/readoutBox.test.ts`: across 400 frequencies (3 Hz to 24 kHz) and levels (above 0 dB to below the floor) the box keeps one size and place, and holds every value; the widest and narrowest values give the same box and the same text places; the box flips left once as the cursor crosses the Viewer, and never jumps otherwise; the lines split value from unit.

**Claude's calls, open to the owner:**
1. **The Note line's "unit" is its cents** ("C#4 +23¢"): the Note's name right-aligned with the numbers above it, its cents where the units are. A Note on its pitch shows no cents, as before.
2. **"silent" sits in the values' column**, right-aligned like a number, with nothing after it.
3. **The box is 37 px tall** (it was 15) and stays at the top, below the Harmonic Markers' labels: on the shortest Viewer (78 px) it ends about 10 px above the frequency axis's labels. Near the right edge it covers more of the Response Curve's dB labels than the one line did.
4. **Its width** is that of the widest values ("23.99 kHz", "F#10 −50¢"), a little wider than most readings, so it never resizes.

**Tests run:** `npx tsc`, `npm run lint`, the readout's unit tests, the whole Vitest suite (1237 of 1240 passed; the three that timed out under the night's load, the edge Patches and the engine's headroom, none touched here, passed run alone), and the Playwright specs that read the readout or draw the Viewers (`viewerControls`, `smoke`, `designPrinciples`) in Chromium: 24 passed. Seen in the app on port 5174: the box right of the cursor line, flipped to its left near the right edge, values right-aligned with their units in one column.

**Not verified here:** "every test passes in Linux's fonts too" (the branch run on GitHub will say; the tests read the readout's text, not its pixels, and the layout's unit test uses a font of its own).

**To try in the app:**
- Play a Note and move the cursor slowly along the Harmonics of each Spectrum: the box keeps its size, and the numbers change in place, the units still.
- Move it to the right end of a Spectrum: the box flips to the left of the cursor line once, and stays there as the values change.
- Where the trace is at its floor the level reads "silent", and on a Harmonic in tune the cents go away: nothing else in the box moves.
