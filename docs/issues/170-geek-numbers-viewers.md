# 170: Geek numbers: the Viewers

**What to build:** A slice of [133](./133-the-maths-layer-complete.md) (the layer made complete, grilled with the owner 2026-10-31): decisions 6 and 11. Polish of v1's learning layer ([131](./131-v1.md)).

**Blocked by:** none (build after night/2026-10-31 is merged where it touches the same readouts; Claude's call, open to the owner)

**Status:** done (2026-11-02). Built (2026-11-01) on night/2026-11-01 and released; tried by the owner: "Ok for now, we will revisit the geek overlay via an agent later."; what the layer keeps beyond History is for profile 19's review, later ([42](./42-reviews.md))

## Agent Brief

**Category:** enhancement
**Summary:** With the Synth Geek Layer on, the Viewers write the numbers and formulas the engine computes, as 133's decisions 6 and 11 say.

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

## How it was built

Built on 2026-11-01 on night/2026-11-01, test-first. The issue has no Decisions of its own, so τ drawn on the Envelope Timeline (which 168's decision 1 said "may follow with 170 later") was left out.

- **Each Scope** writes, with the Synth Geek Layer on, the period and frequency of the fundamental it holds still in its top-left corner: "2.27 ms · 440 Hz" after A4, "3.82 ms · 261.6 Hz" after C4. Before any Note it adds "at A4" (133, decision 6). LIMITING keeps the Amp Scope's top right. The period has three figures ("0.239 ms" to "582 ms"), and the frequency is given to a tenth of a Hz with any trailing zero dropped.
- **Each Spectrum's hover readout** gets a fourth line while the layer is on: "n = 3" when the peak under the cursor is on a Harmonic of the Spectrum's fundamental (the one the Harmonic Markers count from), and blank between Harmonics. The canvas's readout data ends " · n = 3".
- **The Oscillator Spectrum** writes the Noise's slope in its top-right corner while the Noise is up, "white: 0 dB/oct" or "pink: −3 dB/oct", under the Harmonic Markers' labels. While frozen it stays with the frozen frame.
- **Under the hood** (decision 2), with the layer on, each Scope's tip gives T = 1 / f₀ and each Spectrum's gives fₙ = n × f₀; the Oscillator Spectrum's also gives the Noise's slope and its P(f) formula.
- **Held to the engine** (decision 4), by engine tests:
  - At the Init Patch's A4, and at C4 with Osc 1 an octave up and the Sub an octave under it, the rendered sound repeats after the period the corner reads and not after half of it.
  - On the Oscillator Tap's own analyser bins, the peaks of the 1st to 7th Harmonics are numbered 1 to 7, and the gap between the 3rd and the 4th gets no number.
  - The rendered Noise falls by the slope the corner reads, measured per octave from 500 Hz to 4 kHz, for white and for pink.
- **On a phone** (decision 3), the corners show as they do wider. Measured first from 320 to 1920 px: the narrowest Scope is 278 px wide, and the widest period, "2.27 ms · 440 Hz at A4", takes 111 px, leaving the right for LIMITING (45 px). The Viewers' formulas show only in their touch-and-hold tips.
- **With the layer off** nothing is drawn, and the hover readout and its box are as they were.

Calls, Claude's call, open to the owner:

1. **The Scope's number is the fundamental it holds still** (the engine's Cycle Lock frequency), not the bare Note. That is the Note at Osc 1's Octave, the Sub's pitch when the Sub is up, and it follows Glide and the pitch bend. At the Init Patch the two are the same. With Osc 1 an octave up, C4 reads "1.91 ms · 523.3 Hz", the period of the cycles the Scope draws. Decision 11's words were "the period and frequency of the Note". Before any Note, such a Patch reads "880 Hz at A4", the A4 played an octave up; the Scope's tip says so.
   **Since then (2026-11-02, issue [180](./180-steadier-scopes.md)):** Cycle Lock follows the pitch as played, an LFO on Pitch included; the Scope's number stays the fundamental held still through a vibrato, so the two part where a vibrato swings the pitch. Decided by the owner (180).
2. **"On a Harmonic"** means within a twentieth of the Harmonics' spacing, or within half an FFT bin. No number is given where the Harmonics are under four bins (23 Hz) apart, or on silence. So a Ring product at 3.15 × f₀ gets none. With the Sub up, the Harmonics are counted from the Sub, as the Markers count them, so Osc 1's fundamental reads n = 2.
3. **The hover box keeps one size** while the layer is on (issue 155): its fourth line stays blank between Harmonics rather than coming and going, and its value column is a little wider for "n = 872".
4. **White reads "white: 0 dB/oct"**, a number like pink's, rather than "flat".
5. **The Viewers' tips gained formulas** (T = 1 / f₀, fₙ = n × f₀), from decision 2. Decision 11 named only the Noise's.

**Tests run:**
- `npx tsc` and `npm run lint`.
- The Geek, readout, readout box and tips unit tests, and the engine's test file: 460 passed.
- In Chromium and WebKit, the Geek, viewer controls, overlays, limiting, tooltips, touch tips, oscillator and smoke specs: 105 passed, 5 skipped.
- After the review's fixes: the same unit and engine tests (460 passed), and the Geek, viewer controls and tooltips specs in both browsers (72 passed).
- Linux's fonts: the tests read the canvases' data, not glyphs, and the corners leave wide margins.

**To try:**
1. Turn on Display's Geek. Every Scope reads "2.27 ms · 440 Hz at A4" top left.
2. Play A4: "at A4" goes. Play other Notes, turn Osc 1's Octave, raise the Sub: the period follows the cycles drawn.
3. Hold a Note and hover the Oscillator Spectrum's spikes: the readout adds "n = 1", "n = 2"…
4. Raise the Noise in the Mixer: "white: 0 dB/oct" shows top right of the Oscillator Spectrum. Switch it to pink: "pink: −3 dB/oct".
5. Hover a Scope or a Spectrum for its formula under the hood.
6. Turn Geek off: all of it goes.
