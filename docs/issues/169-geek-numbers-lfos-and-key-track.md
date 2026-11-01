# 169: Geek numbers: the LFOs and Key Track

**What to build:** A slice of [133](./133-the-maths-layer-complete.md) (the layer made complete, grilled with the owner 2026-10-31): decisions 6, 8 and 10 (Key Track). Polish of v1's learning layer ([131](./131-v1.md)).

**Blocked by:** none (build after night/2026-10-31 is merged where it touches the same readouts; Claude's call, open to the owner)

**Status:** ready-for-agent · enhancement

## Agent Brief

**Category:** enhancement
**Summary:** With the Synth Geek Layer on, the LFOs and Key Track write the numbers and formulas the engine computes, as 133's decisions 6, 8 and 10 (Key Track) say.

**Current behavior:** With the layer on, these controls show only their value; their tips say nothing of the maths.

**Desired behavior:** With the layer on, each LFO's Rate shows its period (at the tempo when synced) and its Depth the swing in its Destination's unit; Key Track shows the Cutoff at the Note played (A4 before any). Every live number is tested against the engine's own output (133, decision 4); on a phone a number shows where the value shows today, and formulas only in the touch-and-hold tip.

**Key interfaces:**
- The layer's readouts beside controls and on Viewers, and the tips' "Under the hood" line
- The engine (the numbers' source) and the model it mirrors
- The Display setting that turns the layer on

**Out of scope:**
- History lines ([134](./134-history-in-the-tooltips.md)); the layer's rename ([165](./165-the-synth-geek-layer.md))

**Acceptance criteria:**
- [ ] Rate 2 Hz reads 0.50 s; synced 1/4 at 120 BPM reads 0.50 s
- [ ] Depth on Pitch, Cutoff, Volume and Pulse Width reads ±st, ±oct, ±dB and ±% matching the engine's swing (engine tests)
- [ ] Key Track's figure equals the Effective Cutoff's at the Note
- [ ] With the layer off nothing changes; every test passes in Linux's fonts too
