# 184: Bead's frame in parts, and cheaper

**What to build:** Review 18's finding 4 and review 9's finding 3 on 1.21.1 ([18](../reviews/2026-11-02/18-performance-expert.md), [9](../reviews/2026-11-02/9-ts-react-webaudio.md)): Bead costs 0.6–0.9 ms and an extra style recalculation a frame, mostly from querySelectorAll over every panel and tooltip (5 fps of the Demo at 4×); its frame logic is one 588-line effect with 25 mutable variables, its perch, visit, ride and cling decisions reachable only through end-to-end tests; and the Viewers write to the page before it reads, so with Bead out style recalcs double.

**Blocked by:** none

**Status:** needs-info · enhancement. Polish for v1; [181](./181-bead-never-over-text.md), which changed where Bead rests, shipped in 1.22.0

## Decisions

Claude's call, open to the owner (2026-11-02): in v1 as polish ([131](./131-v1.md)), from the six reviews of 1.21.1.

1. **Nothing Bead does changes:** a refactor and a speed-up, its behaviour held by the mascot spec as it is.
2. **The decisions as pure functions** with unit tests, beside the cling and place modules that already are.

## Agent Brief

**Category:** enhancement
**Summary:** Bead's per-frame logic is one large effect that queries the whole page every frame and forces an extra style recalculation.

**Current behavior:** Mascot's render effect (about 650 lines since 181 and 192, which also added a query of the docked panels each frame) decides perches, visits, rides and the cling inline; each frame it runs querySelectorAll over panels and tooltips and reads layout after the Viewers have written.

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

## Questions for the owner

The night of 2026-11-02: its builder read the issue, Bead's frame and review 18 and stopped before writing code. Since 192, 197 and 200, Bead's frame is about 520 lines in a 1,306-line file, its decisions woven through its page reads; the read-before-write phase belongs in the shared render loop, which touches every Viewer; and review 18's measuring scripts were not kept.

1. **One issue or three.** Claude's recommendation: split it. (a) Bead's covers kept by a MutationObserver and their boxes re-read only on scroll or resize, its frame cost measured before and after on a quiet machine. (b) A read phase in the render loop, every layout read before any write, Bead's or the Viewers', with a measuring script kept in the repo (review 18's finding 5, the Viewers' colours read each frame, could join it; see 182's question 2); blocked by (a). (c) Bead's perch, visit, ride, landing and cling choices as pure functions with unit tests, the mascot spec unchanged in both browsers; best after (a).

