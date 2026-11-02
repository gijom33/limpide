# 180: Steadier Scopes

**What to build:** The owner's idea (inbox, 2026-11-02): "are there clever ways to make the scope waveforms more stable even with complex waves?" Then, placing it in v1: "Yes scope improvement for v1. Maybe even use settings in display to choose if some variants are susceptible to be preferred by some but not all." Polish of v1's Viewers ([131](./131-v1.md)).

**Blocked by:** none

**Status:** ready-for-agent · enhancement. In v1, decided by the owner (2026-11-02); measured ([research](../research/180-steadier-scopes.md)) and grilled the same day

## Decisions

Decided by the owner, 2026-11-02:

1. **In v1,** as polish of the Viewers.
2. **Display may offer a choice** where a way of steadying the trace suits some people and not others ("Maybe even use settings in display to choose if some variants are susceptible to be preferred by some but not all").

Grilled with the owner, 2026-11-02, on the measurements in [180-steadier-scopes.md](../research/180-steadier-scopes.md) (the owner: "Perfect I agree", taking every recommendation). Decided by the owner:

3. **Lock to the pitch played, and draw the newest sound:** Cycle Lock follows the phase along the pitch the engine plays (vibrato and Glide included), and the trace shows the newest end of the buffer, not the oldest (today 94 to 165 ms old). Always on, no setting: it removes an error. Measured: vibrato's jitter from 46–61 % to 2–8 %, Glide's from 79 % to 13 %, at 0.097 ms a frame against today's 0.166.
4. **Match the last frame, moving forward only:** of the start points one cycle apart, the one closest to the previous trace, never one that would redraw older sound. Always on. Measured: the flips of FM and Ring at inexact ratios, chords and the Amp Tap from 141–167 % to 3–6 %.
5. **Glow, a Display choice, Off by default:** each trace fades over a few frames, as on an analogue scope (decay about 0.85): Noise's flicker to a third, detune's down a third, at the cost of ghosts. Decision 2's choice where tastes differ.
6. **No averaging of cycles:** it lies where it looks steadiest (a Perfect Fifth standing still as a wave 82 % off the real one; Noise erased). Out of scope: [.out-of-scope/scope-averaging.md](../../.out-of-scope/scope-averaging.md).
7. **Chords lock to the newest Note,** as now, steadied by decision 4; no lock to the chord's shared period (it freezes, then jumps).
8. **Issue 180 owns Cycle Lock's cost:** the new lock is cheaper than today's, so issue [182](./182-a-page-at-rest.md) keeps only skipping a silent Scope.
9. **Slow Vibrato's words stay** ("the Scope stays locked through it"), true with decision 3, held by a test.

## What is there now

Cycle Lock does not wait for the trace to cross zero: it measures where the Note's fundamental is in its cycle (a windowed correlation at the known pitch) and starts the trace there, so filtered and resonant waves, which ring through zero several times a cycle, already stand still. What still moves:

- **A wave whose shape truly changes:** Osc 2 detuned against Osc 1 (the beating), Pulse Width under an LFO, an LFO on the Cutoff. No lock can freeze these without hiding what the sound does.
- **A wave that never repeats exactly:** a chord, FM or Ring at a ratio that is not a whole number, Noise.

## Ways weighed (before the grilling; decided in 3 to 7)

1. **Match the last frame:** of the start points one cycle apart, take the one whose trace looks most like the frame before, so a changing wave morphs smoothly instead of jumping between candidates. Likely the largest gain for detuned and complex waves, and cheap.
2. **Phosphor persistence:** each trace fades over a few frames, as on an analogue scope; what moves becomes a soft glow, what stands still stays sharp. A taste: a Display setting.
3. **Averaging over cycles:** the average of several aligned cycles shows the steady part and lets the drifting part blur away. It hides movement, so a Display setting, off by default.
4. **Chords:** lock to the lowest Note, or to the chord's shared period where its Notes are near a simple ratio (a major triad near 4:5:6).

## To measure first

Which Presets and which gestures (detune, PWM, a Filter LFO, chords, FM and Ring ratios) move the trace today, and by how much from frame to frame, on each Scope; then the same with each way above tried, so the grilling compares measured results.

Measured 2026-11-02: [the research](../research/180-steadier-scopes.md), 20 sounds on the three Taps, today's lock and each way.

## Agent Brief

**Category:** enhancement
**Summary:** The Scopes draw old sound and lose their lock under vibrato, Glide, inexact FM and Ring ratios and chords; lock to the pitch played, draw the newest sound, match the last frame forward only, and offer a Glow in Display.

**Current behavior:** Cycle Lock measures the fundamental's phase at the Note's pitch over the whole window and starts the trace there, at the oldest end of the buffer (94 to 165 ms old). It leaves out pitch changes from vibrato, LFOs on pitch and Glide, so the trace slides (46–79 % frame-to-frame RMS change, against a 3–5 % floor). Where several start points fit (inexact FM and Ring ratios, chords, the Amp Tap), it flips between them (95th percentile 139–167 %).

**Desired behavior:** The lock follows the pitch the engine plays across the window and places the trace at the newest end. Of the candidate starts one cycle apart, it takes the one whose trace best matches the last drawn one, among those no older than the last. Chords lock to the newest Note. Display gains "Glow" (Off by default): with it on, each Scope's trace fades over a few frames. Nothing averages cycles. Detune, PWM and Noise still move as much as their sound changes.

**Key interfaces:**
- Cycle Lock and the Scope's trace window
- The pitch the engine plays, as the Modulation model gives it (vibrato, LFOs on Pitch, Glide, bend)
- The Scope's drawing, and a Display setting remembered with the others
- The Slow Vibrato Preset's words

**Acceptance criteria:**
- [ ] Unit tests on rendered signals, the research's method: vibrato and Glide jitter at most 10 % and 15 %; FM at 1.414, Ring at 2.38, a major triad and the Amp Tap's 95th percentile under 10 %; a saw, detune, PWM and Noise within a few points of their floor (no hiding real change)
- [ ] The trace is at most one cycle plus 20 ms old
- [ ] Cycle Lock's cost per Scope and frame no more than today's (review 18's method)
- [ ] Glow in Display, Off by default, remembered; the design audit covers it on
- [ ] Slow Vibrato's claim held by a test; every Viewer and Scope test passes; every test passes in Linux's fonts too

**Out of scope:**
- Averaging cycles (decision 6)
- The Spectrum and the Timeline
