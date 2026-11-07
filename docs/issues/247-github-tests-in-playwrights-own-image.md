# 247: GitHub's tests in Playwright's own image

**What to build:** The owner's idea (inbox, 2026-11-05), from Claude's suggestion: "Yes, add optional idea about playwright's own image to inbox." Each of GitHub's browser test jobs starts on a bare Linux machine and installs the system libraries WebKit and Chromium need; that install hangs now and then on GitHub's side (twice on 2026-10-27, four times for 1.25.0), and each hang costs a 10-minute timeout and a rerun by hand. Playwright publishes a ready image of Linux with its browsers and their libraries already in it; a job run inside it has nothing to install. Nothing a person sees: the test setup, not the app.

**Blocked by:** none

**Status:** done (2026-11-06). Built (2026-11-05) on night/2026-11-05, merged into main on 2026-11-06 with the night ("Merge the night"); tried on test branches on the owner's word ("Yes, push it"), three runs green and no slower, so kept by decision 3. Ships with the next release.

## Decisions

Claude's calls, open to the owner (2026-11-05, triage):

1. **Only the browser jobs move into the image** (the Playwright shards and the engine job); the checks job (tsc, lint, unit tests) and the deploy stay as they are.
2. **The image's version follows Playwright's own** in the lock file, so a Playwright update cannot leave the image behind: a check fails the run if they differ.
3. **Kept only if it is no slower:** the image is large to download, and a cache hit plus the library install takes about a minute when it does not hang. Three runs are timed against the last three runs before it; if a job's start is more than a minute slower, the issue says so and the owner chooses.
4. **The cache step and both install steps are removed** with their comment, which then no longer applies.
5. **Built at night, tried by day:** the night pushes nothing, so a night builds the change and leaves its runs on a test branch, the timing and the mismatch check for the day, on the owner's word to push the test branch; the issue then waits for the owner.

Since then (2026-11-06), on the test branches:

6. **The layouts hold, not the tests loosened** (decided by the owner: "Yes, fix the layouts"). The first two runs failed three layout tests in both browsers: the image has no DejaVu Sans, the runner's, and gives the page's system font to WenQuanYi Zen Hei, a Chinese font.
7. **The image's system font is set to Liberation Sans** (Claude's call, open to the owner), a Latin font with Arial's widths, in the image already, by a font setting the browser jobs copy in: no visitor reading Latin text gets a Chinese system font, so the page was not reshaped for it. Display's Keys, Tips, Bead and Theme, which broke three and one with Arial's widths on the Mac too, now wrap in two pairs that never break.

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
- [x] Three runs on a test branch go green with no install step, and the skips still apply on GitHub's WebKit.
- [x] Each job's time from start to its first test is recorded for those runs against the three before; more than a minute slower is reported to the owner, not shipped.
- [x] A deliberate version mismatch on a test branch fails early with the message.
- [x] Nothing deploys from the test branches.

**Out of scope:**
- Changing the shards, the worker counts or which tests are skipped on GitHub.
- Running the checks job or the deploy in a container.
- The local runs on the Mac.

## How it was built

Built at night (2026-11-05, on `night/2026-11-05`, commit 03a0bb4), not yet run on GitHub (decision 5).

- **The workflow:** the `browsers` job (the engine job and the twelve end-to-end shards) runs in `mcr.microsoft.com/playwright:v1.64.1-noble`, with `--ipc=host` as Playwright's guide for the image asks, still on `ubuntu-latest`. The cache step, both install steps and their comment are gone; checkout, Node 24 with its npm cache, `npm ci`, the shards, the worker counts and the failure reports are as they were. The `checks` job and the `deploy` are unchanged.
- **The version check:** `scripts/playwrightImage.ts`, the job's first step after setting up Node, before anything is installed. It reads the image's tag from the workflow and Playwright's version from the lock file (`playwright`, `playwright-core`, `@playwright/test`) and fails the run with a message naming what to change, e.g. "Playwright's image in .github/workflows/deploy.yml is v1.63.0-noble, but package-lock.json installs Playwright 1.64.1: change the image's tag to v1.64.1-noble, or Playwright back to 1.63.0." Its unit test covers the match, the mismatch, two versions in the lock and a missing image, and also checks the repository as it stands, so a Playwright update without the image fails the unit tests on the Mac too.
- **The GitHub WebKit skips** read `process.env.CI` and the project's name; GitHub sets `CI` inside a job's container as on the bare runner, so they still apply. The day's runs confirm it (the skipped tests show as skipped in the WebKit shards).
- **Checked:** the workflow parses (Ruby's YAML: the container, the steps in order, the three jobs, the triggers and the deploy's condition as intended); the check run locally passes on the workflow as it is (exit 0) and fails with the message above on a copy whose tag is `v1.63.0-noble` (exit 1); `npx tsc`, `npm run lint`, the script's unit tests (6 passed). No Docker, no GitHub run.

Claude's calls, open to the owner:

1. **The fonts change.** The comment this replaces kept the jobs on the bare runner on purpose, "whose fonts the layout tests are measured in (not Playwright's image, whose differ)" (fa8709f, a call of Claude's, not the owner's). In the image, `system-ui` and `sans-serif` resolve to the image's fonts, so some layout tests may measure differently. Built anyway, since the owner asked for the image; the three runs answer it. If layout tests go red only in the image, the choice is the owner's: re-measure them in the image's fonts, or drop the image (re-measuring would change tests, which this issue keeps out of scope).
2. **The check is a script that reads the workflow**, not a version in one place: a container's image cannot be computed from the lock file in GitHub's workflow syntax, so the tag is written by hand and checked.
3. **The check runs in every browser job**, not in a job of its own that the others wait for: a separate job would add its start to every run, and in each job it fails within seconds, before `npm ci`.
4. **Node stays set up by `setup-node`** (Node 24, as the checks job) rather than the image's own Node, so the tests run on the same Node as before.
5. **`ubuntu-latest` stays** as the host; the image's `noble` is the same release today. If GitHub moves `ubuntu-latest` to a later Ubuntu, the image's tag should follow.

### The day's steps

Nothing here deploys: the workflow runs on a push to `main` or `release/**`, and the `deploy` job runs only when `github.ref == 'refs/heads/main'` (checked in `.github/workflows/deploy.yml`), so a `release/probe-247` branch runs every check and deploys nothing, as for `release/probe-N` in issue 232.

1. **The baseline:** the last three runs before this change, with `gh run list --workflow deploy.yml --limit 10` (three green runs on `main` or a release branch, from before 03a0bb4). For each, `gh run view <id> --json jobs --jq '.jobs[] | {name, startedAt, first: (.steps[] | select(.name | test("playwright test|test:engine")) | .startedAt)}'` gives each job's start and its first test's start.
2. **The three runs:** on the owner's word, `git push origin night/2026-11-05:release/probe-247`, then rerun it twice (`gh run rerun <id>`, after the first is done, or push an empty commit). Each must be green with no install step, and the WebKit shards must show the GitHub-only skips as skipped (issue 232's and the 2026-11-02 inbox's tests in `demo.spec.ts` and `sectionStrip.spec.ts`).
3. **The timing:** the same `gh run view` for the three runs; the image's pull counts in the job's start (the "Initialize containers" step). Compare each job's start-to-first-test against the baseline: more than a minute slower is reported to the owner, not shipped (decision 3).
4. **The mismatch:** on the same branch, change the image's tag to `v1.63.0-noble` (an older published image, or any other; a tag that does not exist fails earlier, at the image's pull, without the message), commit, push to `release/probe-247`: every browser job should fail at the check's step with the message, before `npm ci`. Then drop that commit.
5. **Afterwards:** delete the branch (`git push origin --delete release/probe-247`); the change ships with the next release from `main`.

## How it went (2026-11-06)

- **Three runs green** on `test/247-playwright-image` (runs 42337006667, 42338064589, 42339185897), with no install step and the skips for GitHub's WebKit still applying.
- **Start to first test**, per browser job: 26 to 42 s in the image, against 20 to 60 s in the three runs before (42161464150, 42159264056, 42050895483), one of which stalled 7.5 min in its install; none more than a minute slower.
- **The mismatch** (`test/247-mismatch`, the image at v1.64.0 against the lock file's 1.64.1) failed every browser job at its first step, 27 s in, with the message saying which to change; the unit tests failed it too.
- **Nothing deployed:** the deploy runs on main alone. Both test branches are deleted.
