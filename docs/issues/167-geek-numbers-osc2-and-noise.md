# 167: Geek numbers: Osc 2's tuning and the Noise

**What to build:** A slice of [133](./133-the-maths-layer-complete.md) (the layer made complete, grilled with the owner 2026-10-31): decisions 6 and 7, and the Noise's formula of decision 11. Polish of v1's learning layer ([131](./131-v1.md)).

**Blocked by:** none (build after night/2026-10-31 is merged where it touches the same readouts; Claude's call, open to the owner)

**Status:** ready-for-human · enhancement. Built (2026-11-01) on night/2026-11-01, for the owner to try

## Agent Brief

**Category:** enhancement
**Summary:** With the Synth Geek Layer on, Osc 2's tuning and the Noise write the numbers and formulas the engine computes, as 133's decisions 6 and 7, and the Noise's formula of decision 11 say.

**Current behavior:** With the layer on, these controls show only their value; their tips say nothing of the maths.

**Desired behavior:** With the layer on, Osc 2's Semitone shows its frequency ratio, its Octave its multiple, Detune its beating rate at the Note played (A4 before any, said); their tips' Under the hood give 2^(s/12) and Δf = f·(2^(c/1200) − 1); the Noise's tip gives white flat, pink −3 dB per octave. Every live number is tested against the engine's own output (133, decision 4); on a phone a number shows where the value shows today, and formulas only in the touch-and-hold tip.

**Key interfaces:**
- The layer's readouts beside controls and on Viewers, and the tips' "Under the hood" line
- The engine (the numbers' source) and the model it mirrors
- The Display setting that turns the layer on

**Out of scope:**
- History lines ([134](./134-history-in-the-tooltips.md)); the layer's rename ([165](./165-the-synth-geek-layer.md))

**Acceptance criteria:**
- [x] Semitone +7 reads ×1.498; Octave +1 ×2, −1 ½
- [x] Detune 10 cents at A4 reads its beats in Hz, matching the beats measured on the summed Oscillators in an engine test
- [x] The tips' formulas under the hood
- [x] On a phone the numbers show in the name's place while the control moves
- [x] With the layer off nothing changes; every test passes in Linux's fonts too

## How it was built

- **The readouts:** with the Synth Geek Layer on, Osc 2's Octave reads its multiple (×¼, ×½, ×1, ×2, ×4), its Semitone its ratio (×1.498 at +7, ×0.667 at −7; whole octaves as ×2 and ×½), Detune its beats: "2.55 Hz beats" for 10 cents at A4, the rate to three figures. They show where the value shows, as Q and dB do.
- **The Note they use** (133, decision 6): the newest Note the engine plays, kept by the engine and told to the page as it changes, so a Note from the keys, the piano, MIDI, a Demo or a Hold rhythm all count. Before any, the numbers are A4's and Detune says so: "2.55 Hz at A4" in place of "beats". Only a readout whose text changes draws again. 168, 169 and 170 can take the same Note for Key Track and the Scope.
- **Held to the engine** (decision 4): an engine test renders Osc 2 alone at Semitone +7, Octave +1 and −1 and checks its measured frequency over the Note against the readout's number; two more render both Oscillators at Detune 10 cents on A4, at their Octaves and both an octave up, measure the beats from the swells of the summed sound, and check them against the readout (within 0.01 Hz). Detune's f is worked out with the function the engine tunes Osc 2 with, so the two cannot drift. The Noise's slope has no live number; its formula is held by the Pink Noise test already there (−10 dB a decade).
- **Under the hood:** a tip can now carry a formula, shown with the layer on, under a rule and headed **Under the hood**, above History (decision 2). The formulas sit together in the Synth Geek Layer's module, for 168 to 170 to add to: Octave f₂ = f × 2^o, Semitone f₂ = f × 2^(s/12), Detune Δf = f·(2^(c/1200) − 1), each with its letters said; the Noise, on its fader's tip and on Noise colour's, "white: P(f) flat; pink: P(f) ∝ 1/f, −3 dB per octave".
- **On a phone** (decision 3): where the value shows in the name's place, at 860 px and narrower, the number shows there while the control moves, as the values do; the formulas only in the touch-and-hold tip. Measured first at 320 to 1920 px: knob widths there leave no room for "2.55 Hz beats" (it ran 8 to 16 px over Env Amount's name), so there Detune shows its figure alone, "2.55 Hz", its words dropped. Wider, the Tuning row widens by Detune's longest readout and no knob moves up or down.
- **Calls open to the owner** (all Claude's call):
  1. **"×½", not "½":** the Octave and the Semitone keep the × on fractions too, so every multiple reads the same way.
  2. **"at A4" in place of "beats"** before any Note, so the readout stays one width; the tip's formula says the same ("A4 until one is").
  3. **f is Osc 2 before Detune** (the Note moved by its Transpose): the rate it beats at against a tone there, Osc 1 or one of its Harmonics. With Osc 2 a fifth up and two Sines, nothing sounds at f, so nothing beats at that rate, though the readout still says "beats" (the review's point). The LFOs, aftertouch and Env Amount are left out, as the knobs' readouts leave them.
  4. **The Octave has a formula too** (2^o), beside the two decision 7 names.
  5. **On a phone, Detune's figure alone**, above: so "at A4" is not said there before a Note is played. A finger turning Detune still sees it in the value bubble, and the touch-and-hold tip says it.
  6. **The Noise's formula on both its tips**, the fader's and Noise colour's.
- **Found, not touched:** with the layer on, the Mixer's fader row is a few pixels wider than its box at 860 px and below (5 to 9 px, from the dB readouts); it was so before this issue.
- **Tests run:** `npx tsc`, `npm run lint`; the Geek, tips and History unit tests and the engine's test file (479 passed, then the five tests of this issue again after the review's fixes); in Chromium and WebKit the Geek, tooltips, touch tips, knob, fader, Osc tabs and fits-the-screen specs (201 passed, 7 skipped: touch input in Chromium only), and the Geek and tooltips specs again after the fixes (38 passed). Linux's fonts are GitHub's run: the readouts' widths are reserved by sizers, and no test measures a glyph.
- **Reviewed** with the code-review skill (standards and spec): fixed Detune's f, which wrote out the engine's tuning again instead of calling it, A4's second copy, and a tip field named `hood`; an engine test was added for an f other than the Note's.
- **To try:** turn the Synth Geek Layer on and open Osc 2: turn Semitone to +7 (×1.498), Octave up and down (×2, ×½); turn Detune and read its beats at A4, then play a Note and watch them change with it, higher Notes beating faster; raise Osc 2 in the Mixer and hear the beats at the rate it says. Hover Octave, Semitone, Detune and the Noise fader for Under the hood. On a phone, turn Detune: its number shows in the name's place.
