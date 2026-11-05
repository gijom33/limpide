# 216: The sound engine pauses in a long silence

**What to build:** Part (d) of [182](./182-a-page-at-rest.md), split by the owner on 2026-11-03: review 18's finding on 1.21.1 ([report](../reviews/2026-11-02/18-performance-expert.md)) that the browser's audio engine runs on through any silence. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** [214](./214-the-silent-viewers-rest.md), whose measurements show what is left to save

**Status:** done (2026-11-04). Built (2026-11-03) on night/2026-11-03, merged into main, not yet released; accepted by the owner, tried in part and the rest trusted: "All issues waiting on my feedback look fine, I tested some, others trust you."

## Decisions

From 182:

1. **Measured before and after,** kept only if it shows (Claude's call, open to the owner).
2. **The LFO plots and the modulation rings keep moving with nothing playing,** decided by the owner ("Keep it moving", 2026-11-03). They follow the sound's clock today, which stops while the engine is paused, so while it is, they move on a clock of their own and pick the sound's clock up again without a jump, as Bead's motion already does.

Claude's calls, open to the owner (2026-11-03):

3. **Never in the way of a Note.** The first Note after the pause sounds on time and without a click, from the computer keys, the piano, a Controller and the Demo; where a browser will not resume without a tap (an iPhone's Safari), it is not paused at all.
4. **The page's own pause is not the browser's.** The invitation to tap for sound, and the return to the page after another app ([the iPhone fix](../inbox.md)), stay for when the browser stops the sound, never for this pause.
5. **Built last of the four,** and dropped (written here with the figures) if 213 to 215 already leave the page near rest.

## Agent Brief

**Category:** enhancement
**Summary:** With nothing playing for a while, the audio engine still runs, costing power for silence.

**Current behavior:** Once started, the audio engine runs until the page closes, through any silence.

**Desired behavior:**
- After a long silence (no Voice sounding, nothing playing, no Hold, no Controller's clock followed), the audio engine pauses.
- The next Note, from anywhere, resumes it in time to sound on time and without a click.
- The LFO plots, the rings and Bead go on moving through the pause, without a jump when it ends.
- The page's pause never shows the invitation to tap for sound and is never taken for the browser stopping the sound.
- Not paused where the browser needs a tap to resume.

**Key interfaces:**
- The audio engine's pause and resume
- The sound's clock, as the LFO plots and Bead read it
- How the page tells the browser's stop from its own

**Acceptance criteria:**
- [x] Idle cost measured before and after on a laptop, the figures in the issue
- [x] An engine test: the first Note after the pause starts on time, with no click
- [x] Browser tests: a key, a piano click and the Demo after the pause all sound; the LFO plot moves through it; the invitation does not appear
- [x] The tests of the browser stopping the sound pass unchanged

**Out of scope:**
- Bead's cost ([184](./184-beads-frame-in-parts.md))

## How it was built

Not dropped under decision 5: 213 to 215 leave a page never clicked near rest, but once the sound has started (any first click or key) the Oscillators run on under a closed Amp, and idle then costs what it did before them (figures below).

- **The pause.** Once no Voice has sounded for 30 seconds, with nothing playing by itself (the Demo, the Song, the Tour, a Tutorial) and no Controller's clock followed, the page suspends its AudioContext. The engine says from when no Voice sounds: never while a key is held or a Note is handed over ahead, else once the last Release has faded. The page looks once a second.
- **The wake.** Anything that changes what the engine plays wakes it first and resumes the sound at once: a Note from the computer keys, the piano, a Controller or a player, a knob, the tempo, a bend. A key, a press or a pointer moving on the page wakes it ahead of the Note it may bring. The Note is scheduled at the moment the sound stopped, so it plays from its very first sample once the browser has resumed. Then the 30 seconds start again.
- **What goes on moving.** While paused, the LFO plots, the modulation rings, the Pitch marker, the Response Curve and Bead's ride on an LFO are drawn at a clock carried on by the page's. On waking, the engine carries its LFOs and the beat on by the time paused, in the sound and the model alike (ADR-0003): each LFO's phase now is the one shown at the end of the pause, and its oscillator starts again there. So nothing drawn jumps and the sound matches the plot.
- **The Viewers.** A paused Tap holds its last picture, so its Scope and Spectrum rest on it, as 214's silent ones do.
- **The page's pause is not the browser's.** The invitation to tap never shows for it, and a return to the page leaves it paused. On an iPhone or iPad it never pauses (decision 3). If a browser refuses to resume without a tap after all, the page stops pausing for the rest of the visit, and the invitation shows as for any stop by the browser.
- Tests: `enginePause.browser.test.ts` (from when nothing sounds; the clock shown runs on and is picked up without a jump; the first Note after a pause starts on the same sample as without one, opens no more steeply, and its tremolo follows the carried LFO sample by sample; a synced LFO stays on the carried beat). `pauseInSilence.test.ts` (when it pauses and when not, what wakes it, a refused resume). `unlockAudio.test.ts` (the page's own pause counts as running; which browsers need a tap). `e2e/enginePause.spec.ts`, with the wait shortened to a second: the Viewers rest and no invitation shows; a key, a piano press and the Demo all sound after the pause; an LFO plot moves through it. The specs of the browser stopping the sound pass unchanged.

Claude's calls, open to the owner:

1. **30 seconds of silence.** That is long enough that playing with pauses to think never meets it, and longer than the Timeline's longest window, so nothing on it moves when the LFOs are carried on.
2. **Resuming costs the first Note a moment.** The Note plays from its start, but only once the browser has resumed. In the tests that took about 1.5 ms in Chromium and 7 to 17 ms in WebKit. A real laptop's output may take longer, and so may Firefox. A pointer moving or a key going down wakes it a little ahead, so a mouse user rarely meets it. Try it on the laptop: a first Note after a minute's rest that feels late would argue for a longer wait.
3. **A moving pointer wakes it,** for that head start: the sound pauses only while the page is left alone.
4. **The paused Viewers hold their last picture,** the steady Oscillators included (the Noise stops moving), rather than showing silence.
5. **The Envelope Timeline stays on the sound's clock:** it stands still through the pause. With an LFO line on it, that line's last seconds are redrawn once on waking, as the LFO was carried on. The plots, the rings and the Curve move through the pause as decision 2 asks.
6. **The LFOs are carried on, not stopped and restarted:** this keeps the plots continuous and the sound matching them.

Measured on 2026-11-04 by review 18's method, with a throwaway spec, not kept: headless Chromium, 1440 × 900 at 2× pixels, Bead off, a fresh page, two clicks on Display to start the sound, 2 s to settle, 10 s measured, the mean of two runs (they agreed within 1 point). The machine was an Apple M2 at a load of 2 to 3. "Paused" sets the wait to a second, and the run waits for the pause. "LFO on" turns LFO 1's Depth to 50 % on its Cutoff.

| State | Main thread busy, 1× | Render loop, 1× | Renderer CPU, 1× | GPU process, 1× | Main thread busy, 4× (fps) |
| --- | --- | --- | --- | --- | --- |
| Idle, sound running | 33.3 % | 11.9 % | 46.5 % | 10.3 % | 97.1 % (59.9 fps) |
| Idle, paused | 16.8 % | 8.8 % | 21.7 % | 2.2 % | 22.6 % (60 fps) |
| LFO on, running | 40.4 % | 18.6 % | 60.4 % | 18.1 % | 99.8 % (42.7 fps) |
| LFO on, paused | 31.1 % | 17.5 % | 42.1 % | 18.1 % | 84.8 % (60 fps) |

The audio thread rendered about a tenth of each of its callbacks running (review 18), none paused. Idle paused costs what a page never clicked does (16.0 % busy, 20.2 % renderer CPU in the same runs). With an LFO on, the plots, the Curve and the Timeline still draw the LFO's sweep through the pause.

Suspending alone, without the Viewers resting, made idle dearer: 53 to 56 % busy, the browser updating the canvases' layers more. That is why the paused Taps rest.

Tests run: `npx tsc`, `npm run lint`, the unit tests of `src/app` and `lfo.test.ts`, and every engine test. The Playwright specs were `audioStart`, `robustStart`, `background`, `piano`, `demo`, `lfo`, `mascot`, `enginePause`, `viewersRest`, `modulationRing` and `pitchMarker`, in Chromium (165 passed) and WebKit (157 passed, 8 skipped as before). After the review's fix, `enginePause`, `audioStart` and `robustStart` were run again in both.

What to try in the app, on the laptop:

- Play a Note, then leave the page alone for a minute. The Oscillator Viewers should freeze on their picture, and an LFO's plot and its rings should go on moving. Activity Monitor should show the browser's energy use drop.
- Then play a key without touching the mouse. It should sound at once and not feel late. Try a piano click and the Demo too, and a Controller if one is to hand.
- With an LFO on Volume or Cutoff, check the plot carries straight on as the first Note comes in.
- Play the Demo and leave it running: it never pauses.
