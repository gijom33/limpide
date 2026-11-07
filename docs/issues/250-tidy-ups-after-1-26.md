# 250: tidy-ups after 1.26

**What to build:** The 1.26.0 code review's leftovers (2026-11-06), the ones not fixed before the release: small standards and smells in the engine, the Shows and the specs, the browser specs that now repeat unit tests, and one edge case in MIDI Learn. Nothing a person sees, but for the edge case. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-human · enhancement. Built (2026-11-06) on night/2026-11-06, for the owner to try

## Decisions

Claude's calls, open to the owner (2026-11-06, triage):

1. **The repeating browser specs (item 9) are one pass for both:** 243 left the Shows' specs as they were (its call 1), and 245 left five of Bead's (its call 3), each for a later pass. A spec goes only where a unit test covers the same rule; a check that the page is wired to the rule stays.
2. **MIDI Learn skips a Bank Select (item 10):** a CC 0 or 32 that a Program Change follows within the same moment is a Program button's bank, not a knob, so Learn waits for the next control instead. A Controller that sends CC 0 from a knob can still be learned when no Program Change follows it.

## The items

1. **The MIDI keyboard spec finds a key by its `data-note`,** four times: by role and name, as the standards ask.
2. **Two fixed waits that prove nothing happens** (the Program Change during the Demo, a Tour test): one wait inside the page, as 238 did for the others.
3. **Written twice:** A4's frequency, in the engine and in the modulation record; the record's gliding and tracked-Note lookups, the same shape; the engine's forget-then-check of a change, and its LFO's set-to record; Bead's own query for reduced motion, which its reading now holds.
4. **The engine writes the record's LFO clocks directly** (their rates and restarts): the record its clocks' only writer, as 244 meant it to be.
5. **Names:** the engine's change detector named for what it does, not a memo; the Shows' `ruling` and `again`.
6. **The change keys built as strings** (the FM, the curve, the twins and the lock): a small tuple or object each.
7. **A Preset found by name** in four places (the Shows twice, the Patch's words, the About): one lookup.
8. **A Tap's level reads its samples twice** a frame (the sum, then the silence): once.
9. **The browser specs that repeat unit tests** (decision 1): the Shows' rules and Bead's acts, ride home, drop on a plot, throw and melt.
10. **MIDI Learn and a Program button** (decision 2): a keyboard that sends a Bank Select with each Program button, pressed while learning, gets CC 0 learned, and its banks stop working.
11. **The comments on Linux's fonts** (the ripple hunter): the header's 39.6 px white key, the Patches' wider-type stand-in and the styles' "Linux's wider fonts" were measured with DejaVu Sans, the runner's font; GitHub's browser jobs now measure in Liberation Sans (247). Measured again in the image, and the words set to what it shows.

## Agent Brief

**Category:** enhancement
**Summary:** Eleven small tidy-ups from 1.26.0's review: the specs' locators, waits and repeats, a few things written twice or named loosely in the engine and the Shows, one Preset lookup, one pass over a Tap's samples, the comments on Linux's fonts, and MIDI Learn passing over a Program button's Bank Select.

**Current behavior:** As the items above say.

**Desired behavior:**
- Each item as it says, with decisions 1 and 2; nothing a person sees changes, but that Learn no longer takes a Program button's bank.
- Tests: Learn ignoring a CC 0 and 32 followed by a Program Change, and taking a CC 0 that none follows; the rest kept passing as they are, the suite no slower.

**Out of scope:** the crossfade on a Mode change (248); WebKit's pause under an LFO plot (249); a per-Voice make-up for the band-pass, which only a per-Voice Resonance would need.

## How it was built

Built at night (2026-11-06, on `night/2026-11-06`, on top of 248), all eleven items.

- **Item 10, MIDI Learn and a Program button:** while Learn hears out a CC 0 or 32, a Program Change sends it back to waiting for a control on the same target, and the bank the CC 0 picked still loads that Program. A CC 0 no Program Change follows is learned as before. "The same moment" is Learn's own settle window (half a second), within which the Program Change comes. Unit tests: the MSB with the LSB, the LSB alone, a button target, and a CC 0 knob.
- **Items 1 and 2:** the MIDI keyboard spec finds the Piano's keys by role and name (C4, E4). The two waits that prove nothing happens wait once in the page, frame by frame, through a new helper that reports the first attribute to change.
- **Items 3 to 6, the engine and the record:** the memo is a change detector, its keys tuples compared part by part (the FM's, the curves', the twins', aftertouch's, and the LFOs' locks beside them), with an `afresh` option in place of forgetting then checking. An LFO oscillator's Rate set and recorded is one function. A4's frequency is the pitch module's. The record's glide and tracked-Note lookups are one slide. The record writes its LFO clocks itself: the engine records Rates, restarts and their calling off through it.
- **Item 3, Bead:** a press that picks Bead up reads the page as letting go does, reduced motion among it, rather than asking the browser again.
- **Items 5 and 7:** the Shows' `rulesRunning` and `changedMeanwhile`; `presetNamed` in the four places.
- **Item 8:** the level meter's one pass over a Tap's samples.
- **Item 9 (decision 1):** the Tour's give-back is checked in the browser at its first and last cards (Close and Done), and a new unit test closes it on every card after it turned its controls; closing the Amp card is the browser's check of the Tour's Freeze let go, Next and Back the unit tests'; the Tutorial's drag passing through its target goes; the Demo's wheel scroll stopping the following goes, Page Down's stays. Bead: the melt no longer checks the Notes doing nothing meanwhile; the Demo's acts no longer turn both LFOs off to see it conduct; the ride reads it on the real line once; the drop on a plot keeps the Triangle's ride, the Saw's landing left to the unit tests and the throw spec.
- **Item 11, measured in Playwright's image** (v1.64.1-noble, with 247's font setting, in Docker on the Mac), Chromium, over every Preset's line: Liberation Sans, GitHub's system font now, is 0.99 of the Mac's system font; DejaVu Sans, installed in the image for the measure, 1.11; the 0.04em stand-in on the Mac's font 1.09. The white key at 1100 px: 41.7 on the Mac, 42.2 in Liberation Sans, 39.6 in DejaVu Sans (the old figure). The comments now name DejaVu Sans as the wider font, and the Patches spec's stand-in runs on GitHub too (it passed in the image).

Tested: `npx tsc`, `npm run lint`, the unit tests of the files touched (`vitest`: the control surface, the record, the engine's browser tests, Bead's frame, the Shows, the Tutorials, the level meter, Cycle Lock), and the specs touched in Chromium (the Demo, the Tour, the Tutorials, the MIDI keyboard, MIDI Learn, Bead, the Patches, the header) and in WebKit, all passing. The header and Patches specs also passed in the image.

Claude's calls, open to the owner:

1. **Learn hands the bank on** when it passes over a Bank Select, so the Program button loads what it would have with Learn off.
2. **Which specs went (item 9):** a browser check was kept wherever it was the only one wiring the page to the rule; the Tutorial's knob found within reach stayed, as no unit test covers the Shows' side of it.
3. **The Patches spec's wider-type stand-in now runs on Linux too:** GitHub's type is no longer wider than the Mac's, so without it no run checked wider type.
4. **Bead's pick reads the whole page** (as its letting go does) for its reduced motion and its leaving: one read more per press, nothing a person sees.

What to try in the app: with a keyboard whose Program buttons send a Bank Select, start MIDI Learn, pick a knob, press a Program button: the Preset loads and Learn still waits; then turn a knob, and it is learned. Everything else should look and sound as it did.
