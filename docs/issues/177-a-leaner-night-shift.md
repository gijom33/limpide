# 177: A leaner night shift

**What to build:** Claude's look at the night of 2026-10-31 ([its report](../night/2026-10-31.md), git-ignored), asked for by the owner: "can you assess what took the most time and tokens during this night shift? I am sure we have been wasteful because of inefficiencies." The night built 26 issues in about 15 hours of subagent work and 5.7 M subagent tokens; most of the time went to tests, run whole in both browsers inside several issues and again at the end, on a machine loaded to 20 to 46 by a Chrome tab, the night's own dev server and side jobs, so timeouts led to reruns and to chasing flakes. The owner: "Yes, write the issue." Process, not the app: [docs/night-shift.md](../night-shift.md), the `night-shift` skill and its implementer brief, and three flaky tests.

**Blocked by:** none

**Status:** done (2026-11-02). Built (2026-11-01) on night/2026-11-01 and released; approved by the owner: "Looks okay, seemed faster last time I ran it."

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
- [x] The skill and the doc state the tiers, the end-of-night suite, batching, the quiet machine, the session rule and the update rule, and a fresh agent reading them can say which tier a given issue is
- [x] Triage's description asks for a measurement before a layout decision
- [x] The three flaky tests pass five runs in a row under load (the whole suite in both browsers at once), and alone as before (the load simulated with CPU burners at 15 to 30, not the whole suite)
- [x] The next night's report shows its load at the start and its tiers per issue (the night of 2026-11-01's)

**Out of scope:**
- Parallel lanes (the brainstorm of 2026-10-31): a later step once one quiet lane is lean

## How it was built

Built 2026-11-01 on `night/2026-11-01`, by day, as the next night's first issue. The `implement` skill cannot be started by an agent (only the owner can type it), so the builder worked its steps by hand; the builder's brief no longer asks for it.

**The rules** (`bbf30c1`, `be14028`): `docs/night-shift.md`, `.claude/skills/night-shift/SKILL.md` and `implementer.md` rewritten as rules, not history: the night's own session; a quiet machine and the load noted at the start, with a warning above 8; the lead naming each issue's tier (light or full, the lists as examples, in doubt full) and what each runs; up to four light issues per builder; no builder running the whole suite; the night's suite once at the end, both browsers, unit tests then Playwright, never side by side, each failure rerun alone; layouts measured before briefing; one-line updates. Also what the owner settled: new issues until 07:00, no four-issue cap. `docs/agents/issue-tracker.md` asks for a measurement before a decision about where something goes on screen.

**The flaky tests** (`1783ac4`, `470c490`, `808fdd5`, `be14028`):
- **Bead's waits** (the Demo's docked card in WebKit, the scroll tests): Bead's motion steps at most 0.05 s a frame (`LONGEST_STEP` in `src/ui/mascotPlace.ts`), so below 20 frames a second it moves slower than the clock. The waits count its own time, frame by frame, and assert the state they saw (a later read found it startled off again by the Demo).
- **Bead's frame cost:** the median frame's work, not the mean; the bound 1 ms or 30 % of the frame without Bead, whichever is more; up to three rounds, Bead sent away between.
- **MIDI Learn's Tap:** the tempo is checked against the gap the page timed between the taps, and polled.
- **The tooltip tests:** the page's clock is installed and run past the hover delay, instead of waiting it out by the wall clock (the LFO tests went from 7 to 4 s).
- **The audit's Bead state:** About and Display opened by the keyboard, and each Escape's effect awaited before the next.
- **Long unit and engine tests:** the unit project's limit 30 s (from 5), the engine's 60 s (from 15), the headroom test 120 s (4.6 s alone). Alone, the edge round trips take 0.2 s and the Q-floor test 0.15 s.

**Tests:** `npx tsc`, `npm run lint`; the touched unit tests (edge sweep, filter design, Ideal, Presets, Bead's place) and the headroom test; the mascot, MIDI Learn, tooltip and audit specs in Chromium and WebKit, 144 passed alone. Under simulated load (11 to 14 CPU burners, `uptime` 15 to 30): each fixed test five times in a row, all green (mascot 40 in Chromium and 35 in WebKit, tooltips and Tap 130, the phone and narrow audits 90, the unit files and the headroom test five runs each); the burners were then stopped.

**Claude's call, open to the owner:**
1. Bead's frame cost is measured relative to the frame without Bead (not skipped under load), and up to three times: a Bead that is only just too dear can pass one try in three.
2. The time limits are raised for the whole unit and engine projects, not test by test: the same slowdown hit seven tests, and a test that hangs still fails, after 30 s rather than 5.
3. The tooltip tests drive the page's clock; the 400 ms they run it on is the Tooltip's 350 ms plus a margin, written in the test.
4. The audit opens About and Display by the keyboard, where a click now and then opened nothing in WebKit; its cause was not found.

**For the owner to look at:**
- The three night-shift files: are the tier examples the ones you want, and is the batching rule right?
- Seen but not fixed (not on the list): the audit's Demo card in WebKit once failed to start under load (the click on Demo opened nothing, at 320 px too); the WebKit hover test "in a short phone window … hovers on its tail" failed once in a parallel run and passed five times alone; GitHub's "dragged and let go, it is thrown, and lands on an edge" fails now and then on its landing place.
