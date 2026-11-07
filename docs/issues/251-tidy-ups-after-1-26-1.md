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

## Agent Brief

**Category:** enhancement
**Summary:** Five small tidy-ups from 1.26.1's review in the crossfade and the modulation record: the Filter side's type, the fade's state as one object, two functions' names, a lookup's tuple of field names, and one render-quantum constant.

**Current behavior:** As the items above say.

**Desired behavior:**
- Each item as it says; nothing heard or seen changes.
- Tests: 248's and 244's kept passing as they are, among them the change of Mode just after a fade, before it settles.

**Out of scope:** the fade's length or shape (248's calls 1 and 2).
