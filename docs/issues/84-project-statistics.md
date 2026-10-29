# 84: Statistics on the project

**What to build:** The owner's idea (2026-10-28): "I am interested in gathering statistics about the project in terms of project size, quality, and performance." The owner added, at triage: runtime performance too (memory usage, frame rate, CPU load…).

**Blocked by:** none

**Status:** needs-info · enhancement

## Triage Notes

**What we've established so far:**

- Three families of measures: size (lines, files, tests…), quality (tests passing, coverage, lint…), and performance, both the build's (bundle size, page-load scores, test durations) and the running app's (memory, frame rate, CPU load while it plays and draws).
- Nothing gathers them today beyond the test runs' own output.

**What we still need from the owner:**

- Who the numbers are for and where they show: a report in the terminal, a page in the docs, the README, or About.
- How often: measured once, or tracked from release to release (each release's numbers kept, to compare).
- For the running app's numbers: measured on which machine and browser, doing what (idle, playing the Demo, a chord on eight Voices)?
