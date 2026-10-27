# Limpide

The owner directs; Claude proposes and builds. The domain words are in `CONTEXT.md`; what is built and why is in `docs/prd.md`, `docs/adr` and `docs/issues`. Why the habits below: [ADR-0010](docs/adr/0010-how-the-work-is-recorded.md).

## Recording the work

- **Commits:** a subject of at most 72 characters starting `Issue N:` or `No issue:`, the detail in the body.
- **Inbox:** the owner's bug or idea goes into `docs/inbox.md` in the owner's words and is committed alone; triage (an issue, or Dropped with the reason) is the next commit.
- **Who decided:** "decided by the owner" for the owner's decisions; "Claude's call, open to the owner" for a call made without them. A grilling's answers go into its issue as a numbered Decisions list.
- **ADRs:** a header line `**Status:** accepted · **Date:** YYYY-MM-DD · **Decided by:** …`. An accepted ADR changes only in its Status line; a reversal is a new ADR that supersedes it.
- The docs call the owner "the owner". The repository carries no email address of the owner's.

## Tests

- While working: the tests that cover the change. One Playwright run at a time: they share port 5199.
- Before a push: the full suite green: `npx tsc`, `npm run lint`, `npx vitest run`, `npx playwright test`.

## Releasing

Commit as you go; push only when the owner says so. Each push is a release, in this order:

1. **Minor releases** (new visible features) first get a code review: the code-review skill over everything since the last minor tag. Fix the bugs it finds; send the rest to the inbox.
2. The full suite green.
3. The version: patch by default, minor for new visible features, major only on the owner's word (`npm version X.Y.Z --no-git-tag-version`), and its line in `docs/issues/25-releases.md`.
4. Commit it as `Issue 25: version X.Y.Z` (issue 25 is the release log), an annotated tag `vX.Y.Z`, `git push origin main --tags`, and `gh release create` with the version's release-log line as its notes.
5. Done when the push's deploy run is green: a push to `main` deploys the site.
