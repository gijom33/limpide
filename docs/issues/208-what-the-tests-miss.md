# 208: What the tests miss

**What to build:** The owner's question (2026-11-02), how to be confident the test suite is sufficient, and the owner's yes to Claude's proposal: "Sure. Also wondering if the stats I generate overlaps a bit since it reports coverage." It does, in part: the statistics ([84](./84-project-statistics.md)) already give the unit and engine tests' coverage as a whole (63.4 % of lines and 57.3 % of branches at 1.21.1, the end-to-end tests not counted). What they do not say is where the gaps are, nor whether the tests that run a line would catch it going wrong.

**Blocked by:** [131](./131-v1.md) (v1 first, by the scope rule)

**Status:** needs-triage · enhancement. v2, not committed (Claude's call, since decided by the owner, below: tooling, beyond v1's polish by the scope rule; the owner may move it into v1). **Since then (2026-11-04):** v2, decided by the owner after the trial below ("Yes, a v2 issue").

## What a grilling would settle

1. **Coverage by file:** the statistics' run already makes the report; whether to keep a short list of the least covered files beside the totals, and which of them matter (the engine and the Grids before the UI's glue).
2. **The bugs that got through:** for each bug the owner finds, a line saying whether a test should have caught it and which kind (unit, engine, end-to-end), so that over a few weeks the thin places show.
3. **Mutation testing** (Stryker or the like) on the engine and the Grids only, since it is slow: the share of small code changes no test catches, as the honest measure coverage is not. Whether it earns its run time, judged after 1.
4. **The end-to-end tests' coverage:** whether to count it too, as the statistics' number leaves it out.

## The browser tests' coverage, measured once (2026-11-04)

The owner's question (inbox, 2026-11-04): "Are you able to measure coverage considering playright?" Answered with a one-off trial on main at `b753433` (the night of 2026-11-03 merged), in a throwaway worktree, nothing committed.

**How:** every Chromium test's page recorded which JavaScript ran (Playwright's `page.coverage`, V8's own count), merged per worker; the built bundle, made with source maps, led it back to `src/`, through the converter Vitest's own V8 coverage uses; set line by line against the unit and engine projects' coverage, counted as the statistics count it. No new dependency: the tools were already installed with `@vitest/coverage-v8`. The 799 Chromium tests passed in 15.0 minutes with it on, about a plain run's time. Not counted: WebKit (no such API), the audio worklet (the engine tests cover it), and the five tests that open pages of their own.

**What it found,** in lines of the app code (8,726):

| | Unit and engine | Browser (Chromium) | Together |
| --- | --- | --- | --- |
| All | 67.1 % | 91.7 % | 97.7 % |
| The UI | 40.2 % | 91.2 % | 96.2 % |
| The engine, MIDI, the Patch, music, modulation, the Demo, input, the Tutorials, the Viewers | 93–100 % | 72–98 % | 98–100 % |

The bundle's statements start on other lines than Vitest's: counted by the smallest statement that holds each line, together is 97.7 %; counted only where a statement starts on the same line, 90.4 %, which marks JSX that plainly renders as never run. The truth is near the first.

**What no test runs** (about 210 lines, some of them mapping leftovers):

- Bead's rain falling, and dodging the umbrella; its fishing line and hook.
- Sub Octave and Sub Waveform turned from the page.
- Typing a tempo; Home and End on the Tempo control; the end of a tempo drag.
- The Tutorial card's next Tutorial, once one is finished.
- A knob's mode worked out from its first values, and a control's mode changed from the MIDI panel.
- The timers falling back to the page's when their worker fails; the screen shown when the app cannot start.

**For a grilling:** whether the statistics gain a "together" column (the hook in the browser tests and the conversion, kept in the repository), and whether the list above becomes tests.
