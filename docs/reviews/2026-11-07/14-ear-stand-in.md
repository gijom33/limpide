# Review 14: the ear stand-in

Rendered offline in Chromium through `createSynthEngine` (OfflineAudioContext, 48 kHz, velocity 1, 120 BPM), in Vitest's browser mode with the engine project's set-up, with the safety limiter's curve swapped for a straight line so the numbers are what reaches it. This time every factory Preset, all 142 of 1.26.2 (`src/patch/presets.ts`), not one release's new ones, so the table is a baseline for issue 258. Each Preset was played on C2, C4 and C6 (MIDI 36, 60, 84), held for its Attack and 1.2 s, then released and rendered through its Release and half a second more (at most 6.5 s); plus a three-Note chord (C4 E4 G4, struck 10 ms apart) for Presets with more than one Voice, or a legato change C4 to G4 halfway through the hold (`pitchChange`) for one-Voice Presets. To find what four Notes miss (Growl's lesson of 2026-11-02), every semitone from C2 to C7 (61 Notes) was rendered twice: held for the Attack and 0.6 s for its level, and for the Attack and 4 s for its peak, with a four-Note chord (C4 E4 G4 B4) held as long on the Presets with Voices. Fold-back was measured on the 24 FM and Ring Presets (FM or Ring up, or an LFO on FM) on C6 and C7 at 192 kHz with the Noise off, as before; the other Presets have no stage that can fold (the browser band-limits the Oscillators, the Filter is linear). The render file was temporary and is deleted.

How to read the table. **Peak** is the largest sample in the C2, C4, C6, chord or legato and C7 renders; the limiter bends anything above 0.8, and **Limiter** names every Note of the 61-semitone scan (and the long chord) that passes it. **C2, C4, C6** are the loudest 100 ms of each Note, in dBFS, and **C2→C6** the change between the two ends, in dB. **Chord or legato** is the loudest 100 ms of that render. **vs group** compares C4 with the median of the rest of its group. **Worst click** is the largest sample-to-sample bend (second difference) in the 5 ms after a Note starts (25 ms for the chord), is released or changes pitch, as a multiple of the largest bend in the steady sound beside it (the 100 ms that follow a start or change, the 100 ms before a release). Bends under 0.001 are left out (— when every one is); from ×10 the bend and the event are given. **> 5 kHz** is the largest share of energy above 5 kHz while the Gate is open, across C2, C4 and C6. **DC** is the worst mean level while the Gate is open, over whole cycles of the Note, in dBFS. **Fold-back** is what lies past 24 kHz against what lies under it at 192 kHz, on C6 and C7, in dB: what a 48 kHz device would fold back (issue 103's line is −60). No render holds a NaN or an Infinity, and every one falls to −76 dB or lower after its Release.

Group medians on C4: Start −20.3, Shapes −15.2, Intervals −15.7, Filter −19.2, Envelope −19.6, LFO −16.9, Bass −14.4, Leads −17.9, Keys & Organs −26.7, Pianos −25.1, Plucks & Mallets −27.1, Pads −23.7, Strings, Brass & Choir −23.9, Drums −25.6, Movement & Effects −22.1 dBFS. On C4 the whole collection spans 19.1 dB, Vowel −31.7 to PWM Bass −12.6.

## Findings, ranked

1. **Resonance Swell passes the limiter, the one Preset that does.** Its triangle LFO swings the Resonance around 0.5 at Depth 0.9 every two seconds, at a Cutoff of 1.2 kHz with no Key Track. Where a Harmonic sits on the Cutoff, the peak swells over it: 1.48 on D6 (1,175 Hz, the fundamental itself), 1.11 on D#6 and 0.90 on D5 (its second Harmonic), each 2.5 s into the held Note, when the LFO is at its top. D6's loudest 100 ms is 0 dBFS, 16 dB over its C4. G4, C#6 and D4 reach 0.62 to 0.72. Its level jumps up to 6.6 dB between neighbouring semitones (D#6 to E6), so playing up the keys, some Notes jump out. The four Notes of the table miss it (0.56 at most): only the scan finds it. No other Preset reaches 0.8 on any semitone, in any chord, held 4 s: Growl is at 0.72 (B4), under the knee since issue 195, and Screamer at 0.70 (D2).
2. **Trance Gate clicks on a strummed chord.** Each Note joining a chord already sounding bends 0.06 to 0.17, about 4 ms after its start, where the gate's own switches bend 0.024 at most: three to seven times as sharp, whether the Notes come 5, 10, 20 or 40 ms apart (0.10, 0.15, 0.17, 0.11). Two Notes 100 ms apart bend 0.04; a chord struck at once bends no more than the gate does. Its words are "a held chord": a chord from a keyboard is never struck at once. Every other Preset's chord starts within ×4 of its steady sound, but Pick Pluck's (×10, its pick's Noise, as its words say).
3. **Ring Lead folds back on C6, and only there.** Its Ring keeps each Note's top partial just under 24 kHz (issue 103), and LFO 2's vibrato swings it past: −57 dB at 192 kHz half a second into the Note, just over issue 103's −60 line. B5, C#6 and D6 measure −116 or lower, and C6 with the vibrato off −117. Every other FM and Ring Preset stays at −65 or under: Clang Alarm −70 (it was −13 on C7 on 2026-10-30), Breathing Bell −75, FM Bell −77, Zap Pluck −78, Machine Chatter −80. Poly Mod Zap's −65 is the saws' own Harmonics past 24 kHz, which a 48 kHz device never plays: it measures the same with FM off.
4. **Zap Pluck is harsh on C6.** 72 % of its energy lies above 5 kHz on C6, against 0 % on C2 and C4 and at most 5.4 % in the rest of Plucks & Mallets. Its FM sidebands climb with the Note while its Cutoff stays at 8 kHz, and its strike is mostly sidebands. The next harshest pitched sounds are by design or in their family's range: Screamer 33 % (C4), Sub Drop 32 % (C6, Osc 2 thrown two octaves up), Breathing Bell 29 %, Glass Shimmer 26 %; the Hats, Ride, Riser and Wind are Noise.
5. **Level outliers within a group: none new.** Every Preset sits within 3 dB of the rest of its group on C4, but the four kept apart on purpose (Thin Pulse −8.2, Vowel −12.5, Breathing Bell −5.1, Ring Bell −4.7, as `presets.browser.test.ts` lists them) and Tine Piano at −3.1. Ring Lead, Ring Sweep, Robot and the three loud Drums of 2026-10-30 are now level with their groups.
6. **Across the keyboard, beyond issue 258's four.** From C2 to C6:
   - Three Filter lessons with a fixed Cutoff: High-pass Buzz climbs 12.8 dB (−27.3 → −14.5: the high-pass at 800 Hz takes most of a C2), 12 vs 24 falls 8.2 dB (−18.9 → −27.2, and −39.9 on C7), and Resonant Ring rises 6.7 dB, but 16 dB around E6 and F6 (−7 dBFS), where its fundamental meets the 1.4 kHz resonant Cutoff, peaking at 0.64. As with Two Speeds, the swing is the lesson's mechanism; whether it should be heard so strongly is 258's question.
   - Seven sounds swing 6.5 to 9 dB: Cowbell +9.1 (review 15 found it acceptable), Dark Drone +8.2, Talking Filter +7.9, Wah +7.5, Deep Sweep +7.1, Laser +6.8, and Clav +6.5, whose C2 plays at −36.1 dBFS through its 300 Hz high-pass.
   - The top octave: from C6 to C7 (the short-hold scan), Sweep Pad loses 33 dB, Breathing Pad 28 and Dark Drone 28, so the three Pads play at −54, −43 and −44 dBFS on C7; a fixed Cutoff without Key Track leaves little of a C7. Sweep Pad and Breathing Pad are 258's; Dark Drone is not.

Issue 258's own, measured for its baseline (not re-reported): Vowel −38.9 / −31.7 / −21.3 (+17.6 dB); Breathing Pad −28.0 / −22.7 / −14.5 (+13.5); Two Speeds −19.2 / −19.0 / −34.8 (−15.6); Sweep Pad −27.7 / −23.2 / −20.0 (+7.7 over its loudest 100 ms in 1.7 s, held through its Attack; 258's −40 on C6 is its first second, and the scan's short hold gives −21 on C6 and −54 on C7). The Drums' median is −25.6 on C4 and −26.3 on C2, the Basses' −14.4 and −16.4; the Kick plays −27.2 on every Note, 808 Boom −15.5 on C2. Felt Piano's Velocity needs a soft Note and was not measured here (velocity 1 only).

Not problems:
- **Clicks on low starts.** Fourteen Presets start a C2 at ×12 to ×102 of their steady sound, all bending only 0.001 to 0.008: Kalimba ×102, 808 Boom ×97 (the click its words promise), Vibes ×92, Tom ×58, Sub Bass ×56, FM Bass ×54 (×56 on 2026-10-30), Glass Keys ×46, and smaller. A fast Attack on a low sine against a C2's tiny bends; nothing comes near a click in absolute terms. No release bends more than ×2 (Growl's C6, ×1.6), and no legato change more than ×4 (Pure Sine, 0.002).
- **DC.** The worst offset is FM Ladder's −53 dBFS (−18 on 2026-10-30, before issue 103), then Ring Sweep −54, FM Growl −57, PWM Bass and Stutter −58.
- **Stutter and Helicopter** jump 6 to 7.5 dB between neighbouring semitones in the short-hold scan: their square LFOs chop the sound, and 0.6 s catches different chops. Held through the four renders they are level (Stutter −23.1 / −21.2 / −19.6).

No fix was made: this review measures.

## The table

| Preset | Group | Voices | Peak | C2 | C4 | C6 | C2→C6 | Chord or legato | vs group | Limiter | Worst click | > 5 kHz | DC | Fold-back C6 / C7 | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Init | Start | 1 | 0.27 | −20.4 | −20.3 | −20.0 | +0.4 | legato −20.3 | — | no | ×1 | 0.1 % | −72 | — | fine |
| Pure Sine | Shapes | 1 | 0.23 | −15.9 | −15.9 | −16.0 | 0.0 | legato −15.9 | −0.9 | no | ×4 | 0.0 % | −64 | — | fine |
| Soft Triangle | Shapes | 1 | 0.22 | −17.7 | −17.7 | −17.7 | 0.0 | legato −17.7 | −2.6 | no | ×1 | 0.2 % | −66 | — | fine |
| Hollow Square | Shapes | 1 | 0.24 | −14.4 | −14.4 | −14.5 | −0.1 | legato −14.4 | +0.9 | no | ×1 | 7.7 % | −62 | — | fine |
| Thin Pulse | Shapes | 1 | 0.24 | −23.0 | −23.3 | −23.7 | −0.7 | legato −23.3 | −8.2 | no | ×1 | 23 % (C6) | −85 | — | fine (apart by design) |
| PWM Morph | Shapes | 1 | 0.39 | −14.4 | −14.4 | −14.5 | −0.1 | legato −14.5 | +0.9 | no | ×1 | 4.0 % | −64 | — | fine |
| Sub Ladder | Shapes | 1 | 0.37 | −14.9 | −15.2 | −15.3 | −0.4 | legato −15.2 | 0.0 | no | ×1 | 5.8 % | −72 | — | fine |
| Square on Square | Shapes | 1 | 0.34 | −14.1 | −14.5 | −14.5 | −0.4 | legato −14.4 | +0.8 | no | ×1 | 5.3 % | −83 | — | fine |
| Sub Two Down | Shapes | 1 | 0.38 | −15.2 | −15.4 | −15.5 | −0.3 | legato −15.4 | −0.3 | no | ×1 | 4.3 % | −60 | — | fine |
| Deep Breath | Shapes | 1 | 0.47 | −14.6 | −14.9 | −15.1 | −0.6 | legato −14.9 | +0.4 | no | ×1 | 4.8 % | −68 | — | fine |
| Octave Stack | Intervals | 1 | 0.24 | −17.4 | −17.6 | −17.7 | −0.3 | legato −17.6 | −2.0 | no | ×1 | 7.1 % | −68 | — | fine |
| Perfect Fifth | Intervals | 1 | 0.34 | −15.1 | −15.4 | −15.4 | −0.4 | legato −15.4 | +0.4 | no | ×38 (0.001, C2 start) | 0.0 % | −72 | — | fine |
| Major Third | Intervals | 1 | 0.34 | −14.8 | −15.3 | −15.4 | −0.6 | legato −15.3 | +0.4 | no | ×3 | 0.0 % | −72 | — | fine |
| Tritone Knot | Intervals | 1 | 0.46 | −16.2 | −16.5 | −16.7 | −0.5 | legato −16.5 | −1.0 | no | ×1 | 3.3 % | −71 | — | fine |
| Slow Beats | Intervals | 1 | 0.25 | −15.2 | −15.4 | −15.3 | −0.1 | legato −15.4 | +0.3 | no | ×1 | 0.0 % | −65 | — | fine |
| Fast Beats | Intervals | 1 | 0.41 | −13.5 | −15.2 | −16.3 | −2.8 | legato −15.2 | +0.6 | no | ×1 | 3.2 % | −64 | — | fine |
| Twelfth Bell | Intervals | 1 | 0.32 | −15.7 | −15.7 | −15.7 | 0.0 | legato −15.7 | 0.0 | no | ×12 (0.001, C2 start) | 0.0 % | −68 | — | fine |
| Ring Bell | Intervals | 1 | 0.21 | −20.3 | −20.3 | −20.3 | 0.0 | legato −20.3 | −4.7 | no | ×12 (0.001, C2 start) | 0.0 % | −82 | −118 / −119 | fine (apart by design) |
| FM Sidebands | Intervals | 1 | 0.23 | −15.2 | −15.2 | −15.2 | 0.0 | legato −15.2 | +0.6 | no | ×1 | 2.7 % | −65 | −122 / −90 | fine |
| Ring Octave | Intervals | 1 | 0.24 | −15.8 | −15.9 | −15.9 | −0.1 | legato −15.9 | −0.3 | no | ×1 | 12 % (C6) | −74 | −124 / −125 | fine |
| FM Ladder | Intervals | 1 | 0.38 | −17.2 | −17.2 | −17.0 | +0.2 | legato −17.2 | −1.6 | no | ×1 | 0.2 % | −53 | −122 / −125 | fine |
| Resonant Ring | Filter | 1 | 0.31 | −22.6 | −18.7 | −15.9 | +6.7 | legato −18.4 | +0.5 | no | ×1 | 0.0 % | −77 | — | **check**: keyboard |
| Self-Oscillation | Filter | 1 | 0.29 | −18.8 | −18.9 | −19.2 | −0.4 | legato −18.9 | +0.3 | no | ×7 | 0.1 % | −86 | — | fine |
| 12 vs 24 | Filter | 1 | 0.24 | −18.9 | −19.4 | −27.2 | −8.2 | legato −19.4 | −0.2 | no | ×1 | 0.0 % | −70 | — | **check**: keyboard |
| Vowel | Filter | 1 | 0.13 | −38.9 | −31.7 | −21.3 | +17.6 | legato −28.6 | −12.5 | no | ×1 | 0.0 % | −111 | — | 258 |
| High-pass Buzz | Filter | 1 | 0.49 | −27.3 | −21.4 | −14.5 | +12.8 | legato −19.5 | −2.2 | no | ×1 | 4.1 % | −98 | — | **check**: keyboard |
| Notch Sweep | Filter | 1 | 0.25 | −18.9 | −19.2 | −19.5 | −0.6 | legato −19.2 | +0.1 | no | ×1 | 11 % (C6) | −70 | — | fine |
| Key Track Demo | Filter | 1 | 0.32 | −18.7 | −19.3 | −19.3 | −0.6 | legato −19.3 | −0.1 | no | ×1 | 0.0 % | −76 | — | fine |
| Velocity Bite | Filter | 1 | 0.41 | −19.7 | −19.1 | −17.0 | +2.7 | legato −18.7 | +0.2 | no | ×1 | 0.0 % | −71 | — | fine |
| Gate | Envelope | 1 | 0.24 | −18.9 | −19.1 | −19.3 | −0.4 | legato −19.1 | +0.6 | no | ×1 | 10 % (C6) | −74 | — | fine |
| Pluck Shape | Envelope | 1 | 0.22 | −21.7 | −21.9 | −22.1 | −0.4 | legato −21.9 | −2.6 | no | ×1 | 10 % (C6) | −105 | — | fine |
| Pluck | Envelope | 1 | 0.48 | −20.3 | −17.8 | −17.3 | +3.0 | legato −17.8 | +1.9 | no | ×3 | 0.0 % | −99 | — | fine |
| Swell | Envelope | 1 | 0.23 | −19.4 | −19.6 | −19.8 | −0.4 | legato −19.7 | −0.2 | no | ×1 | 10 % (C6) | −82 | — | fine |
| Long Tail | Envelope | 1 | 0.22 | −20.6 | −20.7 | −20.9 | −0.3 | legato −20.7 | −1.4 | no | ×1 | 10 % (C6) | −72 | — | fine |
| Two Speeds | Envelope | 1 | 0.26 | −19.2 | −19.0 | −34.8 | −15.6 | legato −19.0 | +0.7 | no | — | 0.0 % | −76 | — | 258 |
| Reverse Filter | Envelope | 1 | 0.27 | −20.0 | −19.8 | −19.9 | +0.1 | legato −19.8 | −0.4 | no | ×1 | 1.3 % | −76 | — | fine |
| Slow Vibrato | LFO | 1 | 0.21 | −18.9 | −19.2 | −19.7 | −0.7 | legato −19.2 | −2.3 | no | ×1 | 3.4 % | −72 | — | fine |
| Fast Vibrato | LFO | 1 | 0.21 | −18.9 | −19.2 | −19.7 | −0.7 | legato −19.2 | −2.3 | no | ×1 | 3.4 % | −69 | — | fine |
| Deep Sweep | LFO | 1 | 0.43 | −18.3 | −16.9 | −11.2 | +7.1 | legato −16.9 | 0.0 | no | ×1 | 0.1 % | −70 | — | watch: keyboard |
| Stepped | LFO | 1 | 0.27 | −20.3 | −16.6 | −18.6 | +1.7 | legato −16.6 | +0.4 | no | ×1 | 0.0 % | −72 | — | fine |
| Ramp | LFO | 1 | 0.27 | −20.6 | −16.7 | −16.6 | +4.0 | legato −16.6 | +0.2 | no | ×1 | 0.0 % | −73 | — | fine |
| Sidebands | LFO | 1 | 0.22 | −18.9 | −19.2 | −19.5 | −0.6 | legato −19.2 | −2.3 | no | ×1 | 5.0 % | −70 | — | fine |
| Resonance Swell | LFO | 1 | 0.56 | −17.4 | −16.3 | −10.1 | +7.4 | legato −12.5 | +0.6 | yes: D5 0.90, D6 1.48, D#6 1.11 | ×1 | 0.0 % | −71 | — | **check**: limiter |
| Rolling Fifth | LFO | 1 | 0.28 | −16.6 | −16.8 | −16.9 | −0.3 | legato −16.8 | +0.1 | no | ×35 (0.001, C2 start) | 0.0 % | −68 | — | fine |
| Chorus Drift | LFO | 1 | 0.28 | −16.3 | −16.9 | −18.3 | −2.0 | legato −16.9 | 0.0 | no | ×1 | 2.3 % | −71 | — | fine |
| Breathing Bell | LFO | 4 | 0.34 | −21.9 | −22.0 | −22.0 | 0.0 | chord −17.2 | −5.1 | no | ×6 | 29 % (C6) | −88 | −81 / −75 | fine (apart by design) |
| Double Motion | LFO | 1 | 0.39 | −18.6 | −17.7 | −13.6 | +4.9 | legato −17.7 | −0.8 | no | ×1 | 0.0 % | −70 | — | fine |
| Key Sync | LFO | 1 | 0.25 | −20.5 | −16.2 | −16.3 | +4.3 | legato −16.2 | +0.7 | no | ×1 | 0.0 % | −71 | — | fine |
| Bass | Bass | 1 | 0.46 | −16.9 | −15.2 | −16.0 | +0.9 | legato −15.2 | −0.8 | no | ×5 | 0.0 % | −64 | — | fine |
| Sub Bass | Bass | 1 | 0.28 | −14.3 | −14.5 | −14.7 | −0.4 | legato −14.5 | −0.2 | no | ×56 (0.003, C2 start) | 0.0 % | −60 | — | fine |
| Reese | Bass | 1 | 0.56 | −14.0 | −13.8 | −14.8 | −0.8 | legato −13.8 | +0.7 | no | ×1 | 0.0 % | −84 | — | fine |
| Acid | Bass | 1 | 0.59 | −19.8 | −13.7 | −14.4 | +5.4 | legato −13.7 | +0.8 | no | ×2 | 0.0 % | −79 | — | fine |
| Rubber | Bass | 1 | 0.52 | −16.4 | −15.9 | −15.5 | +1.0 | legato −15.9 | −1.6 | no | ×4 | 0.0 % | −69 | — | fine |
| Pluck Bass | Bass | 1 | 0.57 | −17.1 | −16.6 | −16.1 | +1.0 | legato −16.6 | −2.3 | no | ×3 | 1.0 % | −88 | — | fine |
| PWM Bass | Bass | 1 | 0.61 | −12.9 | −12.6 | −11.7 | +1.1 | legato −12.6 | +1.9 | no | ×1 | 0.0 % | −58 | — | fine |
| Wobble | Bass | 1 | 0.42 | −17.2 | −13.9 | −15.1 | +2.1 | legato −13.9 | +0.6 | no | — | 0.0 % | −74 | — | fine |
| Double Wobble | Bass | 1 | 0.49 | −17.3 | −14.4 | −16.3 | +0.9 | legato −15.1 | +0.2 | no | ×1 | 0.0 % | −64 | — | fine |
| Growl | Bass | 1 | 0.59 | −17.7 | −16.0 | −14.6 | +3.1 | legato −15.1 | −1.6 | no | ×2 | 0.0 % | −59 | — | fine |
| Split Octave Bass | Bass | 1 | 0.54 | −15.6 | −13.5 | −14.9 | +0.7 | legato −11.6 | +1.0 | no | ×1 | 0.0 % | −66 | — | fine |
| FM Bass | Bass | 1 | 0.44 | −16.4 | −15.9 | −15.2 | +1.2 | legato −15.9 | −1.5 | no | ×54 (0.004, C2 start) | 0.0 % | −64 | −120 / −125 | fine |
| 808 Boom | Bass | 1 | 0.38 | −15.5 | −15.7 | −15.8 | −0.2 | legato −15.7 | −1.4 | no | ×97 (0.002, C2 start) | 0.0 % | −82 | — | fine (its click) |
| FM Growl | Bass | 1 | 0.46 | −14.2 | −14.1 | −13.3 | +1.0 | legato −13.9 | +0.4 | no | ×6 | 0.4 % | −57 | −120 / −123 | fine |
| Lead | Leads | 1 | 0.48 | −17.1 | −17.2 | −16.8 | +0.3 | legato −17.1 | +0.7 | no | ×1 | 0.2 % | −73 | — | fine |
| Square Lead | Leads | 1 | 0.25 | −17.3 | −17.2 | −17.2 | +0.1 | legato −17.2 | +0.7 | no | ×1 | 13 % (C6) | −65 | — | fine |
| Chip Lead | Leads | 1 | 0.24 | −18.5 | −18.7 | −18.9 | −0.4 | legato −18.7 | −0.9 | no | ×1 | 8.9 % | −73 | — | fine |
| Screamer | Leads | 1 | 0.66 | −17.7 | −17.4 | −19.3 | −1.7 | legato −17.5 | +0.5 | no | ×1 | 33 % (C4) | −71 | — | fine |
| Portamento | Leads | 1 | 0.47 | −18.5 | −17.9 | −18.4 | +0.1 | legato −17.9 | 0.0 | no | ×1 | 22 % (C6) | −73 | — | fine |
| Whistle | Leads | 1 | 0.19 | −17.3 | −17.4 | −17.4 | 0.0 | legato −17.4 | +0.5 | no | ×2 | 0.0 % | −68 | — | fine |
| Flute | Leads | 1 | 0.23 | −18.7 | −18.7 | −18.8 | −0.1 | legato −18.7 | −0.9 | no | ×1 | 0.4 % | −71 | — | fine |
| Sync-ish Lead | Leads | 1 | 0.37 | −21.1 | −19.8 | −20.2 | +0.9 | legato −19.6 | −2.0 | no | ×1 | 5.8 % | −97 | — | fine |
| Singing Lead | Leads | 1 | 0.36 | −19.1 | −18.9 | −18.4 | +0.8 | legato −18.9 | −1.1 | no | ×1 | 10 % (C6) | −70 | — | fine |
| Poly Mod Zap | Leads | 1 | 0.47 | −18.7 | −17.7 | −13.2 | +5.4 | legato −16.9 | +0.2 | no | ×1 | 0.0 % | −65 | −78 / −65 | fine |
| Ring Lead | Leads | 1 | 0.55 | −17.7 | −17.8 | −17.6 | 0.0 | legato −17.8 | 0.0 | no | ×1 | 16 % (C6) | −78 | −59 / −124 | **check**: fold-back on C6 |
| Ring Sweep | Leads | 1 | 0.54 | −18.7 | −18.8 | −16.5 | +2.2 | legato −18.8 | −0.9 | no | ×1 | 1.8 % | −54 | −82 / −79 | fine |
| Duo Lead | Leads | 2 | 0.62 | −17.9 | −18.5 | −19.6 | −1.8 | chord −15.4 | −0.6 | no | ×1 | 9.9 % | −71 | — | fine |
| Analog Drift Lead | Leads | 1 | 0.52 | −16.7 | −17.1 | −17.6 | −1.0 | legato −17.1 | +0.7 | no | ×1 | 19 % (C6) | −68 | — | fine |
| Electric Piano | Keys & Organs | 8 | 0.20 | −27.0 | −26.9 | −26.8 | +0.2 | chord −22.2 | −0.3 | no | — | 0.0 % | −82 | — | fine |
| Tremolo Keys | Keys & Organs | 6 | 0.18 | −27.7 | −27.7 | −27.6 | +0.1 | chord −22.9 | −1.0 | no | ×1 | 0.0 % | −81 | — | fine |
| Clav | Keys & Organs | 8 | 0.32 | −36.1 | −29.5 | −29.6 | +6.5 | chord −25.6 | −2.8 | no | ×2 | 6.2 % | −106 | — | watch: keyboard |
| Organ | Keys & Organs | 8 | 0.25 | −26.3 | −26.6 | −26.6 | −0.3 | chord −21.7 | +0.2 | no | ×1 | 0.0 % | −71 | — | fine |
| House Organ | Keys & Organs | 8 | 0.21 | −26.6 | −26.5 | −26.5 | +0.1 | chord −21.5 | +0.3 | no | ×2 | 1.1 % | −80 | — | fine |
| Cathedral | Keys & Organs | 8 | 0.26 | −25.6 | −25.8 | −25.6 | −0.1 | chord −20.9 | +1.0 | no | ×1 | 0.1 % | −72 | — | fine |
| Rave Stab | Keys & Organs | 6 | 0.37 | −27.3 | −26.7 | −25.2 | +2.0 | chord −21.5 | +0.1 | no | ×4 | 3.5 % | −89 | — | fine |
| Piano | Pianos | 8 | 0.29 | −24.4 | −24.5 | −25.1 | −0.8 | chord −19.8 | +0.9 | no | ×1 | 6.7 % | −90 | — | fine |
| Felt Piano | Pianos | 8 | 0.25 | −24.7 | −24.7 | −25.3 | −0.6 | chord −20.0 | +0.7 | no | — | 0.0 % | −79 | — | 258 (Velocity) |
| Honky-Tonk | Pianos | 8 | 0.25 | −24.9 | −25.4 | −27.7 | −2.8 | chord −20.9 | −0.7 | no | ×1 | 7.6 % | −91 | — | fine |
| Tine Piano | Pianos | 8 | 0.21 | −28.2 | −27.9 | −29.5 | −1.3 | chord −22.4 | −3.1 | no | ×1 | 0.0 % | −65 | −110 / −107 | fine |
| Poly Pluck | Plucks & Mallets | 6 | 0.24 | −26.9 | −27.1 | −26.6 | +0.3 | chord −22.2 | +0.1 | no | ×17 (0.005, C2 start) | 2.7 % | −78 | — | fine |
| Harp | Plucks & Mallets | 8 | 0.15 | −28.5 | −28.5 | −28.6 | −0.1 | chord −23.7 | −1.4 | no | ×3 | 0.2 % | −90 | — | fine |
| Chorus Pluck | Plucks & Mallets | 6 | 0.23 | −26.7 | −27.0 | −28.1 | −1.4 | chord −22.4 | +0.2 | no | ×4 | 0.2 % | −87 | — | fine |
| Pick Pluck | Plucks & Mallets | 6 | 0.21 | −29.3 | −28.3 | −26.1 | +3.1 | chord −23.5 | −1.2 | no | ×36 (0.008, C2 start) | 5.4 % | −86 | — | fine (its pick) |
| Marimba | Plucks & Mallets | 8 | 0.21 | −27.4 | −27.3 | −27.0 | +0.3 | chord −22.6 | −0.2 | no | ×37 (0.002, C2 start) | 0.0 % | −88 | — | fine |
| Vibes | Plucks & Mallets | 8 | 0.19 | −26.4 | −26.4 | −26.4 | 0.0 | chord −21.6 | +0.8 | no | ×92 (0.002, C2 start) | 0.0 % | −86 | — | fine |
| Kalimba | Plucks & Mallets | 8 | 0.17 | −28.2 | −28.2 | −28.2 | 0.0 | chord −23.4 | −1.1 | no | ×102 (0.003, C2 start) | 0.6 % | −91 | −100 / −101 | fine |
| Toy Piano | Plucks & Mallets | 8 | 0.19 | −27.1 | −27.1 | −27.1 | 0.0 | chord −22.3 | +0.1 | no | ×1 | 0.8 % | −88 | — | fine |
| Glass Keys | Plucks & Mallets | 8 | 0.20 | −27.0 | −27.0 | −27.0 | 0.0 | chord −22.2 | +0.2 | no | ×46 (0.001, C2 start) | 0.0 % | −82 | — | fine |
| FM Bell | Plucks & Mallets | 8 | 0.22 | −26.2 | −26.1 | −26.1 | +0.1 | chord −21.4 | +1.1 | no | ×2 | 2.3 % | −91 | −115 / −77 | fine |
| Zap Pluck | Plucks & Mallets | 8 | 0.18 | −29.1 | −29.0 | −29.8 | −0.8 | chord −24.8 | −2.0 | no | ×8 | 72 % (C6) | −98 | −79 / −78 | **check**: bright on C6 |
| Pad | Pads | 8 | 0.35 | −24.9 | −24.2 | −25.6 | −0.7 | chord −20.3 | −1.0 | no | ×1 | 0.1 % | −85 | — | fine |
| Warm Pad | Pads | 8 | 0.39 | −22.8 | −22.9 | −24.4 | −1.6 | chord −18.5 | +1.3 | no | ×1 | 0.2 % | −77 | — | fine |
| Sweep Pad | Pads | 8 | 0.30 | −27.7 | −23.2 | −20.0 | +7.7 | chord −17.2 | +1.0 | no | ×1 | 0.0 % | −92 | — | 258; top octave |
| Dark Drone | Pads | 1 | 0.22 | −24.4 | −22.2 | −16.2 | +8.2 | legato −22.4 | +2.0 | no | — | 0.0 % | −80 | — | watch: keyboard, top octave |
| Shimmer Pad | Pads | 4 | 0.38 | −23.3 | −22.9 | −24.2 | −1.0 | chord −19.4 | +1.3 | no | ×1 | 0.1 % | −92 | — | fine |
| Breathing Pad | Pads | 4 | 0.49 | −28.0 | −22.7 | −14.5 | +13.5 | chord −18.0 | +1.5 | no | ×1 | 0.0 % | −95 | — | 258; top octave |
| Trance Gate | Pads | 8 | 0.32 | −25.4 | −25.2 | −24.8 | +0.5 | chord −20.5 | −2.0 | no | ×15 (0.150, chord start) | 0.0 % | −70 | — | **check**: strummed chord |
| Phase Pad | Pads | 8 | 0.26 | −26.7 | −24.4 | −25.0 | +1.7 | chord −20.9 | −1.1 | no | ×1 | 12 % (C6) | −87 | — | fine |
| Chorus Chords | Pads | 4 | 0.28 | −23.9 | −24.8 | −25.5 | −1.6 | chord −20.6 | −1.6 | no | ×1 | 0.4 % | −79 | — | fine |
| Glass Pad | Pads | 6 | 0.37 | −25.2 | −25.3 | −25.1 | +0.1 | chord −20.1 | −2.1 | no | ×1 | 0.4 % | −89 | −113 / −112 | fine |
| Deep Space | Pads | 4 | 0.44 | −22.5 | −22.8 | −21.4 | +1.1 | chord −17.6 | +1.4 | no | ×1 | 0.0 % | −72 | −111 / −111 | fine |
| Glass Shimmer | Pads | 8 | 0.24 | −25.0 | −25.0 | −25.6 | −0.7 | chord −20.2 | −1.8 | no | ×1 | 26 % (C6) | −92 | −98 / −94 | fine |
| PWM Strings | Strings, Brass & Choir | 8 | 0.36 | −21.4 | −22.1 | −21.9 | −0.4 | chord −17.5 | +2.2 | no | ×1 | 3.3 % | −98 | — | fine |
| Strings | Strings, Brass & Choir | 8 | 0.28 | −24.2 | −24.8 | −26.5 | −2.3 | chord −20.2 | −1.4 | no | ×1 | 0.6 % | −81 | — | fine |
| Brass Swell | Strings, Brass & Choir | 8 | 0.29 | −24.8 | −25.0 | −25.4 | −0.7 | chord −20.9 | −1.6 | no | ×1 | 0.8 % | −81 | — | fine |
| Brass Section | Strings, Brass & Choir | 6 | 0.36 | −23.2 | −23.9 | −24.5 | −1.3 | chord −19.7 | 0.0 | no | ×1 | 1.3 % | −80 | — | fine |
| Choir | Strings, Brass & Choir | 8 | 0.41 | −26.0 | −23.0 | −22.9 | +3.1 | chord −18.8 | +1.4 | no | ×1 | 0.0 % | −92 | — | fine |
| Kick | Drums | 1 | 0.14 | −27.2 | −27.2 | −27.2 | 0.0 | legato −27.2 | −1.6 | no | — | 0.0 % | −82 | — | 258 (kit level) |
| Snare | Drums | 1 | 0.35 | −25.6 | −25.6 | −25.5 | +0.1 | legato −25.6 | 0.0 | no | ×1 | 28 % (C2) | −80 | — | 258 (kit level) |
| Hi-hat | Drums | 1 | 0.32 | −27.2 | −27.2 | −27.2 | 0.0 | legato −27.2 | −1.6 | no | ×2 | 99 % (C2) | −134 | — | 258 (kit level) |
| Open Hat | Drums | 1 | 0.20 | −25.6 | −25.6 | −25.6 | 0.0 | legato −25.6 | 0.0 | no | ×1 | 97 % (C2) | −142 | — | 258 (kit level) |
| Ride | Drums | 1 | 0.23 | −26.4 | −26.0 | −26.9 | −0.5 | legato −26.0 | −0.4 | no | ×1 | 99 % (C6) | −114 | −108 / −103 | 258 (kit level) |
| Tom | Drums | 1 | 0.14 | −26.2 | −26.2 | −26.2 | 0.0 | legato −26.2 | −0.6 | no | ×58 (0.004, C2 start) | 0.0 % | −79 | — | 258 (kit level) |
| Cowbell | Drums | 1 | 0.33 | −30.9 | −25.4 | −21.7 | +9.1 | legato −25.4 | +0.2 | no | ×1 | 0.1 % | −113 | — | 258 (kit level); watch: keyboard |
| Clang | Drums | 1 | 0.23 | −31.8 | −25.4 | −26.4 | +5.4 | legato −25.4 | +0.2 | no | ×1 | 16 % (C6) | −108 | −83 / −84 | 258 (kit level) |
| Zap Tom | Drums | 1 | 0.14 | −25.0 | −25.2 | −25.2 | −0.2 | legato −25.2 | +0.4 | no | ×1 | 0.0 % | −72 | — | 258 (kit level) |
| Gong | Drums | 1 | 0.16 | −25.1 | −25.2 | −25.1 | 0.0 | legato −25.2 | +0.4 | no | ×1 | 0.2 % | −96 | −119 / −119 | 258 (kit level) |
| Laser | Movement & Effects | 1 | 0.48 | −28.5 | −22.4 | −21.7 | +6.8 | legato −22.4 | −0.3 | no | ×7 | 0.0 % | −100 | — | watch: keyboard |
| Riser | Movement & Effects | 1 | 0.44 | −22.6 | −21.6 | −19.6 | +3.1 | legato −21.0 | +0.6 | no | ×1 | 65 % (C6) | −116 | — | fine (Noise) |
| Sub Drop | Movement & Effects | 1 | 0.17 | −21.9 | −21.8 | −21.8 | 0.0 | legato −21.8 | +0.3 | no | ×6 | 32 % (C6) | −88 | — | fine |
| Wind | Movement & Effects | 1 | 0.22 | −23.7 | −23.7 | −23.7 | 0.0 | legato −23.7 | −1.6 | no | ×1 | 48 % (C2) | −109 | — | fine (Noise) |
| Ocean | Movement & Effects | 1 | 0.21 | −24.1 | −24.1 | −24.1 | 0.0 | legato −24.1 | −2.0 | no | ×1 | 4.1 % | −85 | — | fine |
| Glide Slide | Movement & Effects | 1 | 0.12 | −22.2 | −22.2 | −22.3 | −0.1 | legato −22.2 | −0.1 | no | ×1 | 9.8 % | −71 | — | fine |
| Trill | Movement & Effects | 1 | 0.14 | −22.0 | −22.1 | −21.6 | +0.4 | legato −22.0 | +0.1 | no | ×1 | 0.1 % | −71 | — | fine |
| Wah | Movement & Effects | 1 | 0.16 | −29.6 | −24.4 | −22.2 | +7.5 | legato −22.1 | −2.3 | no | ×1 | 0.3 % | −107 | — | watch: keyboard |
| Helicopter | Movement & Effects | 1 | 0.43 | −26.3 | −22.1 | −22.5 | +3.8 | legato −22.1 | +0.1 | no | ×1 | 0.0 % | −70 | — | fine |
| Siren | Movement & Effects | 1 | 0.13 | −22.0 | −22.1 | −21.8 | +0.3 | legato −22.1 | 0.0 | no | ×1 | 0.5 % | −71 | — | fine |
| Talking Filter | Movement & Effects | 1 | 0.27 | −25.9 | −22.7 | −18.0 | +7.9 | legato −22.7 | −0.6 | no | ×1 | 1.6 % | −104 | — | watch: keyboard |
| Stutter | Movement & Effects | 1 | 0.55 | −23.1 | −21.2 | −19.6 | +3.4 | legato −23.1 | +1.0 | no | — | 0.0 % | −58 | — | fine |
| Pink Surf | Movement & Effects | 1 | 0.23 | −22.3 | −22.3 | −22.3 | 0.0 | legato −22.3 | −0.2 | no | ×1 | 0.2 % | −67 | — | fine |
| FM Sweep | Movement & Effects | 1 | 0.16 | −20.9 | −21.6 | −22.0 | −1.1 | legato −21.6 | +0.6 | no | ×1 | 0.1 % | −60 | −121 / −124 | fine |
| Robot | Movement & Effects | 1 | 0.27 | −29.4 | −24.8 | −24.1 | +5.3 | legato −24.2 | −2.7 | no | ×1 | 0.9 % | −100 | −122 / −119 | fine |
| Clang Alarm | Movement & Effects | 1 | 0.12 | −21.9 | −22.0 | −22.0 | −0.1 | legato −22.0 | +0.2 | no | ×7 | 20 % (C6) | −79 | −71 / −70 | fine |
| Machine Chatter | Movement & Effects | 1 | 0.12 | −21.7 | −21.9 | −22.0 | −0.2 | legato −21.9 | +0.2 | no | ×7 | 14 % (C6) | −75 | −111 / −80 | fine |

## For the inbox

- Resonance Swell passes the limiter, the one Preset that does: 1.48 on D6, 1.11 on D#6 and 0.90 on D5, 2.5 s into a held Note when its LFO's Resonance peaks on a Harmonic at its fixed 1.2 kHz Cutoff, D6 playing at 0 dBFS, 16 dB over its C4, with jumps of up to 6.6 dB between neighbouring semitones (review 14).
- Trance Gate clicks on a strummed chord: each Note joining a chord already sounding bends 0.06 to 0.17 about 4 ms after its start, three to seven times the gate's own switches (0.024), for Notes 5 to 40 ms apart, where a chord struck at once bends no more than the gate (review 14).
- Ring Lead folds back on C6 alone: LFO 2's vibrato swings the top partial its Ring keeps past 24 kHz, −57 dB at 192 kHz, just over issue 103's −60 dB line, where B5, C#6, D6 and C6 without the vibrato measure −116 or lower (review 14).
- Zap Pluck is harsh on C6: 72 % of its energy lies above 5 kHz (0 % on C4), where the rest of Plucks & Mallets keeps 5.4 % or less, as its FM sidebands climb with the Note past a Cutoff fixed at 8 kHz (review 14).
- Three Filter lessons swing across the keyboard beyond issue 258's four: High-pass Buzz climbs 12.8 dB from C2 to C6 (−27.3 to −14.5 dBFS), 12 vs 24 falls 8.2 dB (and 21 dB to C7), and Resonant Ring rises 16 dB around E6 and F6, where its fundamental meets the 1.4 kHz resonant Cutoff (review 14).
- Seven sounds swing 6.5 to 9 dB from C2 to C6: Cowbell +9.1, Dark Drone +8.2, Talking Filter +7.9, Wah +7.5, Deep Sweep +7.1, Laser +6.8 and Clav +6.5, whose C2 plays at −36.1 dBFS through its high-pass (review 14).
- Three Pads fade in the top octave, a fixed Cutoff leaving little of a C7: from C6 to C7 Sweep Pad loses 33 dB, Breathing Pad 28 and Dark Drone 28, playing at −54, −43 and −44 dBFS on C7; Dark Drone is not in issue 258, and the other two go beyond its C2-to-C6 (review 14).
