# 247: GitHub's tests in Playwright's own image

**What to build:** The owner's idea (inbox, 2026-11-05), from Claude's suggestion: "Yes, add optional idea about playwright's own image to inbox." Each of GitHub's browser test jobs starts on a bare Linux machine and installs the system libraries WebKit and Chromium need; that install hangs now and then on GitHub's side (twice on 2026-10-27, four times for 1.25.0), and each hang costs a 10-minute timeout and a rerun by hand. Playwright publishes a ready image of Linux with its browsers and their libraries already in it; a job run inside it has nothing to install. Nothing a person sees: the test setup, not the app.

**Blocked by:** none

**Status:** ready-for-agent · enhancement. Optional (decided by the owner). In v1 as release upkeep, not a feature (Claude's call, open to the owner, who may move it to v2).

## Decisions

Claude's calls, open to the owner (2026-11-05, triage):

1. **Only the browser jobs move into the image** (the Playwright shards and the engine job); the checks job (tsc, lint, unit tests) and the deploy stay as they are.
2. **The image's version follows Playwright's own** in the lock file, so a Playwright update cannot leave the image behind: a check fails the run if they differ.
3. **Kept only if it is no slower:** the image is large to download, and a cache hit plus the library install takes about a minute when it does not hang. Three runs are timed against the last three runs before it; if a job's start is more than a minute slower, the issue says so and the owner chooses.
4. **The cache step and both install steps are removed** with their comment, which then no longer applies.
5. **Built at night, tried by day:** the night pushes nothing, so a night builds the change and leaves its runs on a test branch, the timing and the mismatch check for the day, on the owner's word to push the test branch; the issue then waits for the owner.

## Agent Brief

**Category:** enhancement
**Summary:** GitHub's browser test jobs run inside Playwright's published Linux image, so they install no browsers or system libraries.

**Current behavior:** Each browser job (four Chromium shards, eight WebKit shards, the engine tests) restores the browsers from a cache keyed on Playwright's version, then installs the system libraries (or, on a miss, the browsers and libraries), each under a 10-minute timeout. The library install sometimes hangs on GitHub's side until the timeout; the job fails and is rerun by hand.

**Desired behavior:**
- The browser jobs run in Playwright's official image for the exact Playwright version the project locks, on the same Ubuntu release the jobs use now.
- No cache or install step is left in those jobs; the shards, worker counts, skips and failure reports stay as they are.
- A Playwright update that is not matched by the image's version fails the run early with a message saying which to change.
- The checks job and the deploy are unchanged.

**Key interfaces:**
- The workflow's browser job: its matrix, steps and the shard and worker flags.
- Playwright's version as the lock file gives it.
- The GitHub-only skips, which read whether the run is on GitHub's WebKit: they must still see it in the container.

**Acceptance criteria:**
- [ ] Three runs on a test branch go green with no install step, and the skips still apply on GitHub's WebKit.
- [ ] Each job's time from start to its first test is recorded for those runs against the three before; more than a minute slower is reported to the owner, not shipped.
- [ ] A deliberate version mismatch on a test branch fails early with the message.
- [ ] Nothing deploys from the test branches.

**Out of scope:**
- Changing the shards, the worker counts or which tests are skipped on GitHub.
- Running the checks job or the deploy in a container.
- The local runs on the Mac.
