# Persona review 9: the TypeScript, React and Web Audio expert

Ran on 1.26.1 (build 38df0ad) on 2026-11-07. Read the code at main (`38df0ad`), with `tsconfig.json`, `biome.json` and `vite.config.ts`, and issues 182, 214, 216 and 249. Measured the live site at https://gijom33.github.io/limpide/ in headless Chromium at 1440 × 900 through the repository's Playwright, driven by Node scripts in a scratch folder. The scripts used CDP `Performance.getMetrics`, the CPU profiler, the `WebAudio` domain (node lifecycle and `getRealtimeData`), a MutationObserver, wrapped canvas calls, and a stand-in React devtools hook to count commits. No tracked file was changed.

Headless Chromium draws in software, so the absolute CPU figures run high. Read the comparisons, not the absolute numbers.

## First impression

"One 227 kB gzip chunk (688 kB raw) and 15 kB of CSS. The page is interactive in under half a second and the console is clean. About opens over a dense panel of Viewers that already show a saw wave before I've played anything. The engine is still one 1,747-line `synthEngine.ts`, but `src/` now reads like a codebase with rules: `strict`, zero `any`, every `biome-ignore` with a reason, and a render loop that says in its header it reads first and writes after. What I want to know is what the page does when nothing is playing."

## What they tried, in order

1. **Checks.**
   - `npx tsc`: clean in 2.2 s.
   - `npx vitest run --project unit`: 1,441 tests in 98 files, green in 37 s.
   - `npm run lint` fails, but only on two untracked files another reviewer left in `src/engine/` (`zzReview15/19.browser.test.ts`). The tracked code is clean.
2. **Types, by grep** (176 non-test files, 26,292 lines).
   - 0 `any`, 0 `@ts-ignore`, 10 `biome-ignore`s, each with a reason.
   - The real casts are idiomatic: `Object.keys(...) as ParamId[]`, `Object.fromEntries(...) as Record<…>`, and narrowing `unknown` from storage after a `typeof` check (`serialize.ts:11`, `library.ts:34`).
   - Two double casts remain: `useMidi.ts:269` and `Mascot.tsx:466`.
   - About 112 non-null assertions, 23 of them in `Mascot.tsx` (`ref.current!`).
   - `noUncheckedIndexedAccess` is still off, which is why `dots[i] as SVGRectElement` (`Mascot.tsx:133`) and `kept.get(key) as V` (`music/cache.ts:11`) need a cast.
3. **Session and ADR-0002.** `getAudioSession` (`app/session.ts:65`) is a module singleton with its reason written beside it: StrictMode runs initialisers twice, and browsers cap AudioContexts. The engine, Patch store, tempo, Viewers and shows live outside React. React subscribes through `useSyncExternalStore` (`App.tsx:113-117`). This is done well.
4. **Web Audio graph, live (CDP `WebAudio`).**
   - 653 nodes at load: 401 Gains, 100 ConstantSources, 47 WaveShapers, 42 Biquads, 26 Oscillators.
   - Then 150 Notes on 8 Voices, 40 Filter Mode changes and 15 s of the Demo. After GC, 656 nodes are alive.
   - Param connections made minus removed is 384 at the end: exactly the load's permanent ones. The issue-101 fix holds, and nothing leaks.
   - Each Mode change builds 16 new Biquads and lets the old ones go.
5. **Read the engine.**
   - `createTakeover`/`createRestartable` (`synthEngine.ts:329-436`).
   - The Mode crossfade (`fadeTo`, `:1496-1523`). A zero-offset ConstantSource's `onended` serves as an audio-clock timer, so the old side is unwired only once the browser has rendered the fade. That's a neat trick, and correct under an offline render.
   - `holdAt`'s Firefox fallback (`:571-579`).
   - `noteOn`'s dip before a restart (`:1675-1699`).
   - `heardAt` (`outputClock.ts:17-22`): the output timestamp, with the latencies as fallback. The algebra is right.
6. **Audio thread (CDP `getRealtimeData`).** `renderCapacity` reads 0.18 at 1 Voice and silent, 0.17 with one Note held, 0.18 at 8 Voices and silent, and 0.18 with an 8-note chord. The load doesn't change with how many Voices sound (finding 2).
7. **Main thread at rest** (welcome closed, one Note, then silence).
   - Before the 30 s pause: 17 % script, 60 layouts and 60 style recalcs a second.
   - After it: 11 % script, still 60 layouts a second.
   - Blocking the LFO plots' attribute writes took layouts from 61 to 20 a second. Removing Bead too took them to 0.
   - The CPU profile at rest puts `phaseAt` (the LFO clock) as the hottest JS function: 227 ms in 4 s. With a Note held it is still first (258 ms in 4 s), ahead of `getFloatFrequencyData`.
   - A MutationObserver on the two LFO plots at Init (both Depths 0, both plots dimmed) saw 720 writes in 2 s, and none changed a value (finding 1).
8. **Who writes what each frame.** While the Oscillator Tap sounds, the Scope and Spectrum write 9 `data-*` attributes per frame (`data-snapshot`, `-guides`, `-glow`, `-period`, `-markers`, `-ideal-marks`, `-noise-slope` …). They do it from inside their draw, the loop's read phase (finding 3). No stylesheet rule uses them, and only the e2e specs read them.
9. **Canvas calls.** Wrapping `CanvasRenderingContext2D` showed about 106 `stroke()` calls per Spectrum per frame while sounding: a separate `beginPath`/`stroke` for each Harmonic Marker tick (`spectrum.ts:279-285`) and each Ideal mark (`idealMark`, `:95-99`). The cost is small (about 30 ms of native stroke and lineTo in 4 s), but one path per style would do it in two calls.
10. **React.** I dispatched 60 Cutoff key steps, one per frame.
    - The handler takes 0.3 ms (median).
    - The 60 steps caused 93 commits and about 3 ms of script each beyond the loop's.
    - `App` still re-renders the tree on each Patch change, with no `memo`. That's acceptable at this size.
    - The markup scan found 0 unlabelled controls: 32 sliders, 40 radios, a tablist. Canvases are `role="img"` with labels.

## What worked

- **The engine's correctness work is mature.**
  - `createTakeover` is shared by the Oscillators and the LFOs.
  - Param connections are cut on `onended`.
  - The Mode crossfade only settles once the browser has rendered the fade.
  - The dip before a restart avoids clicks without special cases.
  - The live node count returns to its baseline after 150 Notes, 40 Mode changes and the Demo.
- **Last review's findings are all answered at the root.**
  - The MIDI Activity line is a store of its own (`useMidi.ts:32-40`).
  - Aftertouch glides (`setPressure`, `:1662-1673`, issue 219).
  - The render loop has a read phase and a write phase (`renderLoop.ts`, issue 221).
  - Bead's frame logic moved to pure `beadFrame.ts`, and `Mascot.tsx` went from 1,107 to 661 lines.
  - Beats are placed at the output's time (`outputClock.ts`, issue 185).
- **Types stay strict by habit.** No `any` in 26 k lines, casts only at `Object.keys` and untyped storage, and the `useMidi` double cast is still the only real escape hatch.
- **The render loop is well built.** It isolates a throwing Viewer (`renderLoop.ts:17-21`), and every Viewer at rest compares its inputs before drawing (`rest.ts`).
- **The silence pause (`pauseInSilence.ts`) is careful.** It wakes on the methods that schedule sound, which a test checks against a real engine. It also handles a refused resume and gives up on iOS, where a tap is needed.

## Where they got stuck

- **The page is never at rest at Init.** The owner decided that the LFO plots keep moving in silence (issue 182, decision 3). At Init both Depths are 0, so the plot is a flat dimmed line, and "moving" changes nothing on screen. The page still computes 802 LFO samples and rewrites three SVG attributes per frame. That is finding 1, and fixing it keeps the owner's decision.
- **The audio thread's flat load** is from reading the code and CDP's figure, not a measured fix. The Voices are built once and run for the page's life, which is the right call for clicks and churn. The cost of that choice is finding 2.
- **`pauseInSilence` reassigns the engine's methods in place** (`:69-75`, typed `(...args: never[]) => void`). It works and is tested. A wrapper that returns a new engine would keep `createSynthEngine`'s object honest. I'm noting it, not filing it.
- **Small items, none worth an inbox line:**
  - `ctx as OutputClockContext` (`synthEngine.ts:1612`) is unneeded: the interface's extra members are optional.
  - `onPress` returns `delete`'s boolean where `onHeld` returns void (`session.ts:124-136`).
  - The Spectrum's separate stroke per mark (step 9).
  - 81 tooltip elements stay mounted.
  - One chunk, with the C16 card page and every tutorial in it.

## Would they…

- **Approve the pull request:** yes, with comments. All three findings are local and none is a bug in the sound.
- **Hire the author:** yes. Last round's five findings were each fixed in the right layer, with a test.
- **Recommend the code to a colleague learning Web Audio:** yes. Read `createTakeover`, the Mode crossfade's `onended` timer, `heardAt` and `pauseInSilence`.
- **Come back:** yes, to see the engine's 1,747 lines split along the seams it already has: Voice, LFOs, Filter sides.

## Since the last run (1.21.1, 2026-11-02)

- **Fixed:** all five findings.
  - The Activity line re-rendering the page (now a store).
  - Aftertouch stepping (now a glide).
  - Bead's 588-line effect and the loop's missing read phase (now `beadFrame.ts` and the read/write loop).
  - Beats late by the output latency (now `heardAt`).
  - The stale TempoControl comment (now about the pulls piling up).
- **Unchanged:**
  - `as unknown as` at `useMidi.ts:269` and `Mascot.tsx:466`.
  - `noUncheckedIndexedAccess` off.
  - No `memo`.
  - One chunk, now 227 kB gzip (it was 204 kB).
- **Up:** non-null assertions, from about 82 to about 112.
- **New:** the three findings below. The idle work moved from the Viewers, which now rest, to the LFO plots and the always-rendered Voices.

## Three findings, ranked

1. At Init, both LFO plots, flat because each Depth is 0, recompute 802 LFO samples and rewrite three unchanged SVG attributes every frame. Live, 720 writes in 2 s changed no value. They cause about 40 of the 60 layouts a second at rest, and `phaseAt` is the page's hottest JS function both at rest and while playing. Fix: `lfoSwingAt` returns 0 without the clock at Depth 0 (`src/engine/modulationRecord.ts:275-280`), and `LfoPlot` writes `d`/`cy` only when they change (`src/ui/LfoPlot.tsx:78-82`). Nothing on screen changes, so the owner's "keep it moving" holds.
2. At 1 Voice, the other seven Voices still render. Each Voice is wired to the master for the page's life (`src/engine/synthEngine.ts:857`), and about nine nodes in ten belong to the Voices. Live, CDP's `renderCapacity` reads 0.18 silent at 1 Voice and 0.18 with an 8-note chord. Fix: measure first, then disconnect a Voice's output from the master (and the Taps) while it is beyond the Voices count and its Release has ended, and reconnect it before its next Note, so the browser stops pulling its subgraph.
3. The Scope and Spectrum write their test hooks (`data-snapshot`, `-guides`, `-glow`, `-period`, `-markers`, `-ideal-marks`, `-noise-slope`) on every frame, from inside the draw. That breaks the loop's own rule that every draw reads before any write (`src/viewers/renderLoop.ts:1-9`), and ships e2e hooks to production, written 60 times a second (`src/viewers/scope.ts:106,117,173,191`, `src/viewers/spectrum.ts:230,273,315,324`). Fix: return them in the Viewer's write, and only when changed, as `data-db` already is (`src/ui/TapViewers.tsx:79-82`), or set them only in the e2e build as `__limpideTrick` is.

## For the inbox, one line each

1. The LFO plots at Depth 0 redo 802 LFO samples and rewrite unchanged SVG every frame (40 layouts a second at rest, `phaseAt` the hottest function): `lfoSwingAt` short-circuits at Depth 0 and `LfoPlot` writes only what changed.
2. At 1 Voice the seven other Voices still render (the audio thread's load is the same silent as with an 8-note chord): disconnect an unused, released Voice from the master, measured before and after.
3. The Scope and Spectrum write their e2e `data-*` hooks every frame inside the draw, against the render loop's read-then-write rule: move them into the write, only when changed, or into the e2e build.
