# 56: Ready for contributors, and the process made visible

**What to build:** The repository invites no one in: no CONTRIBUTING, issue or pull request template, or code of conduct (GitHub's community profile at 42 %), and `main` takes direct pushes ([review 8](../reviews/2026-10-26/8-oss-sceptic.md)). And the process the methodology review admired lacks a few habits ([review 10](../reviews/2026-10-26/10-methodology.md), [review 4](../reviews/2026-10-26/4-ai-expert.md)). From the inbox, 2026-10-26.

**Blocked by:** none

**Status:** in progress (2026-10-27): the files and the tags done; the GitHub Releases go out with the next push; the process habits wait for a grilling with the owner

- [x] A short CONTRIBUTING: how to run it, where bugs and ideas go (GitHub Issues for visitors, as `docs/inbox.md` says), what kind of help is welcome
- [x] A bug-report template; a code of conduct (and an idea template, a pull request template)
- [ ] Tags and GitHub Releases for versions, from the release log (`docs/issues/25-releases.md`): tagged locally, v1.0.0 to v1.10.0 on their version commits; pushing the tags and creating the Releases (`gh release create`, notes from the release log) waits for the owner's next push, since it publishes
- [ ] Grill with the owner, then record (an ADR or the release checklist): the code review at each minor version; ADRs with a status, a date and who decided, reversed by a new ADR rather than edited; commits naming their issue (or "no issue: why"); inbox lines committed before triage; shorter commit subjects

The code of conduct adopts the Contributor Covenant 2.1 by reference (its text is not copied), with the owner's LinkedIn as the private contact: the owner's email is not published in the repository.
