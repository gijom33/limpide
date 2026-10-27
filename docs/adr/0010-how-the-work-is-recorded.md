# How the work is recorded

**Status:** accepted · **Date:** 2026-10-27 · **Decided by:** the owner (grilling of [issue 56](../issues/56-ready-for-contributors.md))

Limpide is built by one owner directing Claude Code, a commit every few minutes. The methodology review ([review 10](../reviews/2026-10-26/10-methodology.md)) and the AI-expert review ([review 4](../reviews/2026-10-26/4-ai-expert.md)) found the method sound but its record patchy: 40 % of commits named an issue, subjects ran to hundreds of characters, ADRs had no status or date and were edited in place (ADR-0007 reversed within 50 minutes by rewriting it), Claude's own calls were unmarked, ideas were triaged before their words were ever committed, and no code review had run. So from 1.11.1 on:

1. **Commits name their issue, briefly.** A subject of at most 72 characters, starting `Issue N:` or `No issue:`; the detail in the body. Commits already pushed stay as they are.
2. **Inbox lines are committed before triage.** The owner's bug or idea goes into `docs/inbox.md` in the owner's words, in a commit of its own; triage (an issue, or Dropped with the reason) is the next commit. The owner's words and the no's stay in the history.
3. **Who decided is written down.** The owner's decisions say "decided by the owner"; a call Claude makes alone says "Claude's call, open to the owner". A grilling's answers go into its issue as a numbered Decisions list.
4. **ADRs have a status, a date and who decided, and are then frozen.** Once accepted, an ADR changes only in its Status line; a reversal is a new ADR that supersedes it. The nine before this one were given the header from git (the date each was added); where the record names no one, "Claude, accepted by the owner".
5. **A code review at each minor version.** Before a minor release is pushed, the code-review skill (Standards and Spec) runs over everything since the last minor tag; the bugs it finds are fixed before the push, the rest goes to the inbox. Patch releases skip it.
6. **The habits live in `CLAUDE.md`** at the root, which every Claude Code session reads, so they hold without being repeated; this ADR records the decision and its reasons.

## Considered Options

- **Keep the habits in the owner's private memory for Claude** (where push-on-request and version-on-push lived): invisible to a visitor, and a reviewer looking for how the agent is steered finds nothing.
- **Conventional commits** (`feat:`, `fix:`), as the first 38 commits had: they say the kind of change, not which issue it serves; the issue number is what links a commit to its why.
- **Rewrite the long subjects already pushed**: rewriting published history breaks every link to those commits, for a cosmetic gain.

## Consequences

- A commit's subject reads whole on GitHub, and `git log --grep "Issue 53:"` finds an issue's commits.
- More commits: an idea costs two (its line, then its triage).
- A reversed decision is a new ADR, so ADRs multiply; each stays true to the day it was made.
- A minor release waits for a review; its findings arrive through the inbox like any other.
