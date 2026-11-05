# 232: 1.24.0 red on GitHub's Linux WebKit

**What to build:** 1.24.0's branch run (GitHub run 41978543786, `release/1.24.0` at `b376a5d`), the first run on GitHub of the night of 2026-11-03, went red, and its failed jobs went red again when re-run on the same commit. Locally, on the Mac, the whole suite is green in both browsers. The release is held: `main` is not pushed, the site stays on 1.23.0 ([25](./25-releases.md)). Polish for v1 ([131](./131-v1.md)): it blocks the release of the night's work.

**Blocked by:** none

**Status:** needs-triage · bug. Diagnosed in part on 2026-11-04 (below); the release waits on it.

## What is known

**Fixed already** (`927bc53`): the header test at 1100 px (a white key 39.6 px on Linux since the BPM keeps room for a tenth, issue 223: its floor is now 39) and Riser's C4 level (−21.33 dBFS on Linux's Chromium against the Mac's −21.5, its Noise seeded: half a dB allowed). Chromium's tickle test failed once and passed on the re-run: a flake.

**Not a slower page.** A probe (a throwaway spec run alone on GitHub, both versions, deleted since) measured the same thing on v1.23.0 and 1.24.0 in GitHub's Linux WebKit:

| Linux WebKit | v1.23.0 | 1.24.0 |
| --- | --- | --- |
| No frame after the load | 2.4 s | 2.4 s |
| Frames a second, Glow on | 8 to 20 | 12 to 25 |
| Frames a second, a Note held | 15 to 17 | 18 to 21 |
| Traces Glow keeps | 3 to 4 | 4 to 6 |

Chromium on the same machine draws at 60 in both. WebKit's AudioContext starts there in an "interrupted" state, running after the first key; the sound itself is heard (the Filter Tap at −11.9 dB, as in Chromium).

**Failing twice, in WebKit:** Glow's Scopes in silence (viewerControls, "Glow is Off at first") and the Spectrums under All; the engine's pause (enginePause, "paused, the Viewers rest": the context found "suspended" where "running" was awaited); the Demo on a phone (demo: the scroll within 1.5 s, 12 to 15 s; the page following the knob, 307 to 405 px off; a person's scroll and Page Down stopping the following); the section strip on a phone; Bead's acts three across (204) and its Demo scroll in 2 × 2 (211, whose WebKit skip 224 removed); a Tutorial Step in 2 × 2; the design audit's dark wide contrast. Tap Tempo (114 < 115) failed once.

## Hypotheses, ranked

1. **Glow fills one trace, then rests (214 at a slow frame rate).** A silent Viewer rests once the silence has lasted as long as Glow keeps a trace, 250 ms; at 8 frames a second that leaves one trace. In 1.23.0 nothing rested, so traces built up. *Prediction:* a rest that also waits for a few frames (or the test playing a Note) makes the Glow tests pass; the probe's own count with a Note held (4 to 6) says the drawing itself is fine.
2. **The resume after the pause refused on WebKit (216).** The context, "interrupted" at the start on GitHub's WebKit, stays "suspended" after the engine pauses; 216 stops pausing for good once a resume is refused. *Prediction:* logging the context's state and the resume's outcome in enginePause shows the refusal. **The one that may touch real people:** check Safari's own states (Apple's WebKit has "interrupted" too) before the release.
3. **The Demo's own scroll taken for the person's (227's one rule for who scrolled).** At a low frame rate the Demo's slow scroll may pass the rule's test for a scroll of the person's own, so the following stops. *Prediction:* the Demo tests on a phone pass when the Demo's own scroll is told apart by where it heads, not by its pace; on v1.23.0 the same tests passed on GitHub.
4. **Bead's 2 × 2 Demo scroll** (211): 224's steadying does not hold on GitHub; the skip may need to come back, with its inbox line.

## How to test them

GitHub's runs: a throwaway branch `release/probe-N` whose workflow runs only the specs in question (`--project=webkit`), about 4 minutes a round, deleted after; nothing deploys from `release/**`. Docker Desktop (Playwright's Linux image) would make the loop local, but it answered every request with an error on 2026-11-04.
