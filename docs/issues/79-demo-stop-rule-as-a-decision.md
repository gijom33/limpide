# 79: The Demo's stop rule as a pure decision

**What to build:** What a person does that stops the Demo is decided inside a listener that matches each key press and each touch against CSS selectors, so only Playwright can test it, and issues 64 and 71 were bugs in it. The listener now describes each event in plain terms and one pure function decides; the selectors live in one step that names what was touched. Candidate 7 of the architecture review of 2026-10-28, in the version the owner chose. Nothing visible changes.

**Blocked by:** none

**Status:** done (2026-10-28). One pure function decides from a plain description of each key press and touch; the selectors are in one step that names what was touched; a node table test covers every rule. Nothing visible changed: the Playwright suite passes untouched.

## Agent Brief

**Category:** enhancement
**Summary:** One pure decision (stop now, stop when the finger lifts, or play on) from a plain description of a key press or a touch, with a node table test of every rule.

**Current behavior:**
- A key stops the Demo unless it freezes on Space, closes an open Display with Escape, presses Enter on a control that shapes the sound or Enter or Space inside Display, or is a modifier, Shift or Tab.
- A touch plays on outside the page, on the Demo's own card, on a control that shapes the sound, inside Display, or anywhere but the piano while Display is open; otherwise a mouse, or a finger on a control that takes touches itself, stops it at once, and any other finger stops it when it lifts unless the browser takes it over to scroll.
- These rules are written as selector checks inside the listener.

**Desired behavior:**
- The listener describes each event: for a key, the key, whether it freezes, whether a modifier is held, what has the focus, whether Display is open; for a touch, what was touched, whether Display is open, whether it is a mouse, whether the target takes touches itself.
- What was touched is one of: a control that shapes the sound, Display, the piano, the Demo's own controls, elsewhere on the page, or outside it; one step names it from the target.
- One pure function returns stop, stop when the finger lifts, or play on.

**Key interfaces:**
- The Demo's stop decision and the event description it takes
- What a target is, for the Demo

**Acceptance criteria:**
- [x] `npx tsc`, `npm run lint`, `npx vitest run` and `npx playwright test` green, no Playwright test changed
- [x] No selector in the listener's rules: they are all in the step that names what was touched
- [x] A node table test of every rule above, issues 64 and 71 among them

**Out of scope:**
- Controls declaring what they are with an attribute (version B, not chosen)
- The page following the Demo's knobs, and a person's scroll pausing it

## Decisions (grilling, 2026-10-28, decided by the owner)

1. Version A: the rule as a pure decision from a plain description, the selectors in one step that names what was touched; the Playwright tests unchanged; nothing visible changes.

Claude's calls, open to the owner:

2. What was touched is named in a fixed order (the Demo's own controls, Display, a control that shapes the sound, outside the page, the piano, the rest of the page), so a target that is two of them is named the way the old checks treated it.
3. Built in the session that grilled it, test-first, not pushed.

## How it was built

- **The decision** (`src/demo/stopRule.ts`): `demoStop(event)` returns `'stop'`, `'onLift'` or `'playOn'` for a `DemoEvent` (a key or a pointer) and its `Touched`. Tests: `stopRule.test.ts`, 23 cases.
- **The naming step** (`touchedBy` in `src/ui/hooks/usePlayers.ts`): the selectors, in the order of decision 2.
- **The listener** (the same hook): describes each key press and pointer press and acts on the decision; the page following the Demo's knobs and a scroll pausing it are as they were.

