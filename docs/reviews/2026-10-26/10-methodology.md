# Persona review 10: the software development methodology expert

The repository at `main` (`2f354e8`), 30 minutes, 2026-10-26: `docs/prd.md`, `docs/issues/`, `docs/adr/`, `docs/inbox.md`, `CONTEXT.md`, `docs/design-principles.md`, `git log`, the tests and `.github/workflows/deploy.yml`. I judge the process, not the synth. The AI-expert review (`4-ai-expert.md`) is taken as read; where I touch its findings I say so in one line.

## First impression

"PRD first, then fourteen numbered issues fifteen minutes later, then code. ADRs with options and consequences, a glossary the code obeys, an inbox with a triage log. Someone has read the books. What I want to know is whether the artifacts *drive* the work or are written *about* the work after it's done. At about 35 commits a day with an agent, the second is the usual failure. So: follow some threads end to end, and look at how decisions get changed."

## What they tried, in order

1. **Shape of the history.** 206 commits over six days (`git log --format=%ad`: 38, 49, 32, 33, 38, 16 a day). If I add up every gap between commits of two hours or less, I get 28.6 active hours. That is a commit every 8 minutes. 143 of the 205 gaps are 10 minutes or less. Median commit: 61 changed lines, p90 405, max 3,083 (`git log --shortstat`). Every commit is authored by the owner with a `Co-Authored-By: Claude` trailer, so git can't tell me who decided what. Only the prose can.

2. **Trace 1: story 18 → issue 01 → `9c1535f` → `src/patch/taper.test.ts`.** Story 18 says "Cutoff on a logarithmic Taper… 20 Hz–20 kHz". Issue 01's third checkbox says "Tapers… tested; Cutoff spans 20 Hz–20 kHz on a log Taper". Commit `9c1535f` (ticket 01) adds `taper.test.ts`, whose `log Taper` block asserts 20 Hz, 20 kHz and the geometric midpoint 632.456 Hz. **Complete**, but I made the story → issue link myself by reading. Issue 01 doesn't cite story numbers, and none of issues 01–14 do.

3. **Trace 2: story 83 → issue 26 → three commits → tests.** Issue 26 cites "PRD story 83" by number. The work landed in `1ad6fec` (model and engine: `modulationModel.test.ts`, `synthEngine.browser.test.ts`, `patch.test.ts`, `serialize.test.ts`), `a4f01d7` (rings: `reach.test.ts`, `e2e/modulationRing.spec.ts`) and `a55b9fe` (UI: `e2e/lfo.spec.ts`, `e2e/lfoDestination.spec.ts`). None of the three subjects names issue 26. I found them through `git log -- docs/issues/26-*` (only `a55b9fe` touches the issue) and by their timestamps. **Complete, but archaeology.** And `a55b9fe` ticks the box "MIDI Learn still maps a control to it" while the Status line it writes says "done, but for MIDI Learn on the new selector (… not tested by hand)". The test arrived 23 hours later in `a355935`.

4. **Trace 3: story 11 → issue 35 → `f418cc7` → `e2e/audioStart.spec.ts`.** This is the best one in the repo. Issue 35 quotes story 11, argues that the change alters the story ("An invitation is not a button, but it is a notice…"), and ticks "PRD story 11 updated". One commit, `f418cc7`, changes the PRD story, the issue, the code and the new e2e spec together. **Complete and bidirectional.** This is what the method looks like when it works.

5. **A trace that fails.** I went looking for features with no story. Song (`d33ce53`), the Sub-oscillator (`4e83ca8`), Key Track (`fa6b9c4`), the Hold rhythm (`e559fd3`) and GoatCounter analytics (`9bee0dd`) all shipped with no PRD story and no issue. The whole run from ticket 16 to version 1.1.0 (`82bab89..a26bda8`, 57 commits) has 52 commits that neither name nor touch an issue. That run also includes the phone layout, while the PRD still listed phones as out of scope. Across the whole history, **83 of 206 commits** name an issue/ticket in the subject or touch `docs/issues/` (counted with `git log --grep` plus `git log -- docs/issues`, de-duplicated).

6. **TDD sample, ten feature commits.** I classified every commit by the files it touches (script output in my scratch folder). 143 of the 158 commits that touch source also touch tests. Ten feature commits, with lines added to source / tests:

   | Commit | What | src + | test + |
   |---|---|---|---|
   | `9c1535f` | ticket 01 | 606 | 290 |
   | `8ab0649` | ticket 03 | 361 | 245 |
   | `2d40e62` | ticket 11 | 889 | 481 |
   | `4a4dcb4` | ticket 12 | 434 | 294 |
   | `82bab89` | ticket 16 | 339 | 89 |
   | `1ad6fec` | two LFOs | 206 | 125 |
   | `5e8d2bf` | issue 31 | 146 | 57 |
   | `01c7483` | issue 34 | 217 | 87 |
   | `a5ea10f` | issue 36 | 254 | 159 |
   | `6375d86` | issue 44 | 144 | 121 |

   **10 of 10 arrive with their tests.** The tests are good: behavioural, and named in the domain language. But *test-first* is invisible. No commit adds a failing test on its own, and red, green and refactor are squashed into one commit. The 11 test-only commits point the other way. Three of them repair tests that the previous code commit broke: `88cce09` after `e8d1aff`, `3c0f62e` after `6bd6afa`, `aba752e` after `83c1e46`, which was a source-only commit. `a355935` adds tests for features already marked done. No commit subject in 206 contains refactor, extract, split, tidy or clean. `src/ui/App.tsx` has been touched by 70 commits and is 963 lines long. The refactor step is either folded silently into feature commits or not happening.

7. **Issues.** There are 44, mostly 10–28 lines. 01–14 were written in one go (`9c1535f`). The rest were written as work arrived, sometimes several at once (`b9c0896` wrote 17–21, 23 and 24 in one commit). Most are true vertical slices that cut through model, engine, UI and tests (01–14, 16, 19–24, 26, 31, 34–39, 43, 44). A few aren't slices: 15 (an audit), 17 (principles), 25 (a release log kept as an issue), 30 (a bundle of small fixes) and 42 (reviews). Each issue has a checklist (253 boxes ticked, 11 open across 7 files), but there is no shared definition of done. "Done" lives in a free-text Status line, with variants like "done: waived", "built, to verify on the real C16" and "diagnosed, not reproduced". Three issues sit at "built, to try on a real device" (34, 38, 44). That's honest, and it's a verification queue nobody counts. Sizing: issues 01–10 were all built between 20:43 and 23:30 on day one, 3 to 40 minutes each by commit timestamps. The issue is no longer a unit of effort. It's a unit of *intent*.

8. **ADRs.** There are 9. Five have Considered Options and Consequences (0001, 0003, 0006, 0007, 0008). Four don't (0002, which is one paragraph, plus 0004, 0005 and 0009). The decisions are real, and several record alternatives that were built and dropped: ADR-0006's per-Scope auto-range, ADR-0001's Resonance compensation stage. Supersession is done properly for 0005 → 0007 and 0004 → 0009. But **no ADR has a Status, Date or Deciders field (0 of 9), and they are edited in place**: ADR-0001 in 6 commits, 0003 in 5, 0005 and 0007 in 4 each. ADR-0007's history explains the contradiction the AI expert found (agreed, and here is why it happened). `82bab89` (22:34) lists "Sum the Taps…" as a rejected option. `c369774` (23:17), `b855ba1` (23:20) and `dc8521a` (23:24) then add and reshape a "Viewers follow: All" option that sums the Taps and make it the default. The old "newest Voice, not the sum" bullet was left behind. A decision was reversed within 50 minutes by editing the record that rejected it.

9. **Owner vs agent decisions.** The owner's decisions are marked in prose: I count 16 phrases such as "owner's call", "decided by the owner", "owner's decision" and "rejected by the user" across issues and ADRs. Issue 44 has the best form: a measured current state, a proposal, then "Decisions open… Decided by the owner on 2026-10-26, all four as proposed". `e2e/designPrinciples.spec.ts` even cites the owner's decision next to each waiver. Agent decisions are simply unmarked: issue 15's A9 and A11 say "Decided: left as it is" without saying who. Grilling shows up as a recorded act once: issue 26, "Settled in two grilling rounds". The questions and answers aren't kept.

10. **Inbox → issue triage.** The inbox was introduced on day five (`9156673`, 10-25 07:56). Since then, 15 of the 16 issues (29–44, all but 36) came through the triage log, and the inbox is empty now. Triage is fast: the three bug lines that were ever committed lived 9 h, 7 h and 1 h. Two things are missing, though. **No idea line has ever been committed.** In 14 commits to `docs/inbox.md`, only those three bug lines were ever added (`git log -p -- docs/inbox.md`), so ideas are written and triaged inside one working copy, and the owner's original words survive only as the issue's "From the owner" line. **Dropped has always been empty.** The inbox routes; it has never said no. The no's happen later, inside issues (issue 26's "Not a destination: Volume") or in the PRD (story 35 struck through).

11. **Releases.** `package.json` started at 1.0.0 in `9c1535f`, and that release was never declared. Eleven version commits run from 1.1.0 (`4b0b5cb`, 10-24) to 1.8.1 (`2ba9f3a`). `gh run list` shows 23 pushes: the first 13 unversioned, the last 10 each a version commit. So the rule was adopted on day four and has been kept since. Issue 25's text still says "each push bumps the minor version", but 1.3.1, 1.4.1 and 1.8.1 are patch releases, so the written rule lags the practice. "Full suite green" is asserted and never recorded (CI runs only unit tests, and there are no tags; the AI expert's point, agreed).

12. **Review.** Issue 42's "The code review, since the first commit" is unchecked. In 206 commits, the AI Hero `code-review` skill has not run once. Issue 34's "Known limits, from the review" is the only trace of any review.

## What works

- **The plan goes before the code, and the plan keeps changing.** PRD → issues → code in 15 minutes on day one. Later, PRD stories 69–83 were added before their issues (`b9c0896`), and story 11 was rewritten by the issue that changed it (`f418cc7`). The PRD is a living document, not a contract.
- **Issues carry state between agent sessions.** Measured current state, proposal, open decisions, a checklist naming the test that covers each box, and "Known limits". Issues 34, 41 and 44 are better than most tickets I've seen on human teams.
- **Executable design principles with ratcheting waivers.** `e2e/designPrinciples.spec.ts` turns `docs/design-principles.md` into checks. Each waiver sets a floor just under today's measurement, and "a waiver nothing needs any more fails the test too". This is a fitness function in the evolutionary-architecture sense, and the best idea in the repo.
- **Ubiquitous language actually used.** `CONTEXT.md` has 59 defined terms, 23 commits of upkeep and `_Avoid_:` lines, and the terms show up in test names.
- **Diagnosis before fixing.** Issue 41 starts from a vague claim, writes a test that would go red if the hiss were real, measures, finds nothing and keeps the test. Textbook.
- **Tests with every slice** (10/10 sampled), and the flaky tests get diagnosed with numbers rather than retried (inbox log, `0b176ca`, `0af9856`).
- **Owner decisions are explicit where they matter:** look B (issue 18), the C16 layout (ADR-0009), issue 44's four calls.

## Where it breaks down

- **Tests are the only gate, and the same agent writes both sides.** There's no second human, the code review has never run (issue 42), commits come every 8 minutes, and tests get repaired after the code breaks them (`88cce09`, `3c0f62e`, `aba752e`). In XP a test suite is trustworthy because the pair argues about it. Here nobody argues. The owner's gate is trying the app on a device, which catches what it looks like, not how it's built (App.tsx: 963 lines, 70 commits, zero refactor commits).
- **Decision records are mutable.** ADRs have no status or date and are edited in place, so a reversal (ADR-0007) or a dead reference (ADR-0001 still promises a Ghost that `a6d4d19` removed) hides inside the document. An accepted ADR should never change except for a status line.
- **Traceability depends on discipline that comes and goes.** 40% of commits link to an issue. Only 3 issues (24, 26, 35) cite story numbers. A whole release's worth of features (1.1.0) skipped the method entirely, and it shows: features with no story, and a PRD scope line that the work had already passed.
- **Who decided is only in prose.** With every commit co-authored, a reader can't separate "the owner chose" from "the agent chose and the owner didn't object" unless a sentence says so. Grilling, the step that most distinguishes this method, leaves almost no record.
- **The process changed mid-flight without a retrospective.** Conventional commits stopped after commit 38, the version rule arrived on day four and the inbox on day five. Each change was good, but none is written down as a process decision, so a reader can't tell a deliberate change from drift.
- **No WIP limit or definition of done.** Issues end in a dozen kinds of "done". Three "built, to verify" issues wait on the owner's hardware with nothing tracking how long. Done-but-unverified is exactly the inventory Kanban warns about.

## Compared with

- **XP:** borrows TDD (test-with, at least), small releases, CI, simple design, and an on-site customer who is also the developer. It drops the second pair of eyes: the agent is a pair programmer with no navigator's veto, and the human navigates the product, not the code. Refactoring is invisible. Sustainable pace isn't a concern for the agent, but commits at 00:00–01:13 and again from 06:46 suggest it is one for the owner.
- **Scrum / Kanban:** no sprints, roles or ceremonies, which is right for one person. Versions act as increments, and the persona reviews in issue 42 act as a sprint review. There is no retrospective (see above). From Kanban it takes a visible flow (inbox → issue → done, with "Blocked by") and an expedite lane ("done at once"), but no WIP limits and no explicit pull policy.
- **Shape Up:** issue 44 (measured state, proposal, decisions open) reads like a small pitch, issue 18's prototypes are spikes, and "to grill first" is shaping. There is no appetite. At an agent's pace, building time stops being the scarce thing, and the owner's attention and real-device verification take its place. Nothing in the method budgets those.
- **DDD:** strong on ubiquitous language (`CONTEXT.md`, domain words in tests) and on deep modules with small interfaces (PRD "Modules"). There is one bounded context, which is right for the size. ADRs are Nygard-style, minus immutability and status.
- **What's new:** grilling as adversarial shaping done by the agent; skills as an executable process manual; issues written as hand-off notes between agent sessions; design principles as ratcheting tests. And the cost of writing documents has dropped to nearly zero, which is why there are so many of them and why they drift.

## Would they…

- **Teach it:** yes, as a case study. Issue 35's one-commit trace, issue 44's decision format, issue 41's diagnosis and the waiver ratchet in `e2e/designPrinciples.spec.ts` are teachable as they stand. ADR-0007's 50-minute rewrite is the cautionary slide.
- **Adopt it for a team:** no, not as practised. It assumes one decider whose decisions live in prose, no review gate and no WIP limit. A team needs who-decided metadata, an independent review on every merge, and immutable decision records. I'd adopt pieces: the issue template, the inbox, executable principles.
- **Recommend it to a solo developer working with an agent:** yes. It is far better than prompting from memory, and the artifacts did keep 206 commits coherent. Recommend it with three amendments: immutable ADRs, issue numbers on every commit, and a scheduled code review.

## Three findings, ranked

1. No independent review gate. The `code-review` skill (issue 42, unchecked) has never run in 206 commits made every ~8 minutes. Tests are the only gate, the agent writes both code and tests, and tests get repaired after code breaks them (`88cce09`, `3c0f62e`, `aba752e`). Issue 26 ticked a box before its test existed (`a55b9fe` → `a355935`). There are zero refactor commits while `src/ui/App.tsx` grew to 963 lines over 70 commits. Run the code review at each minor version and record its findings in the inbox.
2. ADRs are mutable and carry no Status, Date or Decided-by (0 of 9). ADR-0007 was rewritten three times in 50 minutes (`82bab89` → `c369774` → `b855ba1` → `dc8521a`), turning its own rejected option ("Sum the Taps") into the default without a new ADR. ADR-0001 has 6 edits and still promises the Ghost that `a6d4d19` removed. Freeze accepted ADRs, reverse them with a new ADR, and add Status, Date and Decided-by (owner or agent).
3. Story → issue → commit traceability holds for only 83 of 206 commits, and only issues 24, 26 and 35 cite story numbers. The 1.1.0 run (`82bab89..a26bda8`, 52 of 57 commits untracked) shipped Song, the Sub-oscillator, Key Track, the Hold rhythm and analytics with no story or issue, and raw inbox ideas are never committed (`git log -p -- docs/inbox.md`). Prefix every commit with its issue number or "no issue: why", list served stories in each issue, and commit inbox lines before triaging them.
