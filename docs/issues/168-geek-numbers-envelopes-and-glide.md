# 168: Geek numbers: the Envelopes and Glide

**What to build:** A slice of [133](./133-the-maths-layer-complete.md) (the layer made complete, grilled with the owner 2026-10-31): decisions 9 and 10 (Glide). Polish of v1's learning layer ([131](./131-v1.md)).

**Blocked by:** none (build after night/2026-10-31 is merged where it touches the same readouts; Claude's call, open to the owner)

**Status:** ready-for-agent · enhancement

## Agent Brief

**Category:** enhancement
**Summary:** With the Maths Layer (soon the Synth Geek Layer) on, the Envelopes and Glide write the numbers and formulas the engine computes, as 133's decisions 9 and 10 (Glide) say.

**Current behavior:** With the layer on, these controls show only their value; their tips say nothing of the maths.

**Desired behavior:** With the layer on, both Envelopes' Decay and Release readouts add their time constant τ ("300 ms · τ 65 ms"), as the engine uses it; their tips explain τ (63 % of the way) and the curve's formula, Attack being a straight rise; Glide's tip gives its slide curve's formula. Every live number is tested against the engine's own output (133, decision 4); on a phone a number shows where the value shows today, and formulas only in the touch-and-hold tip.

**Key interfaces:**
- The layer's readouts beside controls and on Viewers, and the tips' "Under the hood" line
- The engine (the numbers' source) and the model it mirrors
- The Display setting that turns the layer on

**Out of scope:**
- History lines ([134](./134-history-in-the-tooltips.md)); the layer's rename ([165](./165-the-synth-geek-layer.md))

**Acceptance criteria:**
- [ ] Decay and Release readouts show τ matching the engine's time constant (an engine test on the Amp Tap)
- [ ] The tips' formulas under the hood, Attack's straight rise said
- [ ] Glide's tip gives its curve
- [ ] With the layer off nothing changes; every test passes in Linux's fonts too
