# Persona review 8: the open-source expert, sceptical of AI

Laptop, 30 minutes, 2026-10-30, version 1.16.0. Read: README, CONTRIBUTING.md, CODE_OF_CONDUCT.md, CODING_STANDARDS.md, the licence, `.github/` (workflow, issue forms, PR template), `biome.json`, `.githooks/`, `docs/releasing.md`, the issue tracker's rules, the commit history since v1.8.1, the hooks split out of `App.tsx`; ran `npx tsc`, `npm run lint`, `npm run test:unit` in the checkout, and three mutations in a scratch clone (reverted there); `gh` read-only for the community profile, CI runs and Releases. Nothing tracked was changed but this file.

## First impression

"Last time I said 'mostly impressed, not yet a project you can contribute to'. They read it: there's a CONTRIBUTING now, a code of conduct, issue forms, a PR template, Biome in CI and in a pre-commit hook, tags and GitHub Releases. Community profile up from 42 % to 85 %. 273 more commits in four days, half of them 'No issue:'. So either the paperwork caught up with the code, or the agent got better at producing paperwork. Let's check whether the CI it now runs is actually green."

## What they tried

1. **Community profile.** `gh api …/community/profile`: `health_percentage` 85; CONTRIBUTING, code of conduct, PR template, licence and README found (`issue_template` still `null`, GitHub's API not seeing the YAML forms in `.github/ISSUE_TEMPLATE/`). `main` still unprotected (404), 0 pull requests and 0 issues ever, 1 star, Discussions on but mentioned nowhere. 27 tags `v1.0.0`–`v1.16.0`, each with a GitHub Release.
2. **CONTRIBUTING.md.** Short, honest, useful: what help is wanted (bug reports from Firefox and Android, Presets, accessibility), the commands, "a change that goes against [the ADRs or PRD] is a conversation first", and that the code is written with Claude Code. It answers last time's question: PRs are welcome ("Keep a pull request to one thing"). `CODING_STANDARDS.md` (35 lines) is the best file in the repo for a reviewer: judgement calls only, each with the bug that taught it (issue 77's wrong dependency claim).
3. **Code of conduct.** Five lines that say Limpide "follows" Contributor Covenant 2.1, without its text, and the private report channel is a LinkedIn profile. GitHub counts it; a reporter without LinkedIn has nowhere to go.
4. **Type check, lint, unit tests.** `npx tsc` clean; `npm run lint` → "Checked 233 files … No fixes applied"; `npm run test:unit` → 59 files, **571 tests green** (4 min in this iCloud checkout, 1 min 48 in a clone outside it). No `eslint-disable` left; the duplicate import and the stale Tap comment in `src/engine/synthEngine.ts` (line 15 now says "all of them summed (the app's default…)") are fixed. Biome's formatter is off (`biome.json`), so formatting is still whatever an editor does.
5. **Last time's mutation.** Swapping Next and Previous Preset in `src/ui/hooks/useMidi.ts` line 107 is now caught: `e2e/midiLearn.spec.ts` lines 198–210 learn every Action from its own pad and check the Patch moves the right way. Commit `934436a` says it was written because review 8 swapped them and everything passed. That is the loop working.
6. **New mutations**, in code written since 1.8.1, in a scratch clone:
   - `src/music/idealReference.ts` `besselJ`: normalise on odd orders instead of even → **caught** (`idealReference.test.ts`, "works out the Bessel functions FM's sidebands follow").
   - `src/modulation/modulationModel.ts` `LFO_LAWS.fm.room`: `Math.min(fm, 1 - fm)` → `1 - fm` → **caught** (`destinations.test.ts`, issue 97).
   - `src/engine/synthEngine.ts` line 983: drop `voiceCount() === 1 &&` from the legato rule, so a held Voice that is stolen or retriggered with several Voices no longer restarts → **survived**: the engine suite's only failures were two timeouts, and the unmutated baseline times out on one of the same tests on this machine.
7. **The glue.** `src/ui/App.tsx` went from 963 lines to 684 (10 `useState`, 2 `useRef`, 7 `useEffect`); five hooks came out (`useMidi` 254 lines, `usePlayers` 234, `useTutorialState`, `useHold`, `useKeys`), readable, each with a doc comment on what it owns. None has a unit test; they are covered only through Playwright. The "latest value in a ref" pattern survived the split: 12 refs are assigned during render (`useHold.ts` 15, 18, 23, 35; `useMidi.ts` 60, 144, 209; `usePlayers.ts` 46, 92; `PatchBar.tsx` 43; `App.tsx` 128), and 7 `biome-ignore lint/correctness/useExhaustiveDependencies`, four with the same reason, "X is rebuilt each render, the same each time" (`PatchBar.tsx` 53, `Tooltip.tsx` 63, `DestinationPicker.tsx` 46, `SectionStrip.tsx` 122). I checked two: true today, since the functions touch only refs and setters. React 19.3 ships `useEffectEvent` for exactly this; there are two `useCallback`/`useEffectEvent` in all of `src/`.
8. **CI.** One workflow (`.github/workflows/deploy.yml`) now runs tsc, lint, unit, engine, build and e2e in Chromium and WebKit on every push and PR: what I asked for. `gh run list --limit 100`: 34 success, 7 failure, 2 cancelled. The failures are the release pushes: **1.12.3, 1.12.4, 1.14.1, 1.15.0 and 1.16.0 all failed CI** after `docs/releasing.md` step 3 ("the full suite green") on the owner's Mac. Three were `e2e/fitsScreen.spec.ts:156` ("no two controls come closer than 8 pt at 375×812"), 1.16.0 was the 1280 px header and a Preset name overflowing on Linux's wider fonts (`328a370`), 1.14.1 a WebKit timing. The pages use `font-family: system-ui` (`src/styles.css` line 57), so pixel-exact layout tests measure whichever fonts the machine has. To be fair, the process held: nothing deployed red, and every tag sits on a green commit (`v1.16.0` → `328a370`).
9. **The workflow as a contributor would meet it.** `concurrency: group: pages, cancel-in-progress: true` (lines 14–16) applies to the `pull_request` trigger too (line 6). The first outside PR will cancel a `main` deploy that is in flight, and two PRs will cancel each other. Nobody has seen it because there has never been a PR.
10. **History since 1.8.1.** 273 commits, +14,666 / −2,129 lines (10,246 in `src` and `e2e`), every one co-authored by Claude. 139 subjects start `No issue:`, and 49 of those change `src`, among them the header's rework (`9e34d4e`, 322 lines), the Cutoff rings (`433a47e`, 219) and 17 Presets (`497633d`). The README says the work is planned in issues and "grilled" first; half of it is not. The "code review" at each minor release is the code-review skill, an agent, and its fixes are real (issue 94's legato fix came from the 1.16.0 one, with a test), but nothing shows a human reading a diff. Fixed sleeps in e2e went from 36 to 56 (`demo.spec.ts` alone has 8), while `CODING_STANDARDS.md` asks for timing to run inside the page.
11. **Dependencies.** Still 2 runtime (React 19.3.1), 11 dev. `npm audit`: 0. `npm outdated`: Biome 2.5.15 → 2.6.4, `@vitest/browser-playwright` 4 → 5. Lean and current.

## What worked

- **The previous review was acted on, visibly**: CONTRIBUTING, code of conduct, templates, a linter, browser tests in CI, `App.tsx` split, the MIDI actions tested, the stale comment fixed, and a commit that cites the review it answers. Few human projects close a review that thoroughly in four days.
- **Tests still have teeth** where it counts: two of two mutations in the new FM maths caught, by tests named for the behaviour and the issue.
- **CI gates the deploy**, and the release doc says what to do when it goes red; tags only on green.
- **CODING_STANDARDS.md** reads like a maintainer's notes, not boilerplate: short, specific, each rule with the bug that taught it.
- **Disclosure is honest and prominent**: README "How this was built", CONTRIBUTING, and the trailer on every commit.

## Where they got stuck

- **Trusting a red test.** If I ran the e2e suite on Linux or Windows and saw `fitsScreen` fail, I couldn't tell whether my change or my fonts did it; the owner's own green-on-Mac suite failed CI on five of eight releases.
- **Opening the first PR** would cancel the owner's deploy (step 9). Small, but it is the first thing a contributor does.
- **Knowing what's being worked on.** 102 issue files with Status lines, but feature work lands as `No issue:` commits several times a day; a PR touching the header or `styles.css` (65 commits since 1.8.1) would still conflict by evening.
- **The hooks.** `useMidi` and `usePlayers` are only reachable through a 6,000-line Playwright suite that takes many minutes; I can't unit-test a change there.

## Would they…

- **Contribute:** a small yes now, for a Preset, a bug report from Firefox or an accessibility fix, which is what CONTRIBUTING asks for. Not a feature in the UI layer: it churns daily and the layout tests depend on my fonts.
- **Star:** yes, again. It builds, the tests catch real mutations, two runtime dependencies, and the maintainer answers reviews with commits.
- **Recommend as an example of AI-assisted open source:** yes, with less hedging than last time. I'd point at CONTRIBUTING, CODING_STANDARDS.md, the engine tests and commit `934436a` (a review finding turned into a test). The caveat: "review" here means agents reviewing an agent, and half the commits skip the issue process the README describes.

> Second look at the Claude-built synth. The criticism from last time (no CONTRIBUTING, no linter, untested glue, CI only on unit tests) was fixed within days, including a commit that cites the review and adds the test that would have caught my mutation. The FM maths I mutated was caught both times. What's left: the layout tests are pixel-exact against system fonts, so the owner's green local run failed CI on 5 of the last 8 releases; half the commits are "No issue:"; and the reviews are agents reviewing an agent. Still the most honest AI-built repo I've read.

## Since 1.8.1

- Community profile 42 % → 85 %: CONTRIBUTING, code of conduct, issue forms, PR template (finding 2, done).
- Biome lint in CI and a pre-commit hook; the `eslint-disable` comments, the duplicate import and the stale Tap comment gone (finding 3, done; the formatter is still off).
- `App.tsx` 963 → 684 lines, five hooks; the MIDI Preset arrows now tested end to end (finding 1, mostly done: the hooks have no unit tests, and the hand-synced refs moved with them).
- CI runs the engine and e2e tests in two browsers, as the AI expert asked; it has since caught five releases that passed locally.
- Tags and Releases exist; `main` is still unprotected and no PR has ever been opened.
- New since: half the commits are `No issue:`, and e2e fixed sleeps went from 36 to 56.

## Three findings, ranked

1. The layout e2e tests depend on the machine's fonts (`font-family: system-ui`, `src/styles.css` line 57): 5 of the last 8 release pushes (1.12.3, 1.12.4, 1.14.1, 1.15.0, 1.16.0) failed CI after a green local run, three on `e2e/fitsScreen.spec.ts:156` at 375×812 and 1.16.0 on Linux's wider fonts, so a contributor can't tell their red from their OS's; run the layout tests against one bundled font, or locally in Playwright's Linux image, and say which in CONTRIBUTING.
2. `.github/workflows/deploy.yml` lines 14–16 put pull requests in the same `concurrency: pages` group with `cancel-in-progress: true`, so the first outside PR will cancel a `main` deploy in flight, and PRs will cancel each other; give PR runs their own group (keyed on `github.ref`) and stop cancelling deploys.
3. The hooks split from `App.tsx` kept the hand-synced refs: 12 refs assigned during render (`useHold.ts`, `useMidi.ts`, `usePlayers.ts`, `PatchBar.tsx` 43, `App.tsx` 128) and 7 `biome-ignore useExhaustiveDependencies`, four with the same "rebuilt each render, the same each time" (the kind of claim CODING_STANDARDS.md says went wrong in issue 77); use React 19's `useEffectEvent`, and give `useMidi` and `usePlayers` unit tests (dropping the one-Voice guard on legato, `synthEngine.ts` line 983, also survives the engine suite).
