# 215: The Envelope Timeline draws only its new columns

**What to build:** Part (c) of [182](./182-a-page-at-rest.md), split by the owner on 2026-11-03: review 18's finding on 1.21.1 ([report](../reviews/2026-11-02/18-performance-expert.md)) that the Envelope Timeline works out the whole modulation for every pixel column each frame, 1.3 to 2.2 ms. Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-human · enhancement. Built (2026-11-03) on night/2026-11-03, for the owner to try

## Decisions

From 182 (Claude's calls, open to the owner, 2026-11-02):

1. **Measured before and after,** as review 18 measured, kept only if it shows.
2. **What the person sees does not change:** the Timeline looks the same, pixel for pixel where it can be compared.

## Agent Brief

**Category:** enhancement
**Summary:** Each frame, the Envelope Timeline recomputes and redraws every column, though only the newest columns changed.

**Current behavior:** The Timeline works out the Cutoff, the Filter Envelope and the Amp Envelope for every pixel column on every frame, 1.3 to 2.2 ms a frame.

**Desired behavior:**
- As time moves on, the columns already drawn shift along and only the new ones are worked out and drawn.
- A change that alters what is already drawn (a knob, its time span, a Preset, the theme, a resize, the Display's layers) redraws the whole Timeline once, as now.

**Key interfaces:**
- The Envelope Timeline's drawing

**Acceptance criteria:**
- [x] The Timeline's cost a frame measured in the Demo and on a held chord, before and after, the figures in the issue, well under today's
- [x] Its look unchanged: its tests and the design audit pass; a held Note, a released one and a knob turned mid-Note draw as before
- [ ] Every test passes in Linux's fonts too

**Out of scope:**
- The other Viewers ([213](./213-viewer-colours-read-once-and-a-silent-scope-skipped.md), [214](./214-the-silent-viewers-rest.md))

## How it was built

- **Only the new columns are worked out.** The Timeline samples the Modulation model on a grid of moments fixed to time, one pixel apart, so a column keeps its moment as it scrolls. Each column's Modulation, and the Patch in force then, is now kept from frame to frame, and each frame works out only the columns new since the last. The model's history is only ever added to at or after now, so a past moment's Modulation stays as it was.
- **What is worked out again.** The last frame's newest column is worked out again every frame, since a Note or a knob can land on the very moment it was drawn at (the clock stands still until the sound starts). So are the moments before the model's past is settled: before the first Patch and the first Note, they stand in for what came before. Before any Note, the first Note's key stands in for the Key Track's, and the first Patch is replaced while the clock stands still. The engine says from when its past is settled (`settledFrom`). Until the first Note, the Timeline therefore works out every column as before. A resize or another time span starts the columns afresh.
- **Unchanged.** The picture is still drawn whole each frame from those samples, with the same code, so what is drawn is the same, pixel for pixel. A throwaway in-browser check compared every kept sample with one worked out afresh, about 950,000 columns in Chromium and in WebKit. It ran through the Demo, Cutoff turns, a chord, an LFO on before the first Note, a time span change and a resize, and found no difference.
- Tests: `timeline.test.ts` (only the new columns worked out, the same samples as afresh, a new scale, a clock standing still, the moments before the settled past) and `synthEngine.browser.test.ts` (the model's past is settled from the first Patch and the first Note, and stays as it was once the clock has passed it).

Claude's calls, open to the owner:

1. **The columns are worked out once, but still drawn whole each frame.** The brief asks for the drawn columns to shift along and only the new ones to be drawn. Measured on this branch, working out the Modulation was about 80 % of the Timeline's cost and drawing about 20 %. Shifting the drawn picture cannot keep it pixel for pixel (decision 2): it moves a fraction of a pixel each frame, and the seconds' grid lines stay fixed to the canvas while the curves scroll under them. Shifting would also need the lines, their dots and the labels redrawn over it. So the drawing is left as it was.
2. **Before the first Note, nothing is saved.** Until then, the first Note's key will stand in for the past's Key Track, so every column is worked out each frame as before. With nothing on the Timeline moving, it rests anyway (issue 214).
3. **A Freeze held more than 30 seconds while Notes keep coming** is the one place the picture can differ. The model drops its history after 30 seconds. Before, the frozen window was then drawn again from what was left, and that part fell to silence. Now the columns already worked out stay as they were frozen. Those before the model's oldest Patch or Note left are still worked out again, so part of the window can fall to silence, as before.

Measured on 2026-11-04 by review 18's method, with a throwaway spec, not kept: headless Chromium, 1440 × 900 at 2× pixels, Bead off, a fresh page, 3 s of start-up, 2 s to settle, 10 s measured, the mean of two runs. The machine was an Apple M2 at a load of 2 to 3. The Timeline's own draw was timed in the page, around its call in the render loop. "Chord" is 8 Voices with 8 keys held.

The Timeline's cost a frame (and the frames per second):

| State | 1× before → after | 4× before → after |
| --- | --- | --- |
| Demo | 1.00 → 0.21 ms (56.5 → 57.4 fps) | 4.36 → 1.10 ms (13.4 → 14.2 fps) |
| Chord | 0.89 → 0.14 ms (60 fps) | 3.77 → 0.61 ms (26.9 → 29.6 fps) |

Review 18 found 1.3 to 2.2 ms on 1.21.1 from a CPU profile. Issue 213, which reads the colours once, brought the "before" on this branch down to about 1 ms. The Demo keeps more of its cost at 4×: at 14 fps more columns are new each frame, and its LFO lines still measure their dashes along the whole line.

Tests run: `npx tsc`, `npm run lint`, `timeline.test.ts` and `synthEngine.browser.test.ts`, and the Playwright specs of the Timeline and the design audit in Chromium and WebKit. Those specs are `envelopes`, `geek`, `midiKeyboard`, `modulationRing`, `tempo`, `viewersRest`, `viewerControls`, `lfo`, `designPrinciples` and `demo`. All passed (2 skipped in WebKit, as before). Linux's fonts could not be run here: GitHub's run on the push will show it.

What to try in the app:

- Play and hold a Note, let it go, and turn the Cutoff mid-Note with the Filter Envelope on: the Timeline should look as it did.
- Run the Demo and watch its LFO lines and dots scroll as before.
- Turn an LFO on before playing anything, then play a first Note with Key Track up: the Cutoff line before it moves with it, as it did.
- Change the Env Timeline length and resize the window: the Timeline redraws whole at once.
