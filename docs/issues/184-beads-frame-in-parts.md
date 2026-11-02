# 184: Bead's frame in parts, and cheaper

**What to build:** Review 18's finding 4 and review 9's finding 3 on 1.21.1 ([18](../reviews/2026-11-02/18-performance-expert.md), [9](../reviews/2026-11-02/9-ts-react-webaudio.md)): Bead costs 0.6–0.9 ms and an extra style recalculation a frame, mostly from querySelectorAll over every panel and tooltip (5 fps of the Demo at 4×); its frame logic is one 588-line effect with 25 mutable variables, its perch, visit, ride and cling decisions reachable only through end-to-end tests; and the Viewers write to the page before it reads, so with Bead out style recalcs double.

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Polish for v1; best after [181](./181-bead-never-over-text.md), which changes where Bead rests

## Decisions

Claude's call, open to the owner (2026-11-02): in v1 as polish ([131](./131-v1.md)), from the six reviews of 1.21.1.

1. **Nothing Bead does changes:** a refactor and a speed-up, its behaviour held by the mascot spec as it is.
2. **The decisions as pure functions** with unit tests, beside the cling and place modules that already are.

## Agent Brief

**Category:** enhancement
**Summary:** Bead's per-frame logic is one large effect that queries the whole page every frame and forces an extra style recalculation.

**Current behavior:** Mascot's render effect (about 588 lines, 25 lets) decides perches, visits, rides and the cling inline; each frame it runs querySelectorAll over panels and tooltips and reads layout after the Viewers have written.

**Desired behavior:** The covering elements are kept by a MutationObserver and their boxes read only on scroll, resize or a layout change; all layout reads of a frame come before any write (the Viewers' and Bead's); the perch, visit, ride and cling decisions are pure functions with unit tests, the effect only wiring them.

**Key interfaces:**
- Mascot's render effect
- mascotPlace, mascotCling, mascotMotion
- The render loop's order of reads and writes, shared with the Viewers

**Acceptance criteria:**
- [ ] Bead's frame cost under 0.3 ms idle, and no extra style recalculation a frame (review 18's method)
- [ ] The mascot spec passes unchanged in both browsers
- [ ] Unit tests for the perch, visit, ride and cling decisions
- [ ] Bead's frame-cost test passes; every test passes in Linux's fonts too

**Out of scope:**
- New tricks or places for Bead

## Added in triage (2026-11-02)

- From the 1.20.0 code review: issues 141, 150 and 164 each ticked "Bead's frame-cost test still passes" while it failed under them on a loaded machine (1.0 to 1.9 ms against 1 ms); measure it on a quiet machine before and after.
