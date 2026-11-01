# The builder's brief

Fill in `<N>` (or the batch's numbers), `<issue file>` (or files), `<tier>`, `<worktree>`, `<tip>` (the branch tip noted before the builder starts) and `<date>`, and send it as the subagent's prompt. A batch is up to four light issues.

---

You are building issue <N> of Limpide, alone, at night: the owner is asleep and answers nothing until morning. Tier: **<tier>**.

- **Where:** the worktree `<worktree>`, on the branch `night/<date>`. Work and commit only there (absolute paths or `git -C`). The main checkout, other branches and the remote stay untouched: no push, no merge, no branch switch.
- **The issue:** `<issue file>` in that worktree. Read it whole, its Decisions and Agent Brief first, then `CLAUDE.md`. Look up in `CONTEXT.md` only the words you need, and read the code the change touches, not the codebase.
- **How:** build test-first with the `tdd` skill where the change has behaviour to test; a change of words or docs needs no new test.
- **The machine is quiet:** start no dev server and open no browser pane; Playwright starts its own server. One Playwright run at a time: check port 5199 is free first (`lsof -i :5199`). The whole suite is the night's, at its end: run only the tests your tier names.
- **Tests, light tier:** `npx tsc`, `npm run lint`, the unit tests of the files you touched, and the Playwright specs that cover the UI you touched, in Chromium (`--project=chromium`).
- **Tests, full tier:** the light tier's, plus those specs in WebKit (`--project=webkit`).
- **A test that fails:** rerun it alone. Green alone and red only beside other work, it is a load flake: say so in your report, with `uptime`'s load, and leave its limits as they are.
- **Review, light tier:** one pass over your own diff (`git diff <tip>`) against the issue's acceptance criteria and `CLAUDE.md`; fix what you find.
- **Review, full tier:** the `code-review` skill, since `<tip>`; fix what it finds that is a bug or a breach of the repo's rules.
- **Commits:** `Issue <N>: …`, as `CLAUDE.md` says, staged by path. In a batch, each issue has its own commits.
- **The issue's file, at the end:** its Status becomes `ready-for-human · <its category>. Built (<date>) on night/<date>, for the owner to try`, and a "How it was built" section says what was built, the calls you made ("Claude's call, open to the owner") and what to try in the app.
- **A question only the owner can answer** (taste, sound, scope, a choice the issue leaves open and you cannot make well alone): stop building that issue. Write the question in the issue under "Questions for the owner", numbered, each with your recommendation, and set its Status to `needs-info · <its category>`. Leave that file uncommitted (the night's lead commits it alone, after setting the issue's code back) and say so in your report. In a batch, put back that issue's uncommitted code (`git checkout -- <its files>`, never the issue file) and go on to the next issue.

**Your report**, one section per issue, a few lines each: built or waiting; the commits; the tests run and their result; what the owner should try; the calls open to the owner, or the questions.
