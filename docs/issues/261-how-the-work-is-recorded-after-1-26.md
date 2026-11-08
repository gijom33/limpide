# 261: How the work is recorded, after 1.26

**What to build:** The process ideas of the full review round on 1.26.1 that the owner kept (the inbox, 2026-11-07; reviews [4](../reviews/2026-11-07/4-ai-expert.md) and [10](../reviews/2026-11-07/10-methodology.md)):

1. **A queue of the calls open to the owner:** 225 lines still read "open to the owner" with nothing telling the ones the owner has seen from the ones not; two accepted ADRs (0020, 0021) still say open (reviews 4 and 10).
2. **"Done" with every acceptance box ticked or struck with a reason:** 68 of 201 done issues still had unticked boxes on 1.26.1 (review 10), 67 of 224 on 1.26.2 (review 12).
3. **An index of the issues** (number, title, Status), linked from the README (review 4).
4. **The README's "How this was built" naming the night shift** (review 4).

**Blocked by:** none

**Status:** done (2026-11-07). Built (2026-11-07) on night/2026-11-07 and merged into main on 2026-11-07, approved by the owner, untried: "Merge the night"; ships with the next release. In v1 as polish ([131](./131-v1.md)), decided by the owner (2026-11-07, "Yes" to the triage's process answers: these four kept, the others dropped).

## Agent Brief

**Category:** enhancement
**Summary:** One place listing the calls still open to the owner, done issues with every box ticked or struck, an index of the issues, and the README naming the night shift.

**Current behavior:** As the four items above say.

**Desired behavior:**
- One document lists every call still open to the owner, each with where it was made; a call the owner has since answered or let stand (a release that shipped it, an "All good") is marked so where it was made, and leaves the list. The two ADRs' Status lines say what the owner decided, the only change an accepted ADR may take.
- Every done issue's acceptance boxes ticked, or struck through with the reason; the release steps or the issue-tracker guide say a done issue has no unticked box.
- An index of the issues (number, title, Status's first words), kept by a script so it cannot drift, linked from the README.
- "How this was built" says what the night shift is, in a sentence or two, with a link to a morning report.

**Key interfaces:**
- The issue files' Status lines and acceptance boxes
- The ADRs' Status lines
- The README and the issue-tracker guide

**Acceptance criteria:**
- [ ] ~~The open-calls list exists, each line linked; the owner goes through it (a human step)~~ (the list exists and is linked, kept by a script; the owner's pass through it is the owner's own step)
- [x] No done issue has an unticked box without a strike and a reason
- [x] The index is generated and a check fails when it is stale
- [x] The README names the night shift

**Out of scope:** merges waiting for the owner's play, failing tests committed first, a published roadmap, splitting the App component (all dropped by the owner, 2026-11-07).

## How it was built

Built at night, 2026-11-07, light tier, test-first where there was behaviour (the script).

- **The script,** `scripts/issueRecord.ts` with its unit tests in `scripts/issueRecord.test.ts`. `npm run issues` writes two pages from the files: [the index](../issues.md) (each issue's number, title linked, and its Status's first words, the open ones in a table of their own first) and [the calls open to the owner](../open-calls.md) (every line of the issues, the inbox and the ADRs' Status lines that still reads "open to the owner", each linked to where it was made; under a heading of calls, each item of its list). `npm run issues:check` fails while either page is stale or a done issue has an unticked box.
- **Where it runs:** the pre-commit hook (`.githooks/pre-commit`) runs the check on the staged files of any commit that touches the issues, the inbox, the ADRs or the two pages; the release steps' local suite names `npm run issues:check`; the issue tracker's guide says where the pages are, how a call closes, and that a done issue has no unticked box.
- **The calls a release shipped:** 467 lines whose call, as it reads, was in a release's files now read "let stand by the owner in X.Y.Z", the first release that carried the line. Two answered on their own line say so instead (141's "since reversed by the owner", 208's "since decided by the owner"). ADR-0020 and ADR-0021's Status lines say "let stand by the owner in 1.23.0" and "in 1.24.0", their issues 186 and 227 accepted by the owner on 2026-11-04; so do the Status lines of ADR-0016 and ADR-0022. No ADR's body changed; the rule as quoted (ADR-0010, issue 56) stays. What is left on the list: the calls of the issues built on 2026-11-07 (251 to 267), ADR-0017's narrowing by 255, and 264's triage, none released yet.
- **The done issues' boxes:** 175 boxes in 66 done issues were unticked. All are struck through with "(not checked at the time)"; none is ticked after the fact.
- **The README:** step 2 links the index; a step 8 says what the night shift is, linking [the night shift's page](../night-shift.md) and the report of [the night of 2026-11-06](../night/2026-11-06.md), now kept in the repository (`.gitignore` keeps the others out); the paragraph on who decides points to the open calls. Issue 259's wording of the commit credit stays.

**Claude's calls, open to the owner:**

1. A release that shipped a call counts as the owner letting it stand, for every call whose line was in a release's files: the inbox's triage and drops too, not only the issues' decisions, since each was in a night report or a day's chat before the owner said "push". To reopen one, put back "open to the owner" where it was made and run `npm run issues`.
2. Every unticked box of a done issue is struck as "not checked at the time", none ticked: some could be ticked on evidence (a released issue's "Every test passes in Linux's fonts too" passed GitHub's run before its push), but finding the evidence box by box was not done tonight.
3. The index is `docs/issues.md`, beside `docs/issues/` rather than in it, so the guide's `grep` queries over `docs/issues/*.md` still read issue files only. A Status's first words end at its first full stop, comma, colon or semicolon.
4. The open-calls list is generated and checked like the index, not kept by hand, so a call closed where it was made leaves the list at the next `npm run issues`. A line that only names the calls ("the calls still open to the owner") or quotes the rule is not a call; an ADR's calls are read from its Status line alone.
5. The hook reads the staged files, so another session's unstaged edits never fail a commit, and checks only a commit that touches the record. A merge runs no pre-commit hook: a merge of two branches that both changed issues may leave the pages stale or in conflict; `npm run issues` after the merge settles both (never resolve the pages by hand).
6. The release steps do not yet turn a release's calls into "let stand": that would be a new release rule, beyond this issue's naming of the check. Without it the list grows until someone marks the shipped calls. Recommendation: a line in step 4, beside the shipped issues' Status lines, on the owner's word.
7. The kept morning report is 2026-11-06's: a full night, short, no one quoted. Before merging this branch, delete the main checkout's untracked copy of `docs/night/2026-11-06.md` (the same file), or git refuses the merge.
8. The tdd skill asks for the seams to be agreed first; with the owner asleep, they were the script's four pure functions (the index, the calls, the boxes, the check), tested through their inputs and outputs.

**Try:**
- `npm run issues:check` passes; change an issue's Status, stage it and commit: the hook stops the commit until `npm run issues` has run.
- Read [the open calls](../open-calls.md) and go through them: accept, reverse or leave each, where it was made (the human step of the first box).
- Read [the index](../issues.md) and the README's "How this was built" on GitHub, once merged.
