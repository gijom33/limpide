# Review 13: the fact-checker

Checked: every Preset description, tooltip, Tour and Tutorial word, About text and README line added or changed since v1.19.0 (`git diff v1.19.0..HEAD -- src/ README.md`), against the engine, the code and rendered sound. The renders ran in Chromium from a temporary engine test, since deleted, reading the Taps' analysers at set moments of an offline render with the safety limiter made straight. Unless a line says otherwise, a Note is A3 (220 Hz) at Velocity 1 on Init.

## False claims

1. **Sync tip** (issue 112) said "On: the Rate is a note value at the tempo, and the LFO's cycle lands on the beat." The engine locks the cycle to the beat only with Retrigger free (`lockToBeat`); with Retrigger on, each Note starts it, as issue 112's decision 4 says. Rendered, a synced 1/4 saw at 120 BPM with its beats counted from 0.1 s and a Note at 0.33 s: Retrigger free, the saw is at its start (−1.000) at 0.6, 1.1 and 1.6 s; Retrigger on, it is at its start at 0.83 and 1.33 s and at +0.080 on the beats. Fixed (`Issue 112: the Sync tip puts the cycle on the beat with Retrigger off`), test first.
2. **Guides tip** (issue 159), its unchanged second sentence: "A trace inside them has only lost energy; one beyond them has been boosted by Resonance." A chord passes them with no Resonance. The Amp Scope sums every Voice, so an A major triad from A3 (3 Voices, Sustain at full, Resonance 0, the Filter open) peaks at 1.28 against Guides at 0.50. Smaller cases: with Resonance 0 and the Filter open, the Filter Tap passes them by about 5 % (saw 0.526, square 0.531, against 0.500; Osc 1 and Osc 2 at full, 1.052 against 1.000). Pink Noise at full passes them on the Oscillator Tap itself (1.045 against Guides capped at 1.000). Not fixed: issue 159's test holds the sentence, and the answer may be in the Guides (count the Voices) as much as in the words. To the inbox.

## Unverifiable

- **Tempo tip**: "Drag it or use the arrows; double-click to type it." This is true of the dial. In the narrow layout the same tip sits on the BPM button, which only opens the tempo panel, and the panel's own dial has no tip. Whether a reader takes the tip as the button's or the dial's is a judgement. To the inbox.
- **The words for character**: "vowels that never settle, like a robot mumbling" (Talking Filter), and Bead's "a funny turn". These are listening and reading judgements. The mechanisms under them were checked and are below.

## Checked true

- **Portamento** (issue 119): one Voice, Glide 0.25 s, Osc 2 a fifth up, Legato on. Rendered C3, then G3 played over it at 0.8 s:
  - Key Track drags the Filter along: the model's Cutoff goes 1030, 1092, 1284, 1418, 1512 and 1535 Hz from 0.79 to 1.2 s (×1.49, seven semitones at Key Track 100 %).
  - The Filter Envelope's bite comes only on the first Note. Legato, the Filter Envelope stays at its Sustain (0.30), and the share of energy above 2.5 kHz just after the second Note is −32.5 dB. With Legato off, or struck afresh, the Envelope jumps to 0.94, and that share is −17.7 dB, the same bite as the first Note's (−24.5 dB at 10 ms).
  - "Let go of every key to strike afresh": a Note struck `afresh` renders the same as with Legato off, and the note input sends `afresh` once every key is up.
- **Legato tip**: one Voice only (`voiceCount() === 1`, and the switch says "No effect with more than one Voice"). There is no new Attack: the model's Amp and Filter Envelopes carry on, so the Timeline draws one Attack. "An LFO set to Retrigger does not start again": LFO 1 retriggered on the Cutoff reads −0.499, −0.500, −0.496 around the legato Note, and with Legato off it restarts at 0.000.
- **Retrigger tip**'s "a legato one aside, with Legato on": the same render.
- **Talking Filter** (issue 166): a band-pass, LFO 1 (triangle, 2.5 Hz) on the Cutoff and LFO 2 (square, 0.7 Hz) on the Resonance. Its engine test passes: Resonance 0.9 and 0 by turns, each band sweeping, the narrow one more than 6 dB quieter.
- **Synced Rate tip** (issue 176): "At 120 BPM, 1/4 is 2 Hz" (`noteHz`). The note values run 4 bars to 1/32, D dotted and T triplet. Its steps line reads "↑↓ a note value · Page 2 note values", matching `steppedGrid(1, 2)`.
- **Tap tip**: the tempo comes from the second tap, from the last four taps (`taps.slice(1 − TAPS)`, then `tappedBpm`), with the beats counted from the last tap (`engine.now()` as the origin).
- **Timeline and LFO plot tips**: "While an LFO is synced, faint broken lines mark the beats". Both draw `beatsBetween` as dashed lines while Sync is on.
- **Grid steps on every knob's and fader's tip** (issue 160): each line matches its Grid. Percent controls go 1 %, 0.1 % and 10 %. Detune goes 1, 0.1 and 10 cents. The Cutoff and Osc 2's Env Amount go a semitone, 10 cents and an octave. The Filter Envelope Amount goes 0.1, 0.01 and 1 octave. The times and Rates go the next round value, 1 % and double or half. The Mixer goes 0.5, 0.1 and 6 dB. The Octaves move an octave on every key. The Semitone goes a semitone, with Page 2. The keys are those `useParamControl` reads: the arrows, Shift for fine, and Page Up and Down.
- **C16 tips** (issue 148): the banks read "A Oscillators, B Filter, C Amp, D LFO & Envelopes". The shared buttons are "M1 Previous Preset, M2 Next Preset, M3 Freeze, M4 Hold, S3 Snapshot" (S4 is Sub Octave on A only, so it is rightly left out). Every R button is a switch or a Waveform (Slope; Legato on C's R2; Retrigger and Sync side by side on D). "Print C16 card, beside this" is the link next to the layout button. Momentary and Toggle are `describeMode`'s words.
- **The Preset's description × tip** (issue 153): Escape closes it, unless a panel or menu is open or the focus is in a field. Any change to the Patch hides it. Every Preset's description is its tooltip in the Patches panel (`PatchSearch`).
- **Bead's tip, About card and README line** (issues 150, 163): the rules in `beadAfter` match. Off keeps it away and is remembered. B, E, A, D send it away for the visit and call it back, and do nothing while the switch is off. On the computer keyboard those are J, D, H, S, in any octave. Every Parameter has a gesture (`ANSWERS` is keyed by every ParamId). The four jokes are drinking then a burp, a rain cloud and an umbrella, a water gun, and a fountain show; fishing ends with a ♪. It makes no sound. All of this is as `docs/bead.md` says, and that page exists for "All its secrets".
- **The Filter toggle's tip** (issue 161) and **the Ideal step** ("Open Display and turn on Ideal"): a Display Step whose overlay is already on starts by turning it off.
- **Tour, the Amp card** (issue 130): the four stages and the words for each, "before each Note the synth changes one stage, and puts it back after", and "once each Note has faded" the freeze. At 60 BPM each pass turns its stage over 0–1 s, plays its Note at 1.5 s for 85 % of its beats, freezes at 3.2 s for 3 s, and puts the stage back by 7 s. By the Envelope's arithmetic (98 % of the way at its stage's time), the latest fade ends at 3.01 s (the Release pass: key up at 2.01 s, Release 1 s), and the Attack pass's Note is 52 dB down by the freeze. Each Note from onset to fade fits the Timeline's default 2 s window (1.2–3.2 s).
- **About's Support line and the README's** (issue 172): "Share it, or star it on GitHub" links to the repository.

Counts: 2 false (1 fixed, 1 to the inbox), 2 unverifiable (1 to the inbox), about 40 claims checked true.

## Nothing to stop the release

The one false new claim, the Sync tip, is fixed. The Guides' sentence predates this release in substance, and its fix is a choice for the owner.
