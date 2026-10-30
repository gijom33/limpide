# Persona review 4: the AI expert

Read: the live site (1440 × 900, Chromium) and the repository as a visitor reads it (README, `CLAUDE.md`, `docs/` with the PRD, issues 56–99, ADRs 0010–0014, the inbox, `docs/releasing.md` and the other reviews of today, the 244 commits since 2026-10-26, the unit tests, the workflow and its runs, tags and Releases). 2026-10-30, version 1.16.0, about 20 minutes.

## First impression

"The welcome card says it before I go looking: 'Designed and directed by Guillaume Boillet; code written with Claude Code, Anthropic's AI coding agent, following Matt Pocock's AI Hero methodology.' Version, build hash linking to the commit, date. Then the README has a 'How this was built' section with seven numbered steps, and a `CLAUDE.md` at the root. Four days ago I had to dig the AI part out of commit trailers. Now it's the first thing the site and the README tell me."

## What they tried, in order

1. **The site.** Loads in about 6 s on a cold cache, no console errors. The welcome card carries the credit above, AI Hero linked, "Source on GitHub" one click away. The build hash `328a370` is the current `main`.
2. **README.** "How this was built" names the method, the agent and the owner's part ("The owner decides … The agent proposes, writes the code, the tests and the docs"), and links PRD, issues, ADRs, glossary, inbox, reviews and `CLAUDE.md`. This is the section I asked for. But just above it sits the old "How it's built", which links `CONTEXT.md`, `docs/adr` and `docs/issues` again: two headings, one meaning. The screenshot (`docs/screenshot.png`, last changed 2026-10-26) shows the header before 1.16.0 (no Tutorial button, Demo and Song beside the Preset), the Oscillators without the Sub & Noise tab, and the LFOs with Rate before Depth (swapped in 1.14.0). Issue 25's release checklist still says "README screenshots refreshed when the look changed".
3. **`CLAUDE.md`** (37 lines). Short, specific, and the interesting part for me: commit subjects at 72 characters with `Issue N:` or `No issue:`, stage by path because "another session may be working in this checkout", an inbox committed before triage, "decided by the owner" vs "Claude's call, open to the owner", frozen ADRs, one Playwright run at a time (port 5199), and "a yes to a plan that mentions releasing is a yes to the plan, not the release". Each rule has an ADR behind it (0010, 0012). That's how an agent should be steered: rules with reasons, and hooks to check them.
4. **ADR-0010 and ADR-0012.** ADR-0010 cites review 4 and review 10 by name and answers each point: commit subjects, ADR status lines, who decided, a code review at each minor version. ADR-0012 sets up the skills' own files (`docs/agents/`, triage states, Agent Briefs, `.out-of-scope/`, a pre-commit hook). Both have Considered Options with real reasons against. The review loop works: findings → inbox → an ADR → `CLAUDE.md` → hooks.
5. **Commit history since 2026-10-26.** 244 commits in four days (110 on 2026-10-28), every one with a `Co-Authored-By: Claude` trailer. Since ADR-0010: 83 `Issue N:` and 116 `No issue:` subjects, none in another form, one at 73 characters (and logged as a slip in the inbox's Dropped list by the agent itself). `git log --grep "Issue 97:"` now works. 88 of the 95 commits that change source also change tests.
6. **Tests.** `npx vitest run --project unit`: 59 files, 571 tests, all green. `e2e/` has 47 specs. `App.tsx` went from 963 to 684 lines (issues 73–79, ADR-0013 and 0014 move the Patch and the stores out of React): the weak spot the sceptic pointed at was refactored behind tests.
7. **CI.** The workflow now runs `tsc`, the lint, the unit and engine tests, the build and the Playwright suite in Chromium and WebKit before deploying (fixed since my last finding). Runs take 17–21 minutes. But of the last 11 `Issue 25: version …` pushes, 6 failed on first push: 1.12.2, 1.12.3, 1.12.4, 1.14.1, 1.15.0, 1.16.0. Three are the same test (`fitsScreen.spec.ts`, "no two controls come closer than 8 pt at 375×812") and 1.16.0 is the Preset-name and header width at 1280 px: GitHub's Linux fonts are wider than the Mac's, where "the full suite green" was checked. `docs/releasing.md` step 7 handles it (fix under the same version, deploy only on green), and the agent itself suggested Playwright's Linux image before a push, but that suggestion sits untriaged in the inbox.
8. **Tags and Releases.** 27 tags, v1.3.0 to v1.16.0, each a GitHub Release with the release-log line as notes, tagged only once the deploy was green (v1.15.0 is on the fix commit, not the version commit, as step 6 says). Titles drift: "Limpide 1.12.4", "v1.13.0", "1.14.0".
9. **The other reviews of today.** Review 13 (the fact-checker) rendered the 29 new Presets and the changed tips through the engine and found nine false claims, among them Kalimba's "every fourth Harmonic" (the Spectrum shows every odd one) and Zap Pluck's "every strike starts at full FM" (it starts at half and the zap comes in the tail). I checked: Kalimba's line is in the live bundle. The agent's prose about sound is confident and specific, and wrong often enough to matter, and the check that catches it ran after 1.16.0 was published.
10. **The inbox.** 22 lines under Ideas, none triaged. Three are the owner's; the other 19 are "Claude's recommendation" or "from Claude's brainstorm … which the owner asked to keep". The rule in `CLAUDE.md` is "triage is the next commit". Here the agent's ideas fill the owner's queue faster than they are triaged. Each one is labelled honestly, and several defer to the PRD's Out of Scope ("the owner's call"), which is the right instinct.

## What worked

- The AI part is stated where a visitor lands, the site's welcome card and the README, in plain words that split the credit fairly.
- The method changes when a review finds a problem. Every finding from my last report was fixed or answered: the README section, the PRD's "formerly" slip, its Out of Scope and Testing lines, the ADR-0007 contradiction (now one bullet plus a dated amendment), the glossary's Preset and Share link entries, CI running every test, tags and Releases, 72-character subjects.
- `CLAUDE.md` + ADR-0010/0012 + hooks is a complete, readable answer to "how was the agent steered", with no secret prompts.
- The agent logs its own slips in the Dropped list ("commit `8a54d85`'s subject is 73 characters, one over the rule"). That self-reporting is what makes the rest of the record believable.
- Agents reviewing agents: the persona reviews, a code review each minor version, and now a fact-checker that renders audio to test the words. Review 13 is the most convincing document in the repository on whether to trust the agent's output, because it shows where not to.

## Where they got stuck or gave up

- Nothing blocked me. The friction is in the release order: the checks that would have caught today's problems (the fact-checker, the Linux layout run) are run after the push or only suggested, so a release reaches the site with false Preset text, or fails on CI and needs a second commit.
- The README's first picture is three releases old, and its two "built" sections make the reader wonder which one is current.
- The inbox Ideas list reads like a parking lot, not a queue; I couldn't tell which ideas the owner had actually taken up.

## Would they…

- **Like the post:** yes. The claim "built with Claude Code, directed by me" now holds from the first screen down to the commit trailers.
- **Share it:** yes, this time to the README's "How this was built" without a caveat. It's a good example of AI Hero with the steering file in public.
- **Come back:** yes, for ADR-0010 and review 13. One shows a method changing because of a review, the other shows how to test an agent's claims.
- **Work this way:** yes, with one change: run the checks that catch the agent's typical mistakes before the push, not after it. That means the facts in its prose and layouts on the CI's platform.

## Since 1.8.1

All three of my findings were taken up. The README and About name Claude Code and AI Hero and link the process; `CLAUDE.md` is in the repository. The drift I quoted is gone. CI runs the engine and Playwright suites, and versions are tagged and released. Commit subjects follow a checked 72-character rule. New since then are ADRs 0010–0014, the triage states, the pre-commit hook, `.out-of-scope/` and code reviews at minor releases. The open problems have moved later in the pipeline: the release order, and docs that lag the app's look.

## Three findings, ranked

1. 1.16.0 went live with nine false claims in its new Presets and tips (review 13: Kalimba's "every fourth Harmonic" is in the live bundle, Zap Pluck's "starts at full FM" is backwards), because the fact-check ran after the push; add "fact-check new or changed Preset and tip words through the engine" to `docs/releasing.md` before step 5 for any release that adds them, and triage the inbox's fact-checker and ear stand-in lines into it.
2. 6 of the last 11 `Issue 25: version …` pushes failed CI on first push (1.12.2, 1.12.3, 1.12.4, 1.14.1, 1.15.0, 1.16.0), three of them the same `fitsScreen.spec.ts` 8 pt test at 375×812 and 1.16.0 the 1280 px header, all from GitHub's Linux fonts being wider than the Mac's where "the full suite green" was checked; run the layout specs in Playwright's Linux image before the push (Claude's own suggestion, still untriaged in the inbox).
3. The README lags the app: `docs/screenshot.png` (2026-10-26) shows the pre-1.16.0 header, no Sub & Noise tab and Rate before Depth, against issue 25's "README screenshots refreshed when the look changed", and "How it's built" sits just above "How this was built" with the same three links; refresh the picture, merge the two sections, and make the GitHub Release titles one form ("Limpide 1.12.4", "v1.13.0", "1.14.0").
