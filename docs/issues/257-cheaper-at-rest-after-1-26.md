# 257: Cheaper at rest after 1.26

**What to build:** Findings of the full review round on 1.26.1 (the inbox, 2026-11-07; reviews [9](../reviews/2026-11-07/9-ts-react-webaudio.md) and [18](../reviews/2026-11-07/18-performance-expert.md)):

1. **At Init both flat LFO plots** (Depth 0) are recomputed and rewritten every frame, the only repaint on a page at rest: dropping the identical writes takes the GPU from 7.2 % to 0.5 % of a core (reviews 9 and 18).
2. **At 1 Voice the seven unused Voices still render,** four fifths of the audio thread's work: unwired, renderCapacity goes from 0.133 to 0.027 (reviews 9 and 18).
3. **The Scope and the Spectrum write their test hooks** (data-*) every frame from inside the draw, against the loop's read-then-write rule, and ship them to the site (review 9).
4. **The statistics' Demo figure** comes from one sample after the suite, 112 % of a core on 1.26.0 and 107.8 % on 1.26.2, where a quiet machine gives 84 to 90 %: a median of three runs after a cool-down, with the load recorded (review 18).

**Blocked by:** none

**Status:** ready-for-agent · bug. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes" to the triage's eight v1 issues).

## Agent Brief

**Category:** bug
**Summary:** A page at rest still repaints two flat LFO plots, unused Voices still render, the Viewers write test hooks every frame, and the statistics' Demo figure is one noisy sample.

**Current behavior:** As the four items above say.

**Desired behavior:**
- An LFO plot whose drawing has not changed writes nothing that frame.
- Voices beyond the Voices setting take no audio-thread work (disconnected or stopped), and come back with no click and no delay when the setting rises.
- The Viewers' test hooks are written only when their value changes and outside the draw's reads, or only in test builds.
- The statistics measure the Demo's CPU as the median of three runs after a cool-down, and record the machine's load beside it.

**Key interfaces:**
- The LFO plots' frame
- The Voices and the Voices setting
- The Viewers' frame and their test hooks
- The statistics script

**Acceptance criteria:**
- [ ] A test: at Init with nothing playing, no LFO plot is written over several frames
- [ ] A test: at 1 Voice the other Voices are silent and not connected; raising the setting plays chords at once
- [ ] The Viewers' tests still read their hooks
- [ ] The statistics' Demo row says it is a median of three, with the load

**Out of scope:** the README's CPU words ([259](./259-words-that-hold-after-1-26.md)).
