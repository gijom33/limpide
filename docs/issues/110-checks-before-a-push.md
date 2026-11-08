# 110: The checks before a push, and process rules in one place

**What to build:** From the fourteen reviews of 1.16.0 (the inbox, 2026-10-30; reviews 4, 8 and 10, [AI expert](../reviews/2026-10-30/4-ai-expert.md), [open-source sceptic](../reviews/2026-10-30/8-oss-sceptic.md), [methodology](../reviews/2026-10-30/10-methodology.md)):

- **Linux fonts:** 6 of the last 11 release pushes failed CI on GitHub's Linux fonts after a green Mac run (1.12.2, 1.12.3, 1.12.4, 1.14.1, 1.15.0, 1.16.0); three reviewers ask for the layout tests in Playwright's Linux image before a push.
- **Fact-check:** the check of new Preset and tip words ran after the push, so 1.16.0 shipped nine false claims; put it in the release steps before the push, with the ear stand-in.
- **"Done at once":** such changes skip the issues they overturn (the 2026-10-29 header relayout reversed issue 82's decision 4 and issue 44's one order without touching either). Write the "Since then" rule into the issue tracker's guide, and give a change that alters an issue's decision, a setting or a batch of Presets an issue number.
- **Rules drifting:** the code review's scope changed in the release steps only (ADR-0010 and issues 25 and 42 still say minor releases), and amended ADRs (0006, 0013) do not name their amendments.

Claude's recommendations for reviews next time, in the inbox's Ideas at the owner's word, include the same Linux check; they stay there until the owner triages them.

**Blocked by:** none

**Status:** done (2026-11-02). Built (2026-10-30) on night/2026-10-30 and released; approved by the owner: "Okay, I trust you."

## Questions for the owner

1. **The Linux check:** how should the layout tests run in Linux before a push? Docker isn't installed on this Mac.
   - **a. (Claude's recommendation)** Push the release commit to a branch first; GitHub runs the full suite there without deploying, and main is pushed only once it is green. No install; it costs the CI's 20 minutes.
   - **b.** Install a Docker runtime (Colima) here and run Playwright's Linux image locally.
   - **c.** Bundle one font with the app so Mac and Linux draw alike; it changes the app's look slightly, everywhere.
2. **Fact-check and ear stand-in before the push:** add them as release steps for any release that adds or changes Preset or tip words? Claude's recommendation: yes.
3. **"Done at once":** a change that alters an issue's decision, a setting, or a batch of Presets gets an issue number, and the overturned issue a "Since then" line, written into the issue tracker's guide? Claude's recommendation: yes.
4. **Rules in one place:** the release steps are the one home of the release rules; ADR-0010 gets a superseding ADR for the code review's scope, issues 25 and 42 point to the release steps, and an amended ADR's Status line names its amendment (the Status line being the one part an accepted ADR may change)? Claude's recommendation: yes.

## Decisions (triage, 2026-10-30, decided by the owner)

1. The Linux check: the release commit goes to a branch first; GitHub runs the full suite there without deploying, and main is pushed only once it is green.
2. For a release that adds or changes Preset or tip words, the fact-check and the ear stand-in run before the push.
3. A change that alters an issue's decision, a setting, or a batch of Presets gets an issue number, and the overturned issue a "Since then" line; written into the issue tracker's guide.
4. The release steps are the one home of the release rules: a new ADR supersedes ADR-0010's point on the code review's scope, issues 25 and 42 point to the release steps, and an amended ADR's Status line names its amendment (0006, 0013).
5. Added in triage of the inbox's last lines (2026-10-30): the ripple hunter (review 12's agent) runs with the fact-check and the ear stand-in before the push, on any release with issue work, to find every test, tip, description and doc still stating an old fact. Claude's call, open to the owner. Claude's other recommendations kept in the inbox are answered here: the Linux check by decision 1, the fact-checker and ear stand-in by decision 2; the generated Patches at the edges went to [116](./116-patches-at-the-edges.md).

## Agent Brief

**Category:** enhancement
**Summary:** The release steps catch Linux layout failures and false words before main is pushed, and each process rule lives in one place.

**Desired behavior:**
- **CI on a branch:** a push to a release branch runs the same build and full suite as main, without deploying; pull requests too. Only main deploys.
- **Release steps:** before main is pushed, the release commit is pushed to its branch and its CI run is green; for words added or changed in Presets or tips, the fact-check and the ear stand-in have run, and for any issue work the ripple hunter, their findings fixed or answered.
- **The issue tracker's guide** states the "Since then" rule and when a change needs an issue (decision 3).
- **One home:** the new ADR, the pointers from issues 25 and 42, and the Status lines of ADR-0006 and ADR-0013 naming their amendments (decision 4).

**Acceptance criteria:**
- [ ] ~~A branch push runs the suite on GitHub and deploys nothing (the workflow says so; to be seen on the first release branch, since nothing was pushed tonight)~~ (not checked at the time)
- [x] The release steps read in order: local suite, branch CI green, checks on words, then main
- [x] No two documents state the code review's scope differently

**Out of scope:**
- Bundling a font (not chosen)
- The CI's concurrency groups ([111](./111-the-repository-front-page-and-community-files.md)), though the two touch the same workflow

## How it was built

Built at night (2026-10-30), on `night/2026-10-30`, nothing pushed.

- **CI on a branch:** `.github/workflows/deploy.yml` runs on a push to `main` or `release/**`, and on pull requests as before; the `deploy` job still runs only for `refs/heads/main`, so a release branch runs `checks` and every `browsers` job and deploys nothing. The YAML was parsed and the trigger and the deploy condition read back; GitHub itself has not run it yet.
- **The release steps** (`docs/releasing.md`): fetch and replay; the code review for issue work; the local suite; the version and its commit; the release branch pushed (`git push --force-with-lease origin main:release/X.Y.Z`) and its run watched to green with `gh run watch`; the checks on words (the fact-checker and the ear stand-in for Preset or tip words, the ripple hunter for issue work), their findings fixed or answered in the inbox; then `main`; the tag, the GitHub Release and the branch deleted; the statistics. The `gh run list --commit … --jq '… // empty'` lookup and its wait loop were tried against `main`'s last run.
- **The issue tracker's guide** (`docs/agents/issue-tracker.md`): a section "When a change overturns an issue": which changes need an issue number, and the `**Since then (date, issue N):**` line beside what it overturns or at the issue's bottom, in the same commit; the inbox's "done at once" points to it.
- **One home:** [ADR-0016](../adr/0016-the-release-steps-are-the-one-home-of-the-release-rules.md) (the release steps hold the release rules; it supersedes ADR-0010's point 5 and amends ADR-0015's gate). Status lines name their amendments: ADR-0006 (by 0011), ADR-0013 (by 0014), ADR-0010 and ADR-0015 (by 0016). Issues 25 and 42 point to the release steps, and issues 42 and 56 have a "Since then" line; `CLAUDE.md`'s push line and the README point to the release steps too, and the README's `npm run stats` now says "after a release".
- **Tests:** `npx tsc`, `npm run lint` and the unit tests (750 passed). No Playwright spec covers these files; Docker is installed but not running here, and was not needed, since decision 1 chose the branch run.
- **The code review** (Standards and Spec), fixed: a restarted release could not push its branch again (now `--force-with-lease`); the run lookup could watch nothing before GitHub registered the run (now a wait loop); issue 42's ticked box had been rewritten (restored, with a "Since then" line at the bottom instead); the "Since then" rule said "at its bottom" where most issues put it beside what it overturns (the rule now allows both); `CLAUDE.md` and the workflow's comment restated the release order (now pointers); ADR-0016 misquoted how ADR-0004 and 0012 word their Status lines.

**Claude's calls, open to the owner:**

1. Release branches are named `release/X.Y.Z`, pushed from `main` and deleted once the version is tagged.
2. The checks on words may run while the branch run does; a fix they bring goes through the branch run again. They are listed after it, as the acceptance asks, because `main` waits on both.
3. Their findings are fixed or answered with a line in the inbox, as the code review's are; their reports are not kept in `docs/reviews/`.
4. ADR-0016 also amends ADR-0015's "the deploy run is the end-to-end gate", since decision 1 moves that gate to the branch run, and ADR-0015's Status line names it.
5. "A batch of Presets" is two or more; the guide also counts a change to a ticked box or built behaviour, says an open issue's Status line names what was replaced, and says what `No issue:` is for. Decision 3 named only decisions, settings and Presets.

**To try:** read `docs/releasing.md` start to end as the next release would follow it, and `docs/agents/issue-tracker.md`'s new section. At the next release, the branch push shows a run on GitHub's Actions page for `release/X.Y.Z` with every job, and its deploy job skipped.
