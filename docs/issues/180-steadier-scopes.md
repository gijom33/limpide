# 180: Steadier Scopes

**What to build:** The owner's idea (inbox, 2026-11-02): "are there clever ways to make the scope waveforms more stable even with complex waves?" Then, placing it in v1: "Yes scope improvement for v1. Maybe even use settings in display to choose if some variants are susceptible to be preferred by some but not all." Polish of v1's Viewers ([131](./131-v1.md)).

**Blocked by:** none

**Status:** needs-info · enhancement. In v1, decided by the owner (2026-11-02). First a measurement of which sounds move on the Scopes today and how much (177's rule: measure before deciding), then a grilling on the ways below and on which become Display settings

## Decisions

Decided by the owner, 2026-11-02:

1. **In v1,** as polish of the Viewers.
2. **Display may offer a choice** where a way of steadying the trace suits some people and not others ("Maybe even use settings in display to choose if some variants are susceptible to be preferred by some but not all").

## What is there now

Cycle Lock does not wait for the trace to cross zero: it measures where the Note's fundamental is in its cycle (a windowed correlation at the known pitch) and starts the trace there, so filtered and resonant waves, which ring through zero several times a cycle, already stand still. What still moves:

- **A wave whose shape truly changes:** Osc 2 detuned against Osc 1 (the beating), Pulse Width under an LFO, an LFO on the Cutoff. No lock can freeze these without hiding what the sound does.
- **A wave that never repeats exactly:** a chord, FM or Ring at a ratio that is not a whole number, Noise.

## Ways to weigh (Claude's, open to the owner)

1. **Match the last frame:** of the start points one cycle apart, take the one whose trace looks most like the frame before, so a changing wave morphs smoothly instead of jumping between candidates. Likely the largest gain for detuned and complex waves, and cheap.
2. **Phosphor persistence:** each trace fades over a few frames, as on an analogue scope; what moves becomes a soft glow, what stands still stays sharp. A taste: a Display setting.
3. **Averaging over cycles:** the average of several aligned cycles shows the steady part and lets the drifting part blur away. It hides movement, so a Display setting, off by default.
4. **Chords:** lock to the lowest Note, or to the chord's shared period where its Notes are near a simple ratio (a major triad near 4:5:6).

## To measure first

Which Presets and which gestures (detune, PWM, a Filter LFO, chords, FM and Ring ratios) move the trace today, and by how much from frame to frame, on each Scope; then the same with each way above tried, so the grilling compares measured results.
