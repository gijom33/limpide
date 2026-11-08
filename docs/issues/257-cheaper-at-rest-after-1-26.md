# 257: Cheaper at rest after 1.26

**What to build:** Findings of the full review round on 1.26.1 (the inbox, 2026-11-07; reviews [9](../reviews/2026-11-07/9-ts-react-webaudio.md) and [18](../reviews/2026-11-07/18-performance-expert.md)):

1. **At Init both flat LFO plots** (Depth 0) are recomputed and rewritten every frame, the only repaint on a page at rest: dropping the identical writes takes the GPU from 7.2 % to 0.5 % of a core (reviews 9 and 18).
2. **At 1 Voice the seven unused Voices still render,** four fifths of the audio thread's work: unwired, renderCapacity goes from 0.133 to 0.027 (reviews 9 and 18).
3. **The Scope and the Spectrum write their test hooks** (data-*) every frame from inside the draw, against the loop's read-then-write rule, and ship them to the site (review 9).
4. **The statistics' Demo figure** comes from one sample after the suite, 112 % of a core on 1.26.0 and 107.8 % on 1.26.2, where a quiet machine gives 84 to 90 %: a median of three runs after a cool-down, with the load recorded (review 18).

**Blocked by:** none

**Status:** done (2026-11-07). Built (2026-11-07) on night/2026-11-07 and merged into main on 2026-11-07, approved by the owner, untried: "Merge the night"; ships with the next release. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes" to the triage's eight v1 issues).

## Agent Brief

**Category:** bug
**Summary:** A page at rest still repaints two flat LFO plots, unused Voices still render, the Viewers write test hooks every frame, and the statistics' Demo figure is one noisy sample.

**Current behavior:** As the four items above say.

**Desired behavior:**
- An LFO plot whose drawing has not changed writes nothing that frame.
- Voices beyond the Voices setting take no audio-thread work (disconnected or stopped), and come back with no click and no delay when the setting rises.
- The Viewers' test hooks are written only when their value changes and outside the draw's reads, or only in test builds.
- The statistics measure the Demo's CPU as the median of three runs after a cool-down, and record the machine's load beside it.

**Key interfaces:**
- The LFO plots' frame
- The Voices and the Voices setting
- The Viewers' frame and their test hooks
- The statistics script

**Acceptance criteria:**
- [x] A test: at Init with nothing playing, no LFO plot is written over several frames
- [x] A test: at 1 Voice the other Voices are silent and not connected; raising the setting plays chords at once
- [x] The Viewers' tests still read their hooks
- [ ] ~~The statistics' Demo row says it is a median of three, with the load~~ (the script measures so from now on; the next release's statistics write the first such row)

**Out of scope:** the README's CPU words ([259](./259-words-that-hold-after-1-26.md)).

## How it was built

- **The LFO plots:** a plot writes its line, dot, beat marks and beat count only when they differ from what it last wrote. At Init both plots are flat at Depth 0 and still move with the clock (issue 182's decision holds), so they write nothing. At Depth 0 the LFO's swing is 0 without its clock being read. A spec watches both plots at Init over 30 frames: 240 writes before, 0 now.
- **The Voices:** only the Voices that may sound are wired to the master: those the Voices setting uses, the newest Note's (the Taps listen to it), and any still held or ringing out. A Voice ringing out beyond the setting is unwired once its Release has faded; the audio clock tells when, as it already does for a Mode's fade, and the two now share that timer. With the Amp Tap on every Voice (the app's default), the Tap listens only to the wired ones, so no analyser keeps an unused Voice rendered. A Voice set on is wired at once, silent, before any Note can take it.
  - **Measured** in Chromium through DevTools, silent: renderCapacity 0.025 at 1 Voice, 0.133 at 8, 0.027 back at 1 (load 6.5). Before, it read the same at 1 and at 8 (reviews 9 and 18).
  - **Engine tests:** they walk the audio graph from what the browser pulls (its output and its analysers). At 1 Voice none of the other seven Voices' sources is reached, and each Voice set on adds one Voice's sources. A chord plays the moment the setting rises from 1. A chord rings out as the setting falls. A released Voice beyond the setting is still rendered while it rings, and is unwired once its Release has faded.
- **The Viewers' test hooks:** the Scope's and the Spectrum's draws hand back their `data-*` hooks, and the frame's write phase writes only those that changed, as `data-db` already was. The draw no longer writes to the page, and a steady picture writes nothing. The hooks stay in the site, written only on a change. The Viewers' specs read them as before.
- **The statistics:** `npm run stats` waits 60 s once the suites and the build are done, then measures the Demo three times and keeps the median of each number. It records the machine's load average (the minute before the runs) in a new Load column of the Demo's table. The page says so, and that a row with no Load is one run. `docs/statistics.md` was written again from its rows, with no new measurement; 1.26.2's row is still one run. `--quick` was checked: one run, its load printed.
- **Calls open to the owner** (all Claude's call):
  1. **The newest Note's Voice stays wired** when the setting falls below it (8 to 1 while the last Note was on Voice 6). The Viewers keep showing its Oscillators, at the pitch they read, until the next Note, which plays on Voice 1 and lets Voice 6 go. Moving the Viewers to Voice 1 at once would show another pitch than the one the Scopes and the Spectrums lock to.
  2. **The hooks stay in the site,** written only on a change, rather than set only in the end-to-end build: the brief allowed either, and this keeps one build for the tests and the site.
  3. **Only the Demo is a median of three;** the idle page and the 8-Voice chord are still one run each. The cool-down, though, comes before all of the running app's states and the page loads, since they all follow the suites. That adds about 90 s to a release's `npm run stats`.
  4. **The cool-down is a fixed 60 s,** not "wait until the load falls below a level": the load is recorded beside the Demo's numbers, so a busy machine shows.
- **Seen, not changed:** All Sound Off silences only the Voices the setting uses, so a Voice beyond it that is still held or ringing out is not silenced. That was so before this issue, and the Voices' wiring leaves it as it was.
- **Tests run:** `npx tsc`, `npm run lint`; the unit suite (1,473 passed) and the engine suite (567 passed). In Chromium the Viewers', LFO, Voices, pause, Bead, Demo, design and geek specs passed (183); in WebKit 178 passed and 5 were skipped. After the review's fixes, the rest and Filter Mode specs passed in both browsers (20).
- **Reviewed** with the code-review skill (standards and spec). Its fixes:
  - a test for the unwiring after a Release, which the first tests never reached, checked to fail when the timer does nothing;
  - one audio-clock timer shared by the Mode fade and the Voices;
  - one measuring path for every state, the load read once;
  - the new spec finds the LFO plots by role and name.
- **To try:** open the page and leave it on Init with nothing playing. In Activity Monitor (or Chrome's task manager), the GPU process should sit near nothing. Set Voices to 1 and watch Chrome's CPU while silent, then set 8: it rises; set 1 again: it falls back. Play chords on 8 Voices, then switch to 1 while a long Release rings: the Release finishes without a cut, and the next Note plays on one Voice. Set Voices back to 4 and play a chord at once: every Note sounds, with no click. The Scopes and Spectrums should look and behave as before, the Freeze, Snapshot, Glow, Guides and Geek corners included.
