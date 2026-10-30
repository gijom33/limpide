# 57: The Tutorial player

**What to build:** Everything that plays a Tutorial, whatever its content, as decided in the grilling of [issue 40](./40-preset-tutorials.md) (its Decisions list): the Tutorial data type, the card, the ring on the Step's control, checking a Step, Listen, the doors in, and the ticks kept. Built against a short Tutorial written for the tests; the real ones are [58](./58-first-tutorials.md). PRD stories 84–89.

**Blocked by:** none

**Status:** done (2026-10-26). **Before the LinkedIn post.**

**Since then:** (2026-10-30, [issue 104](./104-keyboard-and-screen-readers-after-1-16.md)) the card takes the focus when a Tutorial is picked, on its Start, and keeps it on its way forward when the button pressed goes; Next waiting for its Step is `aria-disabled`, so it keeps the focus. It still never takes the focus from the control being turned.

**Since then:** (2026-10-30, [issue 105](./105-header-and-panels-on-every-screen.md)) a Step can name the Viewer its note points at; the page scrolls the least that shows the control and that Viewer between the header and the card, the Viewer first once the Step is made. On a phone a made Step's note shows whole.

- [x] The data: a Tutorial is a Preset's name, a Listen phrase and its Steps; a Step is one Parameter and its target, or one Display option, with an instruction and a note. A test helper applies the Steps to Init
- [x] Checking a Step: a knob or fader within 5 % of its travel (on its own Taper), a choice exactly; reached, it snaps to the target and shows the note; a Step already at its target shows as done
- [x] The card, docked at the bottom on every layout: intro, Steps ("Step 2 of 7"), the last card with what differs and "Match the Preset"; Back (moves the card only), Next, "Do it for me", Quit, Listen; on a phone one or two lines, tapped to show all
- [x] The ring in the accent colour on the Step's control, steady, and the target beside its readout ("→ 800 Hz"); the control's tab or phone section brought into view, the control scrolled above the card
- [x] Listen: the Tutorial's phrase repeated, off until tapped; stops on Quit and at the end
- [x] Starting loads Init as loading a Preset does and stops the Demo; nothing is locked
- [x] The doors: a Tutorial button on a Preset's row when it has one, a Tutorials list at the top of the Patches panel, a "Tutorial" button in the Welcome
- [x] A tick per finished Tutorial, kept with `safeStorage`
- [x] Accessibility: a labelled region, each Step's text in a polite live region, buttons in the Tab order, focus never taken
- [x] Tests: unit for checking a Step and the Patch check; e2e for a Tutorial played through by turning, by "Do it for me", off the path then "Match the Preset", on a phone and at 2 × 2 (the card never covers the control)

Notes from building it: a Step's control is found by its MIDI Learn key (`data-learn`), so anything learnable can be a Step; the ring follows a click (a tab, the Display panel opening). Two Steps arrive already within reach (Bass's Filter Decay, 250 → 180 ms; Pluck's Amp Decay, 300 → 450 ms): as decided, they show as done and snap to their targets, the instruction kept above the note. Starting the Demo ends a Tutorial, since it loads its own Presets; the Song stops Listen. Code: `src/tutorial/` (the Steps, checking them, the stored ticks), `src/ui/TutorialCard.tsx`; tests in `src/tutorial/*.test.ts` and `e2e/tutorial.spec.ts`.
