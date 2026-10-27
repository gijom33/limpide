# 40: A tutorial for each Preset

**What to build:** For a Preset, a step-by-step tutorial that builds it from the Init Patch, one change at a time, each step saying what to turn and what to listen and look for in the Viewers. It opens from a new button in the Preset's row of buttons in the Patches panel. From the inbox, 2026-10-25.

**Blocked by:** a grilling round and a PRD update. The PRD puts guided lessons out of scope ("the data model should allow them, but the content comes later"); this brings them in.

**Status:** done: grilled 2026-10-26, built in [57](./57-tutorial-player.md) (the player) and [58](./58-first-tutorials.md) (the first four)

Questions for the grilling:

- Is a tutorial data (the Init Patch, then a list of changes, each with its words), written by hand, or derived from the difference between Init and the Preset with words added?
- Does a step change the Patch for the visitor, or ask them to make the change and wait until they have?
- Which Presets first: all 103, or one per category to start?
- Where does a tutorial sit on a phone, where the panel covers the page?

- [x] Grilled; the PRD's Out of Scope and user stories updated (stories 84–89), Tutorial and Step in CONTEXT.md
- [x] Issues for the tutorial player and for the content, from the grilling

From the persona reviews (2026-10-26, [review 5](../reviews/2026-10-26/5-learner-teacher.md)): after the welcome nothing shows the signal chain (Oscillators → Filter → Amp) or says where to start, and the best teaching aids (the Curve's tooltip on Resonance, Maths, Ideal, Snapshot) are hidden in the Display panel. A first tutorial, or a "start here", answers both. The Learner's review runs again once tutorials exist ([42](./42-reviews.md)).

The owner, again, 2026-10-26: "a tutorial where the visitor picks a Preset and the page guides them to set it, with explanations along the way". The same idea, still to grill.

## Decisions (grilling, 2026-10-26)

1. **What it teaches:** both a recipe and a lesson: a Tutorial rebuilds its Preset from Init, and each Step's words give the idea behind the change and what to hear and see in the Viewers.
2. **Who changes the Patch:** the visitor. The Step rings the control in the accent colour (steady, no pulse) and shows the target beside its readout ("→ 800 Hz"); a knob or fader within 5 % of its travel counts and snaps to the exact value, a choice must match. "Do it for me" sets it.
3. **Where the Steps come from:** hand-written data, in teaching order; a unit test applies every Step to Init and expects exactly the Preset's Patch.
4. **One change per Step:** one Parameter, or one Display option to switch on (Snapshot, Maths, Ideal…); Display Steps are left out of the Patch check, and Display options stay as set when the Tutorial ends.
5. **A Step's two texts:** an instruction, then a note shown once the change is made. Next moves on (never on its own); a Step already at its target shows as done. Back only moves the card: nothing is undone.
6. **First and last card:** the Preset's name, its about line and the number of Steps; at the end, one sentence on what was built, and what differs from the Preset with "Match the Preset". No preview of the finished sound yet.
7. **The card:** docked at the bottom on every layout, with Back, "Do it for me", Quit and Listen; on a phone one or two lines, tapped to show the whole text. A control on a hidden tab or another phone section comes into view, as a Controller already brings it, and the page scrolls it above the card.
8. **Listen:** a toggle on the card repeating the Tutorial's own short phrase, so both hands are free; off until tapped. The piano and MIDI still play.
9. **Nothing locked:** only the Step's control is watched.
10. **Starting:** loads Init as loading a Preset does; stops the Demo. Quit leaves what was built; the end leaves the Preset.
11. **Kept:** a tick per finished Tutorial in storage (silent where refused); no resuming mid-Tutorial.
12. **Doors:** a Tutorial button on the Presets that have one (tooltip "Tutorial: build this sound step by step"), a Tutorials list at the top of the Patches panel, and a "Tutorial" button in the Welcome opening Bass.
13. **First slice, before the LinkedIn post:** Bass (Oscillators → Filter → Amp, the signal chain), Acid (Resonance and the Filter Envelope), Pluck (the Amp Envelope's shape), Wobble (an LFO on the Cutoff). The Learner's review runs again after.
14. **Words:** drafted by Claude in the voice of the Presets' about lines, reviewed by the owner before release.
15. **Accessibility:** the card a labelled region, each Step's text announced politely, its buttons in the Tab order, focus never taken; the rest with [51](./51-keyboard-and-screen-reader.md).
