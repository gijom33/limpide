# 147: MIDI Learn tells a toggle button from a momentary one

**What to build:** The 1.19.0 fact-check's finding (inbox, 2026-10-31), a bug in v1 ([131](./131-v1.md)): MIDI Learn and Quick Setup make every Action Mapping learned from a button momentary. A toggle button (one message a press, 127 then 0 on the next) learned on an Action is labelled "Momentary" in the MIDI panel and fires on every other press. The label is new in 1.19.0; the behaviour is older (issue 34's known limit). Learn tells the two apart from the press it learns from, as profile 17 suggested ([review](../reviews/2026-10-31/17-midi-mapping-geek.md), "Do detect it in MIDI Learn").

**Blocked by:** none

**Status:** ready-for-agent · bug

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
- [ ] Learn on an Action, press-and-release (127 then 0 within the window): the Mapping is momentary and fires once a press
- [ ] Learn on an Action, one 127 and nothing for the window: the Mapping is a toggle and fires on each of the next 0, 127, 0
- [ ] Learn on an Action from a 0: a toggle, at once
- [ ] The release while learning fires no Action and does not move Quick Setup on twice
- [ ] Learn on an Action from a note: momentary, as before
- [ ] The MIDI panel shows "Toggle" or "Momentary" to match
- [ ] Learning a knob or fader on a Parameter is unchanged (its tests pass as they are)
- [ ] Unit tests in the control surface's spec, red before the fix; an end-to-end test through the MIDI panel with a fake MIDI input

**Out of scope:**
- Detecting the mode of a Mapping already learned, or of the C16 layout's buttons (their modes come from the printed card)
- Sending MIDI back to set a Controller's lights
