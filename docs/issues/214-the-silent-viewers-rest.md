# 214: The silent Viewers rest

**What to build:** Part (b) of [182](./182-a-page-at-rest.md), split by the owner on 2026-11-03: review 18's finding on 1.21.1 ([report](../reviews/2026-11-02/18-performance-expert.md)) that with nothing playing the Viewers redraw silence at 60 fps, about 30 % of a main-thread core. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none; best after [213](./213-viewer-colours-read-once-and-a-silent-scope-skipped.md), so each is measured alone

**Status:** ready-for-agent · enhancement. Polish for v1

## Decisions

From 182:

1. **Measured before and after,** as review 18 measured, kept only if it shows (Claude's call, open to the owner).
2. **What the person sees does not change:** a Viewer still answers the first Note, knob or Bead move within a frame (Claude's call, open to the owner).
3. **The LFO plots and the modulation rings keep moving with nothing playing,** as now, decided by the owner ("Keep it moving", 2026-11-03). What rests is the rest: the Scopes, Spectrums and the Timeline while silent and unchanged.

## Agent Brief

**Category:** enhancement
**Summary:** With nothing playing, the page redraws every Viewer every frame, though most of them show the same silence.

**Current behavior:** The render loop draws every Viewer every frame, silent or not. Idle holds about 30 % of a main-thread core and 17 % of the GPU process, and falls to 55 fps at 4× throttling.

**Desired behavior:**
- A Viewer whose Tap is silent and whose settings have not changed is drawn once, then skipped until a Note, a knob or fader, a Display change, a resize or the theme changes it.
- The LFO plots and the modulation rings go on moving with the LFOs' clock, with or without sound.
- Bead's own motion is not slowed or stopped by the Viewers resting.
- The first frame after a change shows it, as now.

**Key interfaces:**
- The render loop and each Viewer's draw
- What counts as a Viewer's silence and its change

**Acceptance criteria:**
- [ ] Idle main-thread cost measured well under today's at 1×, and idle at 60 fps at 4× (review 18's method), with an LFO on and with none, the figures in the issue
- [ ] The Demo's frame rate at 4× no lower than today
- [ ] The LFO plots scroll in silence as before
- [ ] A Note, a knob turn, a Display switch and a theme change each show on the next frame (browser tests)
- [ ] Every Viewer test and the design audit pass unchanged

**Out of scope:**
- What the Viewers show
- Bead's cost ([184](./184-beads-frame-in-parts.md))
