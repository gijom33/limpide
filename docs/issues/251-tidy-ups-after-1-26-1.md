# 251: tidy-ups after 1.26.1

**What to build:** The 1.26.1 code review's leftovers (2026-11-07), the judgement calls not fixed before the release, all in 248's crossfade and 250's modulation record. Nothing a person sees. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## The items

1. **A Filter side is a bare number,** and "the other side" is written out six times: a small type, or one helper.
2. **The crossfade's state is five loose values** (the side heard, the fade's start and share, the fades counted, the Mode waiting, whether it has settled, the Slope): one object, its rules beside it.
3. **Two `fadeTo`s,** the engine's and a Voice's, with different contracts: names that say which; and a side's state split between the shared side and each Voice's, kept in step by its index, in one place.
4. **The record's slide lookup takes its field names as a tuple,** for two callers: two plain lookups, or one that takes what it reads.
5. **A render quantum written as 128** in the engine's tests beside the engine's own constant: the one constant.

**Added in triage (2026-11-07, from the 1.26.2 code review):**

6. **A change of Mode given a time ahead of the clock** settles the fade then, unwiring a side still heard: none of the app's callers does so, but the early settle could wait on the clock too.
7. **A Mode waiting since inside the 10 ms** still starts its fade from a clock read in the fade's end, which an offline render may have run past: the path that clicked in 1.26.1's statistics run, now reached only from inside the fade.
8. **The click has no test of its own** that fails without 1.26.2's fix: one, if a render can be made to show it every time.

## Agent Brief

**Category:** enhancement
**Summary:** Five small tidy-ups, and three notes on the fade's timing, from 1.26.1's review in the crossfade and the modulation record: the Filter side's type, the fade's state as one object, two functions' names, a lookup's tuple of field names, and one render-quantum constant.

**Current behavior:** As the items above say.

**Desired behavior:**
- Each item as it says; nothing heard or seen changes.
- Items 6 to 8: the fade settled and started only from times the audio clock has reached, and a test that clicks without it, if one can be made to.
- Tests: 248's and 244's kept passing as they are, among them the change of Mode just after a fade, before it settles.

**Out of scope:** the fade's length or shape (248's calls 1 and 2).
