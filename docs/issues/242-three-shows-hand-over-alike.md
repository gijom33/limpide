# 242: three Shows hand over alike

**What to build:** Three places where the Shows (the Demo, the Song, a Tutorial, the Tour) hand over differently for no stated reason, found while mapping the rules for [243](./243-one-module-for-the-shows.md) (the owner's grilling, 2026-11-05). Fixed first, on their own, so that 243 changes nothing a person sees. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** [241](./241-every-preset-reachable-by-program-change.md) (it changes what a Program Change loads)

**Status:** ready-for-agent · bug. Polish for v1

## Decisions

Decided by the owner, 2026-11-05 ("ok" to the recommendations, in 243's grilling):

1. **A keyboard's Program Change stops the Demo,** leaving the Preset it loaded, as picking a Preset in the Patches panel does. Today the Demo ignores it and its next part overwrites the Preset. (Q10)
2. **Starting the Song ends the Tour,** the person's Patch given back, and the Song plays on it, as starting the Demo ends the Tour. Today the Tour carries on silently and its next card stops the Song. (Q11)
3. **Starting the Song clears the Demo's "you are playing now" card,** as starting a Tutorial or the Tour does. (Q12)
4. **Kept as they are:** a letter key with the letter keys off stops the Demo but not the Song, as the glossary says of each (Q9); only the Tour gives the person's Patch back (Q13).

## Agent Brief

**Category:** bug
**Summary:** A Program Change stops the Demo; the Song ends the Tour and clears the Demo's takeover card.

**Current behavior:** An unmapped Program Change during the Demo loads its Preset, the Demo plays on, and its next part loads its own over it. Starting the Song during the Tour stops the Tour's phrase but leaves the Tour open and silent until its next card stops the Song. Starting the Song while the Demo's "The Demo stopped: you are playing now" card shows leaves that card up.

**Desired behavior:**
- An unmapped Program Change (with Bank Select, after 241) during the Demo stops it as the person taking over does, and the Preset it named stays loaded.
- Starting the Song during the Tour ends the Tour as its close does (the person's Patch given back), then the Song plays on that Patch.
- Starting the Song clears the "you are playing now" card.
- Nothing else about who stops whom changes.
- Tests: a Program Change during the Demo stops it and keeps the Preset; the Song started during the Tour ends it and plays on the person's Patch; the Song clears the takeover card.

**Out of scope:** the reshaping into one module (243), the letter keys' rule, a Tutorial's or the Demo's Patch when they end.
