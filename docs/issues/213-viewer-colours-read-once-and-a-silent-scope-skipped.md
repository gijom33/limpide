# 213: The Viewers' colours read once, and a silent Scope skipped

**What to build:** Part (a) of [182](./182-a-page-at-rest.md), split by the owner on 2026-11-03: review 18's findings on 1.21.1 ([report](../reviews/2026-11-02/18-performance-expert.md)) that every Viewer reads its colours from the page every frame, and that Cycle Lock runs on a Scope with nothing to lock to. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-04). Built (2026-11-03) on night/2026-11-03, merged into main, released in 1.24.0; accepted by the owner, tried in part and the rest trusted: "All issues waiting on my feedback look fine, I tested some, others trust you."

## Decisions

From 182 (Claude's calls, open to the owner, 2026-11-02):

1. **Measured before and after,** as review 18 measured (idle, the Demo, an 8-Voice chord, at 1×, 1.25× and 4× throttling), each change kept only if it shows.
2. **What the person sees does not change.**

## Agent Brief

**Category:** enhancement
**Summary:** Each frame, every Viewer asks the page for its theme colours, and Cycle Lock works on Scopes whose Tap is silent.

**Current behavior:** Every Viewer reads its colours from the page's computed styles on every frame. Cycle Lock (rebuilt in 1.22.0, its window computed once) still runs its search on a Scope whose Tap is silent, where there is no cycle to lock to.

**Desired behavior:**
- The theme's colours are read once, and again when the theme, the Display's colours or the window's colour scheme change; every Viewer draws from what was read.
- Cycle Lock is skipped while its Tap is silent and comes back on the first frame with sound; the Scope draws silence as now.

**Key interfaces:**
- The Viewers' theme colours
- Cycle Lock's run per Scope per frame

**Acceptance criteria:**
- [ ] ~~Idle main-thread cost measured lower than before, at 1× and 4× (review 18's method), the figures written in the issue~~ (not checked at the time)
- [ ] ~~A theme change, light to dark and back, redraws every Viewer in its new colours at once~~ (not checked at the time)
- [ ] ~~A Note after silence is locked on the Scope as before, from its first cycles~~ (not checked at the time)
- [ ] ~~Every Viewer test and the design audit pass unchanged~~ (not checked at the time)

**Out of scope:**
- The render loop at rest ([214](./214-the-silent-viewers-rest.md)), the Timeline ([215](./215-the-envelope-timeline-draws-only-new-columns.md)), the audio engine's pause ([216](./216-the-sound-engine-pauses-in-a-long-silence.md))

## How it was built

- **Cycle Lock skips its search on a silent Tap.** Before the windowed correlation, the Scope's buffer is scanned for its loudest sample; under 1e-6/√2 of full scale the correlation could never reach the floor under which it finds no fundamental, so the search is skipped and the Scope draws silence exactly as before. The first buffer with any sound in it is searched as ever, and the skip's threshold is derived from that floor, so the two cannot drift apart. Tests (`cycleLock.test.ts`): a silent buffer asks the pitch only for the span of silence drawn (red before); a Note after silence is locked from its first cycles; a Note at a ten-thousandth of full scale is still locked.
- **The colours are not cached.** A cache of every Viewer's colours, read once and again on a change of the theme, the root's style or the window's colour scheme, was built test-first and measured, and showed nothing (below). Under decision 1 it was dropped: the Viewers still read their colours every frame, so a theme change redraws them in their new colours at once, as before.

Claude's calls, open to the owner:

1. **The colour cache dropped, not kept,** as decision 1 asks of a change that does not show. Reading a property from a style already up to date costs next to nothing: the frame's first `clientWidth` read has already brought the style up to date.
2. **The skip's threshold proves no change in what is drawn,** rather than a looser "quiet" level: below it the old search returned nothing in any case, so nothing a Scope draws can change.
3. **At 1× the gain shows in the render loop's own time, not in DevTools' total main-thread time,** which moves by more from run to run than the skip saves (below). It shows in both at 1.25× and 4×.

Measured on 2026-11-04 by review 18's method, with throwaway specs, not kept. Headless Chromium, 1440 × 900 at 2× pixels, Bead off, a fresh page, 3 s of start-up, 2 s to settle, 10 s measured. The machine was an Apple M2 at a load of 2 to 3. The idle Taps read exactly 0 in every sample.

Main thread busy (DevTools `TaskDuration`) and frames per second, the mean of two runs:

| State | 1× before → after | 1.25× before → after | 4× before → after |
| --- | --- | --- | --- |
| Idle | 29.8 → 29.9 %, 60 fps | 24.5 → 23.8 %, 60 fps | 76.3 → 71.0 %, 60 fps |
| 8-Voice chord | 53.6 → 53.9 %, 60 fps | 68.3 → 68.5 %, 60 fps | 101.1 → 101.2 %, 27 fps |
| Demo | 90.5 → 90.3 %, 56 fps | 99.5 → 99.7 %, 49 fps | 102.5 → 102.3 %, 13.5 fps |

Idle, the render loop's own share of the main thread (the time in its `requestAnimationFrame` callbacks), four runs each, then six interleaved:

| Change | 1× | 4× |
| --- | --- | --- |
| None | 21.9 % (21.7–22.0) | 52.2 % (51.8–52.7) |
| The colour cache alone | 21.9 % (21.6–22.4) | 52.2 % (51.6–52.9) |
| The Cycle Lock skip alone | 21.1 % (20.7–21.3) | 48.7 % (48.7) |
| Skip, then skip and cache, interleaved | 21.1 % against 21.3 % (one run of 17.9 % left out) | 48.2 % against 48.3 % |

A silent Scope's Cycle Lock alone, timed in Node: 0.028 ms before, 0.014 ms after.

With sound, the chord and the Demo cost the same before and after: the skip's scan stops at the first sample with sound.

One thing seen beside the issue, not acted on: in these runs the 8-Voice chord takes about 54 % of the main thread at 1× against idle's 30 %, though its script time is lower. Review 18 found the two equal. This is for [214](./214-the-silent-viewers-rest.md)'s builder to look at.

What to try in the app: nothing should look different. Play a Note after a silence and watch each Scope lock onto it from its first cycles. Then let it ring out, and check that the Scopes draw a flat line as before.

**Since then (2026-11-05, [238](./238-tidy-ups-after-1-24.md)):** Cycle Lock skips its search on the Viewers' one definition of silence, every sample under a millionth of full scale, rather than under 1e-6/√2. Decision 2's proof no longer holds for a Tap between the two, whose trace, a millionth of the Scope's height, is no longer locked; nothing a Scope draws changes that can be seen. Claude's call, open to the owner.
