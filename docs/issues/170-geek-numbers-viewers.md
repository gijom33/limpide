# 170: Geek numbers: the Viewers

**What to build:** A slice of [133](./133-the-maths-layer-complete.md) (the layer made complete, grilled with the owner 2026-10-31): decisions 6 and 11. Polish of v1's learning layer ([131](./131-v1.md)).

**Blocked by:** none (build after night/2026-10-31 is merged where it touches the same readouts; Claude's call, open to the owner)

**Status:** ready-for-agent · enhancement

## Agent Brief

**Category:** enhancement
**Summary:** With the Maths Layer (soon the Synth Geek Layer) on, the Viewers write the numbers and formulas the engine computes, as 133's decisions 6 and 11 say.

**Current behavior:** With the layer on, these controls show only their value; their tips say nothing of the maths.

**Desired behavior:** With the layer on, each Scope shows the period and frequency of the Note played in a corner; the Spectrum's hover readout adds the Harmonic's number when on one; the Oscillator Spectrum's corner gives the Noise's slope while the Noise is up. Every live number is tested against the engine's own output (133, decision 4); on a phone a number shows where the value shows today, and formulas only in the touch-and-hold tip.

**Key interfaces:**
- The layer's readouts beside controls and on Viewers, and the tips' "Under the hood" line
- The engine (the numbers' source) and the model it mirrors
- The Display setting that turns the layer on

**Out of scope:**
- History lines ([134](./134-history-in-the-tooltips.md)); the layer's rename ([165](./165-the-synth-geek-layer.md))

**Acceptance criteria:**
- [ ] A4 played: each Scope's corner reads 2.27 ms · 440 Hz
- [ ] Hovering the 3rd Harmonic the readout adds n = 3
- [ ] Noise up and pink: the corner reads pink: −3 dB/oct
- [ ] With the layer off nothing changes; every test passes in Linux's fonts too
