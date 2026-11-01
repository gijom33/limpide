# 165: The Synth Geek Layer

**What to build:** The owner's idea (inbox, 2026-10-31): "Also tempted to rename the Maths layer into a Synth Geek layer". With History in the tooltips ([134](./134-history-in-the-tooltips.md)) the layer holds more than formulas, so the Maths Layer is renamed. Polish of v1 ([131](./131-v1.md)).

**Blocked by:** none. Built after night/2026-10-31 is merged, since its issue 161 renames a toggle on the same Display row (Claude's call, open to the owner)

**Status:** ready-for-agent · enhancement

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
- [ ] Display shows "Geek" with a glasses icon; turning it on shows what the Maths Layer showed
- [ ] No open doc, tip, Step or card says "Maths Layer"; CONTEXT.md lists it under Avoid
- [ ] The overlay and tooltip specs updated; every test passes in Linux's fonts too

**Out of scope:**
- What the layer shows ([133](./133-the-maths-layer-complete.md), [134](./134-history-in-the-tooltips.md))
