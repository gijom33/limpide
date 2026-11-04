# 224: Tests steady on GitHub's WebKit

**What to build:** From the inbox (2026-11-02 and 2026-11-03): the 1.23.0 branch and deploy runs, and the 1.22.0 and 1.23.0 code reviews' notes on timing in the tests. Tests that pass on the Mac fail or time out on GitHub's Linux WebKit, which draws about 15 frames a second; two new ones skip WebKit there for now. Polish for v1 ([131](./131-v1.md)): a release should not wait on a re-run.

**Blocked by:** none; best after [218](./218-a-change-writes-only-what-it-changes.md), which may mend the first

**Status:** ready-for-agent · bug. Polish for v1

## Decisions

Claude's calls, open to the owner (2026-11-03, triage):

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
- [ ] The cause of each failure written in the issue
- [ ] Three branch runs in a row green on GitHub with no WebKit retries for these tests
- [ ] The two WebKit skips removed, or kept with their cause written
- [ ] No timing step in the mascot spec done in round trips with waits

**Out of scope:**
- Tests that fail on the Mac too (fix them where found)
