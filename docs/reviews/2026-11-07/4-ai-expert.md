# Persona review 4: the AI expert

Ran on version 1.26.1 (build `38df0ad`), 2026-11-07.

Read: the live site (1440 × 900, Chromium, headless Playwright), then the repository as a visitor reads it: README, `CLAUDE.md`, `CODING_STANDARDS.md`, the PRD's date, issues 120, 131 and 251 and every issue's Status line, ADRs 0010 and 0016 to 0022, the inbox, `docs/releasing.md`, `docs/night-shift.md`, `docs/outreach/`, `.claude/skills/`, the 1,481 commits, the engine tests, the CI runs, tags and Releases. About 20 minutes.

## First impression

"Same welcome card as last time, and it still does the job before I look for it: 'code written with Claude Code, Anthropic's AI coding agent, following Matt Pocock's AI Hero methodology', the version, a build hash that links to the commit, the date. I click Play the Demo and the three Sections light up with their Scopes and Spectra, so the product is real. Then I go to the repository, which is what I came for."

## What I tried, in order

1. **The site.** Loaded in 1.5 s, no console errors. Build `38df0ad` is `origin/main`. Played the Demo for 5 s: Kick, the Filter's Spectrum with its Response Curve, the Envelope Timeline. A key press stops it with "The Demo stopped: you are playing now". Clicking Demo leaves its long tooltip open over the Amp Section while the mouse stays on the button. That's a nit, not my subject.
2. **Docs against the app.** I checked four README claims on the live site. `Z`/`X` change the octave (C4–C6 to C3–C5, then to C5–C7). The Tutorial menu lists nine Tutorials, the nine the README names. Display has Freeze, Snapshot, the axes and Bead's switch. Playing the notes B, E, A, D sends Bead away. All four held.
3. **README, "How this was built".** One section now, seven numbered steps (PRD, issues, ADRs and glossary, tests first, inbox, reviews, `CLAUDE.md`), the owner's part and the agent's part in two sentences, then the statistics line. "3,593 tests" checks out: 1,438 + 549 + 1,606 in `docs/statistics.md`. The screenshot is from 2026-11-03 and matches the app's look.
4. **`CLAUDE.md`, `CODING_STANDARDS.md`.** Still 37 lines, still rules with reasons. The coding standards are the best thing I read today: "A branch, field or option that only a test reaches is dead". Each rule names the incident behind it ("the Ideal Reference's memo claimed to list what it depended on, missed six of Osc 2's values (issue 77)").
5. **Issues and the inbox.** 252 issue files. Every open one has a triage state and a category. The 13 open ones are coherent: v2 work is `needs-triage` or blocked by 131, and so out of reach of the night shift. The inbox's Bugs and Ideas are empty: everything is triaged, with a dated line saying where each item went. Last time 22 Ideas sat there untriaged. Issue 251, written this morning from the 1.26.1 code review, has a proper Agent Brief.
6. **Who decided.** I counted the two phrases ADR-0010 requires. "Decided by the owner" appears 237 times in `docs/`, "Claude's call" 492 times; 130 issues and 102 inbox lines carry "Claude's call, open to the owner". Nothing records which of those calls the owner has since seen. ADR-0019 does it once ("accepted by the owner on 2026-11-03"), but ADR-0020 and ADR-0021 are accepted ADRs still "Claude's call, open to the owner". The README says "The owner decides … those decisions are dated", and from the repository I can confirm that for about a third of the decisions.
7. **Commits.** 1,481 commits since 2026-10-21, 209 of them on 2026-10-31 alone. Subjects follow `Issue N:` / `No issue:` since ADR-0010. 1,473 carry the `Co-Authored-By: Claude` trailer. The 8 that don't are the night merges ("No issue: main's commits, into the night (issues 166 to 172)"), so the README's "Every commit names Claude Code" is not quite true.
8. **The night shift.** `docs/night-shift.md` and `.claude/skills/night-shift/` describe Claude building `ready-for-agent` issues from 23:00 to 07:00 in its own worktree. It sorts issues into light and full tiers, runs the whole suite once at the end, pushes nothing, and the owner merges in the morning. For someone in my field this is the most interesting thing in the repository, and the README's "How this was built" never mentions it, nor `.claude/skills/` (night-shift, outreach). The night reports (`docs/night/<date>.md`) are git-ignored, so the public record of a night is its merge commit.
9. **The release path.** `docs/releasing.md` now pushes to `release/X.Y.Z` first and to `main` only after that run is green. 1.26.0 and 1.26.1 passed on the branch the first time, then on `main`. Between those, the 1.22–1.24 branch runs caught failures before `main` saw them, which is what the branch is for. The CI history for 2026-11-05 shows 17 `release/probe-*` pushes ("[DEBUG-1240]", "[DEBUG-240]", "never merged") from diagnosing 1.24.0's WebKit runs and issue 240. They're honestly labelled and the branches are gone, but anyone who opens Actions sees them.
10. **The word checks.** Step 6 of the release steps runs the fact-checker, the ripple hunter and the ear stand-in on the branch, before `main`. That was my first finding last time. Issue 246's "the fact-check's loose Geek tip claims" was fixed on `release/1.25.0` before the push to `main`.
11. **Tests.** `synthEngine.browser.test.ts` has 186 tests, and their names state behaviour: "attenuates Harmonics above 2 kHz by at least 10 dB more than theory when the Cutoff is 1 kHz". The README's "the engine renders real audio and checks Harmonics against theory" is literally true.
12. **Outreach.** `docs/outreach/plan.md`: "the agent drafts, the owner posts". Each place's AI rules were checked at the source. Where AI-written posts are barred, the agent writes notes, not prose, and the drafts are git-ignored because they quote people. It's careful about the very thing I'd worry about.
13. **Scope.** Issue 131 framed v1 on 2026-10-31: "no new features: only polish", and "Bead is the last feature that is not essential". Since then Bead's code went from 2,707 to 4,739 lines, plus 4,530 lines of Bead tests, and 103 of the 875 commits since mention Bead. Every Bead change I looked at was the owner's own idea, so this is the owner's choice, but the frame alone does not hold the line.

## What worked

- The claim holds from the first screen to the commit trailers, and the README's numbers check out against `docs/statistics.md`.
- Every finding from my last two runs was taken up. The word checks and the CI run now come before `main`, the screenshot is current, the Release titles are all "Limpide X.Y.Z", and the inbox is a queue again.
- The review loop: a review finding goes to the inbox, then to an issue or an ADR, then into `CODING_STANDARDS.md` or the release steps. The standards cite the incidents that made them.
- The process is honest about the agent's limits. The fact-checker exists because the agent's prose about sound was wrong, and the outreach plan keeps the agent off every forum.

## Where I got stuck or gave up

- I couldn't tell which of Claude's 492 calls the owner had looked at. That is the one question an AI-sceptical reader will ask, and the repository can't answer it.
- I found the night shift only by listing `docs/`. The README tells the AI Hero story but leaves out the part that's new.
- I couldn't see which issues are open without opening them. `docs/issues/` is 252 files with no index, and a Status line is only visible inside its file.

## Would I…

- **Like the post:** yes. Everything it would claim, I could check.
- **Share it:** yes, to people building with agents, pointing at `CODING_STANDARDS.md`, ADR-0010 and the release steps.
- **Come back:** yes, for the night-shift skill and to see how v1's "done" is decided.
- **Recommend working this way:** yes, with the caveat that it produces a lot of record. 14,862 lines of docs for 26,393 lines of app code, and the record is only as convincing as its decision marks are complete.

## Since the last run (1.16.0, 2026-10-30)

My three findings were all addressed. The word checks run on the release branch before `main` (step 6). Every release goes through a branch run first, and 1.26.0 and 1.26.1 were green the first time. The screenshot was refreshed on 2026-11-03, the two "built" sections were merged, and the Release titles are uniform. The inbox's untriaged Ideas went from 22 to 0. The test count grew from 571 unit tests to 3,593 in all, with 73.6% line coverage. One thing went back: `App.tsx` is at 903 lines again, after the 684 I praised last time. What's new to judge is the night shift, the project's own skills, and the volume of Claude's calls left open.

## Three findings, ranked

1. "Claude's call, open to the owner" appears 492 times, against 237 "decided by the owner", and nothing records which calls the owner has since seen. ADR-0019 says "accepted by the owner on 2026-11-03" once, but ADR-0020 and ADR-0021 are accepted ADRs still marked open. Give a call a closing form ("accepted by the owner, date") and count the open ones in the statistics or in v1's done criteria (131), so "the owner decides" can be checked.
2. The night shift, Claude building `ready-for-agent` issues from 23:00 to 07:00, is invisible from the README's "How this was built": no link to `docs/night-shift.md` or `.claude/skills/`. Its reports are git-ignored. Its 8 merge commits are the only ones without the `Co-Authored-By: Claude` trailer, against the README's "Every commit names Claude Code". Add the night shift and the skills as a step, and either give the merges the trailer or change the sentence.
3. `docs/issues/` is 252 files with no index, and an issue's Status shows only inside its file. To see the 13 open issues and their states, a visitor opens files one by one. Generate an index (number, title, Status), for example with `npm run stats` or a hook, and link it from the README's step 2.

## For the inbox

- 2026-11-07, review 4: 492 "Claude's call, open to the owner" against 237 "decided by the owner", with no mark for a call the owner has since seen (ADR-0019 has one, ADR-0020 and 0021 don't); a closing form, and the open ones counted.
- 2026-11-07, review 4: the README's "How this was built" leaves out the night shift and `.claude/skills/`; the 8 night merges lack the Claude trailer that "Every commit names Claude Code" promises.
- 2026-11-07, review 4: an index of `docs/issues/` (number, title, Status), generated and linked from the README.
