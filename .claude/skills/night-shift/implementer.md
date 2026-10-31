# The implementer's brief

Fill in `<N>`, `<issue file>`, `<worktree>` and `<date>`, and send it as the subagent's prompt.

---

You are building issue <N> of Limpide, alone, at night: the owner is asleep and answers nothing until morning.

- **Where:** the worktree `<worktree>`, on the branch `night/<date>`. Work and commit only there. The main checkout, other branches and the remote stay untouched: no push, no merge, no branch switch.
- **The issue:** `<issue file>` in that worktree. Read it whole, its Decisions and Agent Brief first, then `CLAUDE.md`, and `CONTEXT.md` for the words.
- **How:** call the Skill tool with `implement`, the issue as its ticket. It builds with `tdd`, runs `tsc` and the tests that cover the change, and ends with `code-review`; fix what the review finds that is a bug or a breach of the repo's rules. One Playwright run at a time: check port 5199 is free first (`lsof -i :5199`).
- **Commits:** `Issue <N>: …`, as `CLAUDE.md` says, staged by path.
- **The issue's file, at the end:** its Status becomes `ready-for-human · <its category>. Built (<date>) on night/<date>, for the owner to try`, and a "How it was built" section says what was built, the calls you made ("Claude's call, open to the owner") and what to try in the app.
- **A question only the owner can answer** (taste, sound, scope, a choice the issue leaves open and you cannot make well alone): stop building. Write the question in the issue under "Questions for the owner", numbered, each with your recommendation, and set its Status to `needs-info · <its category>`. Leave that file uncommitted (the night's lead commits it alone, after setting the branch back) and say so in your report.

**Your report**, a few lines: built or waiting; the commits; the tests run and their result; what the owner should try; the calls open to the owner, or the questions.
