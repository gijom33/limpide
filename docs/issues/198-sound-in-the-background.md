# 198: The players keep time when the page is in the background

**What to build:** The owner's bug (inbox, 2026-11-02): "When webpage loses focus, the sound is not fully processed and some of it is skipped. Can we force this not to happen?" A bug of v1's polish ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-human · bug. Built (2026-11-02) on night/2026-11-02, for the owner to try

## Decisions

Decided by the owner, 2026-11-02:

1. **Sound is not skipped** when the page loses focus or goes to the background ("Can we force this not to happen?").
2. **Heard with the Demo or the Song playing** (the owner, asked what was playing: "Demo or Song"), which fits the cause below: both are players on the Transport.

Claude's calls, open to the owner:

3. **The likely cause, to confirm first:** the players (the Demo, the Song, Hold's rhythm) hand their Notes to the engine from the page's main thread, 100 to 150 ms ahead of the audio clock, on a timer every few tens of milliseconds. A browser slows a background page's timers to about once a second (Safari also an unfocused or covered window), so Notes come late, bunched, or are lost. The sound itself runs on the audio thread and is not slowed; Notes played by hand or from MIDI should not be touched, which the reproduction checks.
4. **The fix keeps the look-ahead short in front:** the players' tick comes from a clock the browser does not slow (a timer in a worker, or the audio thread's own), and while the page is hidden the look-ahead widens (to about 2 s) so a slowed tick still finds its Notes handed over. In front again, it narrows, so a Stop or a change of Preset is still heard at once.
5. **What can't be forced:** a browser may still suspend a page it freezes (a phone's locked screen, an old background tab). That is the browser's, not Limpide's; the page then resumes cleanly, with no burst of late Notes.

## Agent Brief

**Category:** bug
**Summary:** With the page unfocused or in the background, the players' Notes are skipped or late, though the sound keeps running.

**Current behavior:** The owner (2026-11-02): when the page loses focus while the Demo or the Song plays, part of the sound is skipped. The players schedule their Notes from the page's main thread a short look-ahead ahead, on a timer that browsers slow in the background, so Notes due between two slowed ticks may come late or be lost.

**Desired behavior:**
- First, reproduce: the Demo, the Song and Hold's rhythm, in Chromium and WebKit, with the page hidden (another tab) and unfocused (another window in front), recording which Notes start and when on the audio clock. Notes played by hand or by MIDI too. Record what is found in this issue.
- The players keep time in the background: every Note starts on its beat, none lost, none bunched. A Note already past its start when it is handed over is dropped, not played late in a burst.
- In front, the look-ahead stays as short as now, so Stop, Freeze, a Preset change and a tempo change are heard as quickly as now.
- Coming back in front plays on smoothly.

**Key interfaces:**
- The Transport (its tick and look-ahead) and the players built on it: the Demo, the Song, Hold's rhythm
- The page's visibility and focus
- The audio clock

**Acceptance criteria:**
- [ ] The reproduction recorded in this issue, per browser and per player, with and without the fix
- [ ] A unit test: with ticks slowed to once a second, every Note of a phrase is handed over before its start, none twice, none after it
- [ ] A unit test: a Note whose start has passed is dropped, not played late
- [ ] An e2e test in both browsers: the Demo with the page hidden for 5 seconds starts every Note of those seconds on time (as the engine records them)
- [ ] Stop, a Preset change and a tempo change in front are as quick as before; every test passes in Linux's fonts too

**Out of scope:**
- A page the browser freezes or suspends (decision 5)
- The Viewers, which need not draw while hidden

## The reproduction

A headless browser never slows a page it runs: its pages stay visible, even behind another tab, and their timers keep time (126 ticks of 20 ms in 3 s, hidden by another tab or not, in both browsers). So the reproduction does what a browser does to a page in the background: the page says it is hidden (or not: unfocused), and its own timers fire only on the next whole second. Each player ran 5 s so, then 1.5 s in front again; the tests' build writes down every Note the engine is asked to start, with when it was handed over, on the audio clock. "Late" is a Note handed over after its start, which the engine then plays at once.

| Browser | Player | Page | Without the fix: Notes late of those started (worst) | With the fix |
| --- | --- | --- | --- | --- |
| Chromium | Demo | hidden | 8 of 10 (0.78 s) | 0 late |
| Chromium | Demo | unfocused | 8 of 9 (0.77 s) | 0 late |
| Chromium | Song | hidden | 14 of 17 (0.79 s) | 0 late |
| Chromium | Song | unfocused | 13 of 19 (0.73 s) | 0 late |
| Chromium | Hold's rhythm | hidden | 10 of 12 (0.74 s) | 0 late |
| Chromium | Hold's rhythm | unfocused | 10 of 12 (0.73 s) | 0 late |
| WebKit | Demo | hidden | 8 of 10 (0.71 s) | 0 late |
| WebKit | Demo | unfocused | 8 of 10 (0.72 s) | 0 late |
| WebKit | Song | hidden | 15 of 18 (0.83 s) | 0 late |
| WebKit | Song | unfocused | 14 of 18 (0.84 s) | 0 late |
| WebKit | Hold's rhythm | hidden | 10 of 12 (0.76 s) | 0 late |
| WebKit | Hold's rhythm | unfocused | 10 of 12 (0.75 s) | 0 late |

Without the fix, the late Notes came in bursts on each slowed tick, and the first second back in front still had 1 to 3 late. With it, none late in either browser, hidden or not, nor back in front: unfocused, the Notes were handed over no further ahead than in front (0.15 s; Hold 0.1 s), so the worker's ticks alone keep time. (Measured with the Demo and Hold's rhythm still widening to 2 s while hidden; the review then kept their short look-ahead, which the unfocused rows measure.) Notes played by hand, the page hidden and its timers slowed: each started the moment it was played, in both browsers; they never wait on a timer, nor do a MIDI keyboard's.

## How it was built

- **The players' ticks** come from timers in a worker (`src/play/workerTimers.ts`), which a browser does not slow in the background; where a worker cannot be made or fails to start, the page's own timers, as before. The Transport (`src/play/transport.ts`) takes them by default.
- **A Note past its start** when handed over is dropped, its key not lit, rather than played late in a burst (a page the browser froze resumes cleanly, decision 5).
- **The look-ahead in front** is as short as before (0.15 s; Hold's rhythm 0.1 s), so Stop, Freeze, a Preset change and a tempo change are heard as quickly as before.
- **The tests' build** writes down every Note the engine is asked to start (`src/app/notesInTests.ts`, like `silentInTests`, absent from the published site), for the e2e test.
- **Tests:** in `transport.test.ts`, ticks slowed to once a second with the page hidden hand every Note over before its start, once; a Note past its start is dropped; back in front the look-ahead narrows. `player.test.ts` and `song.test.ts` pin which players widen. `e2e/background.spec.ts`, in Chromium and WebKit: the Demo with the page hidden and its timers slowed for 5 s starts every Note of the track due in those seconds, on its beat, none handed over late.

Claude's calls, open to the owner:

6. **Only the Song and Listen widen** their look-ahead to 2 s while the page is hidden, the hedge of decision 4, in case a browser slows even a worker. The Demo and Hold's rhythm keep their short one and rely on the worker's ticks: the Demo turns its knobs at once and a Note takes its Envelopes and Glide when handed over, so Notes handed 2 s ahead would miss the moves before them (its Decay and Glide moves heard late, or its Cutoff moves early); Hold's rhythm follows the Notes held, which a MIDI keyboard may change while the page is hidden, and would play 2 s of the old ones. Should a browser slow the worker too, those two would drop Notes in the background rather than play them late.
7. **The reproduction is simulated** (above): a real background tab could not be had headless, and the night opens no browser window. Whether a real Safari slows a worker's timers in the background is not measured.

What to try: play the Demo, then the Song, then a Hold rhythm, and each time switch to another tab or another window for half a minute, in Chrome and in Safari: nothing should be skipped or bunched, and coming back plays on smoothly. Then, in front, Stop and change Preset while each plays: as quick as before.

