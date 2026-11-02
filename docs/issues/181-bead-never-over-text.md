# 181: Bead never over text

**What to build:** The owner's bug (inbox, 2026-11-02), on 1.21.0 during the Demo, with a screenshot of Bead beside Osc 1's ringed Waveform buttons, its tail across the word "WAVEFORM": "During Demo, Bead’s tail is on text which should be avoided. It should go a bit lower." A bug of v1's polish ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · bug

## Decisions

Decided by the owner, 2026-11-02:

1. **Bead's body and tail never cover text:** a control's label, a readout, a heading; where it stands beside one, it goes a bit lower ("It should go a bit lower").

Claude's call, open to the owner:

2. **Everywhere Bead stands still,** not only in the Demo: on a Section's edge, the line under a phone's tabs (142), a clear stretch (164), a ride's end (141), beside a Step's control (151). Its wanderings may pass over text; where it stops may not.
3. **Lower first:** the nearest place below the text that is clear; if none, the nearest clear place along the same line.

## Agent Brief

**Category:** bug
**Summary:** Bead can come to rest with its tail or body over a control's label, as beside Osc 1's Waveform during the Demo.

**Current behavior:** During the Demo (seen on 1.21.0), Bead stood beside Osc 1's Waveform buttons with its tail across the "WAVEFORM" label. Where Bead rests is chosen to avoid cards, rings and the header, but not text.

**Desired behavior:** Wherever Bead comes to rest, neither its body nor its tail (on either side, with the Detune twin) covers text on the page: labels, readouts, headings. Where its chosen place would, it settles a little lower, on the nearest clear place below; failing that, along the same line. Passing over text while moving is fine.

**Key interfaces:**
- Bead's resting places and the checks it already makes against cards, rings and the header (issues 142, 151, 164)
- Its drawn box, tail and Detune twin included (174, 179)
- The Demo's ring on the control it turns

**Acceptance criteria:**
- [ ] During the Demo at a laptop's width, Bead never rests over a label (the e2e test samples where it rests, against every text node's box)
- [ ] The same in a Tutorial (151) and on a phone's tab line (142)
- [ ] A unit test on the placement: a place whose box meets a text box moves lower, else along the line
- [ ] Bead's frame-cost test passes as before; every test passes in Linux's fonts too

**Out of scope:**
- Where Bead goes in the Tour and the Tutorials, or what it does in the Demo
- Bead moving over text on its way
