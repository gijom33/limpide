# 51: Keyboard and screen reader

**What to build:** A sound can be made and changed without the mouse, and every knob is a named slider ([review 6](../reviews/2026-10-26/6-accessibility.md)). What stops keyboard and screen-reader visitors, ranked. From the inbox, 2026-10-26.

**Blocked by:** none

**Status:** done (2026-10-27)

- [x] Focus returns to the control that opened a panel when it closes (a Preset loaded, Escape in the Patch or Display panel, the welcome's Explore or Play the Demo), not to the page body (WCAG 2.4.3)
- [x] Import file reachable by keyboard: a real button, not a hidden input in a label (WCAG 2.1.1)
- [x] Space on a focused button or option: today it freezes the Viewers (deliberate, `App.tsx:552`), against the button and radio patterns (WCAG 2.1.1). A decision for the owner: Space presses what has focus and Freeze keeps Space only when nothing does, or another key for Freeze
- [x] The Viewers' text alternatives: canvases with a role so their labels are read, the Timeline in the accessibility tree, the LFO plots described (WCAG 1.1.1)
- [x] Arrow keys within a radio group, one Tab stop per group
- [x] Home, End, Page Up and Page Down on knobs and faders
- [x] The new Preset announced after Next or Previous (WCAG 4.1.3)
- [x] Distinct slider names across the two Envelopes and the two LFOs (WCAG 2.4.6)
- [x] The letter keys that play Notes can be turned off (WCAG 2.1.4)

How it was done (`e2e/keyboardAccess.spec.ts` tests each):

- Focus goes back to the Patch name when the Patches panel closes by Escape or a Preset loaded, to the Display button when Display closes by Escape, and to the Demo button when the welcome closes (it opened before anything had the focus). A press elsewhere leaves the focus where it went.
- Import file is a button that opens the hidden file picker.
- Space: the owner's call was open; Claude took the first option, so the owner may revisit it. Space presses what has the focus when that is a button, an option, a tab, a link or a field, and Freezes otherwise (a knob, a Viewer, nothing). The test that said the opposite now says this.
- The Scopes, Spectrums and the Timeline are images with their names; each LFO plot says what it shows ("LFO 1: Sine, 2.00 Hz, Depth 0 %, on Cutoff").
- Every radio group (Waveforms, Filter Mode and Slope, Voices, LFO shapes, the Display choices) is one Tab stop, the chosen option; the arrows, Home and End move the choice (`src/ui/radioGroup.ts`).
- Knobs and faders take Page Up and Down (a tenth of the travel), Home and End.
- The Patch's name is in a hidden status, so a new Preset is read out.
- Sliders whose labels repeat have full names, the label last: "Filter Attack", "Amp Attack", "LFO 1 Rate", "Osc 2 Octave" (`paramName` in `src/patch/patch.ts`). The Mixer's are unique already ("Osc 1", "Noise").
- Display has a Keys choice: the letter keys play Notes, or are off; remembered.

Biome's accessibility rules, on since issue 55, found three more, fixed: the Osc 2 tab's "sounding" was a label on a plain span (now hidden text), the Maths formula a label on a paragraph (now a note), the Patches panel's group names hidden headings (now plain text).
