# Persona review 10: the software development methodology expert

Ran on 1.26.1 on 2026-11-07: `main` at `38df0ad`, about 30 minutes. Read `CLAUDE.md`, `CODING_STANDARDS.md`, `docs/prd.md`, `docs/agents/`, `docs/releasing.md`, `docs/night-shift.md`, the 22 ADRs, the 252 issues' Status lines and criteria, `docs/inbox.md`, `.githooks/`, the CI workflow, `gh run list` and `gh release list`, and `git log` (1,481 commits, 1,003 of them since my last run at `328a370`). I judge the process, not the synth.

## First impression

"Twelve days ago this was 206 commits; now it's 1,481, a thousand of them in the last eight days. The scaffolding has grown with it: a release branch before `main`, a night shift with tiers, a release log, a statistics page. The inbox is empty, which on a project this busy is rare. My question has changed. Last time it was whether the rules hold. Now it's whether one owner can still direct something that moves this fast, or whether the method is quietly turning into the agent directing itself while the owner signs off."

## What I tried, in order

1. **History shape.** 1,003 commits since 1.16.0: 209 on 10-31, about 100 to 170 a day after that. The median issue takes 3 commits, and the pattern is consistent: the build, "the review's fixes", "built, for the owner to try". These are small slices with a definition of the work up front, which is what an XP or Kanban coach would want to see.

2. **Trace a story: PRD story 102 (Legato) → issue 119 → commits → tests.** The story names issue 119. The issue has an Agent Brief, six acceptance boxes, a "How it was built", five numbered "Claude's calls" and the owner's verdict ("Perfect."). `git log --grep '^Issue 119:'` gives five commits (`c510bb0`, `935bd4a`, `6cb326e`, `a28b66c`, `e4d0f3b`). The tests carry the number: `describe('Legato (issue 119)')` in `synthEngine.browser.test.ts`, and two `voices.spec.ts` tests ending "(issue 119)". **The trace is complete in both directions.** The older part of the PRD doesn't trace that way. Only 16 of 104 stories name an issue, and only 12 issues cite a story number, so stories 1 to 68 are linked to tickets 01 onward by words only. 401 of 2,034 tests name an issue.

3. **Is TDD visible?** I sorted every commit by its files: 525 change code and tests together, 85 only code, 121 only tests (mostly waits and skips for slow WebKit). The red step never gets a commit of its own. The night shift's implementer brief says "build test-first with the `tdd` skill", 58 issues say "test-first" or "red without the fix", and 18 commit bodies say so too (`4578fa9`: "a test changes Mode in that gap (red without the fix)"). But Legato's three build commits landed within 45 seconds of each other (19:21:21 to 19:22:06), sliced by topic out of a finished working tree. The history is curated after the fact. It doesn't record the order the work was done in, so test-first can be claimed but not checked.

4. **Are the issues' definitions of done honoured?** 147 issues have acceptance criteria. Of the 201 done issues with checkboxes, **68 still have at least one unticked box, and 28 have none ticked at all**: 151 (Bead points the way) has 10 boxes, none ticked; 231 (the band-pass make-up), done on 11-06 and released in 1.26.0, has six, none ticked. The most common box left unticked is "Every test passes in Linux's fonts too" (14 issues). An issue becomes `done` on the owner's word after trying it ("Fine.", "Sounds fine"). That's a sound XP customer acceptance, but the checklist isn't what closes the issue, so a reader can't tell which criteria were met and which were let go.

5. **Who decides?** In the issues, "Claude's call" now appears 373 times and "decided by the owner" 271 times. On 10-30 it was 50 against 109. 225 calls still read "open to the owner", and nothing lists which of them the owner has actually looked at. The owner's acceptance is thinning the same way: 1.24.0 was "tried in part by the owner and the rest trusted", and 1.26.1 was "approved by the owner untried: 'It's fine, I trust you.'" ADR-0021 is itself "Claude's call, open to the owner".

6. **ADRs.** All 22 have the Status · Date · Decided by header. No accepted ADR's body has changed since the freeze rule (10-27), except 0016, which was amended on 10-31 during its own issue's review, before release. Amendments now point forward from the Status line (0004, 0006, 0007, 0009, 0010, 0012, 0013, 0015, 0018, 0020). Two smells remain. Some Status lines are turning into changelogs: ADR-0018's carries a layout move from issue 154 ("from 861 px the BPM and Tap are a column of their own"), and ADR-0017's is "corrected by issue 145, decision 17", so an issue amends an ADR without a new ADR. And 8 of the 22 name no alternative (0002, 0004, 0009, 0014, 0017, 0018, 0020, 0021). 0012 and 0016 are model ones, with Considered Options.

7. **Release and versioning.** `docs/releasing.md` is now the one home of the rules (ADR-0016). The order is a code review, the local suite, version and release log, the release branch on GitHub, the word checks, then `main`, then the tag and the Release. 40 tags, each with a release log line. Since the owner's rule of 10-27, a version is tagged only once it is live (`v1.12.2` and `v1.12.3`, from before that rule, still tag commits that never deployed, and the release log says so). The release branch fixed last run's finding: the gate before the push is now GitHub's own run. One caveat: during 1.22.0, `917fb75` and `2b1a8e4` were each green on `release/1.22.0` and then red on `main` for the same commit, so a green run was a sample, not proof. After issues 224, 232 and 247 (Playwright's image, one WebKit worker per job), 1.25.0, 1.26.0 and 1.26.1 went green first time on both. The cost is seven animation tests skipped on GitHub's WebKit. Two releases on one morning (1.26.0 at 05:59, 1.26.1 at 10:04 UTC) is continuous delivery, and the versioning (patch by default, minor for visible features) is applied as written.

8. **The review loop.** Every release's code review leaves a "tidy-ups after X" issue (196, 228, 238, 246, 250, 251), which becomes the next release, which is reviewed again. That's a healthy ratchet. But v1's exit condition is "the last review round finds only nitpicks; the owner says when", and nothing measures whether the rounds are converging. About 120 issues have opened since v1 was framed as "polish only" on 10-31, two new Tutorials (233, 234) among them, filed as polish of the learning.

9. **Inbox and triage.** The inbox has no untriaged lines. Dropped gives a reason and says who decided, `.out-of-scope/` has 15 files, and every open issue has one state and one category. 251, `ready-for-agent`, has its Agent Brief and no file paths. One slip: issue 251 was created in a commit titled `No issue:` (`4578fa9`).

## What worked

- **Last run's three findings were all acted on.** "No issue" now covers 29 of 376 source-changing commits (it was 47 of 104), and the remaining ones are the release-time review fixes. The pre-push gate is GitHub's own Linux run, on a release branch. Process rules have one home, and amended ADRs point forward.
- **The best-traced feature work I have seen in a repo this size.** Story to issue to commits to test names, with who decided each point.
- **Process as tested code.** The commit-message and inbox rules run as hooks with their own unit tests. The release steps are a numbered procedure, and the CI workflow comments say why each job is shaped as it is (issue numbers included).
- **Saying no is recorded.** An empty inbox, Dropped with reasons, `.out-of-scope/`, and v2 kept as "not committed".
- **A ubiquitous language actually enforced.** `CONTEXT.md` (353 lines) is held to by the coding standards, test names and Playwright's accessible names. That's DDD's glossary doing real work, not decoration.

## Where I got stuck

- **I can't verify test-first.** The history shows tests and code arriving together, committed in topic slices seconds apart. The red step lives only in prose. The night reports, where a red run might be logged, are git-ignored.
- **"Done" means two different things.** The owner's verdict closes the issue; the checkboxes are a plan that's sometimes ticked and sometimes not.
- **I can't find the owner's queue.** 225 calls are "open to the owner", and nothing separates the ones the owner has seen and let stand from the ones never read.
- **Compared with the named methods.** XP: an on-site customer, small releases, CI, a review standing in for the pair; TDD is claimed. Kanban: the inbox and triage states are a pull system with very low work in progress (2 `ready-for-agent`). Shape Up: the grilling is shaping, but no issue states an appetite (none of 252), and v1 is fixed scope with open time, the opposite of a fixed-time cycle. Scrum: none, and nothing missed for one person.

## Would they…

- **Like it:** yes. The discipline is real and self-correcting: it took two reviews' findings and fixed them within days.
- **Share it:** yes, as a case study of a solo owner with an agent, with Legato's trace and `commitChecks.ts` as the slides.
- **Come back:** yes, to see whether v1's exit can be measured and whether the owner's share of the decisions recovers.
- **Recommend it:** to a solo developer with an agent, yes. To a team, not yet, until done means the checklist and the agent's open calls have a queue someone empties.
- **What I'd teach:** the grilled-then-built issue with numbered, attributed decisions; the release branch as the real gate; frozen ADRs that point forward. **What I'd warn against:** throughput faster than the one reviewer who matters (a thousand commits in eight days); "approved untried"; review rounds that feed their own backlog with no measure of convergence.

## Since the last run

On 1.16.0 (2026-10-30) my findings were: "No issue" changes skipping the issues they overturn; a pre-push gate that wasn't the deploy gate (Mac-green, Linux-red); and process rules drifting across their homes. **All three are fixed.** No-issue source commits fell from 45% to 8%. The release branch runs GitHub's suite before `main`, and issues 224, 232 and 247 found the root cause (Linux's fonts and WebKit's frame rate) and moved CI into Playwright's image. ADR-0016 makes `docs/releasing.md` the one home of the release rules, and amended ADRs name their amendment. What's new is a different kind of problem: not rules broken, but decisions and acceptance drifting from the owner to the agent as the pace rose.

## Three findings, ranked

1. **Decisions drift to the agent with no queue back to the owner.** "Claude's call" now outnumbers "decided by the owner" in the issues, 373 to 271 (it was 50 to 109 on 10-30). 225 calls still read "open to the owner" with nothing telling seen from unseen, ADR-0021 is one, and 1.26.1 shipped "approved by the owner untried". Give each release a list of its open calls for the owner to rule on, each line becoming "accepted by the owner" or reversed.
2. **"Done" doesn't certify the definition of done.** 68 of 201 done issues still have unticked acceptance boxes and 28 have none ticked (151 has 10, 231 has 6, released in 1.26.0). "Every test passes in Linux's fonts too" is left unticked in 14. Make a done issue's boxes ticked, or struck through with a reason, and check it in `commitChecks.ts` as the subjects are.
3. **TDD is claimed but not visible in the history.** 525 commits change code and tests together, and the red step never has a commit (Legato's three build commits landed within 45 seconds, sliced from a finished tree). Test-first lives only in prose (58 issues, 18 commit bodies). Commit the failing test first on night branches, or paste the red run's line into "How it was built", so a reader can check it.
