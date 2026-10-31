# The night shift

While the owner sleeps, Claude builds the issues that need nothing from the owner. In the morning the owner tries them and says what goes into `main` and whether to release. The owner's idea (the inbox, 2026-10-31), set up as Claude proposed. The steps are in the `night-shift` skill (`.claude/skills/night-shift/`).

## How a night runs

- **When:** a scheduled task in the Claude desktop app starts it every evening at 23:00. New issues start until 05:00 and the night ends by 07:00, with at most four issues built.
- **Where:** a worktree at `~/limpide-night/<date>`, on the branch `night/<date>` cut from `main`. It was first put outside iCloud, whose syncing breaks git operations with many steps (a rebase on 2026-10-29 stopped midway and left the "… 2" copies); since 2026-10-31 the checkout itself is outside it, at `~/Developer/Limpide`. The main checkout, `main` and the other sessions' branches stay as they were.
- **What:** each issue whose Status is `ready-for-agent` and whose blockers are done, unless another session's worktree or unmerged branch carries its number. Bugs come first.
- **How:** one subagent per issue with a fresh context. It runs `/implement`, which builds with `/tdd` and ends with `/code-review`. Issues run one at a time, because the Playwright tests share port 5199.
- **A question for the owner** stops that issue, not the night: the question goes into the issue with Claude's recommendation, its Status becomes `needs-info`, and its code is set aside.
- **Nothing is pushed.** A push is a release, and the owner's word alone starts one ([CLAUDE.md](../CLAUDE.md)).

## The morning (the owner)

1. Read the report, `docs/night/<date>.md`. It is git-ignored and also shown as the scheduled task's last message: what was built, what to try, the questions, the suite's results.
2. Try the night's issues: `cd ~/limpide-night/<date> && npm run dev`, or ask Claude to open it in the browser.
3. Answer the questions in the issues that wait on you.
4. Tell Claude what to merge: "merge the night" (all of it) or the issues you want. Claude merges `night/<date>` into `main`, removes the worktree (unlinking its `node_modules` first, which is the main checkout's own), and releases only on your "release".
5. Now and then, `/retro` on a night's log, for checks or rules that would have saved the night a mistake.

## What it needs

- **The Mac awake at 23:00:** the app's keep-awake setting (on) holds it awake only while Claude works, so it cannot stop the Mac idle-sleeping before the task starts. Leave the Mac on its charger with the lid open, and in System Settings → Battery → Options (or Energy) turn on "Prevent automatic sleeping on power adapter when the display is off". A task due while the Mac sleeps runs when it wakes; after 05:00 it builds nothing and only reports.
- **The Claude app open.** A task due while it is closed runs at the next launch.
- **Auto permission mode:** the task is saved in Auto, so a permission prompt doesn't hold up the night. Change it by editing the task, under Scheduled in the app's sidebar.
- **Usage:** a night of four issues uses about as much as four issues built by day.
