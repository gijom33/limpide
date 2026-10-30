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

**Status:** needs-triage · enhancement. Questions and two owner-only steps below.

## For the owner alone

1. Fill in the GitHub profile's name, bio and link (GitHub › Settings › Public profile).
2. Switch on private vulnerability reporting (the repository's Settings › Code security). A SECURITY.md then points to it, with no email address.

## Questions for the owner

1. **Ready to do without a decision (Claude's call, open to the owner):** the new screenshot, the two README sections merged into one, the Release titles in one form ("Limpide 1.16.0") from now on and the old ones renamed, a credit line under the tagline, pull requests in their own CI group with deploys never cancelled, and SECURITY.md once step 2 is done. Go ahead?
2. **DCO sign-off for contributors** (`git commit -s`)? Claude's recommendation: no for now. It adds a step for a first contributor, and nobody has contributed yet; MIT's terms in CONTRIBUTING already cover what they send.
3. **AI-assisted contributions:** ask contributors to say so with a `Co-Authored-By` line, as the project does? Claude's recommendation: yes, one sentence in CONTRIBUTING.
4. **The copyright line:** change it to "© Guillaume Boillet, to the extent of the author's rights; written with Claude Code" and add Limpide's MIT licence to the third-party notices? Claude's recommendation: yes for the notices. For the wording, only a lawyer can say what holds; the reviewer's suggestion is a start, not advice.
