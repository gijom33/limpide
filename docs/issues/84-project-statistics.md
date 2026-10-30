# 84: Statistics on the project

**What to build:** The owner's idea (2026-10-28): "I am interested in gathering statistics about the project in terms of project size, quality, and performance." The owner added, at triage: runtime performance too (memory usage, frame rate, CPU load…).

**Blocked by:** none

**Status:** ready-for-human · enhancement. Built; the first row is measured at the next release, on a quiet machine. Every release so far has its exact numbers (size and build), read from its tag.

## Triage Notes

**What we've established so far:**

- Three families of measures: size (lines, files, tests…), quality (tests passing, coverage, lint…), and performance, both the build's (bundle size, page-load scores, test durations) and the running app's (memory, frame rate, CPU load while it plays and draws).
- Nothing gathers them today beyond the test runs' own output.

**What we still need from the owner:**

- Who the numbers are for and where they show: a report in the terminal, a page in the docs, the README, or About.
- How often: measured once, or tracked from release to release (each release's numbers kept, to compare).
- For the running app's numbers: measured on which machine and browser, doing what (idle, playing the Demo, a chord on eight Voices)?

## Decisions (2026-10-30, decided by the owner)

1. The numbers live on a page in the docs, written by a script, with a short summary linked from the README.
2. They are tracked from release to release: one row per release, kept, so the trend shows.
3. The running app is measured on the owner's Mac in Chromium, in three states: idle, playing the Demo, and holding an 8-Voice chord.
4. (2026-10-30) The history is filled in for every release so far, with the exact numbers only for now: "Let's run for the exact metrics for now. We will augment over time." Each release tag is measured as it was released: its size read from its code and git history, and its built page's size from a build with its own locked dependencies. The rest stays blank in those rows, which the page says means not measured for that release yet.

## Agent Brief

**Category:** enhancement
**Summary:** One command measures the project's size, quality and performance and adds the release's row to a statistics page in the docs.

**Desired behavior:**
- **One command** (an npm script) gathers every number below for the current commit and writes them as one row, labelled with the version and the date, into a page in the docs; the rows already there are kept, the newest first, and running it twice for one version replaces that version's row.
- **Size:** source lines and files (app code, tests, docs apart), the number of tests in each suite, Presets, Tutorials, issues done and open, commits.
- **Quality:** each suite's pass count, test coverage of the app code (the unit and engine projects), lint warnings, type errors.
- **Build performance:** the built page's size (JavaScript and CSS, raw and gzipped), each suite's duration, a page-load score from a local run of the built site (first paint, largest paint, total blocking time).
- **Running app** (Chromium on this Mac, each state for a fixed time): memory in use, frames per second and the slowest frame, and the share of the main thread busy; idle, playing the Demo, and holding an 8-Voice chord (Init with 8 Voices).
- **The page** explains each number in one line (what it measures and how), and shows, for the key ones, the change since the previous row.
- **The README** gets a short summary (a few headline numbers) linking to the page; the release steps say to run the command before the release commit.

**Acceptance criteria:**
- [ ] One command produces the row for the current commit, in under ten minutes
- [x] A second release's run adds a row and shows the changes from the first
- [x] The running app's three states are measured with the same durations each time, and the page says on which machine and browser
- [x] The release steps and the README point to the page

**Out of scope:**
- Measuring visitors' devices or anything from the live site's visitors
- Tracking between releases (a run per commit)

## How it was built

- **The command:** `npm run stats` runs `scripts/measureStatistics.ts` (Node's own TypeScript, as the commit hooks do). It reads the version from `package.json`, measures, and merges its row into `docs/statistics.json`, from which it writes `docs/statistics.md` and the README's summary (between `<!-- statistics -->` markers). What is measured, and how:
  - size from the files git tracks (`src/` code apart from its tests, the tests, every Markdown file), the tests written counted in each suite's files, the Presets and Tutorials by loading their modules through Vite, the issues by their Status lines, the commits by `git rev-list`;
  - the unit and engine projects with Vitest's V8 coverage, each with a JSON report and a blob, the blobs merged for the two projects' coverage together; Playwright's suite with its JSON reporter; `tsc` and Biome's JSON report;
  - the site built into a temporary folder, its JavaScript and CSS measured raw and gzipped, then served by Vite's preview on port 5299 (not the end-to-end tests' 5199);
  - in Playwright's Chromium (new headless, 1440 × 900 at 2×): the median of three first visits for First Contentful Paint, Largest Contentful Paint and Total Blocking Time (Chromium's own paint and long-task timings), then each of the three states in a fresh page, settled 2 s and measured 10 s: frames counted by `requestAnimationFrame` in the page, DevTools' `TaskDuration` for the main thread, `SystemInfo.getProcessInfo` for all of Chromium's processes' CPU time, `JSHeapUsedSize` after a garbage collection.
- **Checking it:** `npm run stats -- --quick` skips the three suites and coverage, times one page load and each state for 2 s, and prints the page with its row instead of writing anything (about 30 s). It was run end to end that way on a loaded machine; its numbers were not kept. The full run, with the suites, has not been run here (another session held the end-to-end tests' port): at the next release, run it after `npm version` and before the release commit (`docs/releasing.md`, step 5), and check it takes under ten minutes.
- **The history** (decision 4): `npm run stats -- --history` measures every `v*` tag (`--tags v1.0.0,v1.1.0` for some) in a detached worktree of its own under the system's temporary folder (`--work <dir>` for another), with `npm ci --ignore-scripts` there (the project's `prepare` would change git's settings), and removes it after; tags with the same lock file share one install. The build writes the day it was built into the page (About's splash): its size is read with the release's date in its place, so a second run gives the same numbers, which it did (the whole history run three times, identical). A row measured again keeps the numbers the new run left out, so a later full run of an old release can fill in its blanks. The 27 releases from 1.0.0 to 1.16.0 took 2 ½ to 12 minutes, with the machine quiet or loaded.
- **A new dev dependency:** `@vitest/coverage-v8`, the coverage provider Vitest needs (nothing else measures coverage); the main checkout needs `npm install` once.
- **`tsconfig.json`** allows imports ending in `.ts`, which Node's TypeScript needs for the command's two files.
- **Tests:** `scripts/statistics.test.ts` (unit project): reading Vitest's, Playwright's, TypeScript's and Biome's output, the issue and test counts, a version's row replaced or merged, the page's changes since the row below, the README's summary.
- Claude's calls, open to the owner: the numbers are kept in `docs/statistics.json` and the page written from it; the page splits the numbers into tables (size, quality, build and load, and one per running state), each with a row per release, rather than one very wide table; a page load is a first visit; the running app is measured headless at 2× pixels; the memory is the JavaScript heap (the audio's buffers live outside it); the suites' durations are measured with coverage on; the README's summary gives the newest row's headline numbers.
