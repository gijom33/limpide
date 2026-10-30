# Persona review 15: the sound designer and Preset curator

**How it was done.** I used the live site (1.16.0, build 328a370) through Playwright's Chromium at 1440 × 900. I opened the Preset panel, hovered the pills for their descriptions, and stepped through all 136 Presets with the › arrow (the code holds 136, Init included, not 135). Each one played C4 and C5 on the on-screen piano, and the console showed no errors. Headless Chromium has no ears, so everything about sound comes from offline renders of the 1.16.0 source through `createSynthEngine`, in the way review 14 renders: an OfflineAudioContext at 48 kHz, with the safety limiter's curve made straight. Every Preset was played on C2, C4 and C6 at Velocity 1, held 1.2 s and then released. Each was also played on C4 at Velocity 0.35. A four-Note chord (C4 E4 G4 B4) was added for each Preset with more than one Voice. From these renders I measured:

- **Level:** RMS of the loudest 100 ms, in dBFS, and the peak.
- **Brightness:** spectral centroid, taken at the strike (5 to 48 ms), at 300 ms, and late in the hold.
- **Time:** decay to −20 dB, and the tail after release.
- **Other:** the Effective Cutoff, the LFO swing and the pitch, read from the engine's own model (`modulationAt`). The level of each Harmonic for the organs. The levels of eleven candidate Presets.

The numbers below come from those renders unless they are marked "by ear only" or "not rendered".

## First impression

The synth is serious. It has two Oscillators, a Sub one or two octaves down with a square or sine shape, white or pink Noise, Ring, FM, and Osc 2's pitch on the Filter Envelope (Poly Mod). It has four Filter Modes at 12 or 24 dB, two LFOs with retrigger, and up to 8 Voices. That is more than a Juno-106. The Preset panel is a tidy grid of 14 categories with search. A designer reads it in ten seconds as "a teaching bank (Shapes to LFO, 46 Presets) followed by an instrument bank (Bass to Movement & Effects, 90)", and the order makes sense for a learner. The names are mostly good, and some are excellent (Reese, 808 Boom, Deep Space, Trance Gate, Breathing Pad). The first thing that bothered me came after I loaded a Preset with the arrows. Its description, the "what to look at" line, is nowhere on screen. It appears only as a tooltip on the pill inside the panel. Pointing at the Patch name shows the generic "Patch" help.

## What they tried, in order

1. **Opened the site and the Preset panel.** I read the categories, hovered Reese (the tooltip appeared) and loaded it. I held C4: the Scope beat slowly, the Sub showed up as C3 in the Spectrum, and the Cutoff drifted on its LFO. Then I closed the panel. The description could not be found again (screenshots `hover-reese.png`, `hover-name.png`).
2. **Stepped through all 136 with ›**, playing C4 and C5. Nothing broke and every Preset loaded. Arrows wrap from Out of Tune back to Init.
3. **Checked the keyboard's range.** The piano and the computer keys start at C4. The Octave buttons reach down to C0, but every Bass Preset first sounds at 262 Hz, a tenor register, until you press Z twice.
4. **Rendered every Preset offline** (method above) and compared levels, keyboard tilt, Velocity response, decays and tails, group by group.
5. **Diffed every pair of Patches** to find near-duplicates, and tagged each Preset with the tricks it uses: Velocity, Glide, Key Track, FM, Ring, Poly Mod, Sub, Noise, LFO targets, retrigger.
6. **Went deeper** where the descriptions made claims I could measure:
   - the organs' Harmonics;
   - the retriggered LFOs (Key Sync, Wobble, Stutter, Zap Pluck, Trance Gate, FM Growl);
   - Trill's pitch;
   - Glide times;
   - Velocity on the electric pianos;
   - Marimba's strike.
7. **Built and rendered eleven candidate Presets** from Init, to show tricks no Preset uses yet, and checked their levels against their target groups.

## What worked

- **The tricks are real and the descriptions mostly teach them.**
  - 808 Boom drives Osc 2's pitch from the Filter Envelope (Env Amount +24 st, Decay 60 ms) over a sine Sub. It is the cleverest Preset here: a convincing 808 from a subtractive synth, at −15.8 dBFS on every Note, flat across the keyboard.
  - Kick and Tom use a self-oscillating Filter as the drum's oscillator.
  - Cathedral puts a square an octave up, a sine on the Note and a sine Sub two octaves under Osc 1. Measured on C4, rungs 1, 2 and 4 of C3's ladder sit at 0, 0 and −6.4 dB. The next strongest is rung 12 at −15.4 dB, and everything else is under −55 dB: three clean families, as described.
- **Glide is tuned well.** Measured to within 10 cents after a legato C4 to G4: Acid 62 ms, Ring Lead 52 ms, Lead 82 ms, Portamento 254 ms, Glide Slide 508 ms. These are the right values for each job.
- **Retrigger works where it matters.**
  - Trance Gate's square starts "on" at 0 s (swing +1.00).
  - Stutter's square starts open (909 Hz, against 99 Hz closed).
  - Wobble restarts at every Note.
- **Velocity → Cutoff works where there is something above the Cutoff to open.** A Velocity of 0.35 against 1.0 moves the brightness of the strike (soft over hard):

  | Preset | Brightness, soft over hard |
  |---|---|
  | Snare | 0.59 |
  | Screamer | 0.67 |
  | Velocity Bite | 0.70 |
  | Acid | 0.71 |
  | Pluck Bass | 0.80 |
  | Clav | 0.81 |

- **Envelopes and tails are clean.** No Preset hangs. Plucks and drums fall to −60 dB within 0 to 0.3 s of release. The pads tail on for more than 1.8 s, as they should.
- **The Shapes, Intervals, Filter, Envelope and LFO groups make a good teaching bank.** The pairs work as lessons: Slow and Fast Vibrato, Hi-hat and Open Hat, Stepped and Ramp.

## Where they got stuck

1. **The description disappears once a Preset plays.** The arrows load a Preset with no line about what it shows. A designer auditioning a bank, or a learner, plays a sound without its "look at the Timeline's Cutoff" hint.
2. **Velocity → Cutoff that cannot be heard.** On these seven Presets, soft and hard strikes have the same brightness to within 1 % (onset centroid ratio 0.99 to 1.01):
   - Electric Piano (Velocity 0.7) and Tremolo Keys (0.7), which say "Velocity for a brighter strike";
   - Poly Keys (0.7), which says "Velocity brightens each strike";
   - Tine Piano (0.8), Felt Piano (0.4), FM Bell (0.4) and Duo Lead (0.3).

   They are triangles and sines under Cutoffs of 1.2 to 2.5 kHz with Key Track, so opening the Filter two more octaves finds nothing to let through. Only the level changes, by 9.1 dB, as it does on every Preset.
3. **A retriggered Saw Down does not start at its top.** A retriggered LFO starts at phase 0, the middle of a Saw Down.
   - Key Sync ("every Note opens bright and closes the same way"): measured from the Note's start, the Cutoff is 500 Hz at 0 s, falls to 172 Hz at 0.32 s, and jumps to 1.48 kHz at 0.34 s. The Note opens at the knob, closes, then flashes open a third of a second in.
   - Zap Pluck: the same law puts its full-FM zap at 0.17 to 0.20 s, after the strike.
   - Wobble starts at its knob value (300 Hz), not "from the top", and peaks at 0.1 s.
4. **Trill never plays the Note you press.** A square LFO on Pitch at full Depth swings ±1 semitone around it. On C4 the model gives MIDI 61, 61, 59, 59, 61: C#4 and B3, a whole tone apart, never C4.
5. **Organ and Chord Organ are not drawbar sines.** Their Sub is the default square. On C4, C3's ladder has rungs 1, 2 and 4 (−5.4, 0 and −4.4 dB) plus odd rungs 3, 5, 7, 9, 11 and 13 at −15 to −28 dB. That is nine rungs, not "three clean rungs in the Spectrum".
6. **Marimba's strike is darker than its body.** Its Filter Envelope Amount is −2. The strike starts with the Cutoff two octaves down and opens over 50 ms, so the square two octaves up is muffled in the strike and heard in full for the rest of the decay. The strike is darker than the body (onset centroid 345 Hz, 358 Hz at 300 ms), the reverse of "the bright tick of the mallet, then the round tone".
7. **Square Lead promises a "delayed-feeling vibrato".** It has none. LFO 1 runs freely at a fixed Depth from the first instant, and the synth has no LFO delay or fade.
8. **Levels jump from one Preset to the next.**
   - On C4 the collection spans 29 dB, from Choir at −36.0 dBFS to Wobble at −7.0.
   - Group medians span 12.7 dB, from Keys & Plucks at −27.0 to Bass at −14.3.
   - Each 8-Voice Preset loses about 9 dB on a single Note to the master's 1/√8. Inside Keys & Plucks, the one-Voice Chorus Pluck (−14.6) is 19.5 dB over Clav (−34.1).
   - New beyond review 14:
     - Choir sits 12 dB under the Pads (−36.0 against a median of −23.8). Wind (−34.4) and Clav (−34.1) are about as quiet.
     - In the Drums, the Kick (−28.4) is 8 dB under the Open Hat (−20.3) and 5 dB under the Snare.
     - Acid (peak 0.98), Wobble (0.93) and Screamer (0.85) also pass the limiter's 0.8 knee on a single Note.
     - Breathing Pad climbs 15.4 dB from C2 (−21.0) to C6 (−5.6), and its chord peaks at 1.10.
     - Vowel climbs 18.0 dB across the same range, High-pass Buzz 10.8, Wah 9.4.
9. **The Bass group sounds in the tenor register by default.** The keys start at C4, so Sub Bass plays a 262 Hz saw over a 131 Hz Sub until the visitor shifts two octaves. A Preset carries no register.

## Would they

- **Use it to teach sound design: yes.** The teaching bank is the best-ordered set of lesson Presets I know in a free tool. Poly Mod, Ring, FM and a two-down sine Sub give it tricks that Ableton's *Learning Synths* lacks. The descriptions point at the right Viewer. But it should show the description while the Preset plays, and the Velocity claims in point 2 need fixing first: they teach something the ear cannot confirm.
- **Recommend it to a sound designer: yes, as a sketchpad and a teaching aid.** A designer will enjoy 808 Boom, Reese, Deep Space and Breathing Pad. They will miss the things the Out of Scope list rules out (effects, unison, sync), and an LFO delay and a phase control for retrigger.
- **Ship these Presets in a product: no, not as they are.** A factory bank is levelled to within about ±3 dB per category and played into a sensible register. Here the levels span 29 dB, the Bass group starts two octaves too high, and five Presets are near-copies of others. About ten descriptions are false: the nine already found plus the ones above. With the reworks below, about 110 of the 136 would be shippable.

## The collection (cohesion, variety, categories and order, near-duplicates)

**Cohesion.**
- The naming style is consistent: plain English, Title Case, no numbers or initials. "12 vs 24" and "Key Track Demo" are lesson names and fine in lessons.
- The vocabulary is over-used:
  - "Bell": five Presets (Twelfth Bell, Ring Bell, Breathing Bell, FM Bell, Bell Chords).
  - "Glass": three (Glass Keys, Glass Pad, Glass Shimmer).
  - "Zap": Zap Pluck, Zap Tom and Poly Mod Zap, plus Laser.
  - "Clang": Clang and Clang Alarm.
- Five Presets share the name of their category or of a Tutorial: Bass, Lead, Pluck, Pad, Piano. That is fine for a starting point, but in the panel "Bass" appears three times, as a Tutorial, a category and a Preset.
- Level is the weakest point of cohesion (stuck point 8).

**Variety.** Every common family is covered (bass, lead, keys, piano, pad, strings, brass, choir, bells, drums, effects). Missing are woodwinds, percussive organ, stabs, rides and cymbals, claps, risers and downlifters, and a PWM or Juno bass (see Presets to add). Some tricks are used once or never:

| Trick | Used by |
|---|---|
| Notch Filter | only the Notch Sweep lesson |
| Negative Env Amount (Osc 2) | no Preset |
| Env Amount on a slow Filter Attack | no Preset |
| Osc 1's Octave | only Split Octave Bass and Cathedral |
| Sub two down | no Bass |
| Noise as a strike transient | no Preset |
| Velocity on a pad | no Preset |

**Categories and order.** The split into lessons first and sounds second is right for Limpide. Two problems:

1. **"Chords" is a feature, not a sound family.** It holds a pad, keys, an organ, a pluck, strings, brass, vibes, a lead and bells. Most of its siblings in Keys & Plucks, Pianos and Pads already have 8 Voices, so the group mostly repeats them. Four of its ten are near-copies (see the table below).
2. **Bells and organs are scattered.** Bells sit in five groups. Organs sit in Keys & Plucks (Organ), Chords (Chord Organ) and Pads (Cathedral).

A reorganised list, keeping the six lesson groups as they are:

| Category | Presets |
|---|---|
| Bass | as now, plus PWM Bass |
| Leads | as now, plus Duo Lead, Flute and Analog Drift Lead |
| Keys & Organs | Electric Piano, Tremolo Keys, Clav, Organ, House Organ, Cathedral |
| Pianos | as now |
| Plucks & Mallets | Pluck, Poly Pluck, Harp, Chorus Pluck, Pick Pluck, Marimba, Vibes, Kalimba, Toy Piano (moved from Pianos), Glass Keys, FM Bell, Zap Pluck |
| Pads | as now, plus Phase Pad and Chord Pad |
| Strings, Brass & Choir | PWM Strings, Strings, Brass Swell, Brass Section, Choir |
| Drums & Percussion | as now, plus Ride |
| Movement & Effects | as now, plus Riser and Sub Drop; Out of Tune moves to Intervals beside Fast Beats, or goes |

Rave Stab could sit in Keys & Organs if no Stabs group is wanted. Give the eight Voices as a fact in each description, not as a category.

**First Preset of each category.** Most sell their group:
- Pure Sine, Resonant Ring, Kick and Pad work well.
- "Bass" and "Lead" are plain but are the Tutorials' sounds, so they can stay.
- Movement & Effects opens on Glide Slide, a plain square with Glide that sounds like Init with a slide. Open it on Laser (by ear only, the group's most immediate sound) or Wind instead.
- Keys & Plucks opens on Pluck, a one-Voice Preset in a group of eight-Voice keys. A strummed chord on it cuts each Note off.

**Near-duplicates** (normalised distance between Patches; 0 is identical):

| Pair | Distance | What differs |
|---|---|---|
| Organ ~ Chord Organ | 0.10 | Osc 2 level 0.6 against 0.5; both 8 Voices |
| Fast Beats ~ Out of Tune | 0.13 | Detune 40 against 50 cents, Cutoff 6 against 5 kHz |
| Glass Keys ~ Bell Chords | 0.16 | Detune 3 against 4, Decay 2.5 against 3 s; both 8 Voices |
| Electric Piano ~ Poly Keys | 0.26 | Cutoff 1.8 against 2.2 kHz and small level changes; both 8 Voices |
| Pad ~ Chord Pad | 0.50 | Cutoff 900 Hz against 1.2 kHz, a breath of Noise |
| Twelfth Bell ~ Glass Keys and Bell Chords | 0.72 to 0.76 | three twelfth-stacked sine bells |
| Toy Piano, Marimba, Kalimba, Vibes | — | all "a sine plus something two octaves up", four mallets from one recipe |
| Ocean ~ Pink Surf | — | both Noise through a low-pass LFO'd at 0.12 Hz, both "waves" |
| Vowel ~ Wah ~ Talking Filter | — | three LFO'd band-pass saws |

## Presets to rework (ranked; for each: what is wrong, and the settings to change, as Patch field values)

1. **Electric Piano, Tremolo Keys, Poly Keys, Tine Piano, Felt Piano: Velocity changes only the level.** The soft-over-hard brightness of the strike is 1.00 to 1.01 (measured). Give the Filter something to open, and let the Envelope carry the strike (not rendered):
   - **Electric Piano, Tremolo Keys:** `osc2Waveform: 'square', osc2Octave: 1, mixOsc2: 0.18, cutoff: 600, keyTrack: 0.7, velocityCutoff: 1, filterEnvAmount: 1.5, filterAttack: 0.001, filterDecay: 0.5, filterSustain: 0.2`.
   - **Tine Piano:** `cutoff: 500, filterEnvAmount: 3, filterDecay: 0.25`. FM 0.22 gives sidebands above 500 Hz to open.
   - **Felt Piano:** keep it soft, but say "Velocity: a little brighter" only after `cutoff: 500, velocityCutoff: 0.7`.
   - **Poly Keys:** see 3.
2. **Key Sync (and Zap Pluck, Wobble): retrigger starts mid-wave.**
   - The real fix is in the engine: start a retriggered Saw at its foot and a Saw Down at its peak (phase 0.5), so "every Note starts the same way" also means "starts at the top". It would make the classic trick of a retriggered falling saw as a third envelope work. The owner decides whether to change the engine.
   - Without that, use `cutoff: 1600, lfoRate: 0.75, lfoAmount: 0.8`, which closes 1.6 octaves over the first 0.67 s. The description then says the Note "starts at the Cutoff and closes for two thirds of a second, then flashes open" (not rendered).
   - Wobble's description: "starts from the middle and rises", or `lfoWaveform: 'triangle'`, which also starts at 0. The top is not reachable today.
3. **Chord Organ, Poly Keys, Bell Chords, Chord Pad, Out of Tune: near-copies.** Replace them with Presets to add 4, 6 and 7 (House Organ, Rave Stab, Phase Pad), or give each a real difference:
   - Chord Organ: `subWaveform: 'sine', ampDecay: 0.6, ampSustain: 0.35, filterEnvAmount: 1.5, filterDecay: 0.15, filterSustain: 0`.
   - Bell Chords: `crossMod: 0.08`, a hint of FM against Glass Keys' pure sines.
   - Out of Tune: move it beside Fast Beats, or cut it.
4. **Trill: the pressed Note never sounds.** Measured on C4: C#4 and B3. Change to `mixOsc1: 0, mixOsc2: 1, osc2Waveform: 'triangle', osc2Semitone: 1, lfoDestination: 'osc2Pitch', lfoWaveform: 'square', lfoRate: 6, lfoAmount: 0.0833`. That is ±1 semitone around +1, so the Note and a whole tone above. Rendered at −17.7 dBFS on C4, the same as now. The pitch comes from the LFO law and was not measured.
5. **Organ: "three clean rungs" are nine.** Change to `subWaveform: 'sine'`. Cathedral shows what a sine Sub does to the rungs: everything outside its three families sits under −55 dB.
6. **Marimba: the strike is the darker part.** Change to `filterEnvAmount: 2.5, cutoff: 700, keyTrack: 0.8, filterAttack: 0.001, filterDecay: 0.06, filterSustain: 0`. The square two octaves up then lives only in the first 60 ms (not rendered).
7. **Square Lead: no delayed vibrato exists.** Change to `lfoRetrigger: 'note'`, so every Note starts its vibrato in tune at the centre of the swing. Say exactly that in the description.
8. **Levels.** No knob goes above Volume 100 %, so balancing means bringing the loud ones down. None of these was rendered.
   - Kick: rebuild it on 808 Boom's recipe, `mixOsc1: 0, osc2Waveform: 'sine', mixOsc2: 0.8, osc2EnvAmount: 24, mixSub: 1, subWaveform: 'sine', cutoff: 20000, resonance: 0, filterAttack: 0.001, filterDecay: 0.04, filterSustain: 0, ampAttack: 0.001, ampDecay: 0.35, ampSustain: 0, ampRelease: 0.15`. It should land near 808 Boom's −15.8 dBFS. Then lower Open Hat's `mixNoise` to 0.45.
   - Choir: `resonance: 0.35, cutoff: 1100`, a wider band.
   - Breathing Pad: `resonance: 0.3, lfoAmount: 0.5`, so the resonant peak does not grow 15 dB towards C6. Key Track cannot go negative, so it cannot hold the peak back.
   - Acid, Wobble, Screamer: `volume: 0.75`.
   - The systemic cause is the master's 1/√Voices headroom, which costs 9 dB on any single Note of an 8-Voice Preset. The owner decides whether to change it.
9. **Bass group register.** The owner decides, as a product change: let a Preset carry a keyboard octave, with the Bass group at C2. A Patch-only alternative is `osc1Octave: -1` with Osc 2's Octave lowered by one, but it changes how the Demo plays them.
10. **Sync-ish Lead.**
    - The problem: the name admits it misses. It plays at −27.6 dBFS, 11 dB under the Leads, and puts 80 % of its energy above 5 kHz on C6.
    - The fix: rename it "Nasal Lead" with `cutoff: 1300, resonance: 0.4, keyTrack: 0.6`. The real hard-sync lead is out of reach without sync.
11. **Pluck and Chorus Pluck at one Voice in a group of eight-Voice keys.** Change both to `voices: 6`. The Tutorial needs Pluck at one Voice, so keep it there and move it to the lessons, or change Chorus Pluck only.

## Presets to add (ranked; for each: name, category, what it shows, and its settings as Patch field values from Init)

All of these were rendered, with levels on C2 / C4 / C6 in dBFS (loudest 100 ms) and none peaking over 0.66. I judged them by measurement, not by ear.

1. **Riser** (Movement & Effects): Env Amount (Osc 2) on a slow Filter Attack, so pitch and brightness rise together. No Preset uses this. The Cutoff goes from 200 Hz to 782, 1788, 2953, 4004, 4815 and 5386 Hz across six seconds.
   - Levels: −22.7 / −21.5 / −16.7.
   - Settings: `mixOsc1: 0.5, mixOsc2: 0.6, osc2Detune: 12, osc2EnvAmount: 24, mixNoise: 0.5, filterMode: 'highpass', cutoff: 200, resonance: 0.4, filterEnvAmount: 5, filterAttack: 6, filterDecay: 0.5, filterSustain: 1, filterRelease: 0.5, ampAttack: 3, ampSustain: 1, ampRelease: 0.8, lfoWaveform: 'saw', lfoDestination: 'volume', lfoRate: 6, lfoAmount: 0.3`.
2. **Phase Pad** (Pads): a slowly swept notch on detuned saws, the phaser you can make without effects. The tip promises "phasey", but only a lesson shows it.
   - Levels: −26.5 / −24.3 / −25.6 (Pads median −23.8).
   - Settings: `voices: 8, osc2Detune: 8, mixOsc2: 0.9, filterMode: 'notch', cutoff: 1200, resonance: 0.55, lfoWaveform: 'triangle', lfoDestination: 'cutoff', lfoRate: 0.15, lfoAmount: 0.8, lfo2Destination: 'detune', lfo2Rate: 0.4, lfo2Amount: 0.2, ampAttack: 0.6, ampSustain: 0.9, ampRelease: 2`.
3. **Flute** (Leads): pink Noise as breath, with vibrato on LFO 2 and a light tremolo on LFO 1 at the same 5 Hz. It is the classic woodwind every factory bank has.
   - Levels: −18.7 / −18.7 / −18.6, flat across the keyboard.
   - Settings: `waveform: 'triangle', osc2Waveform: 'sine', osc2Octave: 1, mixOsc2: 0.15, mixNoise: 0.12, noiseColour: 'pink', cutoff: 1800, resonance: 0.1, keyTrack: 1, velocityCutoff: 0.4, filterEnvAmount: 0.8, filterAttack: 0.06, filterDecay: 0.3, filterSustain: 0.3, ampAttack: 0.08, ampDecay: 0.3, ampSustain: 0.85, ampRelease: 0.25, lfoDestination: 'volume', lfoRate: 5, lfoAmount: 0.08, lfo2Destination: 'pitch', lfo2Rate: 5, lfo2Amount: 0.08, glide: 0.04`.
4. **House Organ** (Keys & Organs): a percussive organ, with a sine Sub (the drawbar fix) and a Filter Envelope click.
   - Levels: −23.9 / −24.1 / −24.1.
   - Settings: `voices: 8, waveform: 'square', osc2Waveform: 'sine', osc2Octave: 1, mixOsc2: 0.6, mixSub: 0.5, subWaveform: 'sine', cutoff: 2500, resonance: 0.1, keyTrack: 0.5, velocityCutoff: 0.5, filterEnvAmount: 1.5, filterAttack: 0.001, filterDecay: 0.15, filterSustain: 0, ampAttack: 0.001, ampDecay: 0.6, ampSustain: 0.35, ampRelease: 0.12`.
5. **Sub Drop** (Movement & Effects): Env Amount over a 1.8 s Decay, so Osc 2 falls two octaves onto a sine Sub. It is 808 Boom slowed down into a downlifter.
   - Levels: −16.0 / −15.9 / −15.9.
   - Settings: `waveform: 'sine', mixOsc1: 0, osc2Waveform: 'sine', mixOsc2: 1, osc2Octave: 1, osc2EnvAmount: 24, mixSub: 0.6, subWaveform: 'sine', cutoff: 20000, resonance: 0, filterAttack: 0.001, filterDecay: 1.8, filterSustain: 0, ampAttack: 0.002, ampDecay: 2.5, ampSustain: 0, ampRelease: 1`.
6. **Rave Stab** (Stabs or Keys): a one-finger fifth stab over a Sub. A triad gives six pitches.
   - Levels: −27.0 / −26.7 / −25.3, in line with the 6- and 8-Voice keys.
   - Settings: `voices: 6, osc2Semitone: 7, osc2Detune: 6, mixOsc2: 0.8, mixSub: 0.5, filterSlope: 24, cutoff: 600, resonance: 0.45, velocityCutoff: 0.6, filterEnvAmount: 3.5, filterAttack: 0.001, filterDecay: 0.2, filterSustain: 0.1, ampAttack: 0.001, ampDecay: 0.35, ampSustain: 0, ampRelease: 0.15`.
7. **PWM Bass** (Bass): pulse-width modulation on a bass, Juno-style. Only pads and strings use PWM now.
   - Levels: −12.9 / −12.7 / −11.7 (Bass median −14.3).
   - Settings: `waveform: 'pulse', pulseWidth: 0.5, mixSub: 0.7, filterSlope: 24, cutoff: 350, resonance: 0.25, keyTrack: 0.5, velocityCutoff: 0.5, filterEnvAmount: 2.5, filterAttack: 0.002, filterDecay: 0.25, filterSustain: 0.2, lfoDestination: 'pulseWidth', lfoRate: 0.8, lfoAmount: 0.8, ampAttack: 0.002, ampSustain: 0.9, ampRelease: 0.12`.
8. **Pick Pluck** (Plucks): Noise through the snapping Filter Envelope gives a pick or hammer transient. No Preset uses Noise as a strike.
   - Levels: −29.3 / −28.7 / −26.5.
   - Settings: `voices: 6, osc2Waveform: 'square', osc2Octave: 1, osc2Detune: 5, mixOsc2: 0.35, mixNoise: 0.25, filterSlope: 24, cutoff: 350, resonance: 0.25, keyTrack: 0.8, velocityCutoff: 0.6, filterEnvAmount: 4, filterAttack: 0.001, filterDecay: 0.08, filterSustain: 0.15, filterRelease: 0.2, ampAttack: 0.001, ampDecay: 0.9, ampSustain: 0, ampRelease: 0.3`.
9. **Ride** (Drums): Ring of two squares a tritone and an octave apart, plus white Noise, through a high-pass. It is the 808 cymbal's recipe, and the kit has no cymbal.
   - Levels: −27.5 / −25.7 / −21.9.
   - Settings: `waveform: 'square', osc2Waveform: 'square', osc2Octave: 1, osc2Semitone: 6, osc2Detune: 17, mixOsc1: 0, mixRing: 0.7, mixNoise: 0.35, filterMode: 'highpass', cutoff: 5000, resonance: 0.2, ampAttack: 0.001, ampDecay: 1.6, ampSustain: 0, ampRelease: 1.2`.
10. **Analog Drift Lead** (Leads): a 0.13 Hz LFO on Pitch at 4 % Depth (±4 cents) plus LFO 2 on Detune, the "old analogue" drift. No Preset uses a sub-audible pitch drift.
    - Levels: −15.0 / −15.3 / −15.8.
    - Settings: `osc2Detune: 7, mixOsc2: 0.7, mixSub: 0.3, filterSlope: 24, cutoff: 1400, resonance: 0.35, keyTrack: 0.7, velocityCutoff: 0.5, filterEnvAmount: 1.5, filterAttack: 0.005, filterDecay: 0.6, filterSustain: 0.45, glide: 0.07, lfoDestination: 'pitch', lfoRate: 0.13, lfoAmount: 0.04, lfo2Destination: 'detune', lfo2Rate: 0.7, lfo2Amount: 0.15, ampAttack: 0.004, ampSustain: 0.9, ampRelease: 0.25`.

Missing classics these controls cannot make well: hard-sync lead, supersaw and hoover (no unison), and a real hand clap (an LFO tops out at 20 Hz, too slow for a clap's bursts).

## The ten best tricks (each with the Preset that shows it best, and whether a learner is told about it)

1. **The Filter Envelope throws Osc 2's pitch (Poly Mod) for a drum's pitch dive.** Shown by 808 Boom. Told: yes, in its description and the Env Amount tip.
2. **A self-oscillating Filter as the oscillator, struck by Noise and dropped by its Envelope.** Shown by Kick, and Tom. Told: yes.
3. **A sine Sub two octaves under a raised Osc 1, so one key covers three octaves.** Shown by Cathedral (measured: three families, nothing else above −55 dB except rung 12). Told: yes, there and in Sub Two Down.
4. **Two saws 18 cents apart over a Sub.** Shown by Reese. Told: yes.
5. **The Filter Envelope's Attack slower than the Amp's (0.12 against 0.04 s), so the Note blooms.** Shown by Brass Swell. Told: yes.
6. **Velocity → Cutoff on a dark, resonant mono line.** Shown by Acid (soft strike 0.71 as bright as hard). Told: in Velocity Bite only. Acid's description never mentions Velocity, and the electric pianos promise it without delivering (stuck point 2).
7. **Short Glide on a one-Voice line.** Shown by Acid (62 ms). Told: yes.
8. **Retriggered square LFO on Volume, so the gate lands on the beat.** Shown by Trance Gate (starts on, swing +1.00 at 0 s). Told: yes.
9. **Two LFOs at unrelated slow rates on two targets, so the motion never repeats.** Shown by Breathing Pad (0.17 and 0.11 Hz) and Deep Space (0.07 and 0.05 Hz). Told: yes ("never quite the same twice"), but Breathing Pad's level climbs 15 dB up the keyboard.
10. **Ring between sines a tritone apart with pink Noise.** Shown by Gong. Told: yes.

Tricks these controls allow, which no Preset shows yet (see Presets to add):
- Env Amount on a slow Filter Attack (Riser) and on a long Decay (Sub Drop).
- A notch sweep as a phaser (Phase Pad).
- Osc 2 alone with a square LFO at 1/12 Depth, for a trill on the Note (Trill rework).
- Noise as a strike transient (Pick Pluck).
- A sub-audible pitch drift (Analog Drift Lead).

## Three findings, ranked (each one line for the inbox)

1. Velocity → Cutoff is inaudible on seven of the Presets that set it (Electric Piano, Tremolo Keys, Poly Keys, Tine Piano, Felt Piano, FM Bell, Duo Lead): soft and hard strikes measure within 1 % in brightness, since their sines and triangles have nothing above the Cutoff, yet three descriptions promise a brighter strike.
2. A retriggered LFO starts mid-wave, so Key Sync's Note starts at 500 Hz, closes to 172 Hz, then jumps to 1.48 kHz at 0.34 s (the reverse of "opens bright and closes"), and Trill on C4 plays only C#4 and B3, never the Note pressed.
3. The collection is not levelled and has near-copies: 29 dB between Presets on C4 (Choir −36, Wobble −7 dBFS), the Kick 8 dB under the Open Hat, the Bass group in the tenor register on the default keys, and four Chords Presets near-copies of others (Chord Organ, whose square Sub also gives nine rungs where Organ's text says three, Poly Keys, Bell Chords, Chord Pad).
