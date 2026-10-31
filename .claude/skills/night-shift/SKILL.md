---
name: night-shift
description: The night shift: build the ready-for-agent issues unattended, on a night branch, while the owner sleeps.
disable-model-invocation: true
---

# The night shift

The owner is asleep, so nobody answers until morning. You build the issues that need nothing from the owner, one at a time, each in a fresh subagent, on a **night branch**, and leave a **morning report**. Why it runs this way: [`docs/night-shift.md`](../../../docs/night-shift.md).

**The checkout** is `~/Documents/Claude/Projects/Limpide`, called `main checkout` below. The night works in a worktree at `~/limpide-night/<date>`, outside iCloud, since iCloud's sync breaks git operations with many steps. The date is the evening's, `YYYY-MM-DD`.

## The night's bounds

- **The night ends** at 07:00. Start a new issue only before 05:00, and stop at **four issues built**.
- **The night branch is the only branch that moves.** The main checkout, `main`, `origin` and every other session's branch stay as they are. A push is a release and is the owner's word alone, so the night ends with everything local.
- **A decision for the owner is written down, not taken.** A question only the owner can answer (taste, sound, scope, anything an issue's Decisions leave open) goes into the issue as a numbered question with Claude's recommendation, and the issue waits for the morning. A call the issue leaves to Claude is made and marked "Claude's call, open to the owner", as every day.

## Steps

1. **Set up.** In the main checkout, `git fetch`. Then:
   - `git worktree add ~/limpide-night/<date> -b night/<date> main`, and symlink the main checkout's `node_modules` into it;
   - note the starting commit (`git rev-parse HEAD`) for the report.

   If `night/<date>` already exists, the night is already running or has run: write the report's first line saying so, and end.
2. **The queue.** Read the Status and Blocked by lines of every issue in `docs/issues/` (skip files whose name ends in ` 2.md`, which are iCloud copies). An issue is on the queue when all of these hold:
   - its Status starts `ready-for-agent`;
   - each issue named under Blocked by has a Status starting `done`;
   - no other worktree's branch carries its number (`git worktree list` shows names such as `claude/osc2-pitch-98-…`), and no unmerged branch does (`git branch --no-merged main`): another session is building it, even if it has not committed yet.

   Order: bugs first, then by number. Write the queue at the top of the report. Done when every ready-for-agent issue is either queued or listed with the reason it is not.
3. **Each issue, in turn.** While the clock and the count allow:
   1. Note the branch tip (`git rev-parse HEAD`).
   2. Start one implementer subagent with the brief in [implementer.md](implementer.md), filled with the issue's number, file and the worktree's path. Wait for its report; run one at a time, since the Playwright tests share port 5199.
   3. Check its work in the worktree: the commits are on `night/<date>`, `npx tsc` and `npm run lint` are green, and the issue's Status says what the report says.
   4. **Built:** add it to the report. **Waiting on the owner,** or the checks red after one attempt to fix: copy the issue file aside as the subagent left it, `git reset --hard` to the noted tip, put the file back, and commit it alone (`Issue <N>: the night's questions for the owner`), its Status `needs-info` (for red checks, the question is what failed). Add it to the report with why.
4. **The whole branch.** Once the queue or the night ends: in the worktree, `npx tsc`, `npm run lint`, `npx vitest run`, then the Playwright specs the night touched (`npx playwright test --only-changed=main`). Before Playwright, check that port 5199 is free (`lsof -i :5199`); if it is taken, wait in 5-minute steps up to 30 minutes, then write that it was not run. A red test is looked into once; one you cannot make green is written in the report with its output, and the issue it belongs to marked so.
5. **The morning report.** Write it to the main checkout's `docs/night/<date>.md` (git-ignored), and repeat it as your final message:
   - the first line: how many issues built, how many waiting on the owner, and whether the suite is green;
   - the branch and its commits since the starting commit;
   - for each issue built: what it does in a sentence, what to try in the app and how, and the calls marked "open to the owner";
   - for each issue waiting: its questions, briefly;
   - the issues not queued, and why;
   - the suite's results.
