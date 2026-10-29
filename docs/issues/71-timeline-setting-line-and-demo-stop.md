# 71: The Timeline's setting line, and a piano key ending the Demo under Display

**What to build:** Two lines from the 1.13.0 review (the inbox, 2026-10-28), decided by the owner (grilling of 2026-10-28, question 12): a knob's own setting on the Timeline is drawn faint, thin and dashed (4-4), close to LFO 1's dashed line (5-3), so it becomes a faint solid line; and while Display is open nothing ends the Demo, not even a key on the on-screen piano, so a piano key ends it again, Display open or not.

**Blocked by:** none

**Status:** done (2026-10-28). The knob's own setting on the Timeline is a faint solid line; a press on the on-screen piano ends the Demo with Display open.

**Since then:** the owner had the setting line removed (2026-10-29): the Timeline draws each moved knob's line alone.

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
- [x] The setting line is drawn without a dash pattern; LFO 1's and LFO 2's keep theirs
- [x] An e2e test: Demo playing, Display open, a press on an on-screen piano key ends the Demo and the card says the person took over
- [x] The same with a computer-keyboard piano key
- [x] The issue 64 tests (Display's own controls, Space, Escape, outside click keep the Demo playing) still pass

**Out of scope:**
- Any other Timeline style, or the Timeline's length
- What ends the Song or a Tutorial's Listen
- Display's own controls: they keep the Demo playing

## How it was built

- The setting line: `line` in `src/viewers/timeline.ts` strokes it plainly at half alpha instead of through `dashed` with 4-4; the Timeline's tooltips in `src/ui/tips.ts` say solid. Test: `e2e/envelopes.spec.ts` records the Timeline's strokes for a few frames (every faint one undashed, LFO 1's still 5-3).
- The Demo: its pointer listener in `src/ui/hooks/usePlayers.ts` still ignores presses while Display is open, except on the piano. A computer-keyboard key already ended it with Display open; its test guards that. Tests in `e2e/demo.spec.ts`; the press takes the piano's first key, since the Demo moves the Octave as it plays.
