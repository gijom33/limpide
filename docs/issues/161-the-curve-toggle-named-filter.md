# 161: The Curve toggle named Filter

**What to build:** The owner's idea (inbox, 2026-10-31), with a screenshot of Display's Show row (Harmonics, Ideal, Curve, Guides, Maths): "Filter would be a better name" for Curve. The toggle shows the Filter's Response Curve on the Spectrums. Polish of v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement

## Decisions

1. **The toggle reads "Filter".** Decided by the owner, 2026-10-31.

Claude's call, open to the owner:

2. **The glossary keeps "Response Curve"** for what is drawn: the toggle's tip starts "Filter: the Response Curve, the Filter's gain at every frequency…", and its accessible name says both ("Filter's Response Curve"), so a screen reader and the Maths Layer still meet the word.
3. **Every place that names the toggle follows:** the Tutorials' and the Tour's words that say "Curve" in Display, the keyboard shortcut list if it names it, the tests.

## Agent Brief

**Category:** enhancement
**Summary:** Display's "Curve" toggle, which draws the Filter's Response Curve on the Spectrums, is labelled "Filter".

**Current behavior:** Display's Show row reads Harmonics, Ideal, Curve, Guides, Maths. "Curve" says what is drawn, not what it is of.

**Desired behavior:** The toggle reads "Filter", with its dashed orange mark as now. Its tip names it "Filter" and says it draws the Response Curve, the Filter's gain at every frequency; its accessible name is "Filter's Response Curve". The overlay's stored setting keeps its key, so a visitor's choice still loads. Every Tutorial Step, Tour card, tip or doc that tells the person to turn on "Curve" says "Filter".

**Key interfaces:**
- The overlay toggles' labels and tips
- The Tutorials' and the Tour's words naming Display's toggles
- CONTEXT.md's Response Curve entry (a line on the toggle's name)

**Acceptance criteria:**
- [ ] Display shows Harmonics, Ideal, Filter, Guides, Maths; the Filter toggle draws the Response Curve as before
- [ ] A visitor's stored Curve setting still loads
- [ ] No Step, card or tip says "Curve" for the toggle
- [ ] The overlay, tooltip and viewer-control specs updated; every test passes in Linux's fonts too

**Out of scope:**
- Renaming the Response Curve itself
