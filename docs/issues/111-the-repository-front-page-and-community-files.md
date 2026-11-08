# 111: The repository's front page and community files

**What to build:** From the fourteen reviews of 1.16.0 (the inbox, 2026-10-30; reviews 4, 7, 8 and 11, [AI expert](../reviews/2026-10-30/4-ai-expert.md), [recruiter](../reviews/2026-10-30/7-recruiter.md), [open-source sceptic](../reviews/2026-10-30/8-oss-sceptic.md), [open-source legal](../reviews/2026-10-30/11-oss-legal.md)):

- **The README lags the app:** its screenshot predates 1.16.0; "How it's built" and "How this was built" repeat each other; the GitHub Release titles take three forms ("Limpide 1.12.4", "v1.13.0", "1.14.0").
- **Credit:** the README credits the author only at the bottom, unlinked; one line under the tagline, linked as About does.
- **CI:** pull requests share the deploy's concurrency group with cancel-in-progress, so an outside pull request would cancel a deploy in flight, and pull requests cancel each other.
- **Security:** no private route for security reports: GitHub's private vulnerability reporting is off, and there is no SECURITY.md.
- **Contributing:** CONTRIBUTING asks for no DCO sign-off and says nothing on AI-assisted contributions.
- **Copyright:** the README's line claims all the code, written with Claude Code; qualify it, and add Limpide's own licence to the third-party notices (a lawyer to confirm the wording).
- **The owner's GitHub profile** has no name, bio or link.

**Blocked by:** none

**Status:** ready-for-human · enhancement. Built (2026-10-30) on night/2026-10-30, for the owner to try. Still waiting on the owner's own step 3, the old Releases renamed. Step 2 done (2026-11-05): private reporting switched on by the owner ("OK I switched it", read as on through GitHub's API), and SECURITY.md written.

## For the owner alone

1. Fill in the GitHub profile's name, bio and link (GitHub › Settings › Public profile).
2. Switch on private vulnerability reporting (the repository's Settings › Code security). A SECURITY.md then points to it, with no email address.
3. Rename the eight Releases not yet titled "Limpide X.Y.Z" (v1.13.0 to v1.17.0; v1.12.4 and older already are): `for v in 1.13.0 1.14.0 1.14.1 1.15.0 1.15.1 1.16.0 1.16.1 1.17.0; do gh release edit "v$v" --title "Limpide $v"; done`. New ones get the title from the release steps.

## Questions for the owner

1. **Ready to do without a decision (Claude's call, let stand by the owner in 1.16.1):** the new screenshot, the two README sections merged into one, the Release titles in one form ("Limpide 1.16.0") from now on and the old ones renamed, a credit line under the tagline, pull requests in their own CI group with deploys never cancelled, and SECURITY.md once step 2 is done. Go ahead?
2. **DCO sign-off for contributors** (`git commit -s`)? Claude's recommendation: no for now. It adds a step for a first contributor, and nobody has contributed yet; MIT's terms in CONTRIBUTING already cover what they send.
3. **AI-assisted contributions:** ask contributors to say so with a `Co-Authored-By` line, as the project does? Claude's recommendation: yes, one sentence in CONTRIBUTING.
4. **The copyright line:** change it to "© Guillaume Boillet, to the extent of the author's rights; written with Claude Code" and add Limpide's MIT licence to the third-party notices? Claude's recommendation: yes for the notices. For the wording, only a lawyer can say what holds; the reviewer's suggestion is a start, not advice.

## Decisions (triage, 2026-10-30, decided by the owner)

1. Go ahead with the screenshot, one merged README section on how it was built, Release titles as "Limpide 1.16.0" (old ones renamed), a credit line under the tagline, pull requests in their own CI group with deploys never cancelled, and SECURITY.md once private reporting is on.
2. No DCO sign-off for now.
3. CONTRIBUTING asks contributors to mark AI help with a `Co-Authored-By` line, in one sentence.
4. Limpide's MIT licence goes into the third-party notices. The copyright wording waits for a lawyer; nothing changes in it until then.

## Agent Brief

**Category:** enhancement
**Summary:** The README shows today's app and its author, CI never cancels a deploy, and the community files say how to report and contribute.

**Desired behavior:**
- **README:** a new screenshot of today's app (the wide layout, the Dark theme); one section on how Limpide was built; under the tagline, one line crediting the author, linked as About links the name.
- **Releases:** every GitHub Release titled "Limpide X.Y.Z"; the release steps say so.
- **CI:** pull requests (and branch runs) in a group of their own; the deploy's group never cancels a run in progress.
- **CONTRIBUTING:** one sentence asking for AI help to be marked with a `Co-Authored-By` line.
- **Notices:** the third-party notices the build writes end with Limpide's own licence.
- **SECURITY.md**, once the owner has switched on private reporting: report privately through the repository's Security tab; no email address.

**Acceptance criteria:**
- [x] The README's screenshot shows four Oscillator tabs and the header as it is
- [ ] Every Release's title has the one form
- [x] A pull request's run cannot cancel a main deploy (the workflow's groups say so)
- [x] The built notices end with the MIT licence
- [x] SECURITY.md points to private reporting, which is on

**Out of scope:**
- The copyright line's wording (a lawyer's)
- The owner's GitHub profile (the owner's)

## How it was built

Built at night on 2026-10-30, on the branch night/2026-10-30, for the owner to try.

- **Notices:** the build writes Limpide's own licence (the LICENSE file, headed with the version) as the last section of `third-party-notices.txt`; the About test checks that the last section is it.
- **CI:** runs on `main` share one group that never cancels a run in progress, so a newer push waits for the deploy in flight. A pull request or a release branch runs in a group of its own ref (`checks-…`), which can never be main's, and a newer push to it cancels its older run.
- **README:** a new screenshot; a credit line under the tagline ("Designed and directed by Guillaume Boillet; code written with Claude Code, Anthropic's AI coding agent", the name linked to the same LinkedIn page as About); "How it's built" and "How this was built" merged into one section under the second name (CONTRIBUTING links it), with the statistics' summary at its end. The License line now says the notices end with Limpide's own licence; its copyright wording is unchanged (Decision 4).
- **Releases:** the release steps create each Release with `--title "Limpide X.Y.Z"`. The old titles are left for the owner to rename (step 3), since the night shift changes nothing on GitHub.
- **CONTRIBUTING:** one sentence asks for AI help to be marked with a `Co-Authored-By` line naming the tool.
- **SECURITY.md:** not written. Private vulnerability reporting was still off on 2026-10-31 (read through GitHub's API), and SECURITY.md waits on it. **Since then (2026-11-05):** written by day once the owner had switched reporting on: the live site and latest release supported; what Limpide reads from outside (a shared link's Patch, MIDI, the browser's storage) and what counts as a vulnerability; reports through the Security tab, no email address. Claude's calls, let stand by the owner in 1.26.0: credit to the reporter if they wish, and "allow a few days for a first answer".

Calls made without the owner (Claude's call, let stand by the owner in 1.18.0):

1. The screenshot is the Demo playing Acid at 1920 × 1080 (the four sections across), saved at 1.25× (2400 × 1350), with the Demo's card closed so every Viewer shows whole. With the card open it covers the foot of the Filter's and Amp's Spectrum; it would show what to listen for, though.
2. The credit line follows About's words, Claude Code included; the merged section then only says every commit names Claude Code.
3. The deploy job keeps its own `pages` group, now redundant beside the run's `main` group but harmless.
4. A side effect of the CI groups: a third push to `main` while one run is going replaces the one waiting, so that middle commit is never deployed alone (the newest is).

What to check: the README's top (the credit line and the screenshot) on GitHub once pushed; `third-party-notices.txt` from About on the deployed site; and the first pull request's or release branch's run shows a `checks-…` group, not `main`.

Tests: `npx tsc`, `npm run lint`, `npx vitest run` (1,149 passed) and `e2e/about.spec.ts` in Chromium and WebKit (12 passed). The README, CONTRIBUTING, release steps and workflow have no behaviour a test can check locally.
