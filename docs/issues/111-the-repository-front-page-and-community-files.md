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

**Status:** ready-for-agent · enhancement. The owner accepted the answers (decisions below); SECURITY.md waits on the owner's step 2.

## For the owner alone

1. Fill in the GitHub profile's name, bio and link (GitHub › Settings › Public profile).
2. Switch on private vulnerability reporting (the repository's Settings › Code security). A SECURITY.md then points to it, with no email address.

## Questions for the owner

1. **Ready to do without a decision (Claude's call, open to the owner):** the new screenshot, the two README sections merged into one, the Release titles in one form ("Limpide 1.16.0") from now on and the old ones renamed, a credit line under the tagline, pull requests in their own CI group with deploys never cancelled, and SECURITY.md once step 2 is done. Go ahead?
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
- [ ] The README's screenshot shows four Oscillator tabs and the header as it is
- [ ] Every Release's title has the one form
- [ ] A pull request's run cannot cancel a main deploy (the workflow's groups say so)
- [ ] The built notices end with the MIT licence
- [ ] SECURITY.md points to private reporting, which is on

**Out of scope:**
- The copyright line's wording (a lawyer's)
- The owner's GitHub profile (the owner's)
