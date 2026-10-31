# 139: Tidy-ups after 1.18

**What to build:** The 1.18.0 review's, fact-check's and ripple hunt's small findings (inbox, 2026-10-31), polish for v1 ([131](./131-v1.md)): one shell for the docked cards, sums worked out once, a few names, the remembered settings in one module, a missing test and two Preset descriptions made exact. Nothing a player hears changes.

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## Agent Brief

**Category:** enhancement
**Summary:** Tidy what 1.18.0's checks found: duplicated code, loose names, settings remembered outside their module, a missing test and two loose Preset descriptions.

**Current behavior and desired behavior:**
- **One docked-card shell.** The Tour's card copies the Tutorial card's shell (the top row, the tap-to-show words with the same two lint waivers, the actions row), and its classes say "tutorial" though the Tour is not a Tutorial. Both cards use one shell, with class names that fit both; the waivers are written once.
- **Each sum once.** Osc 2's Envelope term is worked out twice (beside the pitch in cents, which issue 100 made the one answer); FM's index (the FM index constant times FM) is written out in four places. Each has one home that the others call.
- **Names.** The engine tests call the Pulse Width "duty" (a word CONTEXT.md avoids); the Tour card's type shares its component's name; a phrase and its BPM travel together without a name; the Ideal Reference's cache is keyed by a string. Each gets a name in the glossary's words, or a type.
- **The remembered settings.** The cards' folds and the bend range are still remembered outside the one module issue 87 made for the Display settings; they move into it, and what a visitor has saved still loads.
- **A missing test.** When the Tour's "Build a Bass" opens the Bass Tutorial, the focus lands on its Start button; the test that checked it went with the Welcome's Tutorial button (issue 104). A test checks it again.
- **Two Preset descriptions.** FM Bass's "the sidebands jump wide and settle back" and Poly Mod Zap's "laser zap" are true to the ear but loose: the strike is FM's thinnest moment, and the zap is Osc 2's own fall. Their words say so; their sounds do not change.

**Key interfaces:**
- The docked cards (the Tutorial's and the Tour's)
- The engine's Osc 2 pitch and FM terms, and the Modulation model's
- The Display settings module and the stored settings
- The Presets' descriptions

**Acceptance criteria:**
- [ ] The Tour and the Tutorial cards look and behave as before (their e2e specs and the design audit pass unchanged)
- [ ] Osc 2's Envelope term and FM's index each have one definition; the engine and model tests pass unchanged
- [ ] "duty" is gone from the tests; the names follow CONTEXT.md
- [ ] A visitor's stored folds and bend range load after the move
- [ ] A test: the Tour's "Build a Bass" puts the focus on the Tutorial's Start
- [ ] The two descriptions pass the facts check
- [ ] Every test passes in Linux's fonts too

**Out of scope:**
- Any change to a sound or a layout
- The Tour's Amp card words ([130](./130-the-tour-freezes-to-show-adsr.md))
