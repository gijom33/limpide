# Limpide

The owner directs; Claude proposes and builds. The domain words are in `CONTEXT.md`; what is built and why is in `docs/prd.md`, `docs/adr` and `docs/issues`. Why the habits below: [ADR-0010](docs/adr/0010-how-the-work-is-recorded.md) and [ADR-0012](docs/adr/0012-following-the-ai-hero-skills.md).

## Recording the work

- **Commits:** a subject of at most 72 characters starting `Issue N:` or `No issue:`, the detail in the body (the `commit-msg` hook checks it).
- **Staging:** another session may be working in this checkout, so stage by path, only the files you changed; in a file both touched (often `src/styles.css`), stage your hunks alone (`git diff file` filtered, then `git apply --cached --recount`). Parallel sessions are safer each in its own worktree.
- **Inbox:** the owner's bug or idea goes into `docs/inbox.md` in the owner's words and is committed alone (the pre-commit hook checks it, and that no line is dated after today); triage (an issue, or Dropped with the reason) is the next commit. A rejected feature idea also gets a file in `.out-of-scope/`.
- **Issues:** an open issue's Status line starts with a triage state and a category (`docs/agents/triage-labels.md`); a new `ready-for-agent` issue carries an Agent Brief, without file paths.
- **Who decided:** "decided by the owner" for the owner's decisions; "Claude's call, open to the owner" for a call made without them. A grilling's answers go into its issue as a numbered Decisions list.
- **ADRs:** a header line `**Status:** accepted · **Date:** YYYY-MM-DD · **Decided by:** …`. An accepted ADR changes only in its Status line; a reversal is a new ADR that supersedes it.
- The docs call the owner "the owner". The repository carries no email address of the owner's.

## Tests

- Every commit: the pre-commit hook runs the inbox checks, `tsc` and the lint (`.githooks/`, switched on by `npm install`).
- While working: the tests that cover the change. One Playwright run at a time: they share port 5199.
- Before a push: `npx tsc`, `npm run lint`, `npx vitest run` and the Playwright specs the change touches (`npm run test:changed` finds them); the deploy run runs all of Playwright and deploys only when green ([ADR-0015](docs/adr/0015-ci-runs-the-end-to-end-tests-before-a-deploy.md)).

## Agent skills

### Issue tracker

Local Markdown: one file per issue in `docs/issues/`, the inbox as the triage queue; GitHub Issues are for visitors. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default states and two categories, written at the start of an issue's Status line. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` (the glossary) and `docs/adr/` at the root. See `docs/agents/domain.md`.

## Releasing

Commit as you go. A push is a release (it deploys the site), and a release starts only on the owner's own "push" or "release"; a yes to a plan that mentions releasing is a yes to the plan, not the release. The steps: `docs/releasing.md`.
