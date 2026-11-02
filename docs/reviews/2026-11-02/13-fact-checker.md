# Review 13: the fact-checker

Checked: every Preset description, tooltip (the Synth Geek Layer's "Under the hood" formulas and History lines among them), Tour and Tutorial word, plain-words line (issue 123's generator), About text and README line added or changed since v1.20.0 (`git diff v1.20.0..HEAD -- src/ README.md`; the README has not changed). Each claim was read against the engine and the code; where a claim is about sound, it was rendered in Chromium from a temporary engine test, since deleted, with the safety limiter made straight. The History lines were read against their sources' notes in `docs/research/134-history-in-the-tooltips.md`. Unless a line says otherwise, a Note is A4 (440 Hz) at Velocity 1.

## False claims

None found in the new words.

## Unverifiable

- **The Bluetooth line** in the MIDI panel (issue 143): "A Bluetooth one plays once paired in the system's MIDI settings (Audio MIDI Setup on a Mac)". This is true on a Mac. Windows and Linux have no such panel, and whether Chrome's Web MIDI sees a paired Bluetooth Controller there was not tried. To the inbox, if the owner wants the line to name the Mac alone.
- **The LFO Rate's History line** (issue 134): "ARP's 2600 (1971) could slow each oscillator to .03 Hz, "one cycle approximately every 30 seconds", for a smoother vibrato." Both facts are in the source (S5, pages 21 and 34). But the manual's "smoother" vibrato comes from a low-frequency sine wave, not from the .03 Hz floor; the line joins the two. This is minor. To the inbox.
- **The Aftertouch tip**: "nothing at a light touch". Pressure 0 moves nothing, and the move grows with the pressure, so a light touch moves it a little. Many keyboards send nothing until a key is pressed into its bed, so this depends on the keyboard. "as on a plugin synth" is a judgement. "The dot on its knob" does not apply to Pitch, which has no knob; its line on the Timeline does show it.
- **Tempo tip in the narrow layout**: last release's item still stands. The tip sits on the BPM button, which opens the panel and cannot be dragged.
- **The words for character**: "a thick blanket instead of a thin sheet", "like a clarinet", "like breath or distant surf", "the tone gets a little fuller" (Pulse Width 30 %). These are listening judgements; the mechanisms under them are below.

## Checked true

- **FM Bass** (issue 137 left it, issue 129's era rewrote it): "where FM is thinnest, a few sidebands spaced wide; as Osc 2 falls back they close in and fill every Harmonic". Rendered with the Filter open and the Sub down, as the share of power off the carrier in 20 ms windows. With Env Amount +12 it is 1 % at the strike, 0.5 % at 20 ms, 3 % at 60 ms, 36 % at 120 ms and 42 % at 0.4 s. With Env Amount 0 it is 73–75 % throughout. At the strike only 3f (−20 dB) and 5f (−34 dB) stand out, with 2f at −36 dB; by 0.4 s every Harmonic is there (2f −2.2, 3f −10, 4f −23 dB). FM's gain is set by the knobs (`fmDepth`), so Osc 2 thrown up an octave halves the index.
- **Poly Mod Zap**: "least at the strike, brightening the held Note". This was read with Osc 1 a sine. With Env Amount +24, the share off the carrier is 0.1–0.2 % from 0 to 120 ms and 3.3 % at 0.4 s; with Env Amount 0 it is 2.5–3.0 % throughout. The dive and the Filter's closing share one Envelope.
- **Wobble Tutorial** (issue 137): with Retrigger off, Sync on and 1/4 T at 120 BPM, beats counted from 0.1 s, LFO 1 starts a cycle (0, then rising) at 0.1, 1.1 and 2.1 s, which is every second beat. At 0.6, 1.6 and 2.6 s it is mid-cycle (0, falling). That is "every second beat, a wobble starts right on it". "1/4, one wobble on every beat": Sync on keeps the note value's default, a quarter. "three a second again": 1/4 T at 120 BPM is 3 Hz. Listen sets the tempo to the Tutorial's 120 BPM, counted from its first Note (`startPhraseLoop`, `onTempo`), so the wubs land on the loop's beat.
- **Wobble, Stutter** (Presets): "starts its wobble at the Cutoff". Retriggered at 0.37 s, LFO 1 reads 0.01, and the model's Cutoff is 306 Hz against the knob's 300. "starts its stutter open": the square reads +0.80 at each Note, at 0.371 and 1.211 s, and −0.80 one thirty-second later.
- **Synced Presets**: Double Wobble's "a wobble a beat" and "a flutter a sixteenth" are 1/4 and 1/16. Growl's "there and back each eighth" is a full cycle at 1/8. Trance Gate's "sixteen times a bar at any tempo" is 1/16. Each is synced (`NOTE_VALUES`).
- **Aftertouch tip** (issue 132): "The Cutoff opens up to two octaves". Rendered at full pressure on a 400 Hz Cutoff, a saw at A2 has 4f, 8f, 16f and 24f at −11.7, −17.3, −29.0 and −44.5 dB, the same to 0.1 dB as an unpressed 1600 Hz Cutoff. Without pressure they are −17.3, −45.1, −75.8 and −93.7 dB. "on top of its knob and the LFOs": `pressed` raises the knob's value and the LFOs swing around it. "by the key pressed hardest": the pressure is the larger of the channel's and every held Note's, and a released Note's is forgotten. "the Last message says Aftertouch": that is the Activity Monitor's heading and line. "rises" holds on every Destination, Volume included (up to full).
- **Timeline tips with aftertouch**: the orange Cutoff line and each Destination's line come from `modulationAt`, which reads the pressed Patch; on Pitch, from `pressurePitch`.
- **Tempo, Tap, Sync and Tempo (MIDI clock) tips** (issues 136, 137): a note value's speed is BPM ÷ 60 ÷ its beats, so doubling the BPM doubles it. The tempo is not in the Patch, so a Preset leaves it alone. While a clock runs, the person's tempo cannot be set; after a second without ticks its last BPM stays and becomes the person's (`watchClock`).
- **Under the hood** (issues 167–170, 137):
  - The Octave is ×2^o and the Semitone ×2^(s/12) from the Note (Osc 2 follows the Note, not Osc 1's Octave); +7 is ×1.498.
  - Detune's Δf = f·(2^(c/1200) − 1) uses Osc 2's knob tuning without Detune.
  - The Rate's period is 1/f. A note value's is beats × 60 / BPM, and the conversion's "× 2", "÷ 4", "× 2/3" and "× 3/2" are right for 1/8, a bar, a dotted 1/4 and a triplet 1/4.
  - The Depth's reaches are `LFO_LAWS`: ±1 st, ±12 st, ±50 ¢, ±40 % and ±2 oct, with FM and Resonance over their whole range. Volume's foot is 1 − Depth, from a swing of half the Depth.
  - Key Track is Cutoff × 2^(k(n − 60)/12), as `effectiveCutoff` has it.
  - Glide slides in Hz (`setTargetAtTime` on each Oscillator's frequency) with τ = Glide ÷ 4, so it is 98 % of the way there by the Glide time, with one Voice only.
  - Each Envelope stage is `setTargetAtTime` with τ = time ÷ 3, 4 or 6, so 95 %, 98 % and 99.75 % of the way at the stage's time. The Attack curves towards the peak (Velocity for the Amp).
  - The Scope's f₀ is `fundamental()`: Osc 1's Octave, and the Sub's pitch with the Sub up. Its period sits top left and the Noise's slope top right. Pink is Kellet's filter at white's RMS, −3 dB an octave, which is −10 dB a decade.
- **History lines** (issue 134): each was checked against its A- or B-graded source note. These include the patent's dates (filed 1966, granted 1969), the high-pass and the low-pass, Emphasis, "Cutoff Frequency", "Amount of Contour", the Keyboard Control switches, "24Db per octave", "Attack-Decay-Sustain-Release", "as much as a major sixth", "nearly in unison", the Range's feet, the 10–50 % pulse width, the lowest key, five Voices, S-Trig, "half an octave", the SH-101's sub, Keith 1929 and Cowan 1934, the Model 160, white and pink, Winter NAMM 1983 and the 2013 Grammy, Cooley–Tukey 1965, and Fourier and Helmholtz. The Voices line keeps to "the lowest key held" without saying Limpide does the same. About's History link is to that research file, which grades each fact.
- **The plain-words generator** (issue 123): run over every Preset, its phrases were read against each Preset's own description. None claims what the Patch does not do. Where it is shorter, it leaves a part out within its 12 words (Wobble's square, Growl's Sub); it never says something wrong. Its examples:
  - "two sines through Ring, ringing out" (Ring Bell)
  - "a sine with a square above" (Cathedral, Osc 1 an octave up but quieter)
  - "with a rhythmic chop" (Trance Gate, 8 Hz)
  - "thinned by a high-pass" (Hi-hat, Riser)
  - "through a singing Filter" (Kick, Self-Oscillation)
  - "a pure sine with a Sub, ringing out" (808 Boom)
- **Tutorials** (issue 129):
  - Osc 2 on Init is a second saw at the same pitch: Detune is 0 and its fader is at 0, so it is "silent for now".
  - An octave down, a square fills f/2, 3f/2 and 5f/2, below and between Osc 1's lines; the Ideal's circles are Osc 1's and its squares Osc 2's.
  - A 25 % pulse has every fourth line missing. At 30 % the dips come every 3.3 lines (at 3 and 7, 10 dB down), and only the tenth is missing.
  - Ring of sines at f and 2f gives 3f (above Osc 2) and f (on Osc 1's line). At +3 semitones it gives 1.378f and 3.378f, between the lines. Ring alone is −3.0 dB against one sine alone (rendered).
  - A Sub two octaves down fills every other place, Osc 1 every fourth, and the places 2, 6, 10 stay empty.
  - "hundreds of times a second" (the FM Tutorial and the Tour's Oscillators card) holds for the Notes each plays: A3 to E4, and E3 to A3.
- **Tour** (issue 129): the LFO card's "twice a second" is Init's 2 Hz with Sync off. The Filter card's sweep goes from 2000 to 150 Hz and back.
- **Synth Geek Layer tip and About**: the layer's parts are as listed, and History sits at the end of the tips that have one.

Counts: 0 false, 5 unverifiable (2 to the inbox), about 60 claims checked true.

## For the inbox

1. The MIDI panel's Bluetooth line names the system's MIDI settings, which only a Mac has (Audio MIDI Setup); on Windows and Linux it is untried.
2. The LFO Rate's History line ties ARP's "smoother vibrato" to the .03 Hz floor; in the manual, the smoother vibrato is the low-frequency sine wave's.

## Nothing to stop the release
