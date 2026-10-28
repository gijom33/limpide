# Limpide

The owner directs; Claude proposes and builds. The domain words are in `CONTEXT.md`; what is built and why is in `docs/prd.md`, `docs/adr` and `docs/issues`. Why the habits below: [ADR-0010](docs/adr/0010-how-the-work-is-recorded.md) and [ADR-0012](docs/adr/0012-following-the-ai-hero-skills.md).

## Recording the work

- **Commits:** a subject of at most 72 characters starting `Issue N:` or `No issue:`, the detail in the body.
- **Inbox:** the owner's bug or idea goes into `docs/inbox.md` in the owner's words and is committed alone; triage (an issue, or Dropped with the reason) is the next commit. A rejected feature idea also gets a file in `.out-of-scope/`.
- **Issues:** an open issue's Status line starts with a triage state and a category (`docs/agents/triage-labels.md`); a new `ready-for-agent` issue carries an Agent Brief, without file paths.
- **Who decided:** "decided by the owner" for the owner's decisions; "Claude's call, open to the owner" for a call made without them. A grilling's answers go into its issue as a numbered Decisions list.
- **ADRs:** a header line `**Status:** accepted · **Date:** YYYY-MM-DD · **Decided by:** …`. An accepted ADR changes only in its Status line; a reversal is a new ADR that supersedes it.
- The docs call the owner "the owner". The repository carries no email address of the owner's.

## Tests

- Every commit: the pre-commit hook runs `tsc` and the lint (`.githooks/`, switched on by `npm install`).
- While working: the tests that cover the change. One Playwright run at a time: they share port 5199.
- Before a push: the full suite green: `npx tsc`, `npm run lint`, `npx vitest run`, `npx playwright test`.

## Agent skills

### Issue tracker

Local Markdown: one file per issue in `docs/issues/`, the inbox as the triage queue; GitHub Issues are for visitors. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default states and two categories, written at the start of an issue's Status line. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` (the glossary) and `docs/adr/` at the root. See `docs/agents/domain.md`.

## Releasing

Commit as you go; push only when the owner says so. Each release is a push, in this order; a version is published only once it is live:

1. **Minor releases** (new visible features) first get a code review: the code-review skill over everything since the last minor tag. Fix the bugs it finds; send the rest to the inbox.
2. The full suite green.
3. The version: patch by default, minor for new visible features, major only on the owner's word (`npm version X.Y.Z --no-git-tag-version`), and its line in `docs/issues/25-releases.md`.
4. Commit it as `Issue 25: version X.Y.Z` (issue 25 is the release log) and `git push origin main`: a push to `main` deploys the site.
5. When the deploy run is green: an annotated tag `vX.Y.Z` on that commit, `git push origin vX.Y.Z`, and `gh release create` with the version's release-log line as its notes. Done.
6. If the deploy fails, fix it and push again under the same version (its release-log line says what the fix added): a failed attempt costs no version number. A re-run of the same commit needs no push.
