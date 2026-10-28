# Following the AI Hero skills

**Status:** accepted · **Date:** 2026-10-28 · **Decided by:** the owner (grilling of 2026-10-28, questions 1 to 14)

The owner asked to "clean the backlog and catch up with the AI Hero methodology before moving forward". Limpide had followed Matt Pocock's skills since the start (PRD, issues, ADRs, `CONTEXT.md`, grillings), but never ran their setup: no `docs/agents/` told `/triage`, `/to-tickets` or `/implement` where the issues live, issue Status lines were free text ("built, to verify on the real C16", "to diagnose first"), a rejected idea lived only as a line in the inbox's Dropped list, and nothing checked a commit before it was made. So, after 1.14.0:

1. **The issues stay in `docs/issues/`**, one numbered file each, and `docs/agents/issue-tracker.md` says so, for the skills that read and write issues. GitHub Issues stay for visitors.
2. **`CONTEXT.md` stays the glossary.** `docs/agents/domain.md` names it, so either copy of the skills (one says `GLOSSARY.md`, the other `CONTEXT.md`) finds it.
3. **An open issue's Status line is a triage state and a category:** `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human` or `wontfix`, then `bug` or `enhancement` (`docs/agents/triage-labels.md`). A check only the owner can make (the real C16, a friend's phone, a listen) is `ready-for-human`. Finished issues keep the Status they were closed with (`done`, `closed`, `superseded`); nothing is rewritten.
4. **The inbox stays as it is**: the owner's words, committed alone, then triage in the next commit (ADR-0010, point 2). It is the `needs-triage` queue. A small thing is still done at once; a bigger one becomes an issue with a triage state, where `/triage` applies.
5. **A rejected feature idea goes to `.out-of-scope/`**, one file per concept, with the reason, so a later request for the same thing finds the earlier answer. The inbox's Dropped list keeps everything else (a slip already made, a bug that is not one, something already built).
6. **A new `ready-for-agent` issue carries an Agent Brief**: current and desired behaviour, the interfaces involved, acceptance criteria to tick, what is out of scope; no file paths or line numbers, which go stale. File paths stay in the "how it was built" notes written once the work is done.
7. **`CLAUDE.md` gains the skills' "Agent skills" block**, pointing at `docs/agents/`; the house rules stay where they are.
8. **A pre-commit hook runs `tsc` and the lint** (under three seconds). The tests stay as they were: the ones covering a change while working, the full suite before a push.

None of ADR-0010 is reversed: this adds to it. The same grilling also closed issues 13, 49 and 54, cut 42 down to the LinkedIn tap-through, turned the inbox's code tidy-ups into issue 70 and two of its questions into issue 71, and set the order of work: this setup, the issue clean-up, the fixes from issue 69's review, then 68, 70, 71 and 66 each in a fresh session with `/implement` (66 through `/diagnosing-bugs`).

## Considered Options

- **Move the issues to GitHub Issues**, the skills' default: the numbered files, their links from the inbox, the ADRs and 69 issues of history would all need moving, and GitHub Issues are where visitors write; mixing the owner's plan into them hides both.
- **Move the issues to `.scratch/<feature>/`**, the skills' local default: the same move for no gain; `docs/issues/` is already one file per issue.
- **Rename `CONTEXT.md` to `GLOSSARY.md`**: the user-level copy of the skills says `GLOSSARY.md`, the plugin copy `CONTEXT.md`; naming the file in `docs/agents/domain.md` serves both without a rename.
- **Rewrite every Status line**, finished issues included: churn in 60 files that nobody triages again.
- **Run the tests in the hook too**: the unit tests take seconds, Playwright minutes; a hook that slow gets skipped.

## Consequences

- `grep -l '^\*\*Status:\*\* ready-for-human' docs/issues/*.md` lists what waits on the owner; `ready-for-agent` lists what a fresh session can take.
- A commit that fails `tsc` or the lint is refused before it is made. The hook is switched on by `npm install` (the `prepare` script sets `core.hooksPath`); `git commit --no-verify` skips it.
- Briefs make a new issue longer to write and quicker to hand to a fresh session.
