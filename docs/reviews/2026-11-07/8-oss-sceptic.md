# Persona review 8: the open-source expert, sceptical of AI

Ran on 1.26.1, 2026-11-07. Laptop, 30 minutes, the repository at `main` (`38df0ad`, the same as `origin/main`). Read: README, CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, CODING_STANDARDS.md, `.github/` (workflow, issue forms, PR template), `biome.json`, `.githooks/`, `.claude/skills/` (night shift, outreach), `src/patch/serialize.ts`, parts of `src/engine/synthEngine.ts`, `src/ui/App.tsx` and `src/ui/mascotMotion.ts`, the history since `v1.16.0`. Ran `npx vitest run --project unit` in the checkout; `npx tsc`, the lint, a build, three unit mutations and one engine mutation in a scratch clone under `/private/tmp`; `gh` and `npm` read-only. Nothing tracked was changed but this file.

## First impression

"Third look. The README says up front, in its second line, that the code is written with Claude Code, and says how. GitHub's community profile is at 100 % now. Then I see the numbers: 1,481 commits in eighteen days, 1,003 of them since my last visit eight days ago, 209 in one day; 26,000 lines of app code and 470,000 words of docs. Nobody reads that. So the question is no longer whether the paperwork exists, it's whether anyone, human, looks at what lands."

## What they tried

1. **Front door.** README: what it is, a screenshot, the commands, "How this was built" (PRD, issues, ADRs, inbox, agent reviews, CLAUDE.md), MIT. CONTRIBUTING: what help is welcome, commands, house rules, and that an AI tool's help is declared in a `Co-Authored-By` line. SECURITY.md: a real threat model (share link, MIDI, storage) and GitHub's private reporting. `gh api …/community/profile`: **100 %** (85 % last time). Still 0 issues, 0 pull requests, 0 forks, 1 star; `main` unprotected.
2. **Code of conduct.** Unchanged: five lines that say Limpide "follows" Contributor Covenant 2.1 without its text, so GitHub files it as "Other", and the private channel is a LinkedIn profile.
3. **Build it as a stranger.** Clean clone: `npx tsc` clean, `npm run lint` "Checked 363 files … No fixes applied", `vite build` in under a second (one warning: a chunk over 500 kB). Two runtime dependencies (React 19.3.1), eleven dev; `npm audit` 0; `npm outdated`: Biome 2.5.15 → 2.6.6, Vitest 4 → 5, the rest patch releases. Lean and current.
4. **Unit tests.** `npx vitest run --project unit`: 98 files, **1,441 tests green** in 44 s (571 last time).
5. **Do the tests test something?** Three mutations in the scratch clone, each reverted:
   - `src/modulation/modulationModel.ts` line 120, Key Track's sign flipped → **caught** (5 tests, 3 files).
   - `src/music/pitch.ts` `nearestNote`, octave numbering off by one → **caught** (10 tests, 4 files).
   - `modulationModel.ts` line 119, velocity no longer moves the Cutoff → **caught** (2 tests).
   - Last time's survivor, the one-Voice guard on legato (`src/engine/synthEngine.ts` line 1680 now), dropped → **caught** now: the two tests named for it ("restarts a held Voice taken for a new Note on 2 Voices… on 1 Voice it is legato (issue 94)", and the same for a key struck again) and the dip test beside them go red, in `src/engine/synthEngine.browser.test.ts`. Ten engine tests failed in all; I did not run an unmutated baseline to separate the others (the output limits, `writesOnlyChanges`) from the machine's load.
6. **Read the code.** `src/patch/serialize.ts`, the share link's parser: short, total (`sanitizePatch` drops unknown fields, clamps numbers, falls back to defaults), errors a person can read. Good code by any standard. `synthEngine.ts` (1,747 lines) reads well but is dense: nearly every block carries a comment with an issue number, some of them paragraphs ("Near the top the Resonance fades, and a high-pass falls silent (issue 195), as `filterStagesAt` and `filterLevel` have it…"). 18 `biome-ignore` in `src`, each with a reason; no `as any`, no `@ts-ignore`, no TODO. Biome's formatter is still off: 1,493 lines over 120 characters in the app code.
7. **Where the code goes.** `App.tsx` is back up to 903 lines (684 after last time's split; 73 commits touched it in eight days). Bead, the water-drop mascot, is **4,739 lines of app code (18 % of it) plus 2,893 of tests**: more than the engine. Fun, typed, tested; but a stranger who came for a synth inherits a cartoon character's physics.
8. **History since 1.16.0.** 1,003 commits, +68,323 / −15,905 lines, all co-authored by Claude; 319 `No issue:` (a third, down from half). Commit subjects are short and cryptic out of context ("the specs' Piano keys by name, two waits in the page"). A night shift (`.claude/skills/night-shift/`) builds `ready-for-agent` issues unattended on a branch while the owner sleeps; the morning merge of 2026-11-06 (`6c010c6`, 30 files, +684 / −314, issues 248 to 250, the Filter's Mode crossfade in the engine among them) says "approved by the owner, untried: 'It's fine, I trust you. Merge and push.'" The next commit (`4578fa9`) fixes a bug in that very crossfade, found by the agent's code review. Credit for writing it down; it is still the mark I came looking for.
9. **CI.** Last time's two workflow findings are fixed: pull requests and release branches have their own concurrency group, and `main`'s deploy is never cancelled (`deploy.yml`, with the reason in a comment); the browser jobs run in Playwright's image with one bundled font (`.github/fonts.conf`). Release work now goes through `release/X.Y.Z` branches first, and of the last 100 runs the 36 failures are mostly those branches and probe branches doing their job; `main` itself went red twice (2026-11-03). 20 `test.skip`, every one with a reason, a few for "too few frames on GitHub's Linux WebKit"; `retries: 1` on CI. Fixed sleeps in e2e (`waitForTimeout`, by my grep) went from 56 to 96.

## What worked

- **Disclosure** is the best I've seen: README line 5, CONTRIBUTING, every commit's trailer, and even the night shift's untried merges say so in the log.
- **The tests have teeth.** Four of four mutations caught: three in maths a person can check (pitch, Key Track, velocity), and last time's survivor in the engine's legato rule, each by tests named for the behaviour and its issue.
- **Reviews are answered.** Both of last time's CI findings fixed, with the reason written beside the fix; the community profile complete; `useEffectEvent` in use (10 files).
- **Security posture fits the project**: a static page, one parser for untrusted input, written defensively; SECURITY.md says exactly that.
- **Dependencies**: two at runtime, none vulnerable, none stale by more than a minor.

## Where they got stuck

- **Keeping up.** At 125 commits a day, a pull request against `App.tsx`, `styles.css` or the engine is stale by lunch, and there is no way to tell what the night shift will build next except reading 252 issue files.
- **Knowing what a human checked.** The owner directs and decides taste; the diffs are written and reviewed by agents, and some merges are, in the log's own word, "untried". As a would-be dependent I can't tell which code a person has read.
- **The volume.** 470,000 words of docs and 26,000 lines of app code for a browser synth; the glossary alone is 5,200 words. Everything is findable, little is skimmable.

## Would they…

- **Like:** yes. It is careful work, and the honesty is disarming.
- **Contribute:** a Preset, a Tutorial or a bug report from Firefox, as CONTRIBUTING asks; not code in the UI or the engine while it moves this fast.
- **Depend on it:** no, but it's an app, not a library; nothing to depend on.
- **Come back:** yes, to see whether a human-held pace ever sets in.
- **Recommend as an example of AI-assisted open source:** yes, for its disclosure, CODING_STANDARDS.md and its tests; with the caveat that it shows what an agent can produce and keep green, not what a maintainer can keep in their head.

> Third look at the Claude-built synth. Every criticism I made a week ago was fixed, with the reason in the commit. Tests catch every mutation I tried. Disclosure is exemplary, down to a merge whose message says the owner approved it "untried", followed by a fix to a bug in that change found by the agent's own review. That is the thing: 1,000 commits in eight days, 18 % of the code a mascot, a night shift building while the owner sleeps. It's the most honest AI-built repo I've read, and the clearest picture yet of why "an agent reviewed it" isn't the same as "someone read it".

## Since the last run (1.16.0, 2026-10-30)

- Finding 1 (layout tests depend on the machine's fonts): **done**. The browser jobs run in Playwright's Linux image with one font set, and releases go through a branch run first.
- Finding 2 (PRs share `main`'s cancelling concurrency group): **done**, with the reason written in the workflow.
- Finding 3 (hand-synced refs, `useEffectEvent`, hook tests): **mostly done**. `useEffectEvent` in 10 files, `useMidi`, `useShows`, `useHeaderPanel` and `useUnderHeader` have browser tests; 8 `useExhaustiveDependencies` ignores remain, each with its own reason. The legato guard that survived last time is now caught by the engine suite.
- Community profile 85 % → 100 %. Code of conduct unchanged (LinkedIn as the channel).
- New: a night shift builds unattended; 1,003 commits and +68k lines in eight days; `App.tsx` 684 → 903 lines; e2e fixed sleeps 56 → 96.

## Three findings, ranked

1. Night-shift merges go to `main` untried by a human (`6c010c6`, "approved by the owner, untried", 30 files including the engine's Mode crossfade, whose bug the agent review fixed in the next commit `4578fa9`): say in the README which changes a person has tried before release, and keep engine and MIDI changes from the night out of `main` until the owner has played them.
2. The pace makes outside code contributions impractical: 1,003 commits in eight days, `App.tsx` touched 73 times and back up from 684 to 903 lines, so any PR to the UI or engine conflicts within hours; publish what is being built next (a short roadmap or the `ready-for-agent` list in CONTRIBUTING) and split `App.tsx` again.
3. Bead is 4,739 lines of app code (18 %, more than the engine) and 2,893 of tests, and e2e fixed sleeps rose from 56 to 96: the maintenance weight sits on the mascot and on timing, not on the synth; move Bead behind one module boundary a contributor can ignore, and replace sleeps with waits on state, as CODING_STANDARDS.md already asks.
