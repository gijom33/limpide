# 116: Patches at the edges

**What to build:** Claude's recommendation for reviews next time (inbox, 2026-10-30), kept by the owner: "a test generating thousands of Patches at the edges (every knob at an end, both LFOs on one target, FM and Ring at full), none giving silence, an error value, a stuck limiter or a slow frame." The reviews of 1.16.0 found FM's DC offset and the fold-back by hand ([103](./103-fm-and-ring-fold-back-at-the-top.md)); a generated sweep finds such things before a reviewer does. Claude's call, let stand by the owner in 1.16.1.

**Blocked by:** none

**Status:** done (2026-11-02). Built (2026-10-31) on night/2026-10-31 and released; approved by the owner: "Okay, I trust you."

## Agent Brief

**Category:** enhancement
**Summary:** A test renders many generated Patches at their extremes and fails on any that is silent where it should sound, holds an error value, pins the limiter, or draws a frame too slowly.

**Desired behavior:**
- A generator makes Patches from the edges of every Parameter (each knob at its ends and middle, each choice), combining them so that every pair of Parameters meets at their ends at least once, plus the known hard cases (both LFOs on one Destination, FM and Ring at full, the Sub two octaves down, every Voice count).
- Each Patch is rendered offline on a low, a middle and a high Note, and the test fails on: no sound where Osc 1 or another source is up and the Filter open; any NaN or Infinity; the limiter working on most of the Note; an offset larger than the sound's own level.
- A smaller set draws every Viewer once per Patch and fails on a frame over the budget the existing draw-cost test uses.
- A failure names the Patch, in a form that can be pasted into a Share link.
- A seed fixes the generated set, so a failure reproduces.

**Acceptance criteria:**
- [x] The test runs in the engine project in under five minutes on a laptop
- [x] It finds 1.16.0's FM offset when 103's fix is reverted (or the offset check is shown failing on FM Ladder)
- [x] Every Patch it reports today is answered: fixed, or listed as allowed with the reason

**Out of scope:**
- Judging how a Patch sounds (the ear stand-in's job)

## How it was built

**The Patches** (`src/test/edgePatches.ts`, seed 116): every Parameter at its ends and the middle of its travel, every choice at each of its values, and the Tempo at 40, 120 and 240 BPM (not a Patch's, but Sync follows it). A greedy pairwise set (about a hundred Patches) meets every pair of these at every pair of their values, not only at their ends. Then the hard cases: both LFOs at full on each Destination with Sync off and on (one LFO at 20 Hz or 1/32 T at 240 BPM, the other at its slowest), FM and Ring at full (Osc 2 on the Note, two saws an octave apart, two squares into full Resonance), the Sub two octaves down (under Osc 1 two octaves down, and alone as a sine), and every Voice count. Patches at random from the same edges make up a thousand. Unit tests check the values, the pairs, the hard cases, the seed, and that a Share link gives every Patch back whole.

**The sweep** (`src/engine/patchesAtTheEdges.browser.test.ts`): each Patch is rendered offline at 48 kHz, the limiter's curve made straight as in the Presets' test (that helper now lives in `src/test/straightLimiter.ts`). Each is played on C2, C7 and, between them, C4, or a chord of thirds on all its Voices: 3,000 renders. A render fails on:

- an error value anywhere;
- silence (under −120 dBFS) in a 50 ms window where the Modulation model has the Amp open and the Filter letting through, within 20 dB, something a source that is up plays;
- the limiter's knee passed in more than half the Note's 10 ms frames;
- an offset over a third of the sound's level (−10 dB). It is measured as a Blackman–Harris-windowed mean, so a low Note's cycles do not count. It is judged only where the Filter plainly passes a source's fundamental and nothing plays under 20 Hz: no source that low, no Pink Noise, no difference tone of Ring or FM under 20 Hz.

A failure prints the Patch's `#p=` Share link with its Notes and Tempo.

**The frames:** the hard cases, the pairwise set and every Preset are drawn by all seven Viewers, as App wires them, warmed up on Init. The frame timed is the first after the Patch arrives, the frame a knob turn or the Demo brings. A Patch fails if that frame is over three times Init's plus a millisecond on three tries.

**Controls:**

- FM Ladder on C2, C4 and C6, with issue 103's 1 Hz filter made an all-pass, is reported for its offset (−4 dB against its level); with the filter in place it is not (−15 dB).
- The LIMITING spec's Patch is found with its limiter stuck, and answered.
- A notch whose Resonance an LFO swings is found silent.

**Run:** all green, in 204 to 245 s for the file on this laptop while other work loaded it (3.4 to 4.1 minutes). Of the 3,000 renders, 362 have their offset judged, and 356 skip the silence check because the Filter is closed at an end of its range. Unit suite: 804 passed. `presets.browser.test.ts`: 83 passed. `tsc` and the lint are clean. Playwright was not run: no spec touches what changed.

### What the sweep found

No error value anywhere, and no Patch whose limiter sticks for want of stacked sources. Four things are answered in the test, three of them findings for the owner:

2026-10-31: the three findings are fixed by issue [166](./166-the-edges-three-findings.md), on the owner's go-ahead. The sweep no longer answers them: its marks are ordinary checks, the notch's silence control takes a notch's Q below zero by hand, and `IDEAL_HARMONICS` is no longer exported.

1. **Finding: an LFO on a band-pass's or notch's Resonance takes its Q below zero.**
   - The model moves the Resonance from end to end. The sound moves the Q by half the span of the swing, either side of the knob's own Q, but a band-pass's or notch's Q grows by ratios (0.5 × 40^Resonance). So near the top of the swing, its foot passes below zero.
   - Below zero, Chromium's notch passes nothing (the sweep found notches silent) and its band-pass lets everything through.
   - **Talking Filter** (LFO 2's square on its band-pass's Resonance) plays the low half of each cycle unfiltered: 13 dB more above 4 kHz than the same band held at that Resonance.
   - The test "keeps a band-pass a band-pass…" is marked `it.fails` until it is changed.
   - The sweep answers these Patches (7 renders today) with that reason.
   - Not fixed: any fix changes how Talking Filter sounds, so the owner hears it first. A fix could move the Q exactly as the model moves the Resonance, by a curve on each LFO's way to the Q, as the LFOs' clamp is one.
2. **Finding: the model holds the Effective Cutoff within 20 Hz to 20 kHz; the sound's Filter goes past it.** It goes up to the top of what the browser plays, or down towards 0 Hz, wherever the Filter Envelope, Key Track, Velocity or an LFO push it.
   - A high-pass or band-pass pushed past the top plays nothing, where the model's 20 kHz would pass a sliver above hearing.
   - At the bottom, what passes under 20 Hz is not the model's.
   - It makes no difference you can hear, but the Response Curve and the sound disagree there (ADR-0003).
   - The sweep does not judge silence where the Filter is closed at an end, nor the offset at the bottom.
   - Not fixed: holding the sound's Cutoff to the model's range would need a clamp on the Filter's modulation. It is a small engine change, and it is the owner's call whether it is worth it.
3. **Finding: the first frame after a Patch change can take 17 to 80 ms** when FM drives an Osc 1 richer than a Sine. The Ideal then works out the sidebands of each of Osc 1's Harmonics, up to 17,000 partials, once for each new Patch; later frames take 1 to 5 ms.
   - No Preset comes near: the most partials any Preset's Ideal has on C4 is 638.
   - Turning a knob on such a Patch would stutter.
   - The test answers a slow frame only where the Ideal has more than 2,000 partials (3 Patches today).
   - Not fixed: the likely fix, working the Ideal out only up to the top the Spectrum shows (from the Viewers' fundamental), touches the Ideal's precision that issue 103's tests hold.
4. **By design: the limiter works through most of the Note where the sources stack to two at full or more.** The stacking is the Mixer's levels times the square root of the Notes played. That is what it is there for (the engine's comment, ADR-0006, the LIMITING spec). 19 renders today, every one of them at 2 or more.

### Calls made (Claude's call, let stand by the owner in 1.20.0)

- **The frame budget.** No existing test holds an absolute frame time. Issue 45's draw-cost test bounds a cost at three times its quiet case plus a millisecond, so this one holds each Patch's frame to three times Init's plus a millisecond (13 to 19 ms here). The mascot's frame test bounds Bead's added cost at 1 ms; that is a different question.
- **The offset bound:** a third of the sound's level (−10 dB), not the whole of it. At its whole level, 1.16.0's FM Ladder (−4 dB) would have passed.
- **What is not judged.** The offset is judged where the Note plainly sounds and nothing plays under 20 Hz; silence is not judged where the Filter is closed at an end of its range. Without these rules, sub-audio content and the Cutoff's ends showed as offsets and silences that are not faults. The cost: only 362 of the 3,000 renders have their offset judged.
- **The middle Note is a chord on a Patch of several Voices,** so the master's room for Voices is tried too.
- **A Note starts 50 ms into each render** and is judged from 200 to 700 ms after it. Each Note's restart leaves FM Ladder's offset filter settling for about half a second (−33 dBFS in that window, −74 dBFS by a second): the "−67 dBFS over the Gate's first second" in issue 103 is a plain mean, which hides it.
- **It runs in GitHub's engine job**, adding a few minutes there (more than on a laptop).
- **Two constants are exported** for the test: the engine's `SAFETY_KNEE` and the Viewers' `IDEAL_HARMONICS`.

### What to try

- **Talking Filter:** listen for the unfiltered half of each LFO 2 cycle. Then decide whether finding 1 is fixed (it changes Talking Filter) or kept as part of its sound.
- **Finding 3:** load a Patch with FM at full on a triangle or pulse Osc 1, and Osc 2 a Sine three octaves up. Turn a knob and see whether the Viewers stutter.
- **Finding 2:** is the Cutoff's end worth a fix?
- **A failing Patch:** paste a printed `#p=` link after the page's address to hear it.

