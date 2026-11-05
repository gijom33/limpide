# 221: The frame reads the page before it writes

**What to build:** Part (b) of [184](./184-beads-frame-in-parts.md), split by the owner on 2026-11-03: review 18's finding on 1.21.1 ([report](../reviews/2026-11-02/18-performance-expert.md)) that the Viewers write to the page before Bead reads it, so with Bead out the browser works out the page's styles twice a frame. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** [220](./220-bead-keeps-its-covers-as-the-page-changes.md)

**Status:** done (2026-11-04). Built (2026-11-03) on night/2026-11-03, merged into main, not yet released; accepted by the owner, tried in part and the rest trusted: "All issues waiting on my feedback look fine, I tested some, others trust you."

## Decisions

From 184 (Claude's calls, open to the owner, 2026-11-02):

1. **Nothing Bead or a Viewer shows changes.**

Claude's calls, open to the owner (2026-11-03):

2. **A measuring script kept in the repository,** rebuilding review 18's method (idle, the Demo, an 8-Voice chord, at 1×, 1.25× and 4× throttling), so 213 to 222 and later changes measure the same way. The Viewers' colours are [213](./213-viewer-colours-read-once-and-a-silent-scope-skipped.md)'s, not this issue's.

## Agent Brief

**Category:** enhancement
**Summary:** Within a frame, the Viewers write to the page and Bead then reads its layout, forcing the browser to work out the styles a second time.

**Current behavior:** The shared render loop lets each Viewer draw and Bead read and move in turn, reads and writes mixed, so a read after a write forces a fresh style and layout pass.

**Desired behavior:**
- Each frame first reads every layout it needs (Bead's and the Viewers'), then writes.
- No extra style recalculation a frame with Bead out.
- A script in the repository measures the page as review 18 did, and its use is written where the releases' and statistics' tools are described.

**Key interfaces:**
- The shared render loop and its order of reads and writes
- Bead's frame and each Viewer's draw

**Acceptance criteria:**
- [ ] One style recalculation a frame with Bead out, measured by the script, before and after, the figures in the issue
- [ ] The Demo's frame rate at 4× no lower than today
- [ ] The mascot spec, every Viewer test and the design audit pass unchanged

**Out of scope:**
- What Bead or the Viewers show

## How it was built

The night of 2026-11-03, on `night/2026-11-03`, test-first.

**Where the second recalculation came from.** A Chromium trace of Bead idle showed the order of a frame: the LFO plots wrote their lines (an SVG path's `d` and a circle's `cy` are style properties, so each write marks the page's styles out of date), then the Envelope Timeline read its canvas's size, which made the browser work the styles out at once; Bead then read the page and wrote its own drawing, and the browser worked the styles out again before painting. With Bead off nothing wrote after the Timeline's read, so once was enough.

**What was built.**
- **The render loop runs in two steps.** Each draw reads what it needs of the page and may draw on its canvas, then hands back its writes to the page; the loop runs every draw first, then every write, in the same order. A write that throws is reported once, as a draw that throws is.
- **What writes in the second step:** the LFO plots' lines, dots and beats, the modulation rings and their dots, the Pitch marker's dots, the Taps' level mark (`data-db`), and Bead's whole drawing, from its pose on. Bead's frame already read everything first; its writes now wait for the Viewers' reads too.
- **What draws in the first step, as before:** the Scopes, Spectrums and the Timeline read their size and colours and draw on their canvases. Nothing they show or how they show it changed (decision 1).
- **The measuring script,** `npm run perf` (`scripts/measurePerformance.ts`), described in CONTRIBUTING's and the README's tables of commands beside `npm run stats`.
- **Tests:** `renderLoop.test.ts`, every draw before any write, in order (red before), and a write that throws (red before).

**How to run the script.** On a quiet machine (note `uptime`'s load), from the checkout: `npm run perf`. It builds the site without the visit counter, serves it on port 5399 (never the tests' 5199), and measures idle, the Demo and an 8-Voice chord at 1×, 1.25× and 4× DevTools CPU throttling, with Bead out and off: headless Chromium, 1440 × 900 at 2× pixels, a fresh page each time, 3 s of start-up, 2 s settled under the throttling, 10 s measured, the mean of two runs (about 10 minutes in all). It prints one Markdown table and writes nothing. `-- --states idle --throttle 1,4 --bead on --runs 3` measures some of them; `-- --quick` checks the command. Review 18's other measures (2× and 6×, CPU per process, long tasks, the heap) are not in it.

**The figures.** `npm run perf` on 2026-11-04, Apple M2 at a load of 2.5 to 3, Chromium 156, the mean of two runs. Before is this branch at 42450bb (220 built), after is this issue's change.

Style recalculations a frame (before → after):

| | Bead out, 1× | Bead out, 1.25× | Bead out, 4× | Bead off, 1× | Bead off, 4× |
| --- | --- | --- | --- | --- | --- |
| Idle | 2.00 → **1.00** | 2.01 → **1.00** | 2.01 → **1.00** | 1.00 → 1.00 | 1.00 → 1.00 |
| 8-Voice chord | 2.00 → **1.00** | 2.00 → **1.00** | 2.01 → **1.00** | 1.00 → 1.00 | 1.00 → 1.00 |
| Demo | 7.76 → 7.76 | 7.77 → 7.76 | 8.00 → 7.97 | 6.79 → 7.77 | 6.83 → 7.79 |

Layouts a frame went from 1.1 to 1.3 to 1.00 idle and in the chord with Bead out, and in the Demo from 3.34 to 1.35 (Bead out) and 2.36 to 1.36 (off).

Frames per second, main thread busy, and the time in frame callbacks:

| | Before | After |
| --- | --- | --- |
| Idle, Bead out, 1× | 60 fps, 22.2 %, 17.1 % | 60 fps, 23.1 %, 17.2 % |
| Idle, Bead out, 4× | 59.9 fps, 52.6 %, 39.6 % | 60 fps, 51.6 %, 37.5 % |
| Chord, Bead out, 4× | 60 fps, 65.4 %, 51.3 % | 60 fps, 65.7 %, 50.7 % |
| Demo, Bead out, 4× | **45.6 fps**, 99.2 %, 58.2 % | **46.3 fps**, 99.4 %, 52.7 % |
| Demo, Bead off, 4× | **51.3 fps**, 99.1 %, 59.9 % | **51.6 fps**, 99.0 %, 53.7 % |

- Criterion 1 is met: one style recalculation a frame with Bead out, idle and in the chord, at every throttling.
- Criterion 2 is met: the Demo at 4× is no lower (46.3 against 45.6 fps with Bead out). Its frame callbacks take about 6 points less of the main thread.
- The Demo still works the styles out about 8 times a frame, with Bead or without. A trace shows why: the Demo's knobs move through React between frames, so the frame's first read finds the page changed, and the browser works the styles out there and again before painting; the rest are the React updates' own. That was review 18's other finding ("the knobs' React updates land between the canvases' reads and Bead's"), outside this issue. The Demo with Bead off counts one more a frame than before (6.8 to 7.8), with the same main thread time and frame rate and a layout a frame fewer; it was not traced further.

**The calls (Claude's call, open to the owner).**
1. **A draw hands back its writes,** rather than each Viewer registering a read and a write separately: a draw that writes nothing to the page (the canvas Viewers) is unchanged, and what a frame read stays in the draw's closure for its writes.
2. **The canvas Viewers' marks for the tests stay in their draw.** The Scopes, Spectrums and the Timeline set `data-` marks (the glow, the period, the readouts) as they draw. No style names them, so they leave the styles as they were, as 220 found for the Viewers' marks; moving them would split every Viewer's drawing for nothing measured. A style rule naming one would bring the second recalculation back. The same goes for a canvas's size, set in its draw: only when the window resizes.
3. **The script prints, it writes nothing,** and leaves out review 18's 2× and 6× runs, CPU per process, long tasks and the heap: idle, the Demo and the chord at 1×, 1.25× and 4×, as decision 2 asks, plus the time in frame callbacks and the layouts a frame, which 213 to 216 measured by hand.
4. **Its use is in CONTRIBUTING's and the README's tables of commands,** beside `npm run stats`, not in `docs/releasing.md`: it is not a release step.

**Tests.** `npx tsc`, `npm run lint` and `renderLoop.test.ts` (3 passed); no other unit test covers the touched files. The Playwright specs, unchanged: `mascot`, the Viewers' (`viewerControls`, `viewersRest`, `overlays`, `limiting`, `lfo`, `lfoDestination`, `modulationRing`, `pitchMarker`, `envelopes`, `geek`, `enginePause`, `oscillator`, `displayPanel`, `stageColours`, `demo`) and the design audit (`designPrinciples`). Chromium: 246 passed, and the mascot spec again after the review's fixes, 51 passed. WebKit, after the fixes: 238 passed, 5 skipped as before, and 3 of the design audit's narrow-phone checks failed beside the other specs (the section strip's "LFO & Envelopes" read at 4.47:1, at a load of about 3.5); run alone they passed, 34 of 34, so a load flake, its limits left as they are. The review (standards and spec) found Bead's fishing line reading the window's height among its writes, an untrue comment on the Timeline and "Viewer" said of Bead and the rings: all fixed. Its other findings are calls 2 and 4 above.

**To try in the app.** Nothing should look different. Bring Bead out and watch it stand, ride an LFO, fish and point the way in a Tutorial; play the Demo; turn an LFO's Depth up and watch its plot, the rings on its knob and, with Pitch as its Destination, the dots on the piano. To see the change, run `npm run perf -- --states idle --throttle 1` before and after a change to what a frame does.
