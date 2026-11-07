# Persona review 15: the sound designer and Preset curator

Ran on 1.26.1 (the published site, "Version 1.26.1 · 7 Nov 2026" in About) on 2026-11-07.

**How it was done.** The live site in the app's Chromium pane at 1440 × 900: I opened the Patches panel, read its categories and all 142 pills, loaded Presets from the panel and stepped through them with the › arrow. I had no MIDI keyboard and no ears in this pass, so everything about sound comes from offline renders of the 1.26.1 source (`src/patch/presets.ts`, the same list the panel shows, Preset for Preset) through `createSynthEngine`, as review 14 renders: an OfflineAudioContext at 48 kHz, the safety limiter's curve made straight, from a temporary engine test that has since been deleted. Each Preset was played on its home Note (C2 for the Bass group, which now starts the keys there; C4 for the rest), at Velocity 1 and 0.3, held through its Attack and released; also two octaves below and above (a short hold), a C–E–G chord where it has more than one Voice, and its home Note three octaves up at 192 kHz for fold-back. From these:

- **Level:** RMS of the loudest 100 ms, in dBFS, and the peak.
- **Brightness:** spectral centroid 100 ms into the Note.
- **Time:** time to the loudest moment, tail to −60 dB after release, the biggest sample step in the first 3 ms (a click).
- **Census:** a pass over the Patches for review 15's near-copy distance (the one `presets.test.ts` uses) and for which tricks each sound Preset uses.

Six candidate Presets and five reworks were rendered the same way. Anything marked "not rendered" is a calculation or a judgement.

## Since the last run (1.16.0, 2026-10-30)

Most of the last report was built, and it shows in the numbers.

- **The families:** Chords is gone; Keys & Organs, Plucks & Mallets, and Strings, Brass & Choir exist; Movement & Effects opens on Laser. The five near-copies were cut, and all ten proposed Presets are in, each within 3 dB of its family on C4.
- **The Basses start on C2.** Sub Bass now plays at 65 Hz, not 262.
- **Reworks:**
  - Trill now sits on the Note and the tone above.
  - Organ's Sub is a sine.
  - Marimba's strike is the bright part.
  - Square Lead's vibrato is retriggered, and its words say so.
  - Retriggered LFOs start each wave where it classically starts (issue 124).
- **Velocity:** it now brightens the strike on six of the seven Presets where it could not be heard. Soft-over-hard brightness: Tine Piano 0.61, FM Bell 0.79, Electric Piano and Tremolo Keys 0.86, Duo Lead 0.93. It was 0.99 to 1.01 on all seven. Felt Piano is the one left at 0.99.
- **Levels:** across the whole collection on its home Note they now span 19.2 dB (Vowel −32.1 to PWM Bass −12.9), down from 29 dB. The sound families alone span 16.6 dB. Group medians span 10.7 dB, down from 12.7.
  - Choir went from −36.0 to −23.0, inside its family.
  - The Drums are levelled within 2 dB of each other: Kick −27.2, Open Hat −25.6.
- **Not changed:**
  - Vowel still climbs 18 dB up the keyboard, and Breathing Pad 13.5 dB, down from 15.4.
  - Sync-ish Lead keeps its name.
  - The kit as a whole sits about 9 dB under the Basses: the Kick is 11.7 dB under 808 Boom.
  - A Preset's description shows only when it is picked in the panel. Stepping with ‹ › or loading by Program Change shows no line (`PatchBar.tsx`, "Load a sound picked in the panel"). So a curator auditioning the bank by arrows, or from a controller, still meets the sounds without their words.

## First impression

A teaching bank with an instrument bank behind it, now clearly signposted: six lesson groups (48 Presets, Init included) then nine sound families (94). The categories read the way a factory bank's do, and the panel lets Tutorials sit beside the Preset they build, which no commercial bank does. The names are plain and mostly evocative (Reese, 808 Boom, Deep Space, Trance Gate, Cathedral, Sub Drop). A designer's eye goes at once to the vocabulary: three "Glass", four "Zap"/Laser, two "Growl", two "Clang", three "Chorus". And to the group sizes: 17 Movement & Effects and 14 each of Bass and Leads, against 4 Pianos and 5 Strings, Brass & Choir.

## What they tried, in order

1. **Read the panel.** All 142 pills in 15 categories plus Tutorials and My Patches; the search box; a Tutorial pill sitting before its Preset in each family.
2. **Loaded Reese from the panel.** The about line showed under the name.
3. **Stepped with ›** (Reese → Acid → Rubber). No about line appeared; the name changed and the keys stayed on C2 within the Basses.
4. **Rendered every Preset** (method above), then sorted the results by group, by tilt across the keyboard and by Velocity response.
5. **Ran the census** of near-copies and tricks over the Patches.
6. **Rendered candidates and reworks:**
   - additions for what is missing: Harpsichord, Accordion, Clap, Downlifter, Steel Drum, Scoop Brass;
   - fixes for the four Presets whose level swings across the keyboard: Vowel, Breathing Pad, Two Speeds, Sweep Pad;
   - Felt Piano's Velocity;
   - the Kick against 808 Boom, and Choir.

## What worked

- **Clean playing everywhere.** No Preset clicks at its onset: the largest first-3 ms step is 0.02 of the peak. No Preset hangs: every tail ends within its Release, except the ones that are meant to ring past the render (Long Tail, Dark Drone, Deep Space, Glass Shimmer, Gong). No FM or Ring sound folds back: energy past 24 kHz at 192 kHz is −65 dB or less for every FM and Ring Preset without Noise (FM Bass −131, Ring Lead −129, Clang Alarm −72, Poly Mod Zap −65); Ride's and Gong's high energy is their Noise, not fold-back.
- **Levels within each family are now a factory bank's.**
  - Bass: −12.9 to −19.8.
  - Leads: −17.1 to −19.8.
  - Keys & Organs: −25.8 to −29.5.
  - Plucks & Mallets: −26.1 to −29.0.
  - Pads: −22.3 to −25.3.
  - Drums: −25.2 to −27.2.
  - Movement & Effects: −21.2 to −24.8.

  Stepping through a family with the arrows no longer jumps.
- **Velocity works where it is the point.**

  | Preset | Brightness, soft over hard |
  |---|---|
  | Snare | 0.57 |
  | Velocity Bite | 0.58 |
  | Tine Piano | 0.61 |
  | Clav | 0.62 |
  | Pluck Bass | 0.67 |
  | Acid | 0.70 |
  | Screamer | 0.71 |
  | FM Bell | 0.79 |

  Tine Piano's soft Note is also 14.5 dB down, against 10.5 dB elsewhere, so it really is "a mellow tine".
- **Keyboard spread is flat where Key Track is set.** Flute, Organ, Glass Keys, FM Bell, Kalimba, Harp and Vibes are each within 1 dB from C2 to C6. Most Basses are within 2 dB from C2 to C4; Acid climbs 6 dB and Wobble 3 dB, into their resonance.
- **The new ten earned their place.** Riser, Sub Drop, Phase Pad, Pick Pluck and Ride each show a trick no other Preset shows, and each sits in its family's level.

## Where they got stuck

1. **Four Presets swing 12 to 18 dB across the keyboard.** From C2 to C6, Note for Note, a player hears one of these jump or vanish:
   - **Vowel:** −39.4 → −21.3 dBFS. It is also 12.9 dB under its Filter siblings on C4 (−32.1 against a median of −19.2). That is on purpose: `presets.browser.test.ts` lists it APART by −12.5 dB, "kept as quiet as it was before the band-pass was made up". A lesson that is the quietest sound in the bank, and silent at C2, does not teach the formant.
   - **Breathing Pad:** −28.0 → −14.5. Its resonant peak sits still while the Notes climb into it.
   - **Two Speeds:** −19.2 → −34.8. Cutoff 400 Hz, no Key Track and Sustain 0 on the Filter Envelope, so a C6 is gone once the snap is over.
   - **Sweep Pad:** −27.7 on C2, −40.0 on C6 in its first second. It is a sweep that needs its four seconds, but a high Note sounds like nothing for a second.
2. **The drum kit sits 9 dB under the Basses, though every drum has one Voice.** The Drums' median is −25.6 dBFS, the Bass group's −16.4; the Kick is −27.2 and 808 Boom −15.5. The master's room for Voices (kept by issue 125, decision 5) explains Keys, Pianos and Plucks sitting under the Leads. It does not explain the Drums: they have one Voice and the same room as a Bass, and were levelled down to the Keys' level. A visitor who plays the Kick after a Bass hears a weak kick. Most of the Kick's energy is at 55 Hz, which a laptop barely plays, so the gap is wider by ear.
3. **Felt Piano still promises a brighter hard Note.** Its words say "Velocity opens the Filter a little: a harder Note is brighter". Its brightness, soft over hard, is 0.99 (262 against 265 Hz): a triangle under a 300 Hz Cutoff has nothing above it to open. It is the last of the seven from the 1.16.0 run.
4. **The description is missing when stepping.** See "Since the last run". It is a decision of issue 153, so I note it rather than rank it.
5. **Acid slides but never ties.** Glide 0.06 with Legato off: every Note glides and every Note re-strikes the Filter Envelope. The 303 line is made by the tie: an overlapped Note slides without a new blip. Legato, the switch built for exactly that (issue 119), is used by one Preset, Portamento.

## Would they

- **Use it to teach sound design: yes, more than last time.** The lessons are well ordered and level, and the Tutorials sit beside the sounds they build. Vowel and Two Speeds are the two lessons that misbehave up the keyboard.
- **Recommend it to a sound designer: yes, as a sketchpad.** 808 Boom, Sub Drop, Reese, Cathedral, Deep Space, Riser and Phase Pad are the ones I would play to a colleague.
- **Ship these Presets in a product: nearly.** Within each family the bank is levelled like a factory bank. What is left: the kit's level against the Basses, four keyboard swings, one false Velocity claim, and some vocabulary. About 135 of the 142 are shippable as they are.

## Preset by Preset (the sound families; the lessons are judged as lessons)

Levels are on the home Note in dBFS. "Tilt" is the C2 → C6 change (C0 → C4 for the Basses, where the low figure is meaningless).

| Family (median) | Best | Rework or watch |
|---|---|---|
| Bass (−16.4) | 808 Boom (−15.5, flat), Reese (−14.0), FM Bass, PWM Bass | Acid: Legato on (point 5 above). Growl and FM Growl: two names, two unrelated sounds |
| Leads (−17.9) | Analog Drift Lead, Ring Lead, Portamento, Flute (flat ±0.1 dB) | Sync-ish Lead: still apologises in its name; "Nasal Lead". Chip Lead and Whistle are 1.39 apart, the closest pair among the Leads: fine, as one is a pulse and one a sine |
| Keys & Organs (−26.7) | Cathedral, House Organ, Electric Piano | Rave Stab is a stab, not a key; it is filed where it least jars. Clav is the family's quietest (−29.5) |
| Pianos (−25.0) | Piano, Tine Piano | Felt Piano: Velocity (point 3). Only four; Honky-Tonk is Piano detuned (distance 0.54), so the family is really three |
| Plucks & Mallets (−27.1) | Kalimba, FM Bell, Pick Pluck | Marimba and Toy Piano are 1.48 apart, the same sine plus a square two octaves up |
| Pads (−23.7) | Deep Space, Phase Pad, Trance Gate, Glass Pad | Breathing Pad and Sweep Pad: keyboard swing (point 1). Dark Drone is the one Pad with one Voice |
| Strings, Brass & Choir (−23.9) | Brass Swell, PWM Strings, Choir (now in place) | Five Presets for three families; no solo string, no brass stab |
| Drums (−25.6) | Ride, Zap Tom, Gong | The whole kit's level (point 2). Cowbell climbs 9.2 dB from C2 to C6; a cowbell played across the keys is unusual, so it is acceptable |
| Movement & Effects (−22.1) | Laser, Riser, Sub Drop, Stutter | Ocean and Pink Surf (2.32 apart): both Noise through a low-pass swept at 0.12 Hz, both "waves" |

**Near-copies.** The pairs under 0.6 are the drum and piano variants Hi-hat ~ Open Hat (0.42), Piano ~ Honky-Tonk and Kick ~ Tom (0.54). As kit pieces and as a detuned variant, those are what a factory bank does. The next pairs are all over 1.3. By ear, the closest pairs left are:
- Ocean ~ Pink Surf;
- Vowel ~ Wah (2.11 apart, both band-pass saws rocked by an LFO);
- Twelfth Bell ~ Glass Keys (1.76; the same 3:1 sines, a lesson and a sound).

**Vocabulary.** Three Glass (Glass Keys, Glass Pad, Glass Shimmer), four zaps (Poly Mod Zap, Zap Pluck, Zap Tom, Laser), Growl and FM Growl, Clang and Clang Alarm, three Chorus (Chorus Drift, Chorus Pluck, Chorus Chords). A bank this size can afford it, but a renamed Glass Shimmer ("Prism") and Clang Alarm ("Alarm Bell") would read better.

## Presets to rework (ranked; settings as Patch field values)

1. **Vowel** (rendered): `volume: 0.3, resonance: 0.6, keyTrack: 0.5`. It plays −26.5 / −23.2 / −19.5 on C2 / C4 / C6, against −39.0 / −32.1 / −21.3 now: a 7 dB climb instead of 18, peak 0.18. The formant then follows the Note half way. That is less a vowel and more a heard one; say so in the words, or keep `keyTrack: 0` with `volume: 0.25, resonance: 0.6` (−31.0 / −24.8 / −15.6). The APART line in `presets.browser.test.ts` and issue 231's "as before" check would change with it.
2. **Breathing Pad** (rendered): `keyTrack: 0.6, volume: 0.5`. It plays −27.4 / −23.7 / −22.4 against −28.1 / −22.8 / −17.2: a 5 dB climb instead of 11 at a 1.2 s hold. My first render, held through its 1.2 s Attack, gave 13.5 dB.
3. **Two Speeds** (rendered): `keyTrack: 0.8`. It plays −18.9 / −19.0 / −18.7, flat, against a 15.6 dB fall.
4. **Felt Piano:** the words. "Velocity makes a harder Note louder, hardly brighter: felt hides the strike" is true as it is. To make it brighten, `osc2Waveform: 'square', osc2Octave: 1, osc2Detune: 0, mixOsc2: 0.25, cutoff: 250, velocityCutoff: 1` gives 0.92 soft over hard (296 against 273 Hz) at −27.2 on C4 (rendered). That is still subtle.
5. **The Drums' level** (not rendered): bring the kit up to the Basses, since it has a Bass's room. The Kick already plays at full Volume, so it cannot rise by Volume alone. Rebuild it on 808 Boom's recipe, as the last run proposed, or raise its `mixNoise` to 1. Then lift the rest of the kit to match. The Demo starts on the Kick, so its first bar changes.
6. **Acid** (not rendered): `legato: 'on'`, and the words "overlap two Notes to slide without a new strike, the 303's tie". The Demo plays Acid: check that its phrase does not overlap Notes it means to re-strike.
7. **Sweep Pad** (not rendered): `keyTrack: 0.5`, so a high Note is heard from the start. The sweep itself is unchanged.

## Presets to add (for v2, by the scope rule; each rendered on C2 / C4 / C6, dBFS)

| Name and family | What it shows | Level | Settings from Init |
|---|---|---|---|
| Clap (Drums) | Noise through a band-pass, short: the kit has no clap. Without bursts (an LFO stops at 20 Hz) it is a snap more than a clap; say so | −22.0 flat, peak 0.42; with `volume: 0.7`, about −25.1, the kit's level (calculated) | `mixOsc1: 0, mixNoise: 1, filterMode: 'bandpass', cutoff: 1200, resonance: 0.35, velocityCutoff: 0.4, ampAttack: 0.001, ampDecay: 0.18, ampSustain: 0, ampRelease: 0.12` |
| Downlifter (Movement & Effects) | Noise down a 24 dB Filter over three seconds: Riser's opposite, a classic transition | −20.1 flat; `volume: 0.8` lands on about −22.0, the family's median (calculated) | `mixOsc1: 0, mixNoise: 1, filterSlope: 24, cutoff: 150, resonance: 0.45, filterEnvAmount: 5, filterAttack: 0.001, filterDecay: 3, filterSustain: 0, ampAttack: 0.001, ampDecay: 3.5, ampSustain: 0, ampRelease: 1` |
| Accordion (Keys & Organs) | Two pulses 14 cents apart (the musette's beating reeds) with a light tremolo | −22.3 / −21.9 / −24.1; `volume: 0.6` lands on about −26.3 on C4 (calculated) | `voices: 8, waveform: 'pulse', pulseWidth: 0.3, osc2Waveform: 'pulse', osc2PulseWidth: 0.3, osc2Detune: 14, mixOsc2: 0.9, cutoff: 2200, resonance: 0.1, keyTrack: 0.5, ampAttack: 0.04, ampSustain: 1, ampRelease: 0.12, lfoDestination: 'volume', lfoRate: 6, lfoAmount: 0.12` |
| Scoop Brass (Strings, Brass & Choir) | A negative Osc 2 Env Amount: Osc 2 starts three semitones flat and scoops up into the Note as the Filter opens. No Preset uses a negative Env Amount on Osc 2 | −25.6 / −25.7 / −25.8 | `voices: 6, osc2Detune: 6, mixOsc2: 0.7, osc2EnvAmount: -3, cutoff: 700, resonance: 0.1, filterSlope: 24, filterEnvAmount: 2.5, filterAttack: 0.08, filterDecay: 0.5, filterSustain: 0.6, filterRelease: 0.3, velocityCutoff: 0.5, ampAttack: 0.05, ampDecay: 0.3, ampSustain: 0.85, ampRelease: 0.35` |
| Harpsichord (Keys & Organs) | A narrow pulse and a saw an octave up through a high-pass: plucked and thin | −31.0 / −30.4 / −29.1, 4 dB under its family even at full Volume; needs a brighter or louder source (a saw for Osc 1, not rendered) | `voices: 8, waveform: 'pulse', pulseWidth: 0.2, osc2Waveform: 'saw', osc2Octave: 1, osc2Detune: 3, mixOsc2: 0.8, filterMode: 'highpass', cutoff: 90, resonance: 0.1, ampAttack: 0.001, ampDecay: 1.4, ampSustain: 0, ampRelease: 0.25` |

Rendered but not proposed: a Steel Drum (sines 2:1 with a little FM, −24.1 flat), which is too close to Kalimba to add.

Still out of reach by the Out of Scope list: hard sync, unison (supersaw, hoover), a real clap's bursts.

## The tricks: used, and never used

The census of the 94 sound Presets:
- Key Track: 36.
- Velocity → Cutoff: 20.
- Noise: 18; LFO 2: 18.
- FM: 11.
- Glide: 9; retrigger: 8; LFO on Detune: 8; Ring: 8; sine Sub: 8.
- Poly Mod (Osc 2 Env Amount): 7.
- LFO on FM: 5; LFO on Osc 2 Pitch: 5; Sync: 5.

Never or once in a sound:
- a negative Osc 2 Env Amount (none: Scoop Brass above);
- a negative Filter Env Amount (only the Reverse Filter lesson);
- Legato (only Portamento: Acid above);
- Velocity on a pad (none);
- the notch (only Phase Pad);
- Osc 1's Octave (Split Octave Bass and Cathedral);
- the Sub two octaves down (Cathedral and Deep Space).

## The ten best tricks, each with the Preset that shows it

1. **The Filter Envelope throws Osc 2's pitch for a drum's dive:** 808 Boom (−15.5 dBFS, flat across the keys). Told in its words and the Env Amount tip.
2. **The same, slowed over 1.8 s, as a downlifter:** Sub Drop.
3. **Env Amount on a six-second Filter Attack, so pitch and brightness rise together:** Riser.
4. **A sine Sub two octaves under a raised Osc 1, three families of Harmonics:** Cathedral.
5. **Two saws 18 cents apart over a Sub:** Reese.
6. **A self-oscillating Filter struck by Noise as the drum's oscillator:** Kick and Tom.
7. **A notch swept slowly as a phaser without effects:** Phase Pad.
8. **Velocity on the Cutoff of a dark FM tone, so the strike barks:** Tine Piano (0.61 soft over hard).
9. **A retriggered square LFO on Volume, synced, so the gate lands on the beat:** Trance Gate.
10. **Two slow LFOs at unrelated rates on two targets:** Deep Space (0.07 and 0.05 Hz), so the drone never repeats.

## Three findings, ranked (each one line for the inbox)

1. Four Presets swing 12 to 18 dB from C2 to C6: Vowel (−39.4 → −21.3 dBFS, and 12.9 dB under its Filter siblings on C4, held there by the test's APART line), Breathing Pad (−28.0 → −14.5), Two Speeds (−19.2 → −34.8) and Sweep Pad (−40 on C6 in its first second); rendered fixes: Vowel `volume 0.3, resonance 0.6, keyTrack 0.5`, Breathing Pad `keyTrack 0.6, volume 0.5`, Two Speeds `keyTrack 0.8`.
2. The drum kit sits 9 dB under the Basses though every drum has one Voice (Drums median −25.6, Bass −16.4 dBFS on the home Note; Kick −27.2 against 808 Boom −15.5), so the master's room for Voices does not explain it, and the Kick, at full Volume already, needs rebuilding to rise.
3. Felt Piano still says a harder Note is brighter, but soft over hard measures 0.99 (262 against 265 Hz), the last of the seven unheard Velocity claims of the 1.16.0 review; reword it, or give it a square an octave up (`cutoff 250, velocityCutoff 1`, 0.92).
