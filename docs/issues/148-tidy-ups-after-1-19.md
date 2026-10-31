# 148: Tidy-ups after 1.19

**What to build:** The 1.19.0 review's small findings in the C16 work (inbox, 2026-10-31), polish for v1 ([131](./131-v1.md)), as [139](./139-tidy-ups-after-1-18.md) is for 1.18: sums and words written once, the printed card's footer built from the layout's data, a few leftovers removed, and the C16 layout's tip pointing at the card. Nothing a player hears changes, and the card prints as before but for its footer's facts coming from the data.

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## Agent Brief

**Category:** enhancement
**Summary:** Tidy what 1.19.0's code review found in the C16 layout, its printed card and the MIDI code: duplicated sums and labels, a hard-coded footer, unused leftovers and a tip with no way to the card.

**Current behavior and desired behavior:**
- **Each sum and word once.** The card's "Momentary"/"Toggle" repeat the MIDI panel's mode labels; the `'trigger' | 'toggle'` type is written out in the button-mode function and in the card's cell; the bank letters (`'ABCD'[b]`) twice in the card; the first layout re-derives the knob and fader CCs the C16 module already computes; the print script copies the card's margin and page count from its spec; the mascot spec's `26 : 6` stands for Bead's height less the part left showing; the fallback name "MIDI device" is written three times in the inputs module. Each gets one home the others use: the mode labels from the MIDI describe module, a named mode type, a bank-letter helper, the C16 module's CC functions, a shared card constant, a named sum, one constant.
- **The card's footer from the data.** Its doc comment says the card is built from the layout's data, but its footer hard-codes the buttons shared by every bank (M1 Previous Preset, M2 Next Preset, M3 Freeze, M4 Hold, S3 Snapshot) and "Free places stay Toggle". The footer reads them from the layout, so it cannot disagree with it.
- **Leftovers.** `c16Connected` in the MIDI hook is a ref read only where it is set: removed. The 'detect' knob mode and issue 144's rule now serve only first-layout Mappings not yet brought over: kept, with a comment saying so and when they may go (Claude's call, open to the owner: a visitor's stored first layout still loads). `close` and `on` in Bead's perch chooser, and `bottom - 4` twice beside `fits`: named once. The `(m as Partial<Mapping>).device` cast twice in the Mapping guard: once.
- **Words.** The C16 tip calls bank D "the LFOs" where the bank's name is "LFO & Envelopes": the tip uses the bank's name. The C16 layout's tip says "as the printed card says" with no way to it: it names the "Print C16 card" button beside it.

**Key interfaces:**
- The C16 module (layout, CC functions, button modes, bank names) and its printed card
- The MIDI describe module's mode labels
- The MIDI hook, the inputs module, the Mapping guard
- Bead's perch chooser and the mascot spec
- The MIDI panel's tips

**Acceptance criteria:**
- [ ] The card and the MIDI panel show the same mode labels from one source
- [ ] The card's footer is built from the layout's shared buttons; a unit or e2e test changes a shared place and sees the footer follow (or checks the footer against the layout)
- [ ] The print script and the card's spec share the margin and page count
- [ ] `c16Connected` is gone; the 'detect' mode carries its comment
- [ ] The tips name the bank "LFO & Envelopes" and point at the "Print C16 card" button
- [ ] The C16, MIDI and mascot specs and the design audit pass unchanged; every test passes in Linux's fonts too

**Out of scope:**
- One seam for what a Controller is ([149](./149-one-seam-for-a-controller.md))
- Any change to the C16 layout's places or a button's mode
- The MIDI Learn mode bug ([147](./147-midi-learn-tells-toggle-from-momentary.md))
