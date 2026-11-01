# 165: The Synth Geek Layer

**What to build:** The owner's idea (inbox, 2026-10-31): "Also tempted to rename the Maths layer into a Synth Geek layer". With History in the tooltips ([134](./134-history-in-the-tooltips.md)) the layer holds more than formulas, so the Maths Layer is renamed. Polish of v1 ([131](./131-v1.md)).

**Blocked by:** none. Built after night/2026-10-31 is merged, since its issue 161 renames a toggle on the same Display row (Claude's call, open to the owner)

**Status:** ready-for-human · enhancement. Built (2026-11-01) on night/2026-11-01, for the owner to try

## Decisions

Decided by the owner, 2026-10-31 (Claude's recommendations, accepted: "OK with others"):

1. **The name:** "Synth Geek Layer" in the glossary, the docs and the tips; Display's toggle reads "Geek".
2. **The icon:** the toggle's Σ becomes a pair of glasses.
3. **Everything still in use is renamed,** the stored setting's key and share links included ("You can rename, there is no visitor that serious yet"); closed issues and accepted ADRs keep the old name, as history. The formulas' heading inside the layer stays "Under the hood"; open issues follow (133 becomes "the Synth Geek Layer complete").
4. **Its own issue,** built after the night.

## Agent Brief

**Category:** enhancement
**Summary:** The Maths Layer becomes the Synth Geek Layer: Display's toggle reads "Geek" with a glasses icon, and every word, key and doc still in use follows.

**Current behavior:** Display's Show row has "Σ Maths"; the glossary, the PRD, the tips, the Tutorials, open issues and the code call it the Maths Layer; its setting is stored under its old key.

**Desired behavior:** The toggle reads "Geek" with a glasses icon, its tip titled "Synth Geek Layer" and saying what it adds (the formulas under the hood and, with 134, where each control comes from). CONTEXT.md's entry is renamed, with the old name under Avoid; the PRD, the README, the tips, the Tutorials, the Tour and open issues say Synth Geek Layer; the code's names and the stored key follow. Closed issues and accepted ADRs are left as written.

**Key interfaces:**
- The overlay toggles and their icons
- The Display settings module (the stored key)
- CONTEXT.md, the PRD, the tips, the Tutorials and the Tour, open issues

**Acceptance criteria:**
- [x] Display shows "Geek" with a glasses icon; turning it on shows what the Maths Layer showed
- [x] No open doc, tip, Step or card says "Maths Layer"; CONTEXT.md lists it under Avoid
- [ ] The overlay and tooltip specs updated; every test passes in Linux's fonts too

**Out of scope:**
- What the layer shows ([133](./133-the-maths-layer-complete.md), [134](./134-history-in-the-tooltips.md))

## How it was built

- **The toggle:** Display's Show row reads Harmonics, Ideal, Filter, Guides, Geek. Geek's swatch is a pair of glasses drawn in CSS (two round lenses and a bridge, in the text's colour), so it looks the same in every font, Linux's included; the Σ is gone. Turned on, the layer shows what the Maths Layer showed.
- **The tip** is titled "Synth Geek Layer" and starts "The numbers under the hood, for the synth geek:", then lists what it shows today. History is not in it yet: that comes with [134](./134-history-in-the-tooltips.md), which adds its line to each tip.
- **The stored key:** the layer's choice is kept under `geek` in `limpide.overlays`, no longer `maths` (decision 3). A choice saved under `maths` is let go, so a visitor who had the layer on finds it off once; a unit test says so. Claude's call, open to the owner: no carrying over, since there is "no visitor that serious yet". Share links never held the overlays, so they needed nothing.
- **The code's names:** the overlay `geek`, the `geek` module (was `maths`) and its `geekReadout`, the `GeekContext`, the `.geek-formula` chip, the Geek spec (was the Maths spec).
- **The docs:** CONTEXT.md's entry is the Synth Geek Layer, the Maths Layer under Avoid as its old name; the PRD, the design principles, 134's research file and every open issue say Synth Geek Layer. [133](./133-the-maths-layer-complete.md) is titled "the Synth Geek Layer complete" but keeps its file name, so the links to it hold (Claude's call, open to the owner). [161](./161-the-curve-toggle-named-filter.md)'s record of the Show row keeps "Maths", with a pointer here. Closed issues, accepted ADRs, the reviews, the inbox and the release log keep the old name, as history. The Tutorials, the Tour and the README never named the layer, so they needed nothing.
- **Tests run:** `npx tsc`, `npm run lint`; the overlays, Display settings, viewer store and Geek unit tests (32 passed); in Chromium the Geek, overlays, keyboard-access, tooltips, Display panel and toolbar-layout specs (95 passed). Linux's fonts are GitHub's run; the glasses use no glyph.
- **To try:** open Display and look at the Show row's Geek and its glasses, in the dark and the light theme; hover it for the tip; turn it on and see Q on Resonance, dB on the Mixer, the formulas on the Spectrums; reload and it is still on.

