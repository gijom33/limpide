# Persona review 9: the TypeScript, React and Web Audio expert

Read: the code at `328a370` (`src/`, `tsconfig.json`, `biome.json`, ADRs 0001–0003 and 0013–0014, `CODING_STANDARDS.md`), and the checks (`tsc`, lint, unit and engine tests). Measured: the live site at https://gijom33.github.io/limpide/ in headless Chromium at 1440 × 900 through Playwright (frame cost, the CDP WebAudio node counts, heap after GC, render capacity, a CPU profile, refused storage, MIDI timing). Also measured: the real engine bundled from `src/` and run in an `OfflineAudioContext`. 2026-10-30, version 1.16.0. The scripts and their raw output are in the reviewer's work folder (`measure.cjs`, `profile.cjs`, `model-bench.cjs`, `engine-repro.cjs`, `restart-repro.cjs`, `storage-midi.cjs`). No tracked file was changed.

The machine was shared with other reviewers' browsers (load average 46–50 on 8 cores). So absolute frame times are inflated and noisy. The comparisons below (more history against less, before and after) are what to read.

## First impression

"Same stack, two runtime dependencies, and the engine has grown from 764 to 1,018 lines. Now there's an oscillator that is thrown away and rebuilt on every Note, which is exactly where Web Audio code goes wrong. `App.tsx` is down from 963 lines to 684, with five hooks beside it. Biome runs `useExhaustiveDependencies` as an error, and every ignore says what it leaves out. The engine's comments still explain why. Last time I asked for two fixes. Let's see if they landed, and what the new restart code does at the edges."

## What they tried, in order

1. **Checks.** `npx tsc`: clean in 2.7 s. `npm run lint` (Biome): 233 files, clean. `npm run test:unit`: 571 tests in 59 files, green in 47 s. `npm run test:engine`: 258 tests in real Chromium, green in 266 s. In 1.8.1 it was 185 tests in 54 s, but this run shared the machine.
2. **Type strictness, by grep** (non-test `src/`, 119 files). 0 `any`, 0 `@ts-ignore`/`@ts-expect-error`. About 14 real `as` casts, nearly all `Object.keys(...) as ParamId[]` / `Object.fromEntries(...) as Record<…>` or narrowing `unknown` after a `typeof` check. In 1.8.1 there were about 33. A handful of `!`, down from 34. Still there from last time:
   - `src/ui/hooks/useMidi.ts:219`: `access as unknown as MidiAccessLike`.
   - `src/ui/hooks/useMidi.ts:97`: `patch[id] as never`.
   - `noUncheckedIndexedAccess` is still off.
3. **Lint discipline.** 19 `biome-ignore`s, each with a reason. The 9 on `useExhaustiveDependencies` name what they leave out, as `CODING_STANDARDS.md` asks.
4. **Bundle** (the live files): JS 469 kB (149 kB gzip), CSS 55 kB (11.3 kB gzip). In 1.8.1 it was 383 kB / 122 kB and 41 kB / 8.8 kB. Still one chunk, still fine for what it does.
5. **Read the engine's new code**: `createRestartable` (`synthEngine.ts:245-289`), Ring and FM (`:412-428`), the Sub (`:429-442`), Pink Noise (`:119-141`), the history with cached start levels (`:162-183`, `:772-782`), `holdAt` (`:328-335`), and the take-over paths in `noteOn`/`noteOff` (`:977-1011`) with `src/play/transport.ts`.
6. **Model cost against history size** (the real engine, 500 `modulationAt` calls, one per Timeline column, median of 60). With 10 Notes in history: **2.4 ms**. With 2,000 Notes inside the 30 s window: **2.7 ms**. The cost is now flat with history. In 1.8.1 it grew with every Gate event.
7. **Live site, frame cost** (every `requestAnimationFrame` callback timed; run 2, welcome closed):

   | State | Draw per frame (median / p95) | Frame rate |
   |---|---|---|
   | Idle, after load | 6.6 / 7.7 ms | 60 fps |
   | One Note held 5 s | 7.9 / 9.2 ms | 60 fps |
   | Right after 300 quick Notes | 10.5 / 20.3 ms | 43 fps |
   | Demo, 3–8 s in | 13.9 / 29.7 ms | 23 fps |
   | Demo, late (90 s) | 12.5 / 22.2 ms | 28 fps |
   | Demo, late, CPU throttled 4× | 21.7 / 42.1 ms | 14 fps |
   | Silent after the Demo | 11.4 / 20.6 ms | 38 fps |

   Run 1 (3 minutes of Demo) gave the same picture: late Demo 10.7 ms, silent after it 11.1 ms. Under this load the numbers move by a few ms from minute to minute, but nothing grows with time or with Notes played. The 1.8.1 pattern (3.7 → 31 ms after 600 Notes, staying there in silence) is gone. The throttled Demo went from 62.9 ms / 6.6 fps to 21.7 ms / 14 fps.
8. **CPU profile, 4 s of the Demo** (live, minified, attributed by reading the bundle at each location). 53–66 % is `(program)`: native canvas and raster work, plus a busy machine. The JS is spread thin and nothing dominates:
   - `peakOf` in `harmonicSeries` takes 2.7 %, on cache misses when the Demo turns Pulse Width.
   - The Spectrum's fill takes 2.7 %.
   - `soundingPitch`/`destinationSwings` take 2.6–4.3 %, allocating per call.
   - `modulationAt` takes 1 %, and its binary search 0.7 %.
   - GC is 6 %.
   - With Display open, React's commit (`commitUpdate`/`setProp`) and `setStage` show up at about 2 % each.
9. **Node lifecycle** (CDP `WebAudio.audioNodeCreated`/`audioNodeWillBeDestroyed`, GC forced):

   | After | Nodes alive | Created | Destroyed | Heap after GC |
   |---|---|---|---|---|
   | Load | 397 | 397 | 0 | 4.3 MB |
   | One Note | 397 | 400 | 3 | 5.0 MB |
   | 300 Notes | 397 | 1,300 | 903 | 7.9 MB |
   | Demo, 33 / 60 / 87 s | 448 / 397 / 427 | 1,963 / 2,305 / 2,600 | 1,515 / 1,908 / 2,173 | 9.8 / 10.0 / 10.6 MB |
   | 3 min of Demo (run 1) | 397 | 3,748 | 3,351 | 9.9 MB |

   Every non-legato Note now creates three `OscillatorNode`s (Osc 1, Osc 2, Sub), and Chromium collects them: the live count returns to the 397 of the built graph. Heap stays at 8.5–11 MB, and render capacity holds at 0.16–0.25. **No leak.** One thing is untidy. Each new node gets `hz → frequency` and `cents → detune` param connections (`synthEngine.ts:257-258`), and `onended` only calls `old.disconnect()` (`:283`), which cuts outputs, not inputs. CDP counted 4,874 param connections made and 0 removed. Chromium copes; WebKit and Firefox weren't measured.
10. **Restart scheduled ahead, then an earlier one.** This is the Demo's 150 ms look-ahead, or Hold's 100 ms, followed by a key that takes over. `restart(t)` stops only the current node (`:278-286`). The node that a pending later restart was replacing keeps its later stop time, so it plays on beside the new node:
    - `restart-repro.cjs`, the function verbatim, a 220 Hz sine: peak **1.0 → 2.0** between the two restart times, then back to 1.0 (a step, so a click).
    - `engine-repro.cjs`, the real engine, one Voice: a Demo Note handed over at 0.5 s, Stop and a key at 0.4 s. The key's peak is **0.272 from 0.42 to 0.5 s against 0.225 after it** (a single Note is 0.225).
    - `restartLfo` (`:713-731`) has the same shape.
11. **Stop with several Voices.** The same engine run, with the Note handed over for 0.5–0.8 s and the player stopped at 0.45 s (both of `startTransport`'s `noteOff`s). On 1 Voice the Note is silenced (peak 0). **On 4 Voices it plays in full** (peak 0.113, the same as an ordinary Note). `noteOff` closes only Voices with `releasedAt === null` (`:1006-1007`), and a handed-over Note already has its future release recorded. Only the one-Voice line (`:1010`) catches it. The engine test for this case (`synthEngine.browser.test.ts:554`) uses one Voice.
12. **Storage refused** (`localStorage` and `sessionStorage` throw `SecurityError`). The page starts: 22 sliders, the welcome, the Demo works. In one of three loads Playwright also logged an uncaught "The operation is insecure.", which I couldn't reproduce with a stack. Every storage read I found in `src/` is guarded.
13. **The start failure boundary.** With `AudioContext`'s constructor made to throw, the page shows "Limpide stopped … Reload" instead of a blank page (`src/ui/StartFailure.tsx`).
14. **MIDI.** `requestMIDIAccess` was not called during a normal load (`useMidi.ts:213` waits for `midiWanted`), so there's no permission prompt before a gesture.

## What worked

- **Both 1.8.1 blockers are fixed, and fixed properly.** The model keeps each Gate event's starting level and each pitch's slide origin when it is appended (`synthEngine.ts:772-778`, `:823-835`), so a past moment is a binary search (`lastAt`, `:166-175`). The benchmark is flat from 10 to 2,000 Notes. `safeStorage` (`src/app/storage.ts`) is used everywhere, `main.tsx:9` included, and `StartFailure` catches what's left.
- **ADR-0013/0014 are the right move.** The Patch lives in a store the engine hears first, and React reads it through `useSyncExternalStore`. That replaces the hand-rolled ref mirrors I complained about. Building the stores once in the audio session (`src/app/session.ts:37-80`) is the correct answer to StrictMode's double initialisers.
- **The render loop survives a bad Viewer** (`src/viewers/renderLoop.ts:11-21`): it reports once and keeps drawing.
- **Firefox has a fallback** (`holdAt`, `synthEngine.ts:328-335`), with its one inexactness documented.
- **The restartable oscillator is a sound design.** Pitch reaches each short-lived node through two `ConstantSource`s that live as long as the Voice, so a restart rewires only the node. The comment explains it in two sentences, and the node churn measures clean in Chromium. Ring as a gain driven by Osc 2 and FM through a Note-tracking gain into `frequency` are textbook native-node work. Pink Noise runs Kellet's filter twice over the loop, so the loop has no seam. Nice.
- **Legato doesn't restart** (`:983-984`, issue 94), so a held line doesn't click.
- **React.** `App.tsx` lost 280 lines to `useHold`, `useKeys`, `useMidi`, `usePlayers` and `useTutorialState`. It is down to 6 effects and 1 ref.
- **Biome enforces hook dependencies.** That was my item 10 last time.
- **Engine tests still measure rendered audio.** There are 73 more of them than last time.

## Where they got stuck

- **The take-over edge of the new restart code** (items 10 and 11 above). Both bugs need a player that schedules ahead and then an earlier event. That is exactly what taking over the Demo or switching Hold off does, and no test plays it with more than one Voice or listens to the oscillators.
- **Frame time under load.** The machine was busy, so I can't say what a quiet M2 gets during the Demo now. I can only say it no longer grows. The per-frame `cssVar` reads (`spectrum.ts:120-277`, `timeline.ts:105-199`) and drawing hidden Viewers are unchanged from 1.8.1 (minor).
- **Types**, small: the double cast at `useMidi.ts:219` and `as never` at `useMidi.ts:97` remain.

## Would they…

- **Approve the pull request:** not quite. Request one change, two small fixes in the same place: the restart that a later restart was replacing must be stopped too, and `noteOff` must cancel Notes already handed over on several Voices. Each fix is a few lines plus an engine test. Everything else is comments.
- **Hire the author:** yes. Both requested fixes from the last review landed with the right fix, not a patch over the symptom. The new oscillator work shows the same command of Web Audio.
- **Recommend the code to a colleague learning Web Audio:** yes. Start with `synthEngine.ts`'s Voice, `envelope.ts` and `createRestartable`. Read `transport.ts` with the two findings above in mind.

## Since 1.8.1

- Fixed: the Timeline's cost per frame (O(history) → O(log history); measured flat). The blank page without storage (it starts; a start failure shows a Reload message). MIDI requested at load (now on demand). The render loop dying on a throw. Firefox's missing `cancelAndHoldAtTime` (fallback). No lint (Biome, hook dependencies as errors). `App.tsx` at 963 lines (684, plus hooks). The Patch's ref mirrors (a store, ADR-0013).
- Unchanged: `as unknown as MidiAccessLike`, `noUncheckedIndexedAccess` off, per-frame CSS variable reads, Viewers drawing while hidden, no `React.memo`, so a Patch change re-renders the tree.
- New: per-Note node creation (clean in Chromium), and the two take-over bugs above.

## Three findings, ranked

1. A key that takes over the Demo, or Hold going off, within the look-ahead plays two copies of each Oscillator until the Note the player had handed over was due. `createRestartable.restart` (`src/engine/synthEngine.ts:275`) stops only the current node, so the node a pending later restart was replacing plays on, and `restartLfo` (`:713`) does the same. Measured with the real engine offline: 0.272 peak against 0.225, then a click at the handed-over time; a bare sine doubles, peak 2.0 against 1.0. Fix: on a restart earlier than the pending one, `stop(t)` the previous node too.
2. Stopping the Demo, Song or Hold rhythm on a Patch with several Voices lets the Notes already handed over play in full. `noteOff` (`src/engine/synthEngine.ts:1006`) closes only Voices with `releasedAt === null`, and a handed-over Note has its future release recorded already, so neither `noteOff` in `startTransport`'s stop (`src/play/transport.ts:79-80`) reaches it. Measured offline: 4 Voices, peak 0.113 (a full Note) after the stop; 1 Voice, 0. Fix: also close Voices released after `t`, and extend the engine test at `synthEngine.browser.test.ts:554` to several Voices.
3. Each restarted Oscillator's `hz`/`cents` param connections are never removed: `onended` calls `old.disconnect()` (`src/engine/synthEngine.ts:283`), which cuts outputs only. Measured on the live site (CDP): 4,874 param connections made and 0 removed over 300 Notes and 90 s of Demo. Chromium still collects the nodes (397 alive, as built; heap 8–11 MB), but this relies on one engine's GC; WebKit and Firefox were not measured. Fix: `hz.disconnect(old.frequency)` and `cents.disconnect(old.detune)` in `onended`.
