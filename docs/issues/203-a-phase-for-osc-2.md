# 203: A phase for Osc 2

**What to build:** The owner's idea (inbox, 2026-11-02): "Should we be able to change the phase of OSC 2?" Then: "Yes add to inbox for v2." Phase is heard only where the two Oscillators keep a fixed relation: at Detune 0 with both restarting together on each Note, two saws half a cycle apart cancel each other's odd Harmonics and sound an octave up, which the Scope and the Spectrum would show well. With Detune, or Oscillators that run freely, the phase drifts by itself and a knob would change next to nothing, which is why most analogue synths have none.

**Blocked by:** [131](./131-v1.md) (v1 first, by the scope rule)

**Status:** needs-triage · enhancement. v2, not committed (decided by the owner, 2026-11-02): to grill with the owner before anything is built.

## What a grilling would settle

1. Whether Limpide's Oscillators restart in step on each Note today: to check first, as it decides whether a phase can be heard at all.
2. A Phase knob on Osc 2 (0–360°), working only while the Oscillators restart together and greyed out otherwise, or no control and a Tutorial step or Preset showing phase cancellation at Detune 0 (Claude's options, open to the owner).
3. Its place on the C16 layout and in the Synth Geek Layer, if a control.
