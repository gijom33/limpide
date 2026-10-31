# CI runs the end-to-end tests before a deploy, not the release routine

**Status:** accepted · **Date:** 2026-10-30 · **Decided by:** the owner

Supersedes [ADR-0012](./0012-following-the-ai-hero-skills.md)'s point 8 as far as "the full suite before a push" (ADR-0012 is frozen, ADR-0010): the rest of that point, the pre-commit hook and the tests covering a change while working, stands.

A release took over two hours from the owner's "push" to a live site: the full suite locally (Playwright's 940 end-to-end tests, about 40 minutes on the owner's Mac), then the statistics (about an hour, the whole suite again with coverage), then the deploy run (28 minutes for 1.16.1, 23 of them the same end-to-end tests in one job). The deploy run now spreads its checks over parallel jobs, the end-to-end tests in eight shards (about 6 minutes, fa8709f), and deploys only once every job is green. Running the same tests on the Mac first bought nothing a red deploy run does not: a failed run leaves the live site as it was, and the fix is pushed under the same version ([releasing](../releasing.md), since 2026-10-27).

## Decision

- **Before a push:** `npx tsc`, `npm run lint`, `npx vitest run`, and the Playwright specs the change touches (plus any layout spec it could move).
- **The deploy run is the end-to-end gate:** all of Playwright, both browsers, on GitHub's Ubuntu; a red run deploys nothing.
- **The statistics come after the push,** on a quiet machine; their row is committed and goes out with the next push.

## Consequences

- A release's local time drops from about two hours to a few minutes, and the deploy run from 28 to about 6.
- A failure only the whole suite would catch now shows in the deploy run instead of on the Mac: it costs a fix pushed under the same version, as a Linux font failure already did.
- The release's statistics row may land one push later than its version line.
