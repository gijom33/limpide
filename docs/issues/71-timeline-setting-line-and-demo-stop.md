# 71: The Timeline's setting line, and a piano key ending the Demo under Display

**What to build:** Two lines from the 1.13.0 review (the inbox, 2026-10-28), decided by the owner (grilling of 2026-10-28, question 12): a knob's own setting on the Timeline is drawn faint, thin and dashed (4-4), close to LFO 1's dashed line (5-3), so it becomes a faint solid line; and while Display is open nothing ends the Demo, not even a key on the on-screen piano, so a piano key ends it again, Display open or not.

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## Agent Brief

**Category:** enhancement
**Summary:** Draw a knob's own setting on the Env Timeline as a faint solid line, and let a piano press end the Demo while Display is open.

**Current behavior:**
1. On the Env Timeline, a modulated knob's own setting (where it sits before modulation) is a faint, thin line dashed 4-4. LFO 1's line is dashed 5-3, so the two read alike; only width and fading tell them apart.
2. While the Display panel is open, the Demo ignores every pointer press, so a press on the on-screen piano plays a Note on top of the Demo instead of ending it ("you are playing now"). Issue 64 only asked that Display itself (opening it, its settings, Freeze, the Escape or outside click closing it) leave the Demo playing.

**Desired behavior:**
1. The knob's own setting is a faint solid line, as thin as now; no other Timeline line changes. Any text that describes it (the key's tooltips, the Timeline's tooltip, code comments) says solid.
2. With Display open, a press on the on-screen piano ends the Demo exactly as it does with Display closed, and so does a computer-keyboard piano key. Opening Display, changing its settings, Freeze (Space), Snapshot, and closing the panel with Escape or a click outside the piano still leave the Demo playing.

**Key interfaces:**
- The Timeline viewer's dash patterns and its key (legend)
- The Demo's take-over rules: the listeners that decide which presses end it, and their exception for Display

**Acceptance criteria:**
- [ ] The setting line is drawn without a dash pattern; LFO 1's and LFO 2's keep theirs
- [ ] An e2e test: Demo playing, Display open, a press on an on-screen piano key ends the Demo and the card says the person took over
- [ ] The same with a computer-keyboard piano key
- [ ] The issue 64 tests (Display's own controls, Space, Escape, outside click keep the Demo playing) still pass

**Out of scope:**
- Any other Timeline style, or the Timeline's length
- What ends the Song or a Tutorial's Listen
- Display's own controls: they keep the Demo playing
