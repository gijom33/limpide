# 207: Detune's number clear of Env Amount

**What to build:** The owner's bug (inbox, 2026-11-02), found trying [167](./167-geek-numbers-osc2-and-noise.md), with a screenshot of Osc 2's Tuning row: "see how text is badly aligned on image". Where a control's value shows in its name's place (860 px and narrower), Detune's number with the Synth Geek Layer on, its beating rate ("9.82 Hz"), is wider than the name "Detune" and runs into the next knob's name: "9.82 HzEnv Amount". Reproduced at 700 px ("12.9 HzEnv Amount"). Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · bug. Polish for v1

## Decisions

Decided by the owner, 2026-11-02:

1. **The row's words do not run together or overlap** ("see how text is badly aligned").

Claude's calls, open to the owner:

2. **Measured first,** at 320 to 860 px, for every control whose value shows in the name's place, with the Synth Geek Layer on and off: Detune's beats are the one seen, but a long value elsewhere (a time in seconds, a Cutoff in kHz, a Depth's swing) may do the same. The fix covers all of them.
3. **The value fits its own column:** shorter where it must (fewer figures, the unit kept), or drawn smaller, rather than the row spread apart; the knobs do not move as a value changes. Which one is the implementer's choice, measured; if neither fits at 320 px, the owner is asked.

## Agent Brief

**Category:** bug
**Summary:** Where a knob's value shows in its name's place, a value wider than the name runs into the next knob's name.

**Current behavior:** At 860 px and narrower, a control being moved shows its value where its name was. With the Synth Geek Layer on, Detune's value is its beating rate, "12.9 Hz", wider than "Detune": it runs into "Env Amount" beside it with no space, reading "12.9 HzEnv Amount".

**Desired behavior:**
- A value shown in a name's place stays inside that control's own column, with clear space before the next name, at every width from 320 to 860 px, with the Synth Geek Layer on and off.
- The value stays readable and keeps its unit.
- The knobs and the row do not move or reflow while a value changes.

**Key interfaces:**
- A knob's or fader's label, which shows the value in the name's place at narrow widths
- Osc 2's Tuning row, and the other rows of narrow knobs

**Acceptance criteria:**
- [ ] At 700 px, Geek on, Detune turned to its top: its value and "Env Amount" do not touch or overlap
- [ ] The same at 320, 375, 601 and 860 px
- [ ] Every control's longest value, Geek on and off, checked against its neighbours at those widths
- [ ] No knob moves as its value changes
- [ ] A browser test measures the gap between Detune's value and Env Amount's name

**Out of scope:**
- What the values say (the Synth Geek Layer's review will look at that)
- Wide windows, where the value shows under the name
