# 57: The Tutorial player

**What to build:** Everything that plays a Tutorial, whatever its content, as decided in the grilling of [issue 40](./40-preset-tutorials.md) (its Decisions list): the Tutorial data type, the card, the ring on the Step's control, checking a Step, Listen, the doors in, and the ticks kept. Built against a short Tutorial written for the tests; the real ones are [58](./58-first-tutorials.md). PRD stories 84–89.

**Blocked by:** none

**Status:** to do. **Before the LinkedIn post.**

- [ ] The data: a Tutorial is a Preset's name, a Listen phrase and its Steps; a Step is one Parameter and its target, or one Display option, with an instruction and a note. A test helper applies the Steps to Init
- [ ] Checking a Step: a knob or fader within 5 % of its travel (on its own Taper), a choice exactly; reached, it snaps to the target and shows the note; a Step already at its target shows as done
- [ ] The card, docked at the bottom on every layout: intro, Steps ("Step 2 of 7"), the last card with what differs and "Match the Preset"; Back (moves the card only), Next, "Do it for me", Quit, Listen; on a phone one or two lines, tapped to show all
- [ ] The ring in the accent colour on the Step's control, steady, and the target beside its readout ("→ 800 Hz"); the control's tab or phone section brought into view, the control scrolled above the card
- [ ] Listen: the Tutorial's phrase repeated, off until tapped; stops on Quit and at the end
- [ ] Starting loads Init as loading a Preset does and stops the Demo; nothing is locked
- [ ] The doors: a Tutorial button on a Preset's row when it has one, a Tutorials list at the top of the Patches panel, a "Tutorial" button in the Welcome
- [ ] A tick per finished Tutorial, kept with `safeStorage`
- [ ] Accessibility: a labelled region, each Step's text in a polite live region, buttons in the Tab order, focus never taken
- [ ] Tests: unit for checking a Step and the Patch check; e2e for a Tutorial played through by turning, by "Do it for me", off the path then "Match the Preset", on a phone and at 2 × 2 (the card never covers the control)
