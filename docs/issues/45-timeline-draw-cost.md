# 45: The Timeline's draw cost

**What to build:** The Envelope Timeline replays the whole 30 s Modulation history for every pixel column, every frame: `src/viewers/timeline.ts:54` calls `modulationAt` (`src/engine/synthEngine.ts:620`) about 500 times a frame, each replaying `envelopeLevel` (`src/modulation/envelope.ts:37`) from the history's start, and `trim` (`synthEngine.ts:550`) runs only when a new event arrives. Measured by [review 9](../reviews/2026-10-26/9-ts-react-webaudio.md) on the live site: 3.7 ms a frame at load, 31 ms after 600 Notes, and it stays there in silence; the Demo at 35 fps on an M2 after 30 s, 6.6 fps with the CPU slowed 4×. From the inbox, 2026-10-26.

**Blocked by:** none

**Status:** to do. **Before the LinkedIn post:** yes (every visitor who plays the Demo for half a minute pays for it; a phone more than a laptop)

- [ ] A test that fails today: the cost of drawing the Timeline must not grow with the number of Notes played (e.g. sampling 500 columns after 600 Notes takes no longer than after 10)
- [ ] Each sample O(log n) or the columns swept once: store each Envelope event's starting level and search, or walk the history once for all columns in time order
- [ ] The history trimmed to the Timeline's window on every draw, not only when an event arrives
- [ ] Measured again on the live site: frame time flat after 600 Notes; the Demo at 60 fps on a laptop
