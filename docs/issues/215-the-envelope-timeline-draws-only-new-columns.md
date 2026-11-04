# 215: The Envelope Timeline draws only its new columns

**What to build:** Part (c) of [182](./182-a-page-at-rest.md), split by the owner on 2026-11-03: review 18's finding on 1.21.1 ([report](../reviews/2026-11-02/18-performance-expert.md)) that the Envelope Timeline works out the whole modulation for every pixel column each frame, 1.3 to 2.2 ms. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Polish for v1

## Decisions

From 182 (Claude's calls, open to the owner, 2026-11-02):

1. **Measured before and after,** as review 18 measured, kept only if it shows.
2. **What the person sees does not change:** the Timeline looks the same, pixel for pixel where it can be compared.

## Agent Brief

**Category:** enhancement
**Summary:** Each frame, the Envelope Timeline recomputes and redraws every column, though only the newest columns changed.

**Current behavior:** The Timeline works out the Cutoff, the Filter Envelope and the Amp Envelope for every pixel column on every frame, 1.3 to 2.2 ms a frame.

**Desired behavior:**
- As time moves on, the columns already drawn shift along and only the new ones are worked out and drawn.
- A change that alters what is already drawn (a knob, its time span, a Preset, the theme, a resize, the Display's layers) redraws the whole Timeline once, as now.

**Key interfaces:**
- The Envelope Timeline's drawing

**Acceptance criteria:**
- [ ] The Timeline's cost a frame measured in the Demo and on a held chord, before and after, the figures in the issue, well under today's
- [ ] Its look unchanged: its tests and the design audit pass; a held Note, a released one and a knob turned mid-Note draw as before
- [ ] Every test passes in Linux's fonts too

**Out of scope:**
- The other Viewers ([213](./213-viewer-colours-read-once-and-a-silent-scope-skipped.md), [214](./214-the-silent-viewers-rest.md))
