# Review 18: the performance expert, M1 with 8 GiB as the floor

Profile 18's first run, on the published site (1.21.1, build `3015b1a`), 2026-11-02. Driven from Node scripts with the repository's Playwright 1.64.1 (its Chromium 156, headless, and its WebKit), never the repository's test suite. The machine: Apple M2, 8 cores, 16 GB, macOS 27.0.1, shared with five other reviewers. Its load average (1 minute) went from 2 to 39 during the runs. The table below uses only runs made at a load of 2 to 4. The noisier runs agreed in kind but not in their numbers.

**How the floor was stood in for.** An M1 core does about 0.8 to 0.85 of an M2 core's single-threaded work, so **1.25×** DevTools CPU throttling is the honest M1 stand-in. **4×** and **6×** were run as asked: they stand for something weaker than the floor, such as an older Intel MacBook Air or a Chromebook, and they show how much margin there is. DevTools throttling slows the page's main thread only. The audio thread, the GPU process and the compositor run at the M2's full speed, so the audio was measured on its own (below).

## First impression

The page opened in 0.44 s (first paint) and makes sound as soon as the piano exists, which is good. It runs at 60 fps in every state and at every window size on this machine. Then I looked at the idle numbers. With nothing playing, the page keeps about a third of a main-thread core busy, plus the GPU and the audio thread. It is drawing silence 60 times a second. On a laptop that is a battery cost, and it is the first thing a performance engineer would call out.

## What I tried, in order

1. **Probe** (`probe.mjs`): 7 canvases, Bead in, the Synth Geek Layer and every overlay on (set through `limpide.overlays`), one AudioContext at 44.1 kHz. Chromium 156 has neither `playoutStats` nor `renderCapacity`, so dropouts had to be found another way.
2. **States × throttling** (`measure.mjs`): idle on Init, an 8-Voice chord (8 keys held), and the Demo. Each was run at 1×, 1.25×, 2×, 4× and 6×, at 1440 × 900 at 2× pixels. Each run: a fresh page, 3 s of start-up, 2 s to settle, then 10 s measured. The measures were:
   - frame gaps from `requestAnimationFrame`;
   - main thread busy from DevTools `TaskDuration`, also split into script, style and layout;
   - style recalculations and layouts per frame;
   - CPU per process from `SystemInfo.getProcessInfo`;
   - long tasks and long animation frames;
   - heap after a GC.
3. **Window sizes**: the Demo at 1920 × 1080 and 2560 × 1440, each at 1× and 2× pixels.
4. **Isolation**: the Demo and idle with Bead off, and with the overlays back at their defaults.
5. **CPU profiles** (`profile.mjs`, 200 µs sampling, 10 s) of idle and the Demo. The bundle has no source map, so each hot function was matched to its source by its code.
6. **Audio thread** (`audiotrace.mjs`): a Chromium trace of the `audio` category. Each render callback is 256 frames, 5.8 ms of time at 44.1 kHz, and the trace gives how long each one took.
7. **Late events** (`late.mjs`): wrapped `AudioParam`'s scheduling methods to record how far ahead of `currentTime` each event was scheduled, while the Demo played. The call stacks show which events were late.
8. **Patch changes** (`patchswitch.mjs`): 40 × Next Preset with a Note played after each, recording the worst frame within 700 ms of the click.
9. **10-minute soak** (`soak.mjs`): 6 minutes of the Demo looped (restarted 3 times), then 4 minutes of 114 Preset changes with 4-key chords at 8 Voices. A sample every 30 s: heap after GC, DOM nodes, listeners, RSS per process.
10. **Memory footprint** (`footprint.mjs`): macOS `footprint` of each Chromium process 20 s into the Demo.
11. **Load** (`load.mjs`): an empty cache, the network shaped through CDP, a key pressed as soon as `.piano` exists. Measured the time from keydown to the engine's first `setValueAtTime`.
12. **Start-up profile** (`startprof.mjs`), and **WebKit** frames idle and in the Demo (`webkit.mjs`).

Not done: a background tab (headless and Playwright's headed Chromium both keep every tab "visible"), real Safari, a phone, and battery drain measured on a laptop.

## The measures against the floor

| Area | Measure (how) | M2, 1× | M1 stand-in, 1.25× | 4× | 6× | Floor |
| --- | --- | --- | --- | --- | --- | --- |
| Audio | Render callback, 8-Voice chord (trace): p50 / p99 / max of a 5.8 ms budget | 0.58 / 0.73 / 1.25 ms (10–22%) | not throttled; about 12% est. | n/a | n/a | **pass** |
| Audio | Late Notes, Demo (AudioParam wrapper, 30 s) | 0 Note Ons late | 0 | 0; knob moves applied up to 37 ms late | 0; knob moves up to 83 ms late | **pass** |
| Frames | Idle: fps, worst gap, main thread busy | 60, 16.8 ms, 31.8% | 60, 16.8 ms, 33.4% | 55, 33 ms, 99.6% | n/a | **pass** (fail at 4×) |
| Frames | 8-Voice chord | 60, 16.8 ms, 32.2% | 60, 16.8 ms, 34.1% | 53, 33 ms, 99.7% | 25 fps (noisy run) | **pass** |
| Frames | Demo, 1440 × 900 at 2× | 60, 16.8 ms, 44.6% | 60, 16.8 ms, 54.0% | 33, 67 ms, 99.6% | 19, 100 ms | **pass** (2×: 60 fps at 84% busy) |
| Frames | Demo at 1920 × 1080 at 1×, 2560 × 1440 at 1×, 2560 × 1440 at 2× | n/a | 60 fps each, 53–56% busy, GPU 30–34% | 38.5 and 32 fps | n/a | **pass** |
| Frames | First frame after a Patch change (40 Presets) | median 16.8 ms, worst 33 ms (the first) | n/a | median 50 ms, worst 200 ms | n/a | **pass** |
| Frames | Long tasks over 50 ms after start-up | 0 in every 1× and 1.25× run | 0 | 0–12 per 10 s, worst 77 ms | 7–112, worst 93 ms | **pass** |
| Memory | Heap after GC over 10 min (soak) | 5.9 → 10.4 MB in the first 30 s, then flat at 10.6–11.6 MB | n/a | n/a | n/a | **pass**, no leak |
| Memory | DOM nodes / listeners over 10 min | 3,096–3,440 / 446–585, back to 3,110 / 459 | n/a | n/a | n/a | **pass** |
| Memory | Physical footprint (`footprint`) | renderer 203 MB, GPU 194 MB, browser 68 MB | n/a | n/a | n/a | **pass**: about 0.4 GB of 8 GiB |
| Load | Transferred, empty cache | 225 kB (one 206 kB gzipped script) | n/a | n/a | n/a | **pass** |
| Load | First paint: no shaping / 10 Mbit/s with 40 ms RTT / Slow 4G (1.6 Mbit/s, 150 ms) | 436 ms / 628 ms / n/a | n/a | n/a / 1,036 ms / 2,196 ms | n/a | **pass** |
| Load | Keydown to sound | 1 ms | n/a | 3–4 ms | n/a | **pass** |
| Load | Start-up long task | 258–267 ms (195 ms of it is the `AudioContext` constructor) | n/a | 529–547 ms | n/a | **pass**, borderline |
| Idle | CPU with nothing playing (per process) | renderer 46%, GPU 17%, audio thread about 10% of its callback budget | renderer 61% | renderer 114% | n/a | **fail** for a battery |
| Idle | Behind another tab | not measured. From the code, the only loop is `requestAnimationFrame`, which Chrome pauses in a hidden tab. The audio graph keeps rendering. | n/a | n/a | n/a | not measured |

WebKit, headless at full speed: idle 60 fps (worst 19 ms), Demo 60 fps (worst 28 ms).

## Where the time goes

CPU profile of the Demo at 1×, as a share of the main thread's wall time and per frame:

- The render loop: 50.5% (8.6 ms a frame). Within it:
  - the three Taps' Scope, Spectrum and level: 27.5% (4.7 ms);
  - the Envelope Timeline: 12.7% (2.2 ms);
  - Bead: 5.5% (0.9 ms);
  - the LFO plots: 2.2% (0.4 ms).
- React's work for the Demo's knob ticks: about 10%.
- The hottest single functions:
  - Cycle Lock's windowed DFT (`cycleLockOffset`): 5.9%;
  - `prepareCanvas`, whose `clientWidth` read forces layout: 5.7%;
  - `querySelectorAll`, all of it from Bead: 3.8%;
  - `getFloatFrequencyData`, three 8192-point FFTs a frame: 3.4%.

Idle, the render loop still takes 32.6% of the wall time (5.4 ms a frame). Its parts:

- the Taps: 16.4%;
- the Timeline: 7.7%;
- Cycle Lock: 4.3%, run over silence;
- Bead: 3.7%.

Holding an 8-Voice chord costs the same as idle (32.2% against 31.8% busy). The Viewers cost the same whether they show sound or silence.

Style and layout: idle runs 2.0 style recalculations and 1.1 layouts a frame; with Bead off, 1.0 and 1.0. In the Demo it is 7.9 and 3.4 a frame, because the knobs' React updates land between the canvases' `clientWidth` reads and Bead's `getBoundingClientRect`. That costs 2.3% plus 2.2% of the main thread at 1×, and about 5% plus 5% at 4×. The script time dominates.

## What worked

- The audio is solid. The audio thread uses about a tenth of its budget, and no Note On was ever late, even at 6× with the main thread saturated. The Demo's 150 ms look-ahead covers the 77–93 ms long tasks.
- Memory is clean. The heap levels off near 11 MB, nodes and listeners return to where they started after 114 Preset changes and three Demo loops, and the whole browser uses about 0.4 GB on an 8 GiB Mac.
- Load is light: 225 kB, first paint well under a second on a mid-range connection, a key plays the moment the piano is drawn.
- The window size hardly matters. The work is scripting, not drawing pixels, so 2560 × 1440 costs what 1440 × 900 does.
- No leak was found and no long task after start-up appeared on the floor. The ADR-0002 design of one `requestAnimationFrame` loop outside React holds up.

## Where it struggles

- **Idle cost.** About 30% of a main-thread core, 17% of the GPU process and the audio thread always rendering, to draw an unchanging silent picture. At 4× the idle page cannot hold 60 fps.
- **Margin.** At the M1 stand-in the Demo uses 54% of the main thread. At 2× it uses 84%, at 4× it falls to 33 fps, and at 6× to 19 fps. A floor M1 with other tabs and apps open, in Low Power Mode, or on battery throttling has less room than the numbers here.
- **Per-frame work that does not need to be per frame:**
  - the Cycle Lock DFT;
  - Bead searching the whole document;
  - the Timeline recomputing the whole modulation history;
  - `getComputedStyle` read for each colour, every frame;
  - the level meter re-reading the same 8192 samples the Scope just read.
- **Knob moves rewrite the whole Patch.** Each one goes through `applyPatch`, which writes every AudioParam of every Voice: about 10,600 `AudioParam` calls a second during the Demo at 1×. At 4× and 6× the knob automation lands 37 to 83 ms behind the audio clock. This is harmless to the ear today, but it is audio-thread and main-thread work for nothing.

## Would they

- **Like:** yes. The audio engineering is careful, and it never glitched.
- **Share:** yes, with "runs fine on an M1".
- **Come back:** yes, to see the idle and Bead costs fixed.
- **Recommend:** yes for any Apple Silicon Mac. With a caveat for older Intel laptops (the 4× case, where the Demo drops to 33 fps) and for a laptop left with the tab open on battery.

## Findings, ranked by what a person would notice

1. **The page keeps working while nothing plays: idle it holds about 30% of a main-thread core, plus 17% of the GPU process and the audio thread, redrawing silent Viewers at 60 fps (a fail at 4×, where idle falls to 55 fps).** A laptop's battery and fans notice. Fix: when every Tap is silent and nothing moves, draw once and skip frames until a Note, a knob or Bead moves. Suspend the AudioContext after some seconds of silence.
2. **The Demo has little margin below the floor: 54% of the main thread at the M1 stand-in, 84% at 2×, 33 fps at 4× and 19 fps at 6×.** The render loop alone takes 8.6 ms a frame on an M2, and the Demo's 40 ms knob tick re-renders React and rewrites the whole Patch: `applyPatch` makes about 10,600 `AudioParam` calls a second. Fix: write only the changed parameters, and coalesce knob updates to one per frame.
3. **Cycle Lock runs a windowed DFT over all 8192 samples with three trig calls a sample, per Scope, every frame, silence included.** It is the hottest function in the bundle: 5.9% of the main thread in the Demo, 4.3% idle. Fix: compute the Hann window once and use a sin/cos recurrence; skip it when the Tap is silent; share the samples with the level meter, which reads them again.
4. **Bead costs 0.6–0.9 ms and one extra style recalculation every frame, mostly from `querySelectorAll` over every panel and tooltip.** That is 3.6 points of a core idle, and 5 fps in the Demo at 4× (33 against 37.7 with Bead off). Fix: keep the list of covering elements up to date with a MutationObserver, and re-read the boxes only on scroll, resize or a layout change.
5. **The Envelope Timeline recomputes the modulation model for every pixel column every frame (1.3–2.2 ms), and every Viewer reads `getComputedStyle` for each colour, every frame.** It is the second costliest Viewer, steady even when nothing moves. Fix: scroll the drawn canvas and add only the new columns; cache the theme's colours until the theme changes.

The scripts, profiles and raw numbers are in the session's scratch folder (`review-18/`) and are not kept.
