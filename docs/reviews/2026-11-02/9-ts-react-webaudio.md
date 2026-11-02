# Persona review 9: the TypeScript, React and Web Audio expert

Read: the code at `v1.21.1` (`src/` is unchanged from the tag to `1a27970`), `CODING_STANDARDS.md`, ADRs 0013–0014 and 0018–0019, issues 101, 112, 132 and 136, and `git diff --stat v1.16.0 v1.21.1 -- src` (516 commits, 194 files, +19,451 / −2,352). Measured on the live site at https://gijom33.github.io/limpide/ in headless Chromium at 1440 × 900 through Playwright: frame cost with Bead on and off, CDP `Performance.getMetrics`, React commits counted through the devtools hook, a stand-in MIDI keyboard sending aftertouch, and a stand-in MIDI clock. Also measured: the real engine bundled from `src/` and rendered in an `OfflineAudioContext`. 2026-11-02, version 1.21.1. The scripts are in the reviewer's work folder (`measure.cjs`, `clock.cjs`, `zipper.cjs`, `bench-entry.ts`). No tracked file was changed.

The machine was shared with other reviewers (load average 3 to 26 during the runs). Read the comparisons, not the absolute numbers.

## First impression

"`src/` has grown by about 17,000 lines since 1.16. Half of that is tests, and a good part is Bead. The engine now keeps a tempo and pulls a synced LFO onto the beat instead of restarting it, so there are two clocks to keep in step, the page's and the audio's. Aftertouch reaches the engine through the same path as a knob turn. `App.tsx` is 920 lines with 8 effects. Bead is 1,107 lines of component plus 2,240 of pure modules. I want to see where the MIDI stream lands: in the engine, in React, or both."

## What they tried, in order

1. **Checks.** `npx tsc`: clean in 2.3 s. `npm run lint`: 316 files, clean. `npx vitest run src/play/tempoStore.test.ts src/midi/clock.test.ts`: 22 tests green. I didn't run the whole suite because the machine was shared.
2. **Types, by grep** (157 non-test files, 21,635 lines). 0 `any`, 0 `@ts-ignore`. 19 `biome-ignore`s, each with a reason. Two double casts: the old `useMidi.ts:223` and a new one, `Mascot.tsx:915` (`fish.children as unknown as [SVGLineElement, …]`). The old `as never` is still at `useMidi.ts:102`. There are about 82 non-null assertions, 26 of them in `Mascot.tsx` (`ref.current!` in the loop). `noUncheckedIndexedAccess` is still off.
3. **Bundle** (live): JS 630 kB (204 kB gzip), CSS 70 kB (14 kB gzip). In 1.16.0 it was 469 / 149 kB and 55 / 11 kB. Still one chunk, with Bead in it.
4. **Last time's three findings.** All three are answered, in issue 101, with tests:
   - A restart earlier than a pending one now stops every node still running after it (`createTakeover`, `synthEngine.ts:331-341`). The LFOs share it.
   - `noteOff` closes Voices released after `t` (`:1419`), tested on several Voices (`synthEngine.browser.test.ts:636`).
   - An ended node is cut from `hz`/`cents` as well (`:392-397`).
5. **Read the tempo work.** `tempoStore.ts`, `clock.ts`, `lockToBeat`/`endPull` (`synthEngine.ts:994-1048`) and `setTempo` (`:1307-1317`).
   - The pull's span is rounded to whole samples (`:1036-1037`), so the oscillator and the model's clock change Rate on the same sample. ADR-0003 holds by construction.
6. **Stand-in MIDI clock** (24 ppqn from a 1 ms timer, so about 1 ms of jitter, 12 s each). The readout held "120 MIDI" at 120.0 and at 120.4 BPM, and "133 MIDI" at 133.3. Each run re-locked 9 times in 24 beats: the beats drift past `CLOCK_SLACK`, so each re-lock is a new pull plus a React commit. That's cheap and correct.
7. **Stand-in MIDI keyboard, aftertouch.** One Note held, then 1,250 channel-pressure messages at a 250/s cadence, Bead off:

   | | Wall time | React commits | Script | Style recalcs | Main thread busy |
   |---|---|---|---|---|---|
   | Note held, no pressure (5 s) | 5.0 s | 0 | 1.13 s | 301 | 48 % |
   | Pressure on Cutoff | 8.5 s | 1,063 | 4.02 s | 2,040 | 81 % |
   | Pressure on Resonance | 8.4 s | 1,063 | 4.09 s | 2,022 | 80 % |
   | Pressure on Volume | 10.2 s | 1,063 | 5.66 s | 2,443 | 87 % |

   - The page couldn't keep the 250/s cadence: the stream took 8.4–10.2 s to send.
   - The synchronous handler (control surface plus engine) costs 0.25 ms per message, 0.34 ms on Resonance. The rest, about 1 ms per message, is React: a commit for nearly every message.
8. **The same aftertouch in the real engine, offline.** A 0→1 ramp over 1 s as 100 messages of 7-bit values (a keyboard's rate), against 4,000 unquantised steps (near-smooth). The figure is the energy away from the Note's harmonics, as a share of the whole:

   | Destination | 100 steps | Near-smooth |
   |---|---|---|
   | Volume (sine, knob 0.4) | −51.8 dB | −80.2 dB |
   | Cutoff (saw, Resonance 0.7) | −32.4 dB | −76.1 dB |
   | Resonance (saw) | −48.1 dB | −76.7 dB |
   | Pitch, smoothed like the bend | −64.7 dB | −72.0 dB |

9. **Bead's cost** (live, 5 s idle and 8 s of the Demo, two runs each):

   | | Idle draw per frame (median) | Idle script per 5 s | Idle style recalcs per 5 s |
   |---|---|---|---|
   | Bead off | 3.8 / 5.2 ms | 1.20 / 1.59 s | 301 |
   | Bead on | 5.7 / 5.8 ms | 1.83 s | 600–604 |

   - With Bead on, there are about 300 `getBoundingClientRect` calls a second. They are cheap (3–4 ms in all over 5 s), but they force one extra style recalc a frame.
   - In the Demo the two are within noise: 7.3–7.4 ms median, and about 1 layout more a frame with Bead.
10. **Node bench of the new pure code.**
   - `describePatch`: 52 µs.
   - A `geekReadout`: 3 µs.
   - `qSwing` (4,097 Q points): 559 µs.
11. **Timers and listeners.** I checked every `setTimeout`, `setInterval`, `addEventListener` and observer in `src/ui` (Tooltip, TourCard, TutorialCard, useTourState, usePatchWords, LfoPlot's `ResizeObserver`, Bead's loop and its `pointermove`). Each is cleared in its effect's cleanup, or belongs to a store that lives as long as the page (`tempoStore`'s watch, `modulationRing.tsx:78-81`).

## What worked

- **Last review's three bugs are fixed at the root.** `createTakeover` (`synthEngine.ts:309-359`) is the right abstraction: Oscillators and LFOs now share one take-over rule, and each piece has an offline engine test.
- **The tempo store is a good module.** It has one interface (`get`/`subscribe`/`set`/`tap`/`take`/`giveBack`/`midiClock`), an injected clock for tests, and it is built once in the session (ADR-0014). The clock follower fits by least squares with hysteresis, and it held a whole BPM under 1 ms of jitter.
- **ADR-0019's pull** is real Web Audio craft. It keeps the phase, rounds the span to whole samples, and the model and the oscillators make the same two Rate changes.
- **Aftertouch is mirrored in the model.** `pressed()` (`modulationModel.ts:189`) feeds both the sound and `modulationAt`, with a pressure history for the Timeline. The engine tests compare measured audio with the model's prediction.
- **Bead's pure modules** (motion, place, cling, tricks, spray) are deep, deterministic with an injected `random`, and covered by about 1,600 lines of unit tests. The component uses `useEffectEvent` for its props instead of resubscribing.
- **React hygiene stays good.** `App.tsx` grew by 236 lines but has only 8 effects and 2 refs. Biome still enforces hook dependencies.

## Where they got stuck

- **The MIDI stream lands in React.** The Activity Monitor's line is state in `useMidi`, which lives in `App`, so every message with a new line re-renders the whole tree (finding 1). Pitch bend did this before 1.21. Aftertouch makes it continuous whenever a key is pressed.
- **Aftertouch is applied as a knob turn.** It is stepped, rescheduled on every Voice, and on Resonance it rebuilds a 4,097-point curve (finding 2).
- **Bead's 588-line effect.** I could read its pure parts in isolation. The decisions that join them (perch, visit, ride, cling) I could only follow by reading the closure (finding 3).
- **Output latency** isn't measurable in headless Chromium, so finding 4 is from reading the code.
- **Small items.** The new double cast at `Mascot.tsx:915`, non-null assertions up from a handful to about 82, and Bead (3,300 lines) loaded with the first paint. None is worth a line in the inbox on its own.

## Would they…

- **Approve the pull request:** with changes. Findings 1 and 2 are small and local: move the activity line out of `App`, and smooth the pressure on its one Destination. Everything else is comments.
- **Hire the author:** yes. The last review's bugs were fixed in a shared abstraction, not patched case by case. The tempo and the pull are careful work.
- **Recommend the code to a colleague learning Web Audio:** yes. Read `createTakeover`, `lockToBeat` and `tempoStore.ts`. Learn from the aftertouch path what not to do with a fast control stream.

## Since 1.16.0

- **Fixed:** the take-over double oscillators, handed-over Notes on several Voices, and the param connections never removed (issue 101).
- **Unchanged:** `as unknown as MidiAccessLike` (`useMidi.ts:223`), `as never` (`useMidi.ts:102`), `noUncheckedIndexedAccess` off, and no `React.memo`, so a state change in `App` re-renders the tree.
- **New:** the five findings below.

## Findings, ranked

1. Every MIDI message re-renders the whole page. `setActivity(describeMessage(m))` (`src/ui/hooks/useMidi.ts:236`) is state in `App`'s hook (`src/ui/App.tsx:264`), and aftertouch streams it. Measured live: 1,250 channel-pressure messages gave 1,063 React commits, 0.25 ms of engine work and about 1 ms of React per message, and the main thread was 81 % busy against 48 % with the Note held. Fix: keep the Activity line in a small store read only by the MIDI panel (`useSyncExternalStore` there), or update it once a frame.
2. Aftertouch steps its Destination and zippers. `setPressure` (`src/engine/synthEngine.ts:1368-1374`) runs `applyToSound` (`:1252`), which `setValueAtTime`s every param of all 8 Voices. Only Pitch is smoothed (`:1373`). On Resonance it also rebuilds the 4,097-point Q curve on each message (`:1262-1266`, 0.56 ms in Node). Measured offline with the real engine, 100 messages a second, as inharmonic energy: Cutoff at Resonance 0.7 −32 dB against −76 dB smooth; Volume −52 against −80; Resonance −48 against −77. Fix: move only the pressed Destination with `setTargetAtTime` (a few ms, as the bend), and keep the curve rebuild off the pressure path.
3. Bead's frame logic is one 588-line `useEffect` closure with 25 `let`s (`src/ui/Mascot.tsx:358-945`). The perch, visit, ride and cling decisions are reachable only through e2e tests. Its "every layout read first" (`:489-490`) holds only inside its own draw: the rings (`src/ui/modulationRing.tsx:130-150`), the LFO plots and the Pitch Marker write first in the same loop, so with Bead out the style recalcs double (301 → 600 in 5 s idle) and a frame's script goes from 3.8–5.2 ms to 5.8 ms. Fix: split it into read the page → a pure `decide(state, snapshot, now)` → draw, and give `renderLoop` a read phase before the writes.
4. A MIDI clock's beats and a Tap's land late by the output latency. The tempo store places them on `ctx.currentTime` (`src/play/tempoStore.ts:131` and `:104`), which is heard `baseLatency + outputLatency` later, so a synced LFO trails the clock's beats. That is about 10–40 ms on built-in output and much more over Bluetooth; it is not measurable headless. Fix: map the page's clock to the context's with `ctx.getOutputTimestamp()` and allow for `outputLatency`.
5. `src/ui/TempoControl.tsx:34-37` says that setting the tempo on every drag step "would restart a synced LFO's cycle at every pixel". Since ADR-0019 a tempo change pulls the LFO over two cycles instead of restarting it. The reason for setting it only on release is now the stacked pulls, not a restart. Fix the comment, as "Docs follow the behaviour" asks.
