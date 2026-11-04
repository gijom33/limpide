# 213: The Viewers' colours read once, and a silent Scope skipped

**What to build:** Part (a) of [182](./182-a-page-at-rest.md), split by the owner on 2026-11-03: review 18's findings on 1.21.1 ([report](../reviews/2026-11-02/18-performance-expert.md)) that every Viewer reads its colours from the page every frame, and that Cycle Lock runs on a Scope with nothing to lock to. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Polish for v1

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
- [ ] Idle main-thread cost measured lower than before, at 1× and 4× (review 18's method), the figures written in the issue
- [ ] A theme change, light to dark and back, redraws every Viewer in its new colours at once
- [ ] A Note after silence is locked on the Scope as before, from its first cycles
- [ ] Every Viewer test and the design audit pass unchanged

**Out of scope:**
- The render loop at rest ([214](./214-the-silent-viewers-rest.md)), the Timeline ([215](./215-the-envelope-timeline-draws-only-new-columns.md)), the audio engine's pause ([216](./216-the-sound-engine-pauses-in-a-long-silence.md))
