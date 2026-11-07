# 250: tidy-ups after 1.26

**What to build:** The 1.26.0 code review's leftovers (2026-11-06), the ones not fixed before the release: small standards and smells in the engine, the Shows and the specs, the browser specs that now repeat unit tests, and one edge case in MIDI Learn. Nothing a person sees, but for the edge case. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement

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

## Agent Brief

**Category:** enhancement
**Summary:** Ten small tidy-ups from 1.26.0's review: the specs' locators, waits and repeats, a few things written twice or named loosely in the engine and the Shows, one Preset lookup, one pass over a Tap's samples, and MIDI Learn passing over a Program button's Bank Select.

**Current behavior:** As the items above say.

**Desired behavior:**
- Each item as it says, with decisions 1 and 2; nothing a person sees changes, but that Learn no longer takes a Program button's bank.
- Tests: Learn ignoring a CC 0 and 32 followed by a Program Change, and taking a CC 0 that none follows; the rest kept passing as they are, the suite no slower.

**Out of scope:** the crossfade on a Mode change (248); WebKit's pause under an LFO plot (249); a per-Voice make-up for the band-pass, which only a per-Voice Resonance would need.
