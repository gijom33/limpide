# 227: Small slips in 1.23's new features

**What to build:** From the inbox (2026-11-03, the 1.23.0 code review): four slips it found in features new in 1.23, none holding the release. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · bug. Polish for v1

## Decisions

Claude's calls, open to the owner (2026-11-03, triage):

1. **One rule for "the person scrolled":** the Tour's and the Demo's checks of who moved the page become one, shared, and the same events count in both.
2. **The output clock's stamps are checked,** a stamp it cannot place (a context time of 0, or one ahead of now) left out as a zero one is: a guard on a risk not yet seen.

## Agent Brief

**Category:** bug
**Summary:** Four small slips in the background players, the MIDI clock's stamps, MIDI Learn's reading of a fader and the checks of who scrolled the page.

**Current behavior:**
- Back in front after the page was hidden, up to 2 s of Notes handed ahead keep the old Preset and octave if the person changes them at once (issue 198, decision 4: "a Stop or a change of Preset is still heard at once").
- The output clock rejects only a zero performance time; a stamp whose context time is 0, or ahead of the current time, is used unchecked (issue 185).
- A fader nudged from 0 learns as Absolute only on exact single steps; a lone 2, or 1, 3, 6, 10, learns as Relative (issue 186).
- The Tour's check of who scrolled misses the piano, Bead and the card's handle, so a finger slid across the piano stops the Tour's scrolling (issue 206); the Demo's pauses its following on a knob's wheel but not on Page Down or the scroll bar (issue 211).

**Desired behavior:**
- A change of Preset or octave, or Stop, right after coming back to the page is heard at once: Notes handed ahead are taken back or re-made.
- The output clock's stamps are checked as above.
- A fader moved a little off its end, by any small rise, learns as Absolute; an encoder's turn still learns as Relative (ADR-0020).
- The Tour and the Demo share one check of who scrolled: the piano, Bead and the card's handle are not the person scrolling; Page Down, the scroll bar and the wheel are, in both.

**Key interfaces:**
- The players' hand-over of Notes, hidden and back in front
- The MIDI output clock
- MIDI Learn's reading of a turn
- The Tour's and the Demo's following of the page

**Acceptance criteria:**
- [ ] A test: hidden, then shown and the Preset changed at once: the next Notes sound in the new Preset
- [ ] Unit tests for the output clock's stamps and for a fader's small rises
- [ ] Browser tests: a finger across the piano during the Tour leaves its scrolling on; Page Down during the Demo pauses its following

**Out of scope:**
- The Demo's and the Tour's scroll speeds
