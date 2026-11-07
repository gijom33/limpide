# 207: Detune's number clear of Env Amount

**What to build:** The owner's bug (inbox, 2026-11-02), found trying [167](./167-geek-numbers-osc2-and-noise.md), with a screenshot of Osc 2's Tuning row: "see how text is badly aligned on image". Where a control's value shows in its name's place (860 px and narrower), Detune's number with the Synth Geek Layer on, its beating rate ("9.82 Hz"), is wider than the name "Detune" and runs into the next knob's name: "9.82 HzEnv Amount". Reproduced at 700 px ("12.9 HzEnv Amount"). Polish for v1 ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-03). Built (2026-11-02) on night/2026-11-02, merged into main, released in 1.23.0; tried by the owner: "All good."

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

## How it was built

**The cause.** Where a value shows in the name's place (860 px and narrower), its hidden copies of the widest it can show (kept so a knob never changes width on wide windows) were still in its box: Detune's, "9999 Hz beats", widened the box past the knob's column, and the value, centred on that wider box, sat to the right, against the next name. The value was not too wide: it was off centre.

**The fix.** There, the copies lie out of the flow and the value is centred on the knob's own column. A value whose widest is still wider than its column is drawn a little smaller, the whole control at one size whatever it reads, so nothing moves as it turns; the size is measured as the window and the fonts change. Detune's widest copy now keeps its words ("beats") apart from its figure, so the size is worked out from the figure the name's place shows. Above 860 px nothing changes.

**Measured first, then after,** every control at 320, 340, 375, 414, 480, 540, 600, 601, 640, 700, 760, 820 and 860 px, Geek on and off, each with the widest values it can show, against its neighbours' names. Before: Detune touched Env Amount from 601 px up (0.4 px, the screenshot's "HzEnv"), and Amp Sustain's dB ran into Release at 601 px; a dozen controls' widest values overran their columns by up to 9 px (the Mixer's and Sustain's dB, the times in ms, Cutoff and Key Track in kHz). After: every value inside its own column, at least 6 px from the next name. A browser test measures Detune at its top against Env Amount at 320, 375, 601, 700 and 860 px.

Claude's calls, open to the owner:

1. **Drawn smaller rather than shortened.** Shorter forms would change what the values say, left to the Synth Geek Layer's review; drawing smaller keeps every figure and unit.
2. **How small:** the most a value shrinks is to about 9 px from 11 (the Mixer's and Amp Sustain's dB with Geek on, "−40.0 dB", at 320 to 375 px and at 601 px); the times in ms go to about 10 px at 601 px, Cutoff and Key Track to about 10.5 px. If 9 px reads too small, the dB could drop its decimal below −10 dB in the name's place ("−40 dB"), which keeps them at 10.5 px or more.

**To try:** at 700 px (or a phone), the Synth Geek Layer on, Osc 2's tab: turn Detune to its top; "12.9 Hz" sits under Detune's dial, clear of "Env Amount". Then the Mixer's faders near the bottom with Geek on, and the Envelopes' times, at 601 px and on a phone: each value stays under its own control, readable.

**Since (2026-11-07, [256](./256-detunes-beats-at-every-interval.md)):** Detune's widest is now "20.0 Hz beats" and "no beats at A4"; its spec checks "no beats" in the name's place too, a semitone and a quarter up.
