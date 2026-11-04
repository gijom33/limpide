# 189: Accessibility after 1.21

**What to build:** Review 6's findings on 1.21.1 ([report](../reviews/2026-11-02/6-accessibility.md)): focus falls to the page when the MIDI panel, a Tutorial, the Tour, the Demo's parts or the BPM field close; Shift+Tab leaves the focused control under the sticky header on a phone and at 200 % zoom; light-theme text under 4.5:1; a Tutorial costs about 90 key presses a Step by keyboard; the tempo is never spoken. And its smaller notes: panels stay open when Tab leaves them; the Geek readouts are not part of their knob's description.

**Blocked by:** none

**Status:** done (2026-11-03). Built (2026-11-02) on night/2026-11-02, merged into main, not yet released; tried by the owner: "All good."

## Decisions

Claude's call, open to the owner (2026-11-02): in v1 as polish ([131](./131-v1.md)), from the six reviews of 1.21.1.

1. **Focus returns to what opened** whatever closes (the button, or the card's opener).
2. **A way between a Tutorial's card and its Step's control:** a "Go to the control" button on the card, and Escape on the control back to the card.
3. **Light theme at 4.5:1** for all text, 3:1 for headings at their size; the colours changed in the light theme only.

## Agent Brief

**Category:** bug
**Summary:** Keyboard and screen-reader gaps: lost focus on close, controls hidden under the sticky header, low light-theme contrast, long keyboard trips in Tutorials, and a silent tempo.

**Current behavior:** Focus falls to the body on Escape inside the MIDI panel, Done or Quit on a Tutorial, Done or Close on the Tour, Escape on the Demo's parts, Enter after typing a BPM. Shift+Tab hides 12 of 56 stops on a phone and 9 of 52 at 200 % zoom under the header. Light theme: header words 4.36:1, the OSCILLATORS heading 3.43:1, greyed values 1.79:1. Bass costs 1,353 keys by keyboard. Tap changes the BPM unannounced, and on phone and 2 × 2 widths the button showing "120 BPM" is named "Tempo". Panels stay open when Tab leaves them. The Geek readouts are loose text.

**Desired behavior:** Each close returns focus to its opener. The page scrolls focus clear of the sticky header (a top scroll padding of its height). Light-theme text meets 4.5:1 (headings 3:1). A Tutorial's card has a "Go to the control" button and the control Escape back. The BPM is announced politely when Tap or a clock changes it, and the tempo button's name includes what it shows. A panel closes when focus leaves it. Each Geek readout is part of its control's description.

**Key interfaces:**
- Each panel's and card's close, and the focus they return
- The page's scroll padding and the header's height
- The light theme's colours
- The Tutorial card
- The tempo button and a live region
- The knobs' descriptions with the Geek Layer on

**Acceptance criteria:**
- [ ] The keyboard access spec covers each close returning focus, Shift+Tab never under the header (phone and 200 %), the Tutorial card's way to the control and back, and the BPM announced
- [ ] The design audit's contrast check passes in the light theme
- [ ] Every test passes in Linux's fonts too

**Out of scope:**
- A real screen reader's run (a human check, later)

## Added in triage (2026-11-02)

- From the 1.21.0 code review: from 861 to 1279 px the BPM's "MIDI" word is hidden and only a green edge marks the clock, a mark by colour alone: a mark that does not rest on colour (an icon or the word) at every width.

## How it was built

**What was built**

- **Focus back to what opened** (decision 1): Escape anywhere in the MIDI panel goes back to MIDI; Quit and Done on a Tutorial's card to the Tutorial button (or the Patch button when picked from the Patches panel); Close and Done on the Tour to About; Stop, or Escape on the Demo's parts, to Demo; Enter or Escape in the typed BPM to the BPM.
- **Header panels close when the focus leaves them** (Display, MIDI, the Tutorials, the narrow Tempo, Patches), so none stays open over what it covers, and a later Escape no longer pulls the focus back to Display.
- **Scroll padding:** up to 860 px the page's top scroll padding is the header's full height (plus the strip's on a phone), so Shift+Tab never leaves the focus under the header as it slides back. The header's and the strip's own controls are exempt, being always in view.
- **Light theme:** the muted grey darkened to #5c6372 (4.5:1 on the page), and the phone strip's Oscillators tab, as text, darkened towards the text; its underline stays green. The design audit's light-theme waiver for muted text is gone.
- **Tutorial card:** "Go to the control" puts the focus on the Step's control (its tab shown, clear of the header and the card); Escape there brings it back to Next (decision 2).
- **Tempo:** announced politely ("Tempo 126 BPM") once it settles after Tap, a MIDI clock or a Controller's knob; the narrow button is named "Tempo: 120 BPM"; the BPM's tip says Enter types it too.
- **The clock's mark from 861 to 1279 px:** a small MIDI socket on the BPM box's top corner, beside the green edge (from the triage note).
- **Geek readouts** ("Q 1.32") are part of their slider's description.
- Tests: the keyboard access spec covers each close (but a Tutorial's Done, the same path as Quit), Shift+Tab on a phone and at 200 % zoom (Chromium; Safari tabs only to fields by default), the card's way to the control and back, the BPM announced and the narrow button's name; the clock spec checks the announcement and the mark at each width.

**Calls made (Claude's call, open to the owner)**

1. The Oscillators heading keeps its green at 3.4:1 in the light theme: decision 3 holds headings to 3:1.
2. The greyed-out values stay as dim as they are (1.79:1 light, 2.14:1 dark): they belong to controls with no effect now, which WCAG 1.4.3 and the design audit leave out. Raising them to 4.5:1 would take away the greying.
3. The Tour's Close goes back to About's button whichever way it started (the welcome has no button of its own).
4. Escape on the control goes back to the card's Next, not to "Go to the control": the next thing after turning the control.
5. The clock's mark where the unit is hidden is a 10 px MIDI socket over the box's corner, so the box keeps its width and the piano its keys.
6. The tempo is announced after 0.6 s of rest, so a run of taps or a clock's drift is said once; the Demo's tempo is not announced.

**What to try**

- Keyboard only: open MIDI, Tab into it, Escape; open a Tutorial and Quit; take the Tour from About and close it; play the Demo, Tab to its parts, Escape. The focus lands on the button each time.
- On a phone, or the browser zoomed to 200 %: Tab down to LFO 2, then Shift+Tab back up; nothing hides under the header.
- A Tutorial: "Go to the control", turn it with the arrows, Escape, Enter on Next.
- Light theme: the header's words and the Oscillators heading.
- With VoiceOver: Tap four times; on a knob with the Synth Geek Layer on.

