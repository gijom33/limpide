# 169: Geek numbers: the LFOs and Key Track

**What to build:** A slice of [133](./133-the-maths-layer-complete.md) (the layer made complete, grilled with the owner 2026-10-31): decisions 6, 8 and 10 (Key Track). Polish of v1's learning layer ([131](./131-v1.md)).

**Blocked by:** none (build after night/2026-10-31 is merged where it touches the same readouts; Claude's call, open to the owner)

**Status:** ready-for-human · enhancement. Built (2026-11-01) on night/2026-11-01, for the owner to try; the Rate's period readout is replaced by [202](./202-the-geek-layers-rate-reads-as-without-it.md) (the owner, 2026-11-02), so it is not to judge here

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
- [x] Rate 2 Hz reads 0.50 s; synced 1/4 at 120 BPM reads 0.50 s
- [x] Depth on Pitch, Cutoff, Volume and Pulse Width reads ±st, ±oct, ±dB and ±% matching the engine's swing (engine tests)
- [x] Key Track's figure equals the Effective Cutoff's at the Note
- [x] With the layer off nothing changes; every test passes in Linux's fonts too

## How it was built

- **Since then (2026-11-02, issue [202](./202-the-geek-layers-rate-reads-as-without-it.md)):** the Rate reads as without the Synth Geek Layer, Hz or a note value, decided by the owner; the period stays in its tip.
- **The readouts:** with the Synth Geek Layer on, each LFO's Rate reads its period, "0.50 s" at 2 Hz (from "0.050 s" at 20 Hz to "20.0 s" at 0.05 Hz); with Sync on, the period of its note value at the page's tempo, "0.50 s" for 1/4 at 120 BPM, following the tempo as it changes. Depth reads the swing in its Destination's unit, as the engine swings it: "±0.80 oct" on the Cutoff at 40 %, "±0.50 st" on Pitch at 50 %, "±12.0 st" on Osc 2 Pitch at full, "±25.0 ¢" on Detune, "±16 %" on Pulse Width, FM and Resonance in their knobs' %, each kept within its room as the engine keeps it (a 25 % pulse swings 20 % at most; two LFOs on one Destination share it). Key Track reads the Cutoff at the Note played, A4's before any: "3.36 kHz" at 100 % before a Note, "2.00 kHz" after C4. They show where the value shows, as Q and dB do.
- **Held to the engine** (133, decision 4): engine tests measure, on what the engine plays, the period of a square LFO's tremolo at 2 Hz, 3 Hz, a synced 1/4 at 120 BPM and 1/8 T at 100 BPM; the swing of the pitch on Pitch, on Osc 2 Pitch and on Detune, of the level on Volume (in dB) and of a pulse's width (its share of each cycle high), and the swing of the Effective Cutoff and of the Resonance in the engine's Modulation model (which earlier tests hold the Filter's sound to); each against the readout's number. FM's swing has no engine test, only the unit test of its law: its index cannot be read from the engine without one of its own. Key Track's figure is checked against the engine's Effective Cutoff at the Note and before any Note (A4). A test made the readouts wrong on purpose and saw the tests fail.
- **Under the hood:** Rate T = 1 / f; a synced Rate T = beats × 60 / BPM; Depth "swing = Depth × its reach", with each Destination's reach at full Depth written from the laws the engine swings by, so the two cannot drift; Key Track fc = Cutoff × 2^(k·(n − 60)/12), its letters said.
- **On a phone** (decision 3): at 860 px and narrower the numbers show in the name's place while the control moves. Measured first from 320 to 1920 px: every LFO readout fits its column with 17 px or more to the next control; Key Track's widest, "20.00 kHz", leaves 8 px or more (the page's least).
- **Calls open to the owner** (all Claude's call):
  1. **Volume's Depth reads its dip, "−6.0 dB" at 50 %, not "±".** The engine's tremolo tops at the Envelope's level and dips Depth below it, so in dB it is not even either way; the readout says how far below the top it goes (20 log₁₀(1 − Depth)), "−∞ dB" at full. The acceptance criterion and decision 8 wrote "±6 dB".
  2. **Key Track's figure alone, "at A4" not said before a Note, nor decision 10's "Cutoff here:".** "2.83 kHz at A4" (and wider, the Note's name) made the Filter's row wrap between 861 and about 900 px wide, moving 29 knobs and the page 19 px taller; the figure alone fits at every width. The tip says the number is at the Note played, A4 until one is. Decision 6 asked for "at A4" said.
  3. **Key Track's figure leaves out the Filter Envelope, the LFOs and Velocity**: the Cutoff the Note starts from, as decision 10's "Cutoff here" reads it; the Timeline's Effective Cutoff moves on from it while the Note plays. So it equals the Effective Cutoff's figure only while those are at rest (the criterion's test is so).
  4. **Pulse Width's room is Osc 1's width**, or Osc 2's while it alone is a pulse; the engine keeps each Oscillator within its own, so with two pulses of different widths Osc 2's swing can differ from the one read.
  5. **Units:** semitones and octaves to two decimals under 10 (one above), cents the same, the % ones whole; a period to three decimals under 0.1 s.
  6. **The Resonance's swing in its knob's %**, though with the layer on that knob reads Q: a swing in Q is not even either way.
  7. **Each LFO its own swing:** with both on one Destination, each Depth reads its share (on Volume, its own dip), not the two together.
  8. **The Cutoff's swing is the law's**, "±2.00 oct" at full Depth even where 20 kHz or 20 Hz stops it on one side (issue 166).
- **Tests run:** `npx tsc`, `npm run lint`; the Geek, tips and History unit tests and the engine's test file (499 passed); in Chromium and WebKit the Geek, tooltips, touch tips, knob, LFO, LFO Destination, tempo, Filter Mode, fits-the-screen and in-between-layout specs (209 passed, 7 skipped: touch input in Chromium only); after the review's fixes the engine tests again (427 passed with the Geek and tips unit tests) and the Geek, tooltips, LFO and tempo specs in both browsers (84 passed). Linux's fonts are GitHub's run: the readouts' widths are reserved by sizers (several for Depth, whichever is widest in the font), and no test measures a glyph.
- **Reviewed** with the code-review skill (standards and spec): the readouts' Note and tempo now travel as one options object, a comment that said every Note-bound readout says "at A4" was put right, and engine tests were added for Osc 2 Pitch and the Resonance; the spec review's other points are calls 2, 3, 6, 7 and 8.
- **To try:** turn the Synth Geek Layer on. Under LFO 1, Rate reads 0.50 s; turn on Sync and change the tempo: the period follows. Turn Depth up and step through the Destinations: its swing changes unit with each (oct, st, ¢, %, dB), and hear that 0.80 octave on the Cutoff, or a 6 dB dip on Volume at 50 %. Turn Key Track up: its figure is the Cutoff at A4, then at each Note you play. Hover Rate, Depth and Key Track for Under the hood. On a phone, turn Depth: its swing shows in the name's place.
