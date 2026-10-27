# 56: Ready for contributors, and the process made visible

**What to build:** The repository invites no one in: no CONTRIBUTING, issue or pull request template, or code of conduct (GitHub's community profile at 42 %), and `main` takes direct pushes ([review 8](../reviews/2026-10-26/8-oss-sceptic.md)). And the process the methodology review admired lacks a few habits ([review 10](../reviews/2026-10-26/10-methodology.md), [review 4](../reviews/2026-10-26/4-ai-expert.md)). From the inbox, 2026-10-26.

**Blocked by:** none

**Status:** done (2026-10-27)

- [x] A short CONTRIBUTING: how to run it, where bugs and ideas go (GitHub Issues for visitors, as `docs/inbox.md` says), what kind of help is welcome
- [x] A bug-report template; a code of conduct (and an idea template, a pull request template)
- [x] Tags and GitHub Releases for versions, from the release log (`docs/issues/25-releases.md`): v1.0.0 to v1.11.0 on their version commits, pushed with 1.11.0, each with a Release (`gh release create`) whose notes are its line in the log
- [x] Grill with the owner, then record (an ADR or the release checklist): the code review at each minor version; ADRs with a status, a date and who decided, reversed by a new ADR rather than edited; commits naming their issue (or "no issue: why"); inbox lines committed before triage; shorter commit subjects

The code of conduct adopts the Contributor Covenant 2.1 by reference (its text is not copied), with the owner's LinkedIn as the private contact: the owner's email is not published in the repository.

## Decisions (grilling, 2026-10-27, decided by the owner)

1. **A code review at each minor version**: the code-review skill over everything since the last minor tag, before the push; bugs fixed first, the rest to the inbox. Patch releases skip it. Issue 42's review of the whole history stays a one-off.
2. **ADRs get a Status, a Date and who decided, then are frozen**: only the Status line changes; a reversal is a new ADR. The nine existing ones backfilled from git.
3. **Commits name their issue, briefly**: `Issue N:` or `No issue:`, at most 72 characters, the detail in the body. Pushed history stays as it is.
4. **Inbox lines committed before triage**, in the owner's words.
5. **Claude's calls marked** "Claude's call, open to the owner"; a grilling's answers kept in its issue as a numbered Decisions list.
6. **Written down in [ADR-0010](../adr/0010-how-the-work-is-recorded.md) and a root `CLAUDE.md`**, linked from CONTRIBUTING and the README.

