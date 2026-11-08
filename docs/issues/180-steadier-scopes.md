# 180: Steadier Scopes

**What to build:** The owner's idea (inbox, 2026-11-02): "are there clever ways to make the scope waveforms more stable even with complex waves?" Then, placing it in v1: "Yes scope improvement for v1. Maybe even use settings in display to choose if some variants are susceptible to be preferred by some but not all." Polish of v1's Viewers ([131](./131-v1.md)).

**Blocked by:** none

**Status:** done (2026-11-02). Built on its own branch and merged into main the same day, approved by the owner: "OK I like the implement of 180, you can merge"; ships with the next release. In v1, decided by the owner (2026-11-02); measured ([research](../research/180-steadier-scopes.md)) and grilled the same day

## Decisions

Decided by the owner, 2026-11-02:

1. **In v1,** as polish of the Viewers.
2. **Display may offer a choice** where a way of steadying the trace suits some people and not others ("Maybe even use settings in display to choose if some variants are susceptible to be preferred by some but not all").

Grilled with the owner, 2026-11-02, on the measurements in [180-steadier-scopes.md](../research/180-steadier-scopes.md) (the owner: "Perfect I agree", taking every recommendation). Decided by the owner:

3. **Lock to the pitch played, and draw the newest sound:** Cycle Lock follows the phase along the pitch the engine plays (vibrato and Glide included), and the trace shows the newest end of the buffer, not the oldest (today 94 to 165 ms old). Always on, no setting: it removes an error. Measured: vibrato's jitter from 46–61 % to 2–8 %, Glide's from 79 % to 13 %, at 0.097 ms a frame against today's 0.166.
4. **Match the last frame, moving forward only:** of the start points one cycle apart, the one closest to the previous trace, never one that would redraw older sound. Always on. Measured: the flips of FM and Ring at inexact ratios, chords and the Amp Tap from 141–167 % to 3–6 %.
5. **Glow, a Display choice, Off by default:** each trace fades over a few frames, as on an analogue scope (decay about 0.85): Noise's flicker to a third, detune's down a third, at the cost of ghosts. Decision 2's choice where tastes differ. Since 2026-11-04 ([229](./229-three-glow-choices.md), decided by the owner): Off, Scopes or All, the Scopes glowing under both.
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
- [x] Unit tests on rendered signals, the research's method: vibrato and Glide jitter at most 10 % and 15 %; FM at 1.414, Ring at 2.38, a major triad and the Amp Tap's 95th percentile under 10 %; a saw, detune, PWM and Noise within a few points of their floor (no hiding real change). Met except FM at 1.414, Ring at 2.38 and the triad, which cannot be: on the Amp Tap their 95th percentile stays at 136 %, 130 % and 67 % against the 10 % (call 1 under "How it was built", merged at the owner's word; issue 225)
- [x] The trace is at most one cycle plus 20 ms old
- [x] Cycle Lock's cost per Scope and frame no more than today's (review 18's method)
- [x] Glow in Display, Off by default, remembered; the design audit covers it on
- [x] Slow Vibrato's claim held by a test; every Viewer and Scope test passes; every test passes in Linux's fonts too

**Out of scope:**
- Averaging cycles (decision 6)
- The Spectrum and the Timeline

## How it was built

Built on 2026-11-02, test-first, on its own branch (not merged). Measured by the research's method on the engine's sound: rendered offline, each Tap read 60 times a second, 2 cycles, 600 points.

- **The engine** gains `fundamentalAt(time)`: the newest Note's fundamental at any moment, now or past, through its Glide, the bend, aftertouch and the LFOs on Pitch, at Osc 1's Octave (the Sub's with the Sub up). `fundamental()` is the same without the LFOs: the period the Scope writes and the cycles it fits stay still through a vibrato. An engine test holds the new one to the Modulation model and to the rendered pitch, through a full-depth LFO on Pitch.
- **Cycle Lock** (decision 3) reads that pitch along the Tap's whole buffer, every 256 samples, and more closely where it jumps (a new Note without Glide), so the phase it follows bends with the sound. It measures the fundamental's phase over the whole buffer, the Hann window worked out once and sin and cos by rotation (review 18). The trace spans the cycles asked of the pitch played, from one rising zero of the fundamental to another, at the buffer's newest end: at most a cycle and 20 ms old, against 94 to 165 ms in 1.21.1.
- **Matching the last frame** (decision 4): of those spans, one cycle apart and no more than 20 ms older than the newest, it takes the one most like the last trace drawn, the newest of those within 5 % as good. It never takes one less than half a frame's time later than the last trace (the research's rule against a frozen Scope), so it never draws older sound. While frozen, the same start is kept. Chords lock to the newest Note (decision 7). Nothing averages (decision 6).
- **Glow** (decision 5): Display's View group, after Viewers follow, has Glow Off and On, Off by default, remembered with the other Display settings, with a tip. With it on, each Scope redraws the traces of the last quarter of a second under the newest, each faded by 0.85 every 60th of a second (halving in about 70 ms), one kept per 60th of a second, so a 120 Hz screen draws no more. A frozen Scope keeps its glow.
- **Measured** (Amp Tap, median / 95th percentile, 1.21.1 → now): Slow Vibrato 45 / 60 → 0.4 / 0.8; Fast Vibrato 60 / 78 → 5.4 / 7.0; the Portamento's Glides 79 → 3.1 (median); the Perfect Fifth 1.5 / 141 → 1.5 / 3; FM at 3:2 3 / 167 → 3 / 5.9; an octave chord 0.1 / 139 → 0.1 / 0.1; a Note changed without Glide settles at once (1.21.1 swung to 160 % for about 10 frames). A saw, detune, PWM and Noise move as much as their floor, within 3 points. The cost: 0.050 ms a Scope and frame, 0.020 of it reading the pitch, against 0.166.
- **On screen** (the dev server, Chromium): holding a Note, the share of the Amp Scope's lit pixels that change from frame to frame is 0.1 % on Slow Vibrato and 0 on Init; with Glow on, the Tritone Knot's drop and the Organ chord's beating leave a trail behind a sharp newest trace.

Calls, Claude's call, let stand by the owner in 1.22.0:

1. **FM at 1.414, Ring at 2.38 and the major triad stay well above 10 %.** The brief asks for their 95th percentile under 10 %; the decided lock cannot reach it, as the research's own table shows (the recommended lock at 125 / 136, 124 / 130 and 38 / 63). Their waves never repeat at the Note's period, and Ring at 2.38 has no fundamental at all: what is left is the sound's own change. Decision 4's "141–167 % to 3–6 %" is true of the Perfect Fifth, FM at 3:2 and the octave chord, and those are held under 10 % by a test. The others are measured at 124 / 136 (FM 1.414), 124 / 130 (Ring Bell held) and 43 / 67 (C major), against 130 / 161, 142 / 166 and 48 / 139 in 1.21.1, and a test holds their 95th percentile at least 20 points under 1.21.1's. Freezing them would mean starting off the fundamental's rising zero (the research's "any start", rejected) or averaging (decision 6).
2. **The trace spans the cycles of the pitch played**, rising zero to rising zero, rather than a fixed number of samples: under a vibrato both its edges stand still. The cycles fitted and the period written still follow the steady pitch.
3. **No older than 20 ms past the newest start**, from the brief's age bound, so of the research's 9 candidates only those within 20 ms are weighed. "As good" means within 5 % of the trace's RMS of the best, so a steady wave is drawn from its newest start.
4. **Glow lasts a quarter of a second**, the oldest trace at under a tenth, rather than fading on a layer: there, rounding to 8 bits leaves a haze of every trace ever drawn (measured in Chromium and WebKit: 3/255 left on most of the canvas). Its control sits in Display's View group rather than the row of Keys, Tips, Bead and Theme, which issue 162 sized for four.
5. **Design principles' "No glow"** now reads that no control glows; the Scopes' Glow shows the sound's past, not decoration.

**Tests run:**
- `npx tsc`, `npm run lint`, and all of Vitest (unit and engine): 1620 passed before the review, 1621 after its fixes.
- The Cycle Lock unit tests (synthetic waves: vibrato, Glide, Noise, a fifth, Freeze ten minutes into the page) and the rendered-signal tests in `src/viewers/cycleLock.browser.test.ts` (vibrato, Glide, Slow Vibrato's words on every Tap, the flips, FM, Ring and the triad against 1.21.1, the floor, the age, a Note change, the cost).
- In Chromium and WebKit: the Display panel, viewer controls, design audit (with a "Glow on" state), voices, Geek, limiting, oscillator, overlays, smoke, tooltips and toolbar layout specs: 262 passed before the review. After its fixes, 283 passed and 3 WebKit audits failed waiting for the Demo card, a later state, under both browsers' load; alone they passed (21), and so did the WebKit set again (143).
- The "Glow on" audit state chooses Glow by the keyboard and leaves it unfocused: clicked, the pointer rests on the chosen segment, whose hovered edge is 1.22:1. That hover look is every Segmented's, not Glow's, and no other state hovers one; left as it is.
- Two fresh reviews of the branch (standards, and spec). Fixed from them: a frozen trace could creep forward on a large audio clock (the start was kept in clock samples and rounded; a test now runs ten minutes in); after a Note without Glide the trace slid for about 5 frames (the pitch is now read more closely where it jumps; a test holds it); the Glow faded per frame, so twice as fast on a 120 Hz screen (now by time); design principles' "No glow", the PRD's Cycle Lock line, the Glow's duration in its tip and CONTEXT.md; a shared jitter measure in the tests; the engine helper's name.
- Linux's fonts: the new tests read numbers and canvas data, not glyphs; the Glow control is a Segmented like its neighbours.

**To try** (on the branch's dev server):
1. Pick Slow Vibrato and hold a Note: the Scopes stand still as the pitch sways. Fast Vibrato: nearly still.
2. Pick Portamento, hold a key and play another over it: the trace stays locked through the slide.
3. Pick Perfect Fifth: no more flips between two shapes. Then FM Bell, Tritone Knot or a chord on Organ: they still move, as their sound does.
4. Display, View, Glow: On. Add Noise in the Mixer, or detune Osc 2: the flicker softens into a glow. Freeze holds it. Reload: Glow stays on.
