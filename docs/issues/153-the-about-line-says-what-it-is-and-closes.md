# 153: The about line says what it is, and closes

**What to build:** The owner's bug (inbox, 2026-10-31), seen at about 2000 px wide with Init loaded: "This info box remains a screen and I do not know where it comes from and did not figure out how to remove it." The box is a loaded Preset's about line, shown under the Patch name since 1.16.1 ([109](./109-teaching-the-new-oscillator-features.md), decision 3, decided by the owner: "until the first knob is turned"). It works as built, but nothing on it says what it is, it looks like a tooltip stuck open, clicks pass through it so it cannot be closed, and it sits over the Oscillators' and the Filter's headings. A bug of v1's polish ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-02). Built (2026-10-31) on night/2026-10-31 and released; tried by the owner: "I guess it is okay. We shal see if someone complains."

## Decisions

Claude's call, open to the owner, 2026-10-31 (decision 3 of 109 stands: it still shows on a load and goes on the first change to the sound; these add to it):

1. **It says what it is:** the Preset's name leads the line, in bold ("**Init** · The plain starting point: one saw through an open low-pass Filter."), so it reads as that sound's description, not a stray tip.
2. **It closes:** a small close button (×) at its right end, with a tip and an accessible name ("Close the Preset's description"), and Escape while it shows. The box takes the pointer for its button only; a click elsewhere on it still goes through to the controls beneath, as now.
3. ~~It covers no heading~~: replaced by decision 7, the owner's answer to the night's question 1.
4. **No timer:** it does not fade by itself, since its words are read while playing ("Turn FM down and watch the rungs fold away").

Decided by the owner, 2026-10-31 (evening), answering the night's question 1:

5. **The Preset arrows show no box:** "I would not show the box if the preset is changed via the arrows. If user wants to know more about the preset, he can do it via the preset browser."
6. **A load from the Patch panel shows it,** a deliberate pick, as now (with decisions 1, 2 and 4).
7. **Over the headings' row, made wider** (the night's option (a), Claude's recommendation, taken): the box keeps its place under the Patch name and may be as wide as the Oscillators and the Filter together at three and four across, so it stays one or two lines and never reaches the Osc tabs or the Filter's Mode row; it covers the two headings while it shows.

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
- [x] Loading a Preset from the Patch panel shows "Name · about line", the name in bold
- [x] Changing the Preset with the arrows (‹ ›) shows no box
- [x] The close button and Escape take the box away; turning a knob or loading another Patch still does
- [x] A click on the box away from its button still reaches the control beneath
- [ ] At 375, 700, 1100, 1440 and 2000 px the box never reaches the Osc tabs or the Filter's Mode row; at three and four across it is at most two lines for every Preset
  (Its first half holds at every width. Two lines holds at 1440 and 2000 px and from 1,280 px; at 1100 px the longest eight take three lines: see call 3 below.)
- [ ] An e2e test covers closing it by button and by Escape; the design audit passes; every test passes in Linux's fonts too
  (The tests and the audit pass in Chromium and WebKit on macOS; Linux's wider fonts are stood in for by wider letter-spacing in the layout test. GitHub's run on Linux is the real check.)

**Out of scope:**
- When the line shows (on a load by the person) and its words

## How it was built

Built 2026-10-31, at night, on `night/2026-10-31` (two commits, `Issue 153: …`).

- **The box:** a Preset picked in the Patches panel shows "**Name** · about line" under the Patch name, with a × at its right end (its tip in `tips.ts`, its name "Close the Preset’s description"). The × and Escape close it; a knob turned or another load still do. Only the × takes the pointer: a click on the words reaches what lies beneath. The words are hidden from a screen reader, which hears the line once with the name, as before; closing does not say it again.
- **Where it sits:** over the Sections' headings (decision 7), as wide as the Oscillators and the Filter together (at three and four across; at 2 × 2 and on a phone, as wide as the Sections), set closer than before (line height 1.25, 4 px padding) so it never reaches the Osc tabs or the Filter's Mode row. An e2e test lays every Preset's line in the box at 375, 700, 1100, 1440 and 2000 px, again in wider type as Linux's fonts set it, and checks it clears both, stays within the Filter's right edge and below the Patch name. The design audit has the box as one more state.
- **The arrows** (decision 5) load without it, and a screen reader hears the name alone.
- Issue 109's build note has a dated line for what changed.

Calls made without the owner (Claude's call, open to the owner):

1. **A Controller's Preset pads and a keyboard's Program buttons show no box either**, as they are the arrows on hardware (they step through the Presets in order).
2. **A screen reader hears the about line only when the box shows** (a pick in the panel); after the arrows, the name alone, as a sighted visitor sees it.
3. **Three lines where the Oscillators and the Filter are narrow.** Two lines for every Preset needs about 830 px for the two Sections, which they reach at 1,280 px wide. Below that, at three across, the longest lines take three (8 Presets at 1100 px, 18 in wider type), and three Presets take four at 861 px; each still clears the Osc tabs and the Mode row. Two lines there would need the box over the Amp's heading too, or smaller type. Kept to the owner's width.
4. **Below 375 px** (older small phones) the box's type is a size smaller (11 px), so the longest lines, six there, still clear the Osc tabs.
5. **The × gives the focus back to the Patch name**, the button it hangs from, as the Patches panel does when it closes.
6. **Escape closes the box only when it closes nothing else:** with a menu or panel open (the Patches panel over it, Display, MIDI, Tempo, the Tutorials, About) or a field being typed in, Escape goes to that first. A docked card's own fold and "whole text" do not count.
7. **The ×'s target** is 24 px, with a 44 px finger pad around it on phones, and like the Patch panel's ×, no visible word on touch screens.
8. **Save and Import** load without the box: only a pick in the panel shows it.

**What to try:** at about 2000 px wide, open the Patch panel and pick Kalimba (one of the longest lines): its name in bold leads, the box spans the Oscillators and the Filter in two lines, clear of the Osc tabs and the Mode row. Close it with its ×, then pick it again and press Escape. Pick it again and turn a knob. Step with ‹ ›: no box. Try 1100 px (three lines for Kalimba) and a phone width.

## The night's question (answered: decisions 5 to 7)

Asked at night, 2026-10-31, before building: decision 3's rooms are not there. Measured on this branch's header (with issues 112 and 119), every Preset's line set on one line in the box's 12 px type with its name in bold is 428 px wide at the least, 783 px for the middle one and 1,425 px for the longest (Kalimba, Portamento). The room between the header and the Sections' headings is 41 px tall at three and four across (one line of the box, 31 px), 29 px at 2 × 2 (not even one line) and 66 px on a phone (two lines at the box's padding, three at a tighter one; the longest take five there, and already reach the Oscillators' heading). Beside the headings, the Oscillators' heading lies right under the box's left end, and the gap between it and the Filter's heading is 222 px at 700 px wide and 241 px at 1,100 px (four or five lines, which would reach the Osc tabs). Narrowing the box cannot leave the Oscillators' heading clear, since the heading is under its left end.

1. **Where does the box go, if not over the headings?** The choices, each measured:
   - (a) **Over the headings' row, as now, made wider:** the box keeps its place under the Patch name; at three and four across it may be as wide as the Oscillators and the Filter together, so it stays one or two lines and never reaches the Osc tabs or the Filter's Mode row. It covers the two headings while it shows; with the name in bold, the × and Escape, it reads as the Preset's description, and the first turn of a knob still takes it away. Acceptance criterion 4 would go.
   - (b) **Under the headings:** it hangs below the Sections' heading row, over their first controls (the Osc tabs, the Filter's Mode and Slope), the ones its words often name. The headings stay clear.
   - (c) **Room that opens:** the Sections move down by the box's height while it shows and back up when it goes. A first turn of a knob would move the page under the pointer, unless the room stays until the pointer is let go.
   - (d) **One line above the headings, as wide as the page:** fits for most Presets at 1,440 px and all at 2,000 px; at 1,100 px and below the long lines need (a), (b) or (c) as well.

   Claude's recommendation: (a). The headings are the one thing on the page not needed while reading the line and playing: every knob and Viewer the words point at stays in view, nothing moves, and the box goes with one click, Escape or the first turn. Decisions 1, 2 and 4 will be built as written, whichever is chosen.
