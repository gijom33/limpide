# 108: Preset claims and levels

**What to build:** From the fourteen reviews of 1.16.0 (the inbox, 2026-10-30; reviews 13 and 14, [fact-checker](../reviews/2026-10-30/13-fact-checker.md), [ear stand-in](../reviews/2026-10-30/14-ear-stand-in.md)), both measured by rendering through the engine offline:

- **False claims:** Zap Pluck does the reverse of its words (a restarted falling saw LFO starts mid-ramp, so each Note starts at FM 50 %, is a pure sine at 1/6 s, then jumps to full FM in its tail). Kalimba's sidebands sit on the odd Harmonics, not every fourth, and its "tine, then a round tone" never happens. Tine Piano's "a hard one barks" and FM Bell's "bright, then mellow" are inaudible (their Filters sit above every partial). FM Sidebands' "either side of the Harmonic" folds onto the Harmonics; the Osc 1 Octave tip's "each cycle takes twice as long" doesn't show on the Scope (Cycle Lock), its body gets the gap between the Oscillators wrong, and the FM tip's "hundreds of times a second" is tens on low Notes. Nine in all, in review 13's report.
- **Level jumps:** Clang, Zap Tom and Gong play 7 to 8 dB over the other Drums (Zap Tom 15 dB over Tom); Robot 12 dB under its group (18 dB on C2); Ring Lead, Ring Sweep and Breathing Bell about 6.5 dB under theirs.

**Blocked by:** none ([124](./124-where-a-retriggered-lfo-starts.md), which held back Key Sync, Zap Pluck and Wobble, is done)

**Status:** done (2026-10-30). Review 13's nine false claims and review 15's hold when rendered, and every Preset plays within 3 dB of its group's median on C4, five named exceptions apart, by its own Volume and a few reworked sounds; an engine test checks both. Not yet heard by the owner: the changed Presets wait for the owner's ear before the release.

**Since then:** (2026-10-30) [125](./125-the-preset-collection.md) regrouped the Presets into sound families: the level test's groups are those families, Pluck sits in the Envelope lesson with no exception, Poly Keys and Chord Organ are gone, and Duo Lead and Cathedral changed Volume.

**Since then:** [124](./124-where-a-retriggered-lfo-starts.md) is built (2026-10-30): a retriggered LFO starts each Waveform where it classically starts. Key Sync's words now hold (rendered: the Cutoff opens at 1.5 kHz at the Note and closes to 170 Hz over two thirds of a second). Wobble's "from the top" was corrected there (a retriggered Sine starts at the centre, rising). Zap Pluck now starts at full FM and is nearly a pure sine by 0.3 s, as its words say, but its zap comes back every third of a second, about 30 dB down, which its words leave out: that, and its level, are this issue's.

## Agent Brief

**Category:** bug
**Summary:** Every Preset and tip review 13 found false says what it does, and no Preset jumps more than a few dB from its group when stepping through the list.

**Current behavior:** as listed above, each measured in reviews 13 and 14.

**Desired behavior:**
- **Each false claim** is made true: change the sound where the words describe the better sound (Zap Pluck starting at full FM and melting to a sine; Kalimba's tine fading to a round tone; Tine Piano barking when hit hard; FM Bell mellowing), or change the words where the sound is the point. The choice per Preset is the agent's, written in this issue's notes.
- **Levels:** each Preset's loudest 100 ms on C4 sits within 3 dB of its group's median (the ear stand-in's measure), unless its words say it is meant to stand out; Breathing Bell's four Voices are allowed for.
- Nothing reaches the limiter that did not before.

**Key interfaces:**
- The Preset list, its descriptions, and the tips review 13 names

**Acceptance criteria:**
- [x] Each of review 13's nine false claims, rendered again, is true
- [x] A test (or a recorded offline render) lists each changed Preset's level against its group, all within 3 dB
- [ ] Each changed Preset still has a Tutorial or Demo part that uses it working, where it has one
- [ ] The owner listens to the changed Presets before the release

**Out of scope:**
- FM's and Ring's fold-back at the top and FM's DC offset ([103](./103-fm-and-ring-fold-back-at-the-top.md))
- The older Presets that drive the limiter (Stutter, Laser, Growl and others): not new, left in review 14's report

## Added in triage (2026-10-30)

From review 15 ([report](../reviews/2026-10-30/15-sound-designer.md), "Presets to rework", items 1 and 4 to 8, 10 and 11), the same kind of finding, with settings the reviewer proposes and mostly rendered:

- **Velocity heard on the Cutoff:** Electric Piano, Tremolo Keys, Poly Keys, Tine Piano, Felt Piano, FM Bell and Duo Lead set Velocity on the Cutoff, but soft and hard strikes measure within 1 % in brightness (nothing above the Cutoff to open). Give the Filter something to open, or take the promise out of the words.
- **Trill** plays C#4 and B3 on C4, never the Note pressed. **Organ**'s square Sub gives nine rungs where its words say three (a sine Sub). **Marimba**'s strike is its darker part. **Square Lead**'s delayed vibrato does not exist. **Sync-ish Lead** is 11 dB under the Leads and very bright up high.
- **Levels:** Choir (−36 dBFS) to Wobble (−7 dBFS) on C4, the Kick 8 dB under the Open Hat, Breathing Pad's peak growing 15 dB towards C6, Acid, Wobble and Screamer loud. Levelled with each Preset's Volume, the master's room for Voices kept unless [125](./125-the-preset-collection.md) decides otherwise.
- **Pluck and Chorus Pluck** at one Voice in a group of 6- to 8-Voice keys: Chorus Pluck to 6 Voices; Pluck stays at one for its Tutorial.

Key Sync, Zap Pluck and Wobble wait on [124](./124-where-a-retriggered-lfo-starts.md), where the owner chose to fix the engine (2026-10-30): after it, their words are checked again. The collection's shape (categories, near-copies, additions) is 125's. Claude's call, open to the owner.

Acceptance, added:
- [x] Each Preset above, rendered again, does what its words say (soft and hard strikes measurably differ where Velocity is promised)
- [x] The level criterion covers every Preset, not only 1.16.0's

## How it was built

**The measure** (`src/patch/presets.browser.test.ts`, the engine project): each Preset rendered offline on C4 at Velocity 1, held for its Attack and a second, with the safety limiter's curve made straight (review 14's method), and its loudest 100 ms taken; one test per group holds each Preset within 3 dB of the group's median. Five sit apart on purpose, named in the test with how far and why, and still held within 3 dB of that: Thin Pulse (−8 dB), Ring Bell (−4.5) and Vowel (−12.5), whose words now say they play quietly; Breathing Bell (−5.5), its four Voices, as triage allowed; and Pluck (+9.5), one Voice for its Tutorial in a group of six- and eight-Voice keys, which [125](./125-the-preset-collection.md)'s regrouping settles. The same file renders the 31 reworked Presets on C2, C4, C6 and a chord, each under the limiter's knee (0.8), and checks every claim below. Before the change 30 of its 64 tests failed; after, all pass.

**The claims** (`src/patch/presets.ts`, `src/ui/tips.ts`), each made true by the sound or by the words, rendered:

1. **Zap Pluck** (sound): its falling saw slowed from 3 to 2 Hz. At A4, 87 % of the power off the carrier at the strike, under 10 % by 0.4 s, and the saw's next zap at 0.5 s comes 49 dB under the strike (at 3 Hz: 0.34 s, 31 to 34 dB under), so the words stand without mentioning it.
2. **Kalimba, its sidebands** (words): they sit on the odd Harmonics, the lower ones folded back; 2f and 4f stay under −40 dB.
3. **Kalimba, its tine** (sound): a 24 dB Filter at 450 Hz with full Key Track, opened three octaves by an Envelope that snaps shut (FM 0.12 to 0.2). 3f and 5f at −10 and −15 dB at the strike, −25 to −27 and −41 to −45 dB by 0.4 s, on A3, A4 and A5 (before, the same throughout).
4. **Tine Piano** (sound): FM 0.35 through a 24 dB Filter at 200 Hz that Velocity opens two octaves (Envelope Amount 0.5). On C4 the Harmonics above the first are 8.6 dB louder for a hard strike than a soft one (Velocity 1 against 0.35); before, 0.1 dB.
5. **FM Bell** (sound): the Filter at 400 Hz with full Key Track, opened three octaves at the strike and closing over 0.6 s. The 4.56f and 6.13f partials fall about 6 and 11 dB against the Note between the strike and 0.4 s, on A3, A4 and A5 (before, they rose by up to 1 dB).
6. **FM Sidebands** (words): the sidebands grow on the odd Harmonics above the Note, the lower ones folding back; 0.5f, 2f and 4f stay under −40 dB.
7. and 8. **Osc 1 Octave tip**: its `how` now sends the learner to the Spectrum, where the spikes and the Harmonic Markers move an octave down, and says why the Scope looks the same (Cycle Lock follows Osc 1); its body gives the gap as Osc 2's Octave less Osc 1's.
9. **FM tip**: Osc 2 swings Osc 1 at Osc 2's own frequency, hundreds of times a second mid-keyboard, tens on the lowest Notes; in tune or whole octaves away its partials land on the Harmonics and change their levels, elsewhere between them.

From review 15:

- **Velocity on the Cutoff:** Electric Piano, Tremolo Keys and Poly Keys get a quiet square an octave up through a 24 dB Filter at 200 Hz that Velocity opens two octaves (on C4 a hard strike's Harmonics above the first more than 3 dB louder than a soft one's, the test's bar; before, within 0.2 dB); Felt Piano's Filter goes to 300 Hz with Velocity 0.8 and its words say a harder Note is brighter; Tine Piano and FM Bell as above. Duo Lead is left: its words promise nothing.
- **Trill** (review 15's settings): Osc 2 alone a semitone up, a square LFO on Osc 2 Pitch at a twelfth of full Depth, so it plays the Note and the whole tone above; its claim that Cycle Lock follows each jump was dropped (Cycle Lock follows the Note, not an LFO).
- **Organ and Chord Organ:** a sine Sub, so the odd rungs a square Sub added fall under −40 dB.
- **Marimba** (review 15's settings): the Filter at 700 Hz opened by its Envelope for 60 ms; the strike is now brighter than the tone (Harmonics above the first −12 dB at the strike, −17 dB at 0.3 s; before −11 and −10).
- **Square Lead:** its vibrato retriggered; the words say each Note starts in tune at the centre of the swing, which the Modulation model shows (no LFO delay exists).
- **Sync-ish Lead:** the band-pass at 1 kHz, Resonance 0.1 and Key Track 60 % (from 1.8 kHz, 0.5 and 100 %): 7.8 dB louder, and less bright up high. Its name stays (review 15 proposed Nasal Lead): names are 125's.
- **Chorus Pluck:** six Voices. Pluck stays at one for its Tutorial.
- **Choir:** a low-pass at 1.1 kHz with Resonance 0.6 instead of a band-pass, 12.8 dB louder; its words say so. **Breathing Pad:** Resonance 0.3 and LFO 1 at half Depth, so its chord no longer reaches the limiter (it peaked at 1.10).

**The levels:** the master's room for Voices kept ([125](./125-the-preset-collection.md), decision 5); loud Presets brought down by their own Volume, quiet ones raised by their sound where Volume could not (it goes no higher than 100 %): Chip Lead's pulse 12 to 25 % (its words follow), Ring Lead's and Ring Sweep's Ring and Osc 1 up, Clav doubled by Osc 2 a few cents off (its words follow), Glass Pad's Ring up, Kick's Noise 0.4 to 0.6 and Tom's 0.3 to 0.8 (their words follow), Cowbell's Resonance 0.6 to 0.3, Wind's band-pass wider and higher (1.2 to 2 kHz, Resonance 0.7 to 0.1), Wah's Resonance 0.7 to 0.3, Robot's band-pass at 1 kHz with no Resonance, Ocean's Cutoff 600 to 1200 Hz, High-pass Buzz's 1.5 kHz to 800 Hz, Pluck Shape's Decay 0.25 to 0.7 s. Every changed level, in dBFS on C4, before (held 2.5 s) and after (as the test measures):

| Group (median before → after) | Preset: before → after (against the median after) |
|---|---|
| Shapes (−15.3 → −15.3) | Square on Square −11.4 → −14.5 (+0.8) |
| Intervals (−15.7 → −15.7) | Perfect Fifth −12.9 → −15.4 (+0.3); Major Third −12.8 → −15.3 (+0.4); Slow Beats −9.9 → −15.4 (+0.3) |
| Filter (−19.1 → −19.2) | Resonant Ring −11.8 → −18.7 (+0.6); Self-Oscillation −9.8 → −18.9 (+0.4); Vowel −30.9 → −32.8 (−13.5); High-pass Buzz −24.2 → −21.4 (−2.1); Key Track Demo −16.2 → −19.3 (−0.1) |
| Envelope (−19.7 → −19.7) | Pluck Shape −24.7 → −21.9 (−2.2) |
| LFO (−15.8 → −16.9) | Stepped −13.5 → −16.6 (+0.3); Ramp −13.6 → −16.7 (+0.2); Resonance Swell −15.4 → −16.3 (+0.6); Rolling Fifth −13.7 → −16.8 (+0.1); Chorus Drift −13.7 → −16.9 (+0.0); Key Sync −11.8 → −16.2 (+0.7) |
| Bass (−14.1 → −14.5) | Reese −11.9 → −13.8 (+0.7); Acid −9.2 → −13.7 (+0.8); Wobble −6.9 → −13.9 (+0.6); Double Wobble −7.4 → −14.4 (+0.1); Growl −6.7 → −14.6 (−0.1) |
| Leads (−17.7 → −17.8) | Lead −15.2 → −17.2 (+0.6); Square Lead −14.7 → −17.2 (+0.6); Chip Lead −22.4 → −18.7 (−0.9); Screamer −14.9 → −18.0 (−0.2); Portamento −16.0 → −17.5 (+0.3); Whistle −15.9 → −17.4 (+0.4); Sync-ish Lead −27.5 → −19.7 (−1.9); Ring Lead −22.3 → −17.8 (+0.0); Ring Sweep −22.9 → −18.8 (−1.0) |
| Keys & Plucks (−27.4 → −27.1) | Clav −34.0 → −29.5 (−2.4); Organ −22.6 → −26.6 (+0.5); Tremolo Keys −28.0 → −27.7 (−0.6); Marimba −27.6 → −27.3 (−0.2); Glass Keys −24.5 → −27.0 (+0.1); Chorus Pluck −14.7 → −27.0 (+0.1); Kalimba −27.7 → −28.2 (−1.1); Zap Pluck −29.3 → −29.0 (−1.9) |
| Pianos (−24.7 → −25.4) | Honky-Tonk −23.5 → −25.4 (+0.0); Tine Piano −27.4 → −27.9 (−2.5) |
| Pads (−23.1 → −23.1) | Choir −35.8 → −23.0 (+0.1); Sweep Pad −18.8 → −23.2 (−0.1); Dark Drone −8.4 → −22.3 (+0.8); Shimmer Pad −19.1 → −22.9 (+0.2); Breathing Pad −13.3 → −22.7 (+0.4); Glass Pad −28.1 → −25.3 (−2.2) |
| Chords (−24.3 → −24.8) | Poly Keys −27.4 → −27.0 (−2.2); Chord Organ −22.9 → −25.1 (−0.3); Strings −20.3 → −24.8 (+0.0); Duo Lead −18.5 → −24.5 (+0.3); Chorus Chords −21.7 → −24.8 (+0.0) |
| Drums (−23.7 → −25.6) | Kick −30.7 → −27.2 (−1.6); Snare −23.7 → −25.6 (+0.0); Open Hat −20.4 → −25.6 (+0.0); Tom −34.7 → −26.2 (−0.6); Cowbell −29.1 → −25.2 (+0.4); Clang −20.2 → −25.4 (+0.2); Zap Tom −20.0 → −25.2 (+0.4); Gong −20.8 → −25.2 (+0.4) |
| Movement & Effects (−16.1 → −22.2) | Glide Slide −14.3 → −22.2 (+0.0); Wind −33.9 → −23.6 (−1.4); Ocean −27.0 → −24.1 (−1.9); Trill −17.7 → −22.1 (+0.1); Wah −30.4 → −24.3 (−2.1); Helicopter −12.6 → −22.1 (+0.1); Laser −10.3 → −22.4 (−0.2); Siren −17.7 → −22.1 (+0.1); Talking Filter −19.1 → −22.2 (+0.0); Stutter −7.2 → −23.1 (−0.9); Pink Surf −16.3 → −22.3 (−0.1); FM Sweep −15.6 → −21.6 (+0.6); Robot −29.3 → −24.7 (−2.5); Clang Alarm −15.9 → −22.0 (+0.2); Machine Chatter −15.9 → −21.9 (+0.3); Out of Tune −15.7 → −21.7 (+0.5) |

**Judgement calls** (Claude's call, open to the owner):

1. **Groups meet the quiet, not the loud:** Volume can only lower, so where a quiet sound could not be raised far enough the rest of its group came down. Movement & Effects' median fell from −16.1 to −22.2 dBFS (Wind, Wah, Robot and Ocean, Noise and band-passes, raised by up to 10 dB still sit near −24), the Drums' from −23.7 to −25.6. The groups now differ more from each other than before (Bass −14.5, Keys & Plucks −27.1): the criterion is per group, and the master's room for Voices puts the 8-Voice groups lower.
2. **Acid and Wobble, two Tutorial Presets, got quieter**, so their Tutorials gain a last Step each: the Amp's Volume to 60 % and 45 %. Bass and Pluck keep their Volume.
3. **The Kick and the Tom keep their recipe** (more Noise, not review 15's rebuild on 808 Boom's): the Demo's Kick part turns its Filter Envelope, and the same Kick plays.
4. **The Demo's balance moves:** Acid, Strings and Sweep Pad play about 4.5 dB quieter, Wobble and Double Wobble 7, Self-Oscillation 9 (it was at the limiter's knee), the Kick 3.5 dB louder; Tremolo Keys and FM Bell sound different (a darker electric piano that brightens with Velocity, a bell that mellows).
5. **The older Presets that drove the limiter** (Stutter, Laser, Growl, Helicopter, Dark Drone, Double Wobble, Breathing Pad, Acid, Wobble, Screamer) are now at 20 to 75 % Volume for their level; review 14 left them out of scope, and their lower Volume only takes them further from it.

**Tests:** `src/patch/presets.browser.test.ts` (new); Acid's Tutorial Step count in `e2e/tutorial.spec.ts` (14 to 15), not run in this lane. The whole Vitest suite passes. Playwright specs this could affect, to run at the merge: `e2e/tutorial.spec.ts` (Acid's and Wobble's new last Step), `e2e/demo.spec.ts` (nine parts' Presets changed in level or sound), `e2e/patchSearch.spec.ts` (descriptions changed; none adds "bell"), `e2e/holdRhythm.spec.ts` (Pluck Shape's longer Decay still fades 22 dB between strikes 450 ms apart), `e2e/patches.spec.ts` (no Preset added or removed).

