# 263: The e2e tests wait on state

**What to build:** Half of review 8's last idea on 1.26.1 (the inbox, 2026-11-07; [report](../reviews/2026-11-07/8-oss-sceptic.md)): the e2e tests' fixed sleeps, up from 56 to 96 since 1.16.0, made waits on the state they stand in for. Fixed sleeps are where GitHub's slower machines have gone red before ([224](./224-tests-steady-on-githubs-webkit.md), [232](./232-1-24-0-red-on-githubs-linux-webkit.md), [240](./240-the-demo-54-px-off-on-a-slow-phone.md)).

**Blocked by:** none

**Status:** done (2026-11-07). Built (2026-11-07) on night/2026-11-07 and merged into main on 2026-11-07, approved by the owner, untried: "Merge the night"; ships with the next release. In v1 as polish of the tests ([131](./131-v1.md)): Claude's call, let stand by the owner in 1.26.2 (2026-11-07; the triage's questions did not name it). The other half, Bead behind one module, is dropped (the inbox).

## Agent Brief

**Category:** enhancement
**Summary:** Replace the e2e tests' fixed sleeps with waits on what each sleep is waiting for.

**Current behavior:** 96 fixed sleeps in the e2e specs, each a guess at how long something takes.

**Desired behavior:**
- Each sleep that waits for a state (a class, a value, an attribute, an animation's end, an audio event) waits on that state instead.
- A sleep that measures time itself (a hold, a timing claim) stays, with a comment saying so.
- No test slower in all, none flakier.

**Key interfaces:**
- The e2e specs and their shared helpers

**Acceptance criteria:**
- [x] The count of fixed sleeps falls, each one left commented with why
- [ ] ~~The whole Playwright suite green locally in both engines, and on GitHub's branch run~~ (green locally in both engines in the shift's suite (2026-11-07), four load flakes passing alone; GitHub's branch run comes with the next release)

**Out of scope:** the app's code.

## How it was built

Built at night, 2026-11-07, full tier. Counted as review 8 counted (`waitForTimeout` in `e2e/`): **99 fixed sleeps before, 63 after**, as the specs stood after the day's issues 252 to 261 and 265 to 267.

- **Two helpers** in `e2e/helpers.ts`. `steady(page, ...elements)` watches in the page, frame by frame, until the page's scroll and scroll size and the elements' boxes and scroll hold still for five frames running, with no short transition or animation inside them; it gives up after five seconds without failing, and the test's own checks then say what moved. `frames(page, n)` waits for the page to draw two frames (or `n`).
- **Waits on a layout or a scroll (14):** fitsScreen (2) and fourAcross (1) after a resize; dockedCards (5) after the Demo's card opens, unfolds or folds and for the scroll range; the Demo's card adding no scroll bar; the Tour's own-scroll test after the wheel; About's fling; the section strip's two scrolls (the second also checks first that the page did scroll up). The Demo card's fill is polled until it has grown, not read after 1.5 s.
- **Waits on what the sleep stood for (22):** a held control on a phone is held until its tip shows (touchTips, 4); the frozen frame drawn, two frames after `data-frozen` (viewerControls, 2); the Envelope Timeline's ink polled as the Note plays; the autosave polled in `localStorage`; Bead switched back on as it melts, watched frame by frame until the page draws the new Bead (`key={bead.comebacks}`), not for 3 s. Where the page handles an input as it comes and draws it in the next frame (a key, a MIDI message, a finger lifted, a pointing at a source, a focus with tips off), the check that nothing changed comes two frames after instead of 100 to 200 ms: keyboardAccess (2), midiLearn (2), c16Learn (1), piano (1), modulationRing (5, two of them inside the polls for the rings at rest), displayPanel (2). One sleep inside the page went too: the Timeline's strokes are gathered over ten frames, not 300 ms.
- **The 63 left are times, each commented "a time: …" or with its reason on the line above:** a check that nothing comes within a while (no tip, no stop, no Bead, no LIMITING, no Pickup, no second hint, no pause; most of mascot's 15, demo's 5, tutorial's 4); a while on the app's own clock (a Release, Learn's 500 ms settle, the Hold rhythm's two seconds, the words' interval, a second of the LFO plot); reads spread over a while (a wobble, a stroll, the frames of two seconds). Three are close to a state but have none to wait on: Bead's two waits before it is read settled (it may set off or stay, so nothing says it has seen the change) and the Tour's "the synth turning its controls" (the step's turn has no end to watch). Song's 500 ms for the old octave's Note to end stays too: a Note handed ahead before the change can still light the old octave after a poll found none.
- **The sleeps timed inside the page** (a tap rhythm's gaps, the Song hidden for a second, the samplers' 25 to 150 ms steps) are not `waitForTimeout` and stay: they are the timing CODING_STANDARDS asks to run inside the page.
- **Tests:** `npx tsc`, `npm run lint`, and the 24 changed specs in Chromium (twice) and WebKit. Timed back to back against the specs as they were, at the same load, the 16 specs whose waits changed took 334 s before and 329 s after in Chromium (the mean of two runs each); the biggest gains are About's drags (8.9 s to 6.3 s) and the section strip (3.1 s to 1.9 s); Bead's comeback test 7.2 s to about 6 s. Four tests this issue did not change failed once beside other work, at loads up to 180, and passed alone: in Chromium background's Demo hidden for five seconds (a Note 1 ms off), mascot's suitcase and its Waveform tail; in WebKit Bead landing on the Amp three across. One failure was this issue's: the section strip's header looked up as a `banner`, which it is not on a phone, set back to its tag.

**Claude's calls, open to the owner:**

1. The count is of `waitForTimeout`, as review 8 counted; a sleep inside one `evaluate` is timing in the page, not a fixed wait between round trips, and is not counted.
2. A check that nothing happens is a time claim, and keeps its sleep, unless the page handles the input as it comes: then two frames are what the old 100 to 200 ms stood for, and a change, were it to come, is drawn by then. Were one of those inputs ever handled later (a timer, a worker), its check would pass without testing anything rather than fail.
3. `steady()` gives up after five seconds without failing, so a page that never settles makes a test slower, not red, and its own checks still judge the layout. None of its waits took longer than 0.7 s tonight.

**Try:** nothing on screen changed. GitHub's branch run at the next push is the test that matters: the whole suite on its slower Linux WebKit, first try. `grep -rn waitForTimeout e2e` lists the 63 left, each with its reason.

