# 189: Accessibility after 1.21

**What to build:** Review 6's findings on 1.21.1 ([report](../reviews/2026-11-02/6-accessibility.md)): focus falls to the page when the MIDI panel, a Tutorial, the Tour, the Demo's parts or the BPM field close; Shift+Tab leaves the focused control under the sticky header on a phone and at 200 % zoom; light-theme text under 4.5:1; a Tutorial costs about 90 key presses a Step by keyboard; the tempo is never spoken. And its smaller notes: panels stay open when Tab leaves them; the Geek readouts are not part of their knob's description.

**Blocked by:** none

**Status:** ready-for-agent · bug. Polish for v1

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
