# 167: Geek numbers: Osc 2's tuning and the Noise

**What to build:** A slice of [133](./133-the-maths-layer-complete.md) (the layer made complete, grilled with the owner 2026-10-31): decisions 6 and 7, and the Noise's formula of decision 11. Polish of v1's learning layer ([131](./131-v1.md)).

**Blocked by:** none (build after night/2026-10-31 is merged where it touches the same readouts; Claude's call, open to the owner)

**Status:** ready-for-agent · enhancement

## Agent Brief

**Category:** enhancement
**Summary:** With the Maths Layer (soon the Synth Geek Layer) on, Osc 2's tuning and the Noise write the numbers and formulas the engine computes, as 133's decisions 6 and 7, and the Noise's formula of decision 11 say.

**Current behavior:** With the layer on, these controls show only their value; their tips say nothing of the maths.

**Desired behavior:** With the layer on, Osc 2's Semitone shows its frequency ratio, its Octave its multiple, Detune its beating rate at the Note played (A4 before any, said); their tips' Under the hood give 2^(s/12) and Δf = f·(2^(c/1200) − 1); the Noise's tip gives white flat, pink −3 dB per octave. Every live number is tested against the engine's own output (133, decision 4); on a phone a number shows where the value shows today, and formulas only in the touch-and-hold tip.

**Key interfaces:**
- The layer's readouts beside controls and on Viewers, and the tips' "Under the hood" line
- The engine (the numbers' source) and the model it mirrors
- The Display setting that turns the layer on

**Out of scope:**
- History lines ([134](./134-history-in-the-tooltips.md)); the layer's rename ([165](./165-the-synth-geek-layer.md))

**Acceptance criteria:**
- [ ] Semitone +7 reads ×1.498; Octave +1 ×2, −1 ½
- [ ] Detune 10 cents at A4 reads its beats in Hz, matching the beats measured on the summed Oscillators in an engine test
- [ ] The tips' formulas under the hood
- [ ] On a phone the numbers show in the name's place while the control moves
- [ ] With the layer off nothing changes; every test passes in Linux's fonts too
