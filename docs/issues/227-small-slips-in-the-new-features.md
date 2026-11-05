# 227: Small slips in 1.23's new features

**What to build:** From the inbox (2026-11-03, the 1.23.0 code review): four slips it found in features new in 1.23, none holding the release. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-04). Built (2026-11-03) on night/2026-11-03, merged into main, not yet released; accepted by the owner, tried in part and the rest trusted: "All issues waiting on my feedback look fine, I tested some, others trust you."

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
- [x] A test: hidden, then shown and the Preset changed at once: the next Notes sound in the new Preset
- [x] Unit tests for the output clock's stamps and for a fader's small rises
- [x] Browser tests: a finger across the piano during the Tour leaves its scrolling on; Page Down during the Demo pauses its following

**Out of scope:**
- The Demo's and the Tour's scroll speeds

## How it was built

- **Back in front, the Notes handed ahead are taken back.** The Song and Listen hand their Notes about 2 s ahead while the page is hidden (issue 198). On the first tick back in front, the Transport closes the Gate at the first of them not yet within the short look-ahead, rewinds its phrase there, and hands them again as they fall due, on the Preset and octave of then. Stop was already heard at once. Tests: `transport.test.ts` (shown, the Preset and octave changed at once: the Notes from the cut are made again on the new ones); `phrase.test.ts` (a rewind hands every Note again, at any pass boundary); `e2e/background.spec.ts`, the Song hidden for a second, then shown with Octave up at once: every Note due a moment later is made again an octave up (red before).
- **The output clock's stamps are checked** (decision 2): a context time of 0, or one ahead of the context's current time, falls back on the latencies, as a zero performance time did. Test: `outputClock.test.ts`.
- **A fader nudged off an end by any small rise learns as Absolute:** values rising from the bottom (1 to 15) or falling from the top (113 to 126), without a repeat or a turn back. [ADR-0021](../adr/0021-a-fader-leaves-an-end-by-any-small-rise.md) records it, superseding ADR-0020's "a lone 1 or 126". Test: `encoderMode.test.ts`.
- **One check of who scrolled** (decision 1): the Demo's following now uses the Tour's (`watchPersonScroll`), and it leaves out a finger on what takes touches itself (the piano, Bead, a card's handle, a knob), read on the element touched or one it is in. The Demo's stop rule reads touches the same way. Page Down and the scroll bar now pause the Demo's following, as the wheel did; a knob's wheel no longer does. Tests: `personScroll.browser.test.ts`; `e2e/tour.spec.ts`, a finger slid across the piano leaves the Tour's scrolling on; `e2e/demo.spec.ts`, Page Down during the Demo pauses its following (both red before).

Claude's calls, open to the owner:

1. **Page Up and Page Down no longer stop the Demo,** wherever they are pressed. Before, any key but a few stopped it, so Page Down ended the Demo and the criterion "Page Down during the Demo pauses its following" could not be met. They only scroll the page (or turn the control they are on, the tempo's too), as the wheel does, which leaves it playing. The arrows, Home and End on the page still stop it, as issue 79 has them.
2. **The take-back closes the Gate at the first Note taken back,** so a Note started before it and still held then ends there. The Song's and the Tutorials' phrases rarely hold a Note across the next one's start; on a Preset with several Voices, one such Note may end a little early, once, on coming back.
3. **Only a context time ahead of the context's is left out,** not a performance time ahead of the page's: the brief names the context time, and a browser's performance time sits close to now, where a check could throw away good stamps.
4. **The fader rule's new miss:** a two's-complement encoder turned up faster at each click (1, 2, 4, 7), or one brisk click (3), now learns as Absolute; the MIDI panel's Absolute or Relative changes it.

What to try in the app:

- Play the Song, switch to another tab for a few seconds, come back and press Octave up (or load another Preset) at once: the next Notes are in the new octave or sound, not after two seconds of the old.
- On a phone, during the Tour, slide a finger across the piano: the Tour still brings its Viewers into view. During the Demo, press Page Down or drag the scroll bar: the Demo plays on and the page stays where you put it until the next part.
- MIDI Learn a fader from the bottom with a quick small push: it learns as Absolute. An endless encoder turned back and forth still learns as Relative.
