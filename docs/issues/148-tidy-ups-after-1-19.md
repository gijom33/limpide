# 148: Tidy-ups after 1.19

**What to build:** The 1.19.0 review's small findings in the C16 work (inbox, 2026-10-31), polish for v1 ([131](./131-v1.md)), as [139](./139-tidy-ups-after-1-18.md) is for 1.18: sums and words written once, the printed card's footer built from the layout's data, a few leftovers removed, and the C16 layout's tip pointing at the card. Nothing a player hears changes, and the card prints as before but for its footer's facts coming from the data.

**Blocked by:** none

**Status:** done (2026-11-02). Built (2026-11-01) on night/2026-10-31 and released; approved by the owner: "Okay, I trust you."

## Agent Brief

**Category:** enhancement
**Summary:** Tidy what 1.19.0's code review found in the C16 layout, its printed card and the MIDI code: duplicated sums and labels, a hard-coded footer, unused leftovers and a tip with no way to the card.

**Current behavior and desired behavior:**
- **Each sum and word once.** The card's "Momentary"/"Toggle" repeat the MIDI panel's mode labels; the `'trigger' | 'toggle'` type is written out in the button-mode function and in the card's cell; the bank letters (`'ABCD'[b]`) twice in the card; the first layout re-derives the knob and fader CCs the C16 module already computes; the print script copies the card's margin and page count from its spec; the mascot spec's `26 : 6` stands for Bead's height less the part left showing; the fallback name "MIDI device" is written three times in the inputs module. Each gets one home the others use: the mode labels from the MIDI describe module, a named mode type, a bank-letter helper, the C16 module's CC functions, a shared card constant, a named sum, one constant.
- **The card's footer from the data.** Its doc comment says the card is built from the layout's data, but its footer hard-codes the buttons shared by every bank (M1 Previous Preset, M2 Next Preset, M3 Freeze, M4 Hold, S3 Snapshot) and "Free places stay Toggle". The footer reads them from the layout, so it cannot disagree with it.
- **Leftovers.** `c16Connected` in the MIDI hook is a ref read only where it is set: removed. The 'detect' knob mode and issue 144's rule now serve only first-layout Mappings not yet brought over: kept, with a comment saying so and when they may go (Claude's call, let stand by the owner in 1.20.0: a visitor's stored first layout still loads). `close` and `on` in Bead's perch chooser, and `bottom - 4` twice beside `fits`: named once. The `(m as Partial<Mapping>).device` cast twice in the Mapping guard: once.
- **Words.** The C16 tip calls bank D "the LFOs" where the bank's name is "LFO & Envelopes": the tip uses the bank's name. The C16 layout's tip says "as the printed card says" with no way to it: it names the "Print C16 card" button beside it.

**Key interfaces:**
- The C16 module (layout, CC functions, button modes, bank names) and its printed card
- The MIDI describe module's mode labels
- The MIDI hook, the inputs module, the Mapping guard
- Bead's perch chooser and the mascot spec
- The MIDI panel's tips

**Acceptance criteria:**
- [x] The card and the MIDI panel show the same mode labels from one source
- [x] The card's footer is built from the layout's shared buttons; a unit or e2e test changes a shared place and sees the footer follow (or checks the footer against the layout)
- [x] The print script and the card's spec share the margin and page count
- [x] `c16Connected` is gone; the 'detect' mode carries its comment
- [x] The tips name the bank "LFO & Envelopes" and point at the "Print C16 card" button
- [ ] ~~The C16, MIDI and mascot specs and the design audit pass unchanged; every test passes in Linux's fonts too (they pass in Chromium and WebKit on macOS, the specs touched only to share the card's print constants, check the foot and name Bead's height; Linux's fonts are GitHub's run, after a push)~~ (not checked at the time)

**Out of scope:**
- One seam for what a Controller is ([149](./149-one-seam-for-a-controller.md))
- Any change to the C16 layout's places or a button's mode
- The MIDI Learn mode bug ([147](./147-midi-learn-tells-toggle-from-momentary.md))

## How it was built

- **Each sum and word once:** the card's Momentary and Toggle (its header, each button and the Print C16 card tip) come from the MIDI panel's mode labels (`describeMode`); the button modes are one type, `ButtonMode`, in the Mappings module; the bank letters one helper (`bankLetter`); the first layout's table counts its CCs with the C16 module's `knobCc`, `faderCc` and `buttonCc`; the print script and the card's spec share the margin and the page count (a small module beside the print script, since it uses Node's Buffer); the mascot spec's 26 is a named `BEAD_HEIGHT`; the inputs module's "MIDI device" is written once.
- **The card's foot from the data:** the C16 module finds the buttons the same on every bank (`sharedButtons`, today M1 to M4 and S3) and says them as one line; the foot reads that line, a free button's mode (Toggle, the C16's own setting) and the channel from the module. It prints the same words as before. A unit test empties bank C's S row and sees S3 Snapshot leave the line; the card's spec checks the foot against the layout.
- **Leftovers:** `c16Connected` is a local in the hook; the 'detect' mode and `detectKnobMode` (issue 144's rule) say they serve only a stored first layout and go with `upgradeC16Layout`; Bead's perch chooser names its 4 px over the window's bottom (`TAKEABLE_OVER_BOTTOM`) and its lists `fitting` and `chosen`, with no change to where it goes; the Mapping guard reads `device` once.
- **Words:** the C16 layout's tip names its banks from the layout ("A Oscillators, B Filter, C Amp, D LFO & Envelopes") and points at the Print C16 card button beside it.
- **Skipped:** nothing. The mascot spec's sum was `26 : 0` by tonight, not the review's `26 : 6`, and it allows Bead's whole height, not its height less the edge left showing (the code's overlap, 24 px), so the name says its height and the test is unchanged.
- **Tests run:** `npx tsc`, `npm run lint`; the unit tests of the MIDI modules, the tips, Bead's place and the scripts (271), and the MIDI hook's browser test; in Chromium and WebKit the C16 card, MIDI Learn, Quick Setup, mascot and tooltip specs and the design audit, all passing. Five mascot and MIDI Learn tests (Bead's frame timing, a throw, the tempo knob) failed under the machine's load (load average 22, other sessions running) and passed alone; one of them first failed because the spec's new name was read inside the page, fixed. Then the code review (standards and spec): no bug; its points taken (the C16 layout's tip said the shared buttons too, now from the same line; the PDF helpers out of the app's code; a shorter 'detect' comment; clearer names).
- **Claude's calls, let stand by the owner in 1.20.0:**
  1. **The 'detect' mode stays,** for a visitor whose first layout (before 1.19) is still stored: it loads and is brought over when the C16 is next plugged in. It and issue 144's rule may go with the upgrade, a release or two after v1.
  2. **The C16 layout's tip names all four banks by their names,** "A Oscillators, B Filter, C Amp, D LFO & Envelopes", where it said "A the Oscillators … D the LFOs", and **says the shared buttons as the card does,** "On every bank: M1 Previous Preset, M2 Next Preset, M3 Freeze, M4 Hold, S3 Snapshot", where it said "M1 to M4 are the Preset arrows, Freeze and Hold, and S3 Snapshot". Both from the layout, so neither can drift from it.
  3. **The tip's way to the card:** "Set the C16’s knobs to Relative #1 and each button as the card says: Print C16 card, beside this, opens it."
- **To try:** with a C16 connected (or the fake one), hover C16 layout and Print C16 card in the MIDI panel and read the tips; open the card (`#c16-card`) and check its foot reads as before; print it, one page.
