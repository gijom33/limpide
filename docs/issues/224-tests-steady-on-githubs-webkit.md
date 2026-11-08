# 224: Tests steady on GitHub's WebKit

**What to build:** From the inbox (2026-11-02 and 2026-11-03): the 1.23.0 branch and deploy runs, and the 1.22.0 and 1.23.0 code reviews' notes on timing in the tests. Tests that pass on the Mac fail or time out on GitHub's Linux WebKit, which draws about 15 frames a second; two new ones skip WebKit there for now. Polish for v1 ([131](./131-v1.md)): a release should not wait on a re-run.

**Blocked by:** none; best after [218](./218-a-change-writes-only-what-it-changes.md), which may mend the first

**Status:** done (2026-11-04). Built (2026-11-03) on night/2026-11-03, merged into main, released in 1.24.0; accepted by the owner, tried in part and the rest trusted: "All issues waiting on my feedback look fine, I tested some, others trust you." GitHub's three branch runs come with the next push.

## Decisions

Claude's calls, let stand by the owner in 1.24.0 (2026-11-03, triage):

1. **Find the cause of each before changing a test,** on a machine as slow as GitHub's (a Linux WebKit in a container, or the Mac's WebKit with the page held as slow): a Note dropped or a Bead move missed may be the app's, not the test's.
2. **A test that times its steps does so inside the page,** in one evaluate, never in round trips with waits (CODING_STANDARDS, the 1.22.0 and 1.23.0 reviews).
3. **The two skips come out** once their tests hold on GitHub's WebKit, or stay with the cause written beside them.

## Agent Brief

**Category:** bug
**Summary:** Some browser tests fail only on GitHub's Linux WebKit, slowing releases and hiding what they test there.

**Current behavior:**
- 198's test of the Demo hidden for five seconds drops the same Note (3.581 s) on both tries there, handed over past its start, perhaps while a part's Preset loads; it skips WebKit.
- 211's 2 × 2 glide test saw no fall or flight from Bead during the Demo's scroll there; it skips WebKit.
- 190's Tutorial test "an end card's 'Next: …' starts the next Tutorial" timed out at 30 s on both tries in the 1.23.0 deploy run, having passed in its branch run.
- Two Bead ride tests sample the ride in ten round trips with waits; the mascot spec has other timing steps in round trips.
- 181's Demo check samples parts 1 to 3 only; the e2e text sampler's covers list lacks the Destination menu, the Tutorial menu, the tempo, MIDI, Learn and Quick Setup panels that the app's list has.

**Desired behavior:**
- Each of these passes on GitHub's WebKit on its first try, run after run, or its cause in the app is found and fixed.
- The timing steps run inside the page.
- The Demo check covers every part; the sampler's covers list matches the app's.

**Key interfaces:**
- The Demo's hand-over of Notes while hidden
- Bead's moves during a page scroll
- The Tutorial end card's Next
- The browser tests' sampling of Bead

**Acceptance criteria:**
- [x] The cause of each failure written in the issue
- [ ] ~~Three branch runs in a row green on GitHub with no WebKit retries for these tests (waits for the owner's push)~~ (not checked at the time)
- [x] The two WebKit skips removed, or kept with their cause written
- [x] No timing step in the mascot spec done in round trips with waits

**Out of scope:**
- Tests that fail on the Mac too (fix them where found)

## How it was built

The night of 2026-11-03, on `night/2026-11-03`. GitHub's slowness was stood in for by the Mac's WebKit with the page held slow (decision 1): a throwaway spec burned 33 to 154 ms of each frame, about 7 to 15 frames a second. It was deleted after.

**The causes.**
- **198's hidden Demo dropped a Note: the test's.** The test made the page say it was hidden and slowed its timers, but the page went on drawing, which a hidden page never does. On a slow WebKit a frame now and then held the page longer than the Demo's 0.15 s look-ahead. A Note handed over after its start is dropped by design. The dropped Notes (3.581 s, 2.644 s) were mid-part, not at a Preset's load. Reproduced: 1 run in 4 with frames up to 154 ms. 218 did not mend it.
- **211's 2 × 2 scroll saw no move: the test's and the app's.**
  - The test's: its 6 s watch began before its own press of Demo, a round trip earlier. On the slow page the scroll began 4.7 s into the watch, and Bead was still flying when the watch ended, so no move was counted (4 runs in 4).
  - The app's: Bead's motion goes at most 0.05 s a frame (`LONGEST_STEP`), so under 20 frames a second it moves slower than the clock. The Demo's scroll went by the clock. With the watch fixed, in 2 × 2 Bead landed about 0.7 s after the page stopped (3 runs in 6). The phone passed.
- **190's end-card test timed out: the test's.** It makes 14 Steps over two Tutorials. On the slow page each Step took about 2.3 s (1.4 s to be made, the rest Next), so the test ran past 30 s. No Step was stuck.
- **The Bead ride tests:** they read Bead 10 times, with 150 ms waits as round trips, which a loaded machine stretches.
- **Found on the way, the drop test's ("dropped on LFO 1's plot"): the test's.** Its second pick-up pressed 8 px above the bottom of Bead's box. While Bead rides, its board makes the box deeper, and the board takes no press. Once the board was out, that point was off Bead's own pixels and the press went through to the LFO plot underneath (3 runs in 3). Whether the test failed depended on whether the board was out before the press: 3 runs in about 15, and once beside the other tests.

**What was built.**
- **The Demo's scroll goes on Bead's clock.** It moves at most 0.05 s of its time a frame, as Bead does, so on a slow device both slow together. Test-first: `glide.browser.test.ts`.
- **The hidden Demo's test holds back the page's frames while hidden.** WebKit's skip came out. 8 runs in 8 passed at the speed that failed before.
- **The 2 × 2 and phone scroll test presses Demo inside the page and watches 8 s from there.** WebKit's skip came out. 8 runs in 8 passed slowed.
- **The end-card test is marked slow.** 4 runs in 4 passed slowed.
- **The mascot spec's timing steps run in the page.**
  - The ride tests read Bead along its line in one evaluate (`alongTheLine`).
  - The tickle's 12 moves, 40 ms apart, are dispatched in the page.
  - Bead switched off and on while it leaves is done in the page.
  - The run-off's clicks come with no wait between them.
  - A fixed 0.9 s wait before reading "hovering" became a wait for Bead to settle, counted in its own frames.
- **The drop test presses on Bead's own pixels,** found in the page. 20 runs in 20 passed in WebKit.
- **181's text check runs through every part of the Demo, 6 s each,** instead of parts 1 to 3 for 8 s.
- **What Bead never stands under or over is one list** (`mascotCovers.ts`), read by Bead and by the test's text sampler. The sampler had lacked six of the panels.

**The calls (Claude's call, let stand by the owner in 1.24.0).**
- On a device drawing fewer than 20 frames a second, the Demo's scroll lasts longer than 211's second and a half: about 1.9 s at 15 frames a second. The alternative was to leave the app alone and loosen the test. Faster devices see no change. A dated line in [211](./211-the-demo-scrolls-slower-so-bead-is-seen.md) says so.
- The Demo itself still drops a Note whenever a page in front stalls for more than about 0.11 to 0.15 s. That is its look-ahead, chosen so a Stop is heard at once. Out of this issue's scope; a hidden page draws nothing, so it holds there.
- 6 s a part, not 8, so the whole Demo check stays near two minutes per window size.
- The tickle test now times Bead's pointer handler in the page; the real mouse still reaches it in the click after.

**Tests.**
- `npx tsc`, the lint, and the unit tests of the touched files: glide, SectionStrip and the mascot modules, 176 passed.
- Playwright, after the review's fixes: mascot, background and tutorial, in Chromium and WebKit (the mascot spec whole in both, as its timing steps moved).
  - WebKit: 99 passed and 4 skipped.
  - Chromium: 102 passed, 1 failed, then mascot alone 49 of 49.
- The one failure was 211's 2 × 2 scroll test in Chromium, beside the others. That happened in 2 of 4 full runs, at loads of about 3 to 12. Alone and four at a time it passed 24 runs in 24, so it is counted a load flake and its limits stay. Its message was not kept. If GitHub shows it, the next look starts there.
- Earlier runs, before the fixes above, also failed once each beside the others and passed 3 runs in 3 alone, at a load of about 3: 179's tail test, and 142's phone tabs check.
- GitHub's three branch runs wait for the owner's push.

**To check.**
- After the push, three branch runs in a row with no WebKit retry for background's hidden Demo, 211's two scroll tests, 190's end-card tests and the ride tests.
- On a fast machine the Demo's scroll should look as before. To see the slow case, throttle the CPU in Chrome's DevTools (6×) and watch Bead land before the page stops in 2 × 2.

