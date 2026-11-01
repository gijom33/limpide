# 177: A leaner night shift

**What to build:** Claude's look at the night of 2026-10-31 ([its report](../night/2026-10-31.md), git-ignored), asked for by the owner: "can you assess what took the most time and tokens during this night shift? I am sure we have been wasteful because of inefficiencies." The night built 26 issues in about 15 hours of subagent work and 5.7 M subagent tokens; most of the time went to tests, run whole in both browsers inside several issues and again at the end, on a machine loaded to 20 to 46 by a Chrome tab, the night's own dev server and side jobs, so timeouts led to reruns and to chasing flakes. The owner: "Yes, write the issue." Process, not the app: [docs/night-shift.md](../night-shift.md), the `night-shift` skill and its implementer brief, and three flaky tests.

**Blocked by:** none

**Status:** ready-for-agent · enhancement. First in the next night's queue, ahead of the bugs, decided by the owner (2026-11-01: "Yes, 177 first"), so the night after it runs by its rules.

## What the night showed (2026-10-31)

- **Time:** full-tier issues took 30 to 85 minutes (160: 85; 150 and 163: 72; 112 and 116: 68; 141: 62); light-tier ones 2 to 9 (172, 161, 162, 174, 176, 171). Several builders ran the whole suite (112 in both browsers, 150 and 160 in Chromium, 157 `test:changed`), then the night ran it again.
- **Load:** a browser tab at over 100 % of a core for 16 hours, the night's Vite dev server rebuilding on every edit with Bead animating in the app's browser pane, side jobs driving headless browsers beside the builds. At load 16 to 46 the end-of-night suite had 7 unit and 12 browser timeouts, all green alone; one builder lowered a limit (166's sideband cap) because of a load flake.
- **Rework from triage:** 153's decision 3 and 158's first criterion could not be met (no room on screen), found only by the builder; 150's rules were corrected after building; 176 left a bug that 160 fixed.
- **Fixed cost:** each subagent spends 80 to 100 k tokens reading before it builds (172, a 2-minute change, cost 80 k).
- **Reviews:** the `code-review` skill runs two reviewers for every issue, small ones included.
- **The lead:** the night's lead shared one session with the day's triage and grillings, its context reaching 629 k tokens, read again at each of several hundred turns.

## Decisions

The owner asked for the issue (2026-11-01); the rules below are Claude's call, open to the owner:

1. **The night runs in its own session** (the scheduled task's), never in a day session's conversation; a night started by hand from a day session starts a new session for it.
2. **A quiet machine:** the night starts no dev server and opens no browser pane; side jobs (reviews, research, prototypes) run by day, not beside a night; the night's report notes the load average at the start and, if it is above 8, says the results may carry load flakes. The owner's part (closing busy tabs) goes in docs/night-shift.md's "What it needs".
3. **Testing by risk, the rule:** each issue is light or full, the lead saying which in its brief. Light (words, labels, tips, docs, one panel's layout): `tsc`, lint, the touched unit tests and the touched Playwright specs in Chromium, one review pass. Full (the engine, MIDI, Bead's motion, layouts across widths, stored settings): the same plus the touched specs in WebKit and the `code-review` skill. No builder runs the whole suite; the night runs it once at the end, both browsers, one Playwright run at a time and never beside the unit suite, failures rerun alone before they are called real.
4. **Small issues batched:** up to four light issues in one subagent, each its own commits and its own report section.
5. **Measured before decided:** a triage decision about where something goes on screen is checked against the page at the widths it names (a quick measurement in the browser) before it is written; the lead does the same for a queued issue's layout criteria before briefing it.
6. **The three flaky tests fixed for good:** Bead's frame-cost test (it failed at load with the night's starting code: measure relative to a reference frame, or skip under load with a note), the long unit tests that time out at 5 s under load (give them their measured time and a margin, as `d15c07a` did for the edge round trips), and the tooltip timing tests (wait on state, not time).
7. **Status updates:** the lead posts one line per issue to the report and to the owner, not a summary of each builder's report; "waiting on its own background work" notices get no message.

## Agent Brief

**Category:** enhancement
**Summary:** Make the night shift cheaper and faster: its own session, a quiet machine, tests by risk with one full suite at the end, small issues batched, layout decisions measured at triage, three flaky tests fixed, terser updates.

**Current behavior:** See "What the night showed". The night-shift skill tells each builder to run `/implement` (tdd, the touched tests, `code-review`); nothing says which tests a small change needs, so builders ran the whole suite; nothing keeps the machine quiet; issues run one per subagent however small; three tests fail under load.

**Desired behavior:** docs/night-shift.md and the `night-shift` skill (SKILL.md and implementer.md) carry decisions 1 to 5 and 7 as rules, written for an agent (`/writing-for-agents`): the session, the quiet machine and the load note, the two tiers and what each runs, the end-of-night suite and the rerun-alone rule, batching, the layout check at triage (also a line in docs/agents/issue-tracker.md or wherever triage is described). Decision 6's three tests no longer fail on a loaded machine, each change explained in a comment, and a run of the whole suite at a high load (or simulated, e.g. with CPU throttling) shows them steady.

**Key interfaces:**
- docs/night-shift.md, `.claude/skills/night-shift/SKILL.md` and `implementer.md`
- The triage description (docs/agents)
- Bead's frame-cost test, the unit tests that time out under load, the tooltip timing tests

**Acceptance criteria:**
- [ ] The skill and the doc state the tiers, the end-of-night suite, batching, the quiet machine, the session rule and the update rule, and a fresh agent reading them can say which tier a given issue is
- [ ] Triage's description asks for a measurement before a layout decision
- [ ] The three flaky tests pass five runs in a row under load (the whole suite in both browsers at once), and alone as before
- [ ] The next night's report shows its load at the start and its tiers per issue

**Out of scope:**
- Parallel lanes (the brainstorm of 2026-10-31): a later step once one quiet lane is lean
