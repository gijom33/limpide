# The night shift

While the owner sleeps, Claude builds the issues that need nothing from the owner. In the morning the owner tries them and says what goes into `main` and whether to release. The steps are in the `night-shift` skill (`.claude/skills/night-shift/`); why the rules are these: [issue 177](issues/177-a-leaner-night-shift.md).

## How a night runs

- **When:** a scheduled task in the Claude desktop app starts it every evening at 23:00. New issues start until 07:00; the queue or the clock ends the night, then the night's suite runs and the report is written.
- **Its own session:** the night runs in the scheduled task's session. A night started by hand from a day session starts a new session for it, so the lead's context holds the night alone.
- **Where:** a worktree at `~/limpide-night/<date>`, on the branch `night/<date>` cut from `main`, outside iCloud (whose syncing breaks git operations with many steps). The main checkout, `main` and the other sessions' branches stay as they were.
- **What:** each issue whose Status is `ready-for-agent` and whose blockers are done, unless another session's worktree or unmerged branch carries its number. Bugs come first.
- **A quiet machine:** the night starts no dev server and opens no browser pane; reviews, research and prototypes run by day. The report notes the load average at the start; above 8, it says the results may carry load flakes.
- **Tiers:** the lead names each issue's tier in its brief, judging by what the change can break; in doubt, full.
  - **Light** (for example words, labels, tips, docs, one panel's layout): `tsc`, the lint, the touched unit tests and the touched Playwright specs in Chromium, one review pass of its own diff.
  - **Full** (for example the engine, MIDI, Bead's motion, layouts across widths, stored settings): the same, plus the touched specs in WebKit and the `code-review` skill.
- **Builders:** one subagent per full issue, or up to four light issues in one, each with its own commits and its own report section. One at a time, since the Playwright tests share port 5199. No builder runs the whole suite.
- **The night's suite:** once, at the end, all of it in both browsers: the unit suite, then Playwright, one run at a time and never beside each other. A failure is rerun alone before it is called real.
- **Layouts measured first:** before briefing an issue that says where something goes on screen, the lead checks its criteria against the page at the widths they name, with a headless Playwright measurement.
- **Updates:** one line per issue, to the report and to the owner.
- **A question for the owner** stops that issue, not the night: the question goes into the issue with Claude's recommendation, its Status becomes `needs-info`, and its code is set aside.
- **Nothing is pushed.** A push is a release, and the owner's word alone starts one ([CLAUDE.md](../CLAUDE.md)).

## The morning (the owner)

1. Read the report, `docs/night/<date>.md`. It is git-ignored, but for [one kept as an example](night/2026-11-06.md) (issue 261), and also shown as the scheduled task's last message: the load at the start, what was built and in which tier, what to try, the questions, the suite's results.
2. Try the night's issues: `cd ~/limpide-night/<date> && npm run dev`, or ask Claude to open it in the browser.
3. Answer the questions in the issues that wait on you.
4. Tell Claude what to merge: "merge the night" (all of it) or the issues you want. Claude merges `night/<date>` into `main`, removes the worktree (unlinking its `node_modules` first, which is the main checkout's own), and releases only on your "release".
5. Now and then, `/retro` on a night's log, for checks or rules that would have saved the night a mistake.

## What it needs

- **The Mac awake at 23:00:** the app's keep-awake setting (on) holds it awake only while Claude works, so it cannot stop the Mac idle-sleeping before the task starts. Leave the Mac on its charger with the lid open, and in System Settings → Battery → Options (or Energy) turn on "Prevent automatic sleeping on power adapter when the display is off". A task due while the Mac sleeps runs when it wakes; after 07:00 it builds nothing and only reports.
- **A quiet Mac:** close busy browser tabs, stop the day's dev servers, and leave no other Claude session working.
- **The Claude app open.** A task due while it is closed runs at the next launch.
- **Auto permission mode:** the task is saved in Auto, so a permission prompt doesn't hold up the night. Change it by editing the task, under Scheduled in the app's sidebar.
- **Usage:** each issue uses about as much as the same issue built by day; a light one, batched, less.
