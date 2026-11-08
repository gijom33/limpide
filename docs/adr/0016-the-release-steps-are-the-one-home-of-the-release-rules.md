# The release steps are the one home of the release rules

**Status:** accepted · **Date:** 2026-10-30 · **Decided by:** the owner (triage of [issue 110](../issues/110-checks-before-a-push.md), decisions 1 to 4); the ripple hunter in point 4 is Claude's call, let stand by the owner in 1.18.0 (its decision 5)

Supersedes [ADR-0010](./0010-how-the-work-is-recorded.md)'s point 5, the code review at each minor version, and amends [ADR-0015](./0015-ci-runs-the-end-to-end-tests-before-a-deploy.md)'s "the deploy run is the end-to-end gate" (both are frozen, ADR-0010).

The methodology review of 1.16.0 ([review 10](../reviews/2026-10-30/10-methodology.md)) found the process's own documents drifting the way the product's words once did. The retro of issues 73 to 79 (26dd7ea, 2026-10-28) moved the code review from minor releases to every release that carries issue work, but only in [the release steps](../releasing.md): ADR-0010 still said patch releases skip it, issues 25 and 42 said minor releases only, and issue 25 pointed to steps in `CLAUDE.md` that had moved out. Amended ADRs (0006 by 0011, 0013 by 0014) still read plain `accepted`. The same reviews found the release order letting through what its checks were made to catch: 6 of the last 11 release pushes failed on GitHub's Linux fonts after a green run on the Mac, and 1.16.0 shipped nine false claims in its Preset and tip words because the fact-check ran after the push.

## Decision

1. **One home.** The release rules (what runs before a push, in which order, and what each check covers) live in [`docs/releasing.md`](../releasing.md) alone. An ADR records why a rule was chosen; an issue, `CLAUDE.md` or the README points to the release steps rather than restating them.
2. **The code review's scope:** before every release that carries issue work (a feature, a fix, a refactor that changes nothing visible), over everything since the last tag; the bugs it finds are fixed before the push, the rest goes to the inbox. This replaces ADR-0010's point 5, which reviewed minor releases only.
3. **The branch run before `main`:** a release's commit is pushed to its own branch first, where GitHub runs the same build and the whole suite as for `main`, on its Linux, and deploys nothing; `main` is pushed only once that run is green. The deploy run still runs everything and deploys only when green, but it is no longer where a release first meets Linux.
4. **The checks on words before the push:** for a release that adds or changes Preset or tip words, the fact-checker and the ear stand-in; for any release with issue work, the ripple hunter (issue 42's reviewers 12 to 14). Their findings are fixed or answered before `main` is pushed.
5. **An amended ADR's Status line names its amendment**, the one part of an accepted ADR that may change: `accepted, <the part, quoted or numbered> amended by ADR-N` (or `superseded by`), as ADR-0004 and ADR-0012 already name what supersedes them in part.

## Considered Options

- **Playwright's Linux image on the Mac before a push** (three reviewers' ask): it needs a Docker runtime installed and kept running here, and a second copy of what GitHub already runs.
- **One bundled font, so the Mac and Linux draw alike:** it changes the app's look slightly, everywhere, to fix a test's environment.
- **Keep the deploy run as the gate** (ADR-0015): a red run deploys nothing, but `main` then holds a commit that failed, and the fix costs a second push to `main`, as on 6 of the last 11 releases.
- **Restate each rule where it is used** (ADR-0010, issue 25, `CLAUDE.md`): each copy has to be found and changed with every retro, and the retro of 2026-10-28 changed one of four.

## Consequences

- A release waits for two runs on GitHub, the branch's and then the deploy's, about 6 minutes each; a Linux layout failure costs a commit on the branch, not a red `main`.
- A release with new Preset or tip words waits for the fact-checker and the ear stand-in, which render through the engine; their fixes go through the branch run again.
- A retro that changes a release rule changes `docs/releasing.md`, and records why in an ADR when the change reverses one.
- The release branch is pushed within a release, so on the owner's word like the rest of it, and deleted once its version is tagged.
