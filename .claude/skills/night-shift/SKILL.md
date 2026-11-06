---
name: night-shift
description: The night shift: build the ready-for-agent issues unattended, on a night branch, while the owner sleeps.
disable-model-invocation: true
---

# The night shift

The owner is asleep, so nobody answers until morning. You are the night's **lead**: you build the issues that need nothing from the owner through builder subagents, one at a time, on a **night branch**, and leave a **morning report**. Why it runs this way: [`docs/night-shift.md`](../../../docs/night-shift.md).

**The checkout** is `~/Developer/Limpide`, called `main checkout` below. The night works in a worktree at `~/limpide-night/<date>`, apart from the main checkout. The date is the evening's, `YYYY-MM-DD`.

## The night's bounds

- **Its own session.** The night runs in the scheduled task's session. If this conversation already holds a day's work (the night was started by hand from a day session), start a new session for the night and end here.
- **The clock.** Start a new builder until 07:00. The queue or the clock ends the building; then the night's suite (step 4) and the report.
- **A quiet machine.** The machine is the night's alone: start no dev server, open no browser pane, run no side job (a review, research, a prototype) beside a builder. Playwright starts its own server for its run.
- **The night branch is the only branch that moves.** The main checkout, `main`, `origin` and every other session's branch stay as they are. A push is a release and is the owner's word alone, so the night ends with everything local.
- **A decision for the owner is written down, not taken.** A question only the owner can answer (taste, sound, scope, anything an issue's Decisions leave open) goes into the issue as a numbered question with Claude's recommendation, and the issue waits for the morning. A call the issue leaves to Claude is made and marked "Claude's call, open to the owner", as every day.
- **Updates are one line per issue**, to the report and to the owner: its number, built or waiting, its tier, the time. A notice that a builder is still waiting on its own background work gets no message.

## Tiers

Every issue is **light** or **full**; you name the tier in its builder's brief, and the report shows it. The lists are examples: judge by what the change can break.

- **Light:** words, labels, tips, docs, one panel's layout. The builder runs `tsc`, the lint, the touched unit tests and the touched Playwright specs in Chromium, and makes one review pass of its own diff.
- **Full:** the engine, MIDI, Bead's motion, layouts across widths, stored settings. The light checks, plus the touched specs in WebKit and the `code-review` skill.

An issue in doubt is full. No builder runs the whole suite in either tier; the night runs it once, in step 4.

## Steps

1. **Set up.** In the main checkout, `git fetch`. Then:
   - `git worktree add ~/limpide-night/<date> -b night/<date> main`, and symlink the main checkout's `node_modules` into it;
   - note the starting commit (`git rev-parse HEAD`) and the load average (`uptime`) for the report. Above 8, the report says the night's results may carry load flakes.

   If `night/<date>` already exists, the night is already running or has run: write the report's first line saying so, and end.
2. **The queue.** Read the Status and Blocked by lines of every issue in `docs/issues/` (skip files whose name ends in ` 2.md`, which are iCloud copies). An issue is on the queue when all of these hold:
   - its Status starts `ready-for-agent`;
   - each issue named under Blocked by has a Status starting `done`, or was built tonight on `night/<date>` (its Status in the worktree says `Built (<date>) on night/<date>`): it then builds on top of that work;
   - no other worktree's branch carries its number (`git worktree list` shows names such as `claude/osc2-pitch-98-…`), and no unmerged branch does (`git branch --no-merged main`): another session is building it, even if it has not committed yet.

   Order: bugs first, then by number. Give each issue its tier, and group light issues that follow each other into batches of up to four. Write the queue, with the tiers and batches, at the top of the report. Done when every ready-for-agent issue is either queued or listed with the reason it is not. After each builder, read the queue again from the worktree's issue files: an issue whose blockers were built tonight joins it (the owner, 2026-11-05: "do as many as possible, including the newer code refactoring ones"). One whose blocker is waiting on the owner stays off it, with that reason.
3. **Each builder, in turn.** While the clock allows:
   1. **Layouts measured.** If the issue (or one in the batch) says where something goes on screen, check its criteria against the page at the widths they name, with a short headless Playwright measurement: a throwaway spec in the worktree's `e2e/`, port 5199 free, deleted after, never committed. A criterion the page cannot meet (no room at a width) is a question for the owner: write it into the issue as step 3.5 says, and skip the issue.
   2. Note the branch tip (`git rev-parse HEAD`).
   3. Start one builder subagent with the brief in [implementer.md](implementer.md), filled with the issue's number (or the batch's numbers), file, tier, the worktree's path, the date and the noted tip. Wait for its report: one builder at a time, since the Playwright tests share port 5199.
   4. Check its work in the worktree: the commits are on `night/<date>`, `npx tsc` and `npm run lint` are green, and each issue's Status says what the report says.
   5. **Built:** add it to the report. **Waiting on the owner,** or the checks red after one attempt to fix: copy the issue file aside as the builder left it; set the branch back, with `git reset --hard` to the noted tip for a single issue, or in a batch with `git checkout -- .` and a `git revert` of that issue's commits alone, keeping the others' (red checks the batch's report cannot pin on one issue set the whole batch back); put the file back, and commit it alone (`Issue <N>: the night's questions for the owner`), its Status `needs-info` (for red checks, the question is what failed). Add it to the report with why.
4. **The night's suite.** Once the building ends, in the worktree, one command at a time, each after the last has ended:
   1. `npx tsc` and `npm run lint`;
   2. `npx vitest run`;
   3. `npx playwright test`, the whole suite in both browsers. Before it, check that port 5199 is free (`lsof -i :5199`); if it is taken, wait in 5-minute steps up to 30 minutes, then write that it was not run.

   Rerun each failure alone (`npx vitest run <file> -t '<name>'`, `npx playwright test <file>:<line> --project=<browser>`). Green alone, it is a load flake: list it as one, with the load (`uptime`) at the time. Red alone, it is real: look into it once; one you cannot make green is written in the report with its output, and the issue it belongs to marked so.
5. **The morning report.** Write it to the main checkout's `docs/night/<date>.md` (git-ignored), and repeat it as your final message:
   - the first line: how many issues built, how many waiting on the owner, and whether the suite is green;
   - the load at the start, with the warning above 8;
   - the branch and its commits since the starting commit;
   - for each issue built: its tier, what it does in a sentence, what to try in the app and how, and the calls marked "open to the owner";
   - for each issue waiting: its questions, briefly;
   - the issues not queued, and why;
   - the suite's results: the real failures, then the load flakes.
