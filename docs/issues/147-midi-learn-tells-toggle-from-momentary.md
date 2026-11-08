# 147: MIDI Learn tells a toggle button from a momentary one

**What to build:** The 1.19.0 fact-check's finding (inbox, 2026-10-31), a bug in v1 ([131](./131-v1.md)): MIDI Learn and Quick Setup make every Action Mapping learned from a button momentary. A toggle button (one message a press, 127 then 0 on the next) learned on an Action is labelled "Momentary" in the MIDI panel and fires on every other press. The label is new in 1.19.0; the behaviour is older (issue 34's known limit). Learn tells the two apart from the press it learns from, as profile 17 suggested ([review](../reviews/2026-10-31/17-midi-mapping-geek.md), "Do detect it in MIDI Learn").

**Blocked by:** none

**Status:** done (2026-11-04). Built (2026-10-31) on night/2026-10-31, released in 1.20.0; accepted by the owner, tried in part and the rest trusted: "All issues waiting on my feedback look fine, I tested some, others trust you."

## Decisions

Claude's call, open to the owner, 2026-10-31, from profile 17's review:

1. **Detected while learning only,** never live on a learned Mapping: two quick presses of a toggle send the same pair as one momentary press, and quick presses are what Hold's tapped rhythm is made of.
2. **The rule:** a button learned on an Action whose first message is a press (above the middle) and whose release (at or below the middle) follows within about half a second is momentary; one whose release does not follow in that time is a toggle. A first message at or below the middle is a toggle (a toggle whose light was on), since a momentary press never starts with its release.
3. **The release while learning is used up** by Learn, so it does not also fire the Action or arm the next Quick Setup step.
4. **A note learned on an Action stays momentary,** as now: a note-on is the press.

## Agent Brief

**Category:** bug
**Summary:** MIDI Learn and Quick Setup always learn a button on an Action as momentary; a toggle button then fires on every other press and the MIDI panel calls it "Momentary".

**Current behavior:** Learning a CC button on an Action records the Mapping as momentary ('trigger') at its first message. A toggle button, which sends 127 on one press and 0 on the next, then fires the Action only on the 127s, so every other press does nothing; the MIDI panel labels it "Momentary".

**Desired behavior:** Learning a CC button on an Action waits briefly after the first message: a release within about half a second makes the Mapping momentary, no release in that time makes it a toggle, and a first message at or below the middle makes it a toggle at once. A toggle Mapping fires on every message, as the C16 layout's toggles already do. The MIDI panel's label says which. The release that ends a momentary learn is used up by Learn: it fires nothing and does not arm the next Quick Setup step. The window and its message use the same settle mechanism the knobs' Encoder Mode detection uses while learning.

**Key interfaces:**
- The control surface's MIDI Learn state machine (its armed and listening phases, the settle timer)
- The Mapping's mode ('trigger' or 'toggle') and how an Action fires for each
- Quick Setup's Action steps, which learn through the same machine
- The MIDI panel's mode label

**Acceptance criteria:**
- [x] Learn on an Action, press-and-release (127 then 0 within the window): the Mapping is momentary and fires once a press
- [x] Learn on an Action, one 127 and nothing for the window: the Mapping is a toggle and fires on each of the next 0, 127, 0
- [ ] ~~Learn on an Action from a 0: a toggle, at once~~ (not checked at the time)
- [x] The release while learning fires no Action and does not move Quick Setup on twice
- [x] Learn on an Action from a note: momentary, as before
- [x] The MIDI panel shows "Toggle" or "Momentary" to match
- [x] Learning a knob or fader on a Parameter is unchanged (its tests pass as they are)
- [x] Unit tests in the control surface's spec, red before the fix; an end-to-end test through the MIDI panel with a fake MIDI input

**Out of scope:**
- Detecting the mode of a Mapping already learned, or of the C16 layout's buttons (their modes come from the printed card)
- Sending MIDI back to set a Controller's lights

## How it was built

Built on 2026-10-31, on night/2026-10-31, in two commits: the build, then the code review's fixes.

**What changed:**
- A CC learned on an Action now goes through Learn's listening phase and its settle timer, the one the knobs use.
- If a second message arrives within half a second (the release), the Mapping is momentary, and Learn ends at once. If only one message arrives, the Mapping is a toggle.
- Learn uses up the button's messages, the release included, so they fire nothing, and Quick Setup moves on once.
- A note still learns at once as momentary. The MIDI panel's label comes from the mode, so it says "Toggle" or "Momentary".
- While a button is heard out, the Learn bar says "one moment…" where it said "keep turning…".
- The glossary's MIDI Learn entry is updated, and issue 34's first Known limit has a "Since then" line.

**Tests:**
- Unit tests in the control surface's spec. The toggle, knob-on-an-Action and cut-short tests fail on the code before the fix.
- An end-to-end test in the MIDI Learn spec, through the MIDI panel with a fake MIDI input. It also fails on the code before the fix.
- Passing: `tsc`, the lint, all unit tests, and the MIDI Learn and Quick Setup Playwright specs (Chromium).

**Calls made (Claude's call, open to the owner):**
1. **Decision 2 changed, after the code review:**
   - The rule is now: one message alone in the window is a toggle, whatever its value; a second message makes it momentary.
   - This replaces "a first message at or below the middle is a toggle at once". A knob or fader turned on an Action starts at any value, so learning a toggle at once from a low first value made it fire on every message of the rest of the turn.
   - A lit toggle's 0 is still a toggle, but it is mapped after the half second, not at once. That is why the third acceptance criterion is left unticked.
   - A knob on an Action stays momentary, as before.
2. **A button cut short:** if another target is selected while a button is heard out (a click on screen, or Quick Setup's Skip or Back), nothing is learned. Its release, still to come, is not learned for the next target either. The code does not guess, and a skipped step stays unmapped.
3. **The window is the knobs' settle time, 500 ms.** A momentary button held down longer than that is learned as a toggle, and its later release fires the Action once. Stopping Learn within the window learns nothing, as with a knob.
4. **The Learn bar's words while waiting:** "Hold: one moment…".

**To try in the app,** with the C16 or any Controller:
1. MIDI › MIDI Learn, click Hold, and press a C16 button set to toggle once. After half a second the Learn bar says "Mapped Hold". The MIDI panel lists it as "Toggle", and Hold now switches on every press.
2. Do the same with a button set to momentary, pressed and let go quickly. It is listed as "Momentary" and fires once a press.
3. Run Quick Setup's Action steps with either kind of button. Each press moves the Setup on one step, never two.

