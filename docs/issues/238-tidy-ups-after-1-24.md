# 238: Tidy-ups after 1.24

**What to build:** What the 1.24.0 code review (standards and spec, since v1.23.0) and its word checks left, none holding the release (inbox, 2026-11-04). Polish for v1 ([131](./131-v1.md)).

**Blocked by:** [228](./228-tidy-ups-after-1-23.md) (the same code; build after it is merged; Claude's call, open to the owner)

**Status:** ready-for-human · enhancement. Built (2026-11-05) on night/2026-11-05, for the owner to try

## What is left, and what to do

From the code review:

1. **218's bare flags** (`apply(start.patch, true)` and the like) where the engine takes `{ whole }`: named options at every call.
2. **218's four memos in the engine** ("remember a key, skip if unchanged"), `follows`/`following` for the LFOs' last Rate and Waveform, and `ALL_FM`: one small memo shape for the four, and names that say what they hold.
3. **"Silent" asked twice with two thresholds** (213, 214): one definition of a silent Viewer, used by both.
4. **216's hand-kept list of the engine's methods that wake it** (all nine there today): a test that fails when a method that makes sound does not wake the engine, or the wake moved to where every such method passes.
5. **227's `SOUND_KEYS` alias and its "step around 0" test** reading "within 15 of the top": the alias gone, the test named for what it checks.
6. **223's Switches listed in the MIDI code:** beside the choices they belong to, so a new Switch cannot be missed.
7. **Two boxes overstating:** 224's "no timing step … in round trips with waits" (four fixed waits are left in the mascot spec) and 214's "Viewer tests pass unchanged" (one was edited): the four waits made waits for what they read, and 214's box worded as it was.
8. **216's first Note after the pause** is on time on the audio clock only (1.5 ms late in Chromium, 7 to 17 ms in WebKit), and a Controller's Note has no early wake: the engine wakes on any MIDI message, not only on a Note it plays (Claude's call, open to the owner).
9. **A paused Viewer rests without comparing the Harmonics and Ideal settings** (214, 216): turning either redraws a resting Viewer.
10. **217's test renders the hook, not the app:** a test through the app that a MIDI message redraws only the MIDI panel.
11. **221's Demo with Bead off,** 6.79 to 7.77 style recalculations a frame, untraced: traced once, the cause written here, fixed if it is ours.

From the word checks:

12. **Riser's description, "from 200 Hz past 5 kHz",** true near C4 only since its Key Track is 0.5 (C2 to 2.69 kHz, C6 to 10.8 kHz): say where it holds ("on C4").
13. **The shipped issues' Status lines keep "merged into main, not yet released"** after their release, 1.23.0's and 1.24.0's too: [the release steps](../releasing.md) gain a step that brings them up to date, and the stale ones are.

Dropped: 227's commit changing the knob's mode test before ADR-0021 came (already committed, nothing to build). Done at once: 204's and 212's boxes ticked.

## Agent Brief

**Category:** enhancement
**Summary:** Thirteen small tidy-ups from 1.24.0's code review and word checks: clearer names and options in the engine, one definition of silence, the engine's wake made hard to miss, a few tests made to test what they say, and two docs brought up to date.

**Current behavior:** As listed above, item by item.

**Desired behavior:** Each numbered item done as its line says, each its own commit; every test still green; no change heard or seen except items 8 and 9 (a Controller's first Note after the pause on time; a resting Viewer redrawn when Harmonics or Ideal is turned).

**Out of scope:** the engine's design beyond these lines; the sounds the ear check found (issue 239).

## How it was built

Built at night (2026-11-05) on night/2026-11-05, on top of 228, 241 and 242, test-first where there was behaviour (items 3, 4, 8, 9 and 10). Each item, its own commit:

1. **The bare flags:** mended. The Patch store hands the engine `{ whole }`; a Voice's apply and the sound's take `{ whole }`, the LFOs' follow `{ withWaveform }`, a takeover's restart `{ again }`.
2. **The four memos:** mended. One `createMemo` says whether a new key changes what one thing was last worked out from, and keeps it: FM's three gains (`fmGainsFrom`), the Resonance's curve (`curveFrom`), the Response Curve's twins (`twinStagesFrom`), aftertouch's pitch (`pressingCents`). A whole Patch forgets them, as before. `follows`/`following` are `lfoSetTo`/`lfoAlreadyAt`; `ALL_FM` is `EVERY_FM_GAIN`. The per-AudioParam record of writes keeps its own shape: it also compares times.
3. **"Silent" asked twice:** mended. `silent` in the level module (every sample under a millionth of full scale) is what the Viewers rest on and what Cycle Lock skips its search on. The lock's own 1e-6/√2 is gone, so a Tap between the two (a trace a millionth of the Scope's height) is no longer locked; 213 has a dated line.
4. **The hand-kept wake list:** mended with a test. A browser test calls every member of a real engine (one left out does not compile) and checks that those scheduling anything in the sound are exactly `WAKES`, the list the pause wraps; checked to fail with one taken out. What it cannot see: a method changing the sound only by setting a value, a curve or a connection (the engine does so only for what is never heard).
5. **`SOUND_KEYS` and "step around 0":** mended. The Demo's stop rule has one `CONTROL_KEYS`; the Encoder Mode's test near the ends is `offTheBottom` (1 to 15) and `offTheTop` (113 to 126).
6. **The Switches in the MIDI code:** mended. `SWITCHES` sits under the Patch's `CHOICES`, and the Switch control's Learn target takes only one of them, so a new Switch not listed fails to compile.
7. **The two boxes:** mended. The mascot spec's last fixed waits wait for what they read: the two scroll waits count Bead's own time, frame by frame, and the tricks test waits for each trick to play out. 214's box says one Viewer test was edited. Kept: the waits for something not to happen (Bead not coming, 0.5 to 4 s), which nothing can be waited for; the 2 s of a measured frame window; the 0.5 s between Bead's footing reads, each read waiting for it to stand; and "on again" (3 s), whose moment of being gone is too brief to wait for.
8. **A Controller's early wake:** built. Every message from a Controller wakes the sound, as the page's keys and pointer do, through a `wake` the pause hands back and the session offers. A Note-on that is the first message after the pause wakes in the same event as before, so it is as late as before (1.5 ms in Chromium, 7 to 17 ms in WebKit, not measured again); a mod wheel, aftertouch or knob ahead of it now wakes the sound early. A MIDI clock and active sensing do not wake it.
9. **A paused Viewer and Harmonics or Ideal:** mended. A paused Spectrum rests on a picture of sound, its Markers and Ideal marks drawn; its rest now compares Harmonics, Ideal and the Synth Geek Layer, so turning one draws it again. Tested through the app (`enginePause`), turned with no gesture that would wake the sound.
10. **217 through the app:** a test in `midiLearn`. A stand-in for React's developer-tool hook notes every component each commit renders; 50 aftertouch messages render the Activity line and nothing else. Checked to fail when the hook sets the page's state on each message. It reads React's internal fiber numbers, named in the test: a React upgrade may need them looked at.
11. **The Demo with Bead off, traced:** kept. A Chromium trace of 3 s of the Demo (the built site unminified, 1440 × 900 at 2×, load about 2) counts 2.35 style recalculations a frame by the trace's own count, the same with Bead out and off. One a frame is forced by the frame's first read: a canvas Viewer's size and colours (`canvasInputs`) find the page changed by React and the Demo's knobs between frames. The writes after the reads (the LFO plots, the rings) then need styles worked out again before paint. Before 221, with Bead off, the plots wrote before the Timeline read, so that read covered both and nothing needed it again; with Bead out, Bead's writes came after, which is why only Bead off gained one. It is ours, the price of 221's reads before writes, and costs about 0.17 ms a frame at 4× throttling (0.09 ms for the one before paint). Mending it would mean no frame read forcing styles at all: the canvases' sizes from a ResizeObserver and their colours read on a theme change, a change to every Viewer for about 1 % of a slow frame. Not done.
12. **Riser's words:** mended: "from 200 Hz past 5 kHz on C4", the test's name with it.
13. **The Status lines:** mended. The release steps' version step brings each shipped issue's "merged into main, not yet released" to "released in X.Y.Z"; the 45 stale lines are, each with the first tag that carries it (128 in 1.18.0, the rest in 1.23.0, 1.24.0 and 1.25.0, checked against the release log).

Claude's calls, open to the owner:

1. **Item 3's one silence is the Viewers' millionth,** not Cycle Lock's 1e-6/√2: the other way, a Tap at 0.8 of a millionth would stop resting. Nothing seen changes either way.
2. **Item 8 wakes on any message from a Controller,** clock and active sensing aside, which the parser hands elsewhere or drops.
3. **Item 9 compares the Geek Layer too:** it draws on a paused Spectrum's readout the same way.
4. **Item 11 is kept, not mended:** the cost is small, the mend a reshaping of every Viewer's reads.
5. **Item 13's step sits inside the version step (4),** not as a new numbered step: the Status lines then say "released" in the commit that ships, and the old step numbers other issues quote stay right.

**Tests run:** `npx tsc` and `npm run lint` clean; Vitest on every file the change touches, by its imports (61 files, 1466 tests, the engine's browser tests among them), green. Playwright over the touched UI (mascot, enginePause, midiLearn, midiKeyboard, quickSetup, viewersRest, viewerControls, overlays, geek, lfo, voices, demo, patches, pitchMarker, oscillator): Chromium 222 passed; WebKit 217 passed, 5 skipped as before. No failures, so no load flakes to report (load about 2 to 4). The code review (standards and spec) found no bug; its notes are mended (`b40c810`) or are the calls above.

**To try in the app:** nothing should look or sound different, but for two things. With a Controller plugged in, leave the page silent for 30 s, then move the mod wheel or a knob before playing: the first Note should be on time. Item 9 has nothing to try by hand: a key or a pointer turning Harmonics or Ideal wakes the sound first, which redraws the Spectrums anyway. Otherwise play the Demo, aftertouch and Presets as usual; Riser's description reads "on C4"; LFO Sync, Retrigger and Legato still learn as buttons in MIDI Learn.
