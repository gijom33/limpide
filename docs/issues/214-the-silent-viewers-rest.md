# 214: The silent Viewers rest

**What to build:** Part (b) of [182](./182-a-page-at-rest.md), split by the owner on 2026-11-03: review 18's finding on 1.21.1 ([report](../reviews/2026-11-02/18-performance-expert.md)) that with nothing playing the Viewers redraw silence at 60 fps, about 30 % of a main-thread core. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none; best after [213](./213-viewer-colours-read-once-and-a-silent-scope-skipped.md), so each is measured alone

**Status:** ready-for-human · enhancement. Built (2026-11-03) on night/2026-11-03, for the owner to try

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

## How it was built

- **A silent Viewer rests.** Each Scope and Spectrum rests once its Tap has been silent for a quarter of a second, the Glow's span. Silent means every sample is under a millionth of full scale, which is too small to draw on a Scope and under every Spectrum's floor. The level meter answers this from the read it already makes, so a resting Tap reads its samples once a frame. The Envelope Timeline rests once both Envelopes have been at rest, and no Note has been struck, for its whole window plus a tenth of a second. It also needs no broken line on it (their marks scroll) and no beats.
- **What a Viewer at rest compares.** A resting Viewer is drawn once, then skipped until something it draws from changes. That covers its size, the pixel ratio, its colours as the theme sets them, and its Display settings (axes, cycles, Glow, overlays, Freeze, Snapshot). It also covers the Response Curve's gains, the Guides' glide, LIMITING, the Synth Geek Layer's readouts, and a hover over a Spectrum. A Note wakes it on the first frame its sound reaches the Tap. A knob wakes the Viewers it changes: the Cutoff wakes the Filter Spectrum's Curve, and the Filter Envelope's Amount wakes the Timeline. A Display switch or a theme change wakes them on the next frame.
- **What goes on moving.** The LFO plots, the modulation rings and the Pitch marker draw every frame as before (decision 3), and so does Bead. A Viewer whose picture moves in silence also keeps drawing: the Filter Spectrum's Curve with an LFO on the Cutoff, and the Timeline with an LFO line.
- Tests: `rest.test.ts` and `level.test.ts` (the rest, how long a Viewer has been silent, a Tap's silence). `e2e/viewersRest.spec.ts` covers the Viewers resting before and after the sound starts, an LFO plot moving beside them, and a Display switch, a theme change, a knob turn and a Note each waking them. The draw-time browser test of `patchesAtTheEdges` now draws its Viewers as if sounding, `draw(false)`, since a silent one would rest.

Claude's calls, open to the owner:

1. **Only a silent Tap rests, as the brief says.** Once the sound has started (any first click or key), the Oscillators run on under a closed Amp. The Oscillator and Filter Taps then carry them with no Note playing, so after a first click only the Amp's Scope and Spectrum and the Timeline are silent. The other four Viewers go on drawing the steady Oscillators. Resting those too would mean resting a picture that shows sound, and that picture moves with the Noise and with any LFO on the Filter. It is a change to what is seen, so it is left for the owner. That is also why criterion 1's "with an LFO on" falls short (below).
2. **The Timeline rests only when nothing on it scrolls.** A Cutoff line's dots, an LFO's dashes and the beats march left even along a flat line, so with any of them shown the Timeline goes on drawing.
3. **"Unchanged" allows a hundredth of a pixel.** That much is left out: an Envelope's last ten-thousandth of its level, and a Tap's last millionth of full scale. It also allows the Glow's stack of identical flat traces, held at the count it had.
4. **ADR-0002 stands unchanged.** Its "Viewers redraw at 60 fps from data that changes every frame" is now true while there is something to show. The decision, one loop outside React, is the same, so no new ADR was written.

Measured on 2026-11-04 by review 18's method, with a throwaway spec, not kept: headless Chromium, 1440 × 900 at 2× pixels, Bead off, a fresh page, 3 s of start-up, 2 s to settle, 10 s measured, the mean of two runs. The machine was an Apple M2 at a load of 2 to 3. "Idle" is review 18's: a fresh page never clicked, so the sound has not started and every Tap is silent. "Idle, sound running" adds two clicks on Display: the sound starts and the Oscillators run on. "LFO on" turns LFO 1's Depth to 50 % on its Cutoff, which also starts the sound.

Main thread busy (DevTools `TaskDuration`), frames per second, and the render loop's own share of the main thread (in brackets):

| State | 1× before → after | 4× before → after |
| --- | --- | --- |
| Idle | 29.4 → 16.0 % (21.2 → 8.7 %), 60 fps | 70.0 → 21.0 % (48.1 → 11.3 %), 60 fps |
| Idle, sound running | 37.6 → 31.5 % (18.3 → 11.3 %), 60 fps | 99.9 → 94.5 % (48.8 → 33.2 %), 46.8 → 60 fps |
| LFO on | 40.9 → 38.9 % (20.0 → 18.1 %), 60 fps | 99.8 → 99.8 % (49.4 → 47.1 %), 40.4 → 44.3 fps |
| Demo | 89.9 → 89.8 % (19.8 → 19.4 %), 56 fps | 99.9 → 99.9 % (20.7 → 20.2 %), 13.4 → 13.7 fps |

Against the criteria:

- Idle by review 18's method is about half today's at 1×, and at 4× it holds 60 fps with room to spare.
- With an LFO on, the 4× figure rises from 40 to 44 fps but does not reach 60, because of call 1: the Oscillator and Filter Viewers keep drawing the Oscillators, and the Filter Spectrum and the Timeline draw the LFO's sweep. The Timeline's share is [215](./215-the-envelope-timeline-draws-only-new-columns.md)'s.
- The Demo is no lower at 4×.

For issue 213's aside: with the sound running, idle costs about what a chord does. Review 18's idle, a page never clicked, has its sound stopped and every Tap silent, which is why it came out cheaper than the 8-Voice chord in 213's runs.

What to try in the app:

- Open the page and wait: nothing should look different. Play a Note and the Viewers answer at once. Let it ring out and they settle as before.
- With nothing playing, turn the Cutoff with the Response Curve on, switch the Spectrum's axes, change the theme, and resize the window. Each should show at once.
- Turn an LFO's Depth up: its plot and the rings go on moving.
