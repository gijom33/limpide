# 84: Statistics on the project

**What to build:** The owner's idea (2026-10-28): "I am interested in gathering statistics about the project in terms of project size, quality, and performance." The owner added, at triage: runtime performance too (memory usage, frame rate, CPU load…).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. The owner answered the three questions (decisions below).

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
- [ ] A second release's run adds a row and shows the changes from the first
- [ ] The running app's three states are measured with the same durations each time, and the page says on which machine and browser
- [ ] The release steps and the README point to the page

**Out of scope:**
- Measuring visitors' devices or anything from the live site's visitors
- Tracking between releases (a run per commit)

