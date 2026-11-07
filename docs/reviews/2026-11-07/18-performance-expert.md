# Review 18: the performance expert, M1 with 8 GiB as the floor

Ran on 1.26.1 (build `38df0ad`) on 2026-11-07, on the published site only. The machine: a 15-inch MacBook Air (Mac14,15: Apple M2, 4 performance and 4 efficiency cores, fanless), 16 GB, macOS 27.0.1, mine alone this time: its load average (1 minute) stayed between 2.2 and 4.1 through every run. Driven from Node scripts with the repository's Playwright 1.64.1 (Chromium 156.0.8078.4 and WebKit 2370, headless), never the repository's test suite, never port 5199. The site's visit counter was blocked in every page, so measuring counted no visits.

**How the floor was stood in for**, as last time: an M1 core does about 0.8 to 0.85 of an M2 core's work, so **1.25×** DevTools CPU throttling stands for the M1; **2×** and **4×** show the margin below it. Throttling slows the page's main thread only. The audio thread, the GPU process and the compositor run at the M2's full speed, so the audio thread was measured on its own and scaled by 1.2 for the M1. Throttling also inflates the processor time Chromium reports, so the CPU figures for battery are taken at 1×.

New this time: Chromium's DevTools `WebAudio.getRealtimeData` gives the audio thread's load (`renderCapacity`, the share of each 5.8 ms render callback spent rendering), and the page's own `AudioContext.playbackStats` counts underruns. The last run looked for `playoutStats`, which does not exist, and missed it.

## First impression

The page draws in a third of a second and plays the moment the piano is there. Every state holds 60 fps at the M1 stand-in, at every window size, in Chromium and WebKit. The idle story has changed: the Viewers now rest and the sound pauses after 30 s of silence, so the page left alone costs half of what it did. But it is still not at rest. The two LFO plots repaint a flat line 60 times a second, and the audio thread renders all eight Voices whatever the Voices count says.

## Since the last run (1.21.1, 2026-11-02)

- **The Demo's margin grew.** At the M1 stand-in the main thread is busy 40.8 % of the time in the Demo (54.0 % then). At 4× it holds 44 fps (33 then). The render loop costs 3.6 ms a frame at 1.25× (8.6 ms then, at 1×). Each Viewer got cheaper:
  - the Envelope Timeline: 0.3 ms a frame (2.2 then);
  - Bead: 0.3 ms (0.6 to 0.9 then);
  - Cycle Lock: 1.5 % of the main thread (5.9 % then).
- **Idle is half the cost.** The sound pauses after 30 s of silence (issue 216) and the Viewers draw a still picture once (issue 214). Idle, the main thread is 14.2 % busy at 1.25× (33.4 % then). All of Chromium takes 42 % of a core at 1× (63 % then). Last run's finding 1 is mostly fixed. What is left is below (findings 1 and 2).
- **An 8-Voice chord** takes 21.8 % of the main thread at 1.25× (34.1 % then), and holds 60 fps at 4× (53 then).
- **Knob moves no longer rewrite the whole Patch.** The Demo makes 881 `AudioParam` calls a second (10,600 then).
- **Start-up is lighter.** The start-up long task is about 117 ms at 1.25×; it was 258 to 267 ms at 1×. The download grew from 225 kB to 246 kB.
- **Unchanged:** no underrun and no long task on the floor; memory flat; no leak found.

### The statistics page's Demo at 112.3 % (+8.9 points) at 1.26.0

The +8.9 points are not in the code that runs. They come from how and when that number was taken:

- The statistics script takes one 10 s sample right after the whole test suite has run on the same machine, Playwright's end-to-end tests included.
- On a quiet machine, the same measure on 1.26.1 (`scripts/measureStatistics.ts`'s method, copied: 1440 × 900 at 2× pixels, the Demo clicked as soon as it is there, 2 s settled, 10 s measured, no throttling) gives **84 to 90 %** over six runs, with the main thread 34.5 to 36.1 % busy, at 60.0 fps. The 1.26.0 row has 112.3 %, 58.5 % and 56.0 fps.
- If 1.26.0's code really cost more, the main thread would be busier in a quiet run too. It is 22 points less busy here, and at 60 fps instead of 56.
- The same row moved idle by +1.2 points and the chord by +3.6, both states with no Demo in them. The whole series swings by 9 to 13 points between releases: 114.8, 112.0, 120.8, 107.5, 103.4, 112.3.
- The likely mechanism: "CPU" counts core-seconds, and this Mac is a fanless MacBook Air. After the suites' long minutes at full load it runs warm, at lower clocks, so the same work takes more core-seconds and the frames come later. The slower frames (56 fps, 67 ms worst) in the same row fit that. I could not reproduce the heat. Ten busy processes started a few seconds before the measure left it at 79 to 82 %, so a busy machine alone does not explain it; a hot one may.
- I could not compare 1.25.0 with 1.26.0 directly: only 1.26.1 is published, and a local build was out of bounds. Nothing in the 1.26.0 diff that runs during the Demo adds per-frame work. The Shows module, Bead's three-step frame and the modulation record all measured cheaper than last run's equivalents. 1.26.1's one change to the hot path, the Taps' level reading its samples once a frame (issue 250), saves well under 0.1 ms a frame.

Fix: take 3 or more runs and record their median with the load average. Measure on a cooled machine, not straight after the suites. Better still, also report the main thread's milliseconds per frame, which is less sensitive to which core a thread runs on.

## What I tried, in order

1. **States × throttling** (`state.mjs`), each run a fresh page with 3 s of start-up, 2 s to settle and 10 s measured, at 1440 × 900 at 2× pixels. The states:
   - the Demo;
   - an 8-Voice chord;
   - one Note held at 1 Voice;
   - idle before the pause, the sound still running;
   - idle after the pause: one key, then 36 s of silence.

   The measures: frame gaps from `requestAnimationFrame`; DevTools `TaskDuration`, `ScriptDuration`, style and layout; processor time per process (`SystemInfo.getProcessInfo`); long tasks and long animation frames; `renderCapacity` every 0.5 s; `playbackStats`; the heap after a GC; live AudioNodes by type (the `WebAudio` domain). Three runs each at 1.25×, then 1×, 2× and 4×.
2. **The statistics page's measure, copied** (`statsclone.mjs`), six runs.
3. **Window sizes:** the Demo at 1920 × 1080 and 2560 × 1440, each at 1× and 2× pixels.
4. **CPU profiles** (`profile.mjs`, 200 µs sampling) of the Demo and of the paused idle page. The bundle has no source map, so each draw was named from its code. The render loop's tick is `ll`, and each draw is a child of it.
5. **A trace of the Demo** (`trace.mjs`, `devtools.timeline` with stacks), to see who invalidates style and layout.
6. **The LFO plots at Depth 0** (`lfo.mjs`, `idlepaused.mjs`): in the same page, alternating, the plots' `setAttribute` calls were let through, or dropped when the value was unchanged, four times each.
7. **The seven unused Voices** (`state.mjs` with `cut`): at 1 Voice with one Note held, the page's AudioNodes and their links were recorded from the start. Each node was assigned to the one Voice whose output it reaches. In the experiment, every node of Voices 2 to 8 was disconnected (476 of 655 nodes, 68 a Voice), which is what a 1-Voice engine that leaves them unpulled would cost. Four runs each way, alternating.
8. **Every Preset in turn** (`patches.mjs`): 142 × Next Preset, a Note held after each, the worst frame within 700 ms, at 1.25× and 4×.
9. **First visit** (`load.mjs`): empty cache, CPU at 1.25×, the network unshaped, at 10 Mbit/s with 40 ms RTT, and at Slow 4G (1.6 Mbit/s, 150 ms). Recorded the bytes, the first paint and when the piano is there. A key was pressed then, and the gap from keydown to the engine's first scheduled `AudioParam` call measured.
10. **AudioParam calls a second** during the Demo (`params.mjs`).
11. **A 10-minute soak** (`soak.mjs`): 6 minutes of the Demo, restarted as it ended, then 4 minutes of Preset changes with a 4-key chord after each. A sample every 30 s: the heap after GC, DOM nodes, listeners, live AudioNodes and `renderCapacity`. Then macOS `footprint` of each Chromium process.
12. **WebKit** (`webkit.mjs`), at full speed: the paused idle page, the Demo and an 8-Voice chord, at 1440 × 900 and at a phone's 393 × 852 at 3× pixels.
13. **A background tab** (`background.mjs`): headless Chromium keeps every tab "visible", so it could not be measured, as last time.

Not done: real Safari, a real phone, battery drain on a laptop, and late Notes (last run's `AudioParam` wrapper; underruns stand in for it this time).

A note on method: the first soak kept every AudioNode alive through my own instrumentation, which holds each node it sees, and showed nodes and listeners climbing by about 15 a second. The soak was run again without it; the numbers below are from that clean run.

## The measures against the floor

| Area | Measure (how) | M2, 1× | M1 stand-in, 1.25× | 2× / 4× | Floor |
| --- | --- | --- | --- | --- | --- |
| Audio | Audio thread load, `renderCapacity` mean / max (not throttled; × 1.2 for an M1) | Demo 0.115 / 0.153; 1 Voice, one Note 0.13 / 0.17 | Demo 0.11 / 0.14; chord 0.096 / 0.125: about 0.2 at most on an M1 | Demo at 4×: 0.10 / 0.12 | **pass**: four fifths of the budget left |
| Audio | Underruns (`playbackStats.underrunEvents`) | 0 | 0 in every run | 0 at 4× | **pass** |
| Audio | 1 Voice, one Note: all 8 Voices against Voices 2–8 cut off | 0.133 against 0.027; renderer 42.5 % against 32.3 % of a core | n/a | n/a | **pass**, but 80 % of the audio work is for silent Voices (finding 2) |
| Frames | Idle, sound paused: fps, worst gap, main thread busy | 60, 17 ms, 18.7 % | 60, 17 ms, 14.2 % | 4×: 60, 17 ms, 29.4 % | **pass** |
| Frames | Idle before the pause (sound running, first 30 s) | n/a | 60, 17 ms, 18.2 % | n/a | **pass** |
| Frames | 8-Voice chord | n/a | 60, 17 ms, 21.8 % | 4×: 60, 17 ms, 69.0 % | **pass** |
| Frames | Demo, 1440 × 900 at 2× | 60, 17 ms, 35.4 % | 60, 17 ms, 40.8 % (Bead off: 36.7 %) | 2×: 59.9, 33 ms, 64.9 %; 4×: 44, 50–67 ms, 99.6 % | **pass** (fail at 4×) |
| Frames | Demo at 1920 × 1080 at 1× / 2×, 2560 × 1440 at 1× / 2× | n/a | 60 fps each; 40.1 / 41.1 / 42.2 / 43.4 % busy; GPU 28–33 % of a core | n/a | **pass** |
| Frames | First frames after a Preset change (142 Presets, a Note held, the Ideal Reference on) | n/a | median 16.8 ms, worst 33 ms (Pure Sine, the first) | 4×: median 33, p90 50, worst 83 ms | **pass** |
| Frames | Long tasks over 50 ms after start-up | 0 | 0 | 2×: 0; 4×: one long frame of 51–53 ms per 10 s of the Demo | **pass** |
| Frames | WebKit, full speed: worst gap; frame callbacks a frame | paused 19 ms, 1.3 ms; Demo 22 ms, 3.0 ms; chord 19 ms, 2.3 ms. Phone size: 19 / 22 / 19 ms; 1.6 / 3.5 / 2.6 ms | n/a | n/a | **pass** |
| Memory | Heap after GC over 10 minutes (clean soak: 3 Demo restarts, 246 Preset changes) | 7.3 MB at start, 11.2 MB at 30 s, then 11.5 to 12.6 MB to the end (12.4 MB) | n/a | n/a | **pass**: no leak; a drift of about 1 MB that does not grow with the Preset changes |
| Memory | DOM nodes, listeners and live AudioNodes over 10 minutes | 2,656 to 2,978 nodes, back to 2,656; 482 to 507 listeners; 653 to 659 AudioNodes; 7 canvases throughout | n/a | n/a | **pass** |
| Memory | Resident memory of all of Chromium over 10 minutes (`ps`, shared pages counted more than once) | 1,205 → 1,355 MB; the renderer 527 → 653 MB, most of it in the first 6 minutes of the Demo | n/a | n/a | **pass**, to watch: the renderer grows while the JS heap stays flat |
| Memory | Physical footprint (`footprint`), the Demo playing | browser 65 MB, renderer 181 MB, GPU 214 MB, audio 24 MB, the rest 120 MB: about 0.6 GB in all | n/a | n/a | **pass**: about 7 % of 8 GiB |
| Load | Transferred, empty cache | 246 kB | same | n/a | **pass** |
| Load | First paint: unshaped / 10 Mbit/s, 40 ms / Slow 4G | n/a | 328 / 520 / 1,776 ms; the piano there at 310 / 502 / 1,967 ms | n/a | **pass** |
| Load | Keydown to the first scheduled sound | n/a | 0.8 ms | n/a | **pass** |
| Load | Start-up long task | n/a | 116–120 ms (299 ms once, on the very first cold load) | n/a | **pass** |
| Idle | All of Chromium, sound paused, nothing moving on screen | 42 % of a core: renderer 25 %, GPU 17 % | (throttling inflates it: 47 %) | n/a | **fail** for a battery, though a third less than last run |
| Idle | The share of that from the flat LFO plots (identical writes dropped, Bead off) | n/a | GPU 7.2 → 0.5 % of a core; 1 style recalculation and 1 layout a frame → 0; 41 → 34 % of a core in all | n/a | (finding 1) |
| Idle | Behind another tab | not measurable headless. From the code, the render loop is `requestAnimationFrame`, which stops in a hidden tab; the Demo moves to a worker's ticks; the sound pauses after 30 s of silence | n/a | n/a | not measured |

## Where the time goes

**The Demo**, profiled at 1.25×: the main thread is busy 41.7 % of the time, 6.95 ms a frame. Ranked:

1. **The three Taps' Viewers: 14.2 % (2.37 ms a frame).** The three Spectrums alone take 10.1 % (1.69 ms):
   - `getFloatFrequencyData`, three 8192-point FFTs a frame: 2.6 %;
   - the two peak-finding passes, each allocating a `Float32Array` filled with −Infinity every frame: 1.4 % and 1.3 %;
   - the Response Curve's `getFrequencyResponse`: 0.4 %.

   The Scopes take 3.6 %, with Cycle Lock at 1.5 % of it.

   *Cheaper:* reuse the arrays and find the peaks in one pass. Take the FFT at 30 Hz, or skip it for a Tap whose samples have not changed since the last frame. A Spectrum 1440 px wide shows nothing that a 4096-point FFT would lose above about 50 Hz.
2. **React re-rendering the Demo's knob turns: about 6 % (1.0 ms a frame)**, in React's scheduler and commit. These commits land between frames.

   *Cheaper:* move a knob's turn by a Show outside React, as the modulation rings already are, or batch the Show's turns into one commit a frame.
3. **Layout: 403 layouts in 5 s, 210 ms, about 4 % of the main thread at 1×.** The trace puts the invalidations on three writers:
   - the modulation rings' `setAttribute('d')`;
   - the LFO plots' `setAttribute('d')`;
   - React's attribute writes.

   Then `prepareCanvas` (`clientWidth` and `getComputedStyle`) forces the style recalculation each frame.

   *Cheaper:* write an SVG attribute only when its string changed, and cache each canvas's size from a ResizeObserver rather than read `clientWidth`.
4. **The browser's own work outside JavaScript: 11.9 %**: style, layout and painting the SVG that changed. It shrinks with the item above.
5. **The rest of the render loop:**
   - the Envelope Timeline: 1.8 %;
   - the LFO plots: 1.8 %;
   - Bead: 1.9 %;
   - the modulation rings: 0.7 %;
   - the pitch marker: 0.1 %.

**The idle page, sound paused**, at 1.25×: the main thread is busy 11.5 %, of which the render loop is 6.6 % (1.1 ms a frame):

- **The flat LFO plots: 1.9 % (0.33 ms a frame), the largest draw at rest.** Each frame they compute 802 LFO samples (`lfoSwingAt` reads the LFO's phase before multiplying by a Depth of 0). They rewrite three unchanged attributes per plot. Each frame that costs a style recalculation, a layout, a repaint and about 7 % of a core in the GPU process.
- The Taps checking whether they may rest: 1.5 %.
- Bead: 1.3 %.

The renderer's processor time stays near 25 to 34 % of a core with the main thread mostly idle: the 60 fps loop itself, the compositor, and the one-second silence check. A loop that stopped when every draw rests would take most of that away too.

## What worked

- **The audio.** No underrun in any run, even at 4× with the main thread saturated. The audio thread uses about a tenth of its budget on an M2, about a fifth on an M1. The Demo's look-ahead covers the 4× long frames.
- **The Demo has real margin now:** 41 % busy on the M1 stand-in, 65 % at 2×, and 60 fps at 2560 × 1440. The ADR-0002 loop with its reads before writes (issue 221) shows in the numbers.
- **Preset changes** cost nothing visible on the floor: the median first frame is one frame (16.8 ms), Ideal Reference and heavy FM included.
- **Load:** a quarter of a megabyte, the first paint in 0.33 s on a good line, 0.5 s on a mid-range one, a key heard in under a millisecond once the piano is there.
- **Memory:** after 10 minutes, 3 Demo restarts and 246 Preset changes, the heap is 12.4 MB, and DOM nodes, listeners and AudioNodes are back where they started. The whole browser uses about 0.6 GB of an 8 GiB Mac.
- **WebKit** runs it at 60 fps at a laptop's and a phone's size, with frame callbacks of 1.3 to 3.5 ms.

## Where it struggles

- **It is never at rest.** With the sound paused and nothing moving on screen, Chromium still takes 42 % of a core at 1×. Of that, about 7 points are the flat LFO plots repainting identical lines (finding 1). Much of the rest is a 60 fps loop running for draws that all skip.
- **The audio thread renders silence for the Voices that are not used** (finding 2). At 1 Voice, four fifths of its work is Voices 2 to 8. Until the 30 s pause it does this with nothing playing at all: 0.13 of the budget at idle, the same as an 8-Voice chord.
- **Below the floor, the Demo is still the limit.** At 4× it falls to 44 fps with the main thread at 99.6 %. The Spectrums and React's knob turns are the two items that would buy it back.

## Would they

- **Like:** yes. The fixes since last run are measured, not guessed, and the audio never glitched.
- **Share:** yes, with "runs comfortably on an M1, and the idle cost is down by a third".
- **Come back:** yes, for the last 40 % of a core at rest.
- **Recommend:** yes for any Apple Silicon Mac. For older Intel laptops (the 4× case) the Demo plays at 44 fps rather than 60, which is acceptable. For a laptop on battery with the tab left open, the page still keeps a core well awake.

## Findings, ranked by what a person would notice

1. **Confirmed: at Init both LFO plots, flat at Depth 0, are recomputed and rewritten every frame. That is the only thing still repainting the paused page with Bead off.** Each frame: 802 LFO samples, 6 identical `setAttribute` calls, 1 style recalculation, 1 layout and a repaint. Dropping the identical writes took the GPU process from 7.2 % to 0.5 % of a core and the whole browser from 41 % to 34 %. Fix: write only changed attributes, and draw a plot whose Depth is 0 once.
2. **Confirmed: at 1 Voice the seven unused Voices still render: four fifths of the audio thread's work.** Cutting Voices 2 to 8 from the graph took `renderCapacity` from 0.133 to 0.027 and the renderer from 42.5 % to 32.3 % of a core. They also render at idle until the 30 s pause, costing as much as an 8-Voice chord. Fix: connect a Voice to the master only while it sounds or is within the Voices count, and reconnect it before its next Note.
3. **The statistics page's +8.9 points for the Demo at 1.26.0 are the measure's noise, not the code.** One 10 s sample, taken right after the full test suite, on a fanless MacBook Air that was probably still hot. On a quiet machine the same measure gives 84 to 90 % on 1.26.1, at 60 fps against the row's 56. Fix: the median of 3 or more runs, the load average recorded, measured after a cool-down, plus the main thread's milliseconds per frame.
4. **The paused page still runs a 60 fps loop for draws that all skip: 25 % of a core in the renderer at 1×, for a still screen.** Fix: when every registered draw rests, stop asking for frames, and start again on a Note, a knob, a pointer or Bead's next move.
5. **The Demo's two largest costs below the floor are the Spectrums (1.7 ms a frame at 1.25×) and React's knob turns (1.0 ms a frame plus a layout).** At 4× the Demo drops to 44 fps. Fix:
   - one peak pass with reused arrays, and the FFT at 30 Hz or skipped when its Tap is unchanged;
   - a Show's knob turns drawn outside React, or one commit a frame.

The scripts, profiles, traces and raw numbers are in this session's scratch folder (`perf18/`), not kept.
