# 252: Nothing left over the controls

**What to build:** Four findings of the full review round on 1.26.1 (the inbox, 2026-11-07; reviews [2](../reviews/2026-11-07/2-synth-enthusiast.md), [3](../reviews/2026-11-07/3-ui-maniac.md), [5](../reviews/2026-11-07/5-learner-teacher.md) and [7](../reviews/2026-11-07/7-recruiter.md)), things that sit over or out of line with the controls:

1. **The Demo button's tip stays open over the Amp** once focus lands on the button by the mouse or by Escape: after About's "Play the Demo" it was still open 20 s on (review 7, Chromium); after the welcome closed with Escape (reviews 2 and 5).
2. **In MIDI Learn at 861 to 1440 px the Learn bar covers LFO 2's Depth and Rate values,** cutting "0 %" and "2.00 Hz" in half; at 1440 × 900 the page cannot scroll them clear (review 3, Chromium, both themes).
3. **With no Web MIDI** (blocked in Chromium, missing in WebKit) the disabled MIDI Learn and Quick Setup buttons look and hover as if enabled, show their tip, and do nothing (review 3).
4. **The Filter and Amp Envelope rows,** side by side, sit 18 px apart vertically at 1100 to 2560 px, 23 px at 861 (review 3, both engines).

**Blocked by:** none

**Status:** ready-for-agent · bug. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes" to the triage's eight v1 issues).

## Agent Brief

**Category:** bug
**Summary:** A tip left open, the MIDI Learn bar over two values, disabled MIDI buttons that look enabled, and two Envelope rows out of line.

**Current behavior:** As the four items above say.

**Desired behavior:**
- A tip opened by focus that did not come from the keyboard (a click, a script moving focus, Escape closing a panel) does not stay open: it shows only on hover or on keyboard focus, as the other tips do.
- In MIDI Learn no value is covered by the Learn bar at any width; where the bar must sit over the page, the page can scroll every control clear of it.
- With no Web MIDI, MIDI Learn and Quick Setup look disabled (greyed, no hover change), and their tip or the MIDI panel says why ("this browser gives no MIDI" or "MIDI is blocked for this site").
- The Filter and Amp Envelope rows line up when side by side, at every width they share a row.

**Key interfaces:**
- The tips and the focus that opens them
- The Learn bar's place and the page's scroll room in MIDI Learn
- The MIDI buttons' disabled look and their words
- The Envelope Sections' layout

**Acceptance criteria:**
- [ ] A test: About's "Play the Demo", and the welcome closed with Escape, leave no tip open on the Demo button
- [ ] A test: in MIDI Learn at 861, 1100 and 1440 px, LFO 2's values are not under the Learn bar (or can be scrolled clear)
- [ ] A test with Web MIDI missing: the two buttons are disabled, look so, and say why
- [ ] A test: the two Envelope rows' tops within 1 px of each other at 861, 1100, 1440 and 2560 px
- [ ] Every test passes in both engines and in Linux's fonts

**Out of scope:** the tips' words; the Learn bar's contents.
