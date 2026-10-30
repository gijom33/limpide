# Review 14: the ear stand-in

Rendered offline in Chromium through `createSynthEngine` (OfflineAudioContext, 48 kHz, velocity 1), with the safety limiter's curve swapped for a straight line so the numbers are what reaches it: the 29 Presets added since v1.15.1 and, as their neighbours, the other 82 Presets in the same ten groups, each on C2, C4 and C6 (MIDI 36, 60, 84) held for 1 to 3 s and then released, plus a three-Note chord (C4 E4 G4, and C2 G2 C3) for Presets with more than one Voice, or a legato change C4 to G4 (`pitchChange`) for one-Voice Presets. The FM and Ring Presets were also rendered on C7 (MIDI 96) at 96 and 192 kHz to tell aliasing apart from the sound's own inharmonic partials.

How to read the table. **Peak** is the largest sample in any of a Preset's renders; the limiter bends anything above 0.8. **RMS** is the loudest 100 ms on C4, in dBFS, and **vs group** compares it with the median of the group's older Presets. **Worst click** is the largest sample-to-sample bend (second difference) in the 5 ms after a Note starts, is released or changes, as a multiple of the largest bend in the steady sound that follows. Bends under 0.001 are left out. **> 5 kHz** is the largest share of energy above 5 kHz across the three Notes. **DC** is the worst mean level while the Gate is open.

| Preset | Group | Voices | Peak | RMS (C4) | vs group | Limiter | Worst click | > 5 kHz | DC | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| Sine Sub Two Down (renamed Sub Two Down in the working tree, not yet committed) | Shapes | 1 | 0.36 | −15.4 | −0.2 | no | ×1 | 4 % | −51 | fine |
| Ring Bell | Intervals | 1 | 0.21 | −20.4 | −5.2 | no | ×13 (0.001, C2 start) | 0 % | −89 | fine |
| FM Sidebands | Intervals | 1 | 0.23 | −15.2 | 0.0 | no | ×2 | 3 % | −65 | fine |
| Ring Octave | Intervals | 1 | 0.23 | −15.9 | −0.7 | no | ×1 | 10 % | −65 | check |
| FM Ladder | Intervals | 1 | 0.23 | −15.1 | +0.1 | no | ×2 | 0 % | **−18** | check |
| Breathing Bell | LFO | 4 | 0.34 | −22.0 | **−6.6** | no | ×5 (0.002) | 31 % | −81 | check |
| Split Octave Bass | Bass | 1 | 0.53 | −13.5 | −1.6 | no | ×2 | 0 % | −67 | fine |
| FM Bass | Bass | 1 | 0.41 | −15.9 | −3.9 | no | ×56 (0.004, C2 start) | 0 % | **−24** | check |
| 808 Boom | Bass | 1 | 0.38 | −15.7 | −3.7 | no | ×139 (0.002, C2 start; the intended click) | 0 % | −63 | fine |
| FM Growl | Bass | 1 | 0.46 | −14.1 | −2.2 | no | ×6 (0.002) | 0.5 % | −32 | fine |
| Poly Mod Zap | Leads | 1 | 0.48 | −17.6 | −1.6 | no | ×2 | 0 % | −41 | fine |
| Ring Lead | Leads | 1 | 0.33 | −22.3 | **−6.3** | no | ×1 | 16 % | −82 | check |
| Ring Sweep | Leads | 1 | 0.34 | −22.9 | **−6.8** | no | ×1 | 1 % | −46 | check |
| FM Bell | Keys & Plucks | 8 | 0.22 | −26.0 | +1.1 | no | ×35 (0.005, C2 start) | 6 % | −72 | check |
| Kalimba | Keys & Plucks | 8 | 0.22 | −27.6 | −0.5 | no | ×76 (0.003, C2 start) | 10 % | −80 | fine |
| Zap Pluck | Keys & Plucks | 8 | 0.21 | −30.5 | −3.3 | no | ×32 (0.002, C2 start) | 5 % | −86 | fine |
| Tine Piano | Pianos | 8 | 0.21 | −27.1 | −2.5 | no | ×117 (0.002, C2 start) | 0 % | −34 (chord) | fine |
| Cathedral | Pads | 8 | 0.36 | −23.3 | −0.8 | no | ×1 | 0.1 % | −74 | fine |
| Glass Pad | Pads | 6 | 0.28 | −28.1 | −5.6 | no | ×1 | 0.4 % | −83 | fine |
| Deep Space | Pads | 4 | 0.45 | −22.8 | −0.2 | no | ×1 | 0 % | −63 | fine |
| Glass Shimmer | Pads | 8 | 0.24 | −25.0 | −2.5 | no | ×1 | 35 % (C6) | −91 | fine |
| Clang | Drums | 1 | 0.43 | −20.1 | **+7.9** | no | ×2 | 19 % | −101 | check |
| Zap Tom | Drums | 1 | 0.26 | −20.0 | **+8.1** | no | ×3 | 0 % | −64 | check |
| Gong | Drums | 1 | 0.26 | −20.8 | **+7.2** | no | ×1 | 0.2 % | −53 | check |
| Pink Surf | Movement & Effects | 1 | 0.46 | −16.9 | +0.8 | no | ×6 (legato) | 0.2 % | −60 | fine |
| FM Sweep | Movement & Effects | 1 | 0.23 | −15.9 | +1.7 | no | ×9 (0.001) | 0 % | −42 | fine |
| Robot | Movement & Effects | 1 | 0.18 | −29.4 | **−11.8** | no | ×1 | 0.6 % | −111 | check |
| Clang Alarm | Movement & Effects | 1 | 0.28 | −15.9 | +1.7 | no | ×7 (0.027) | **46 %** (C6) | −64 | check |
| Machine Chatter | Movement & Effects | 1 | 0.23 | −15.9 | +1.7 | no | ×3 | 14 % | −68 | fine |

Group medians on C4 (older Presets): Shapes −15.2, Intervals −15.2, LFO −15.4, Bass −11.9, Leads −16.1, Keys & Plucks −27.1, Pianos −24.7, Pads −22.5, Drums −28.1, Movement & Effects −17.7 dBFS. No render held a NaN or an Infinity. Every Preset fell to −77 dB or lower after its Release. No new Preset reaches the limiter, even in the three-Note chords: the highest is Deep Space's chord at 0.45. None is broken.

## Problems

1. **Level jumps when stepping through the Drums.** Clang, Zap Tom and Gong sit at −20 dBFS on C4, 7 to 8 dB over the group's median (−28.1). Zap Tom is 14.7 dB louder than the Tom just before it (−34.7), and Clang is 9 dB louder than the Cowbell before it (−29.0). They match the Open Hat (−20.3) but no other drum.
2. **Robot is quiet, and very quiet low.** It plays at −29.4 dBFS on C4, 11.8 dB under its group, and at −35.4 on C2, 17.7 dB under. Its band-pass at 1.5 kHz leaves little of a low Note's Ring product. It is even with Wah (−30.8), the group's quietest older Preset, but not with the four new FM Presets around it (−15.9).
3. **Three Presets about 6.5 dB under their neighbours.** Ring Lead (−22.3) and Ring Sweep (−22.9) are 6.3 and 6.8 dB under the Leads (Lead −15.3, Square Lead −14.8). Breathing Bell (−22.0) is 6.6 dB under the LFO group. Nearly all of Breathing Bell's gap is its four Voices, since the master makes room by 1/√4 = −6 dB. Every other Preset in the LFO group has one Voice.
4. **FM folds back in the top octave.** The engine does not limit FM's swing near Nyquist. This was measured at 192 kHz, where nothing folds, as the energy above 24 kHz against the energy below it; at 48 kHz that energy lands back inside the audible band as partials that sweep the wrong way:
   - Clang Alarm: −120 dB on C4, −42 dB on C6, −13 dB on C7. It is also the harshest new Preset, with 46 to 75 % of its energy above 5 kHz on C6, and its square LFO switches that on and off every 0.2 s.
   - Breathing Bell: −77 dB on C6 and −23 dB on C7. Its slow LFO on FM moves the folded partials, so they glide audibly.
   - FM Bell: −108 dB on C6 and −28 dB on C7, on a Preset meant for bells, which people play high.
   - Lighter: Glass Shimmer −52 dB, Machine Chatter −51 dB and Zap Pluck −60 dB, all on C7. FM Sidebands, FM Ladder, Tine Piano, FM Sweep and 808 Boom stay under −89 dB.
5. **Ring Octave aliases at every pitch.** The product of two squares should be exactly harmonic. Everything between its Harmonics measures −41 dB on C4, −35 dB on C6 and −28 dB on C7 at 48 kHz, against −88, −54 and −51 dB at 96 kHz; a plain square measures −91 dB. The square times square reaches up to twice Nyquist and folds, and the result is a faint inharmonic haze on a sound its text calls "a square again". Ring Sweep and Clang also multiply two full waves, but they are inharmonic by design, so it matters less there (Clang's folded energy is about −41 dB on C6).
6. **1:1 FM leaves a DC offset at the output.** When Osc 2 is on the Note's own pitch, one sideband lands at 0 Hz. The engine starts both cycles together (issue 94), so that sideband is at its largest, J₁(index) times the wave.
   - FM Ladder: 0.117 of offset (−18.6 dBFS) under a −15 dBFS sound, so the wave sits shifted by half its peak in the Scope.
   - FM Bass −24, FM Growl −32, Poly Mod Zap −41 and FM Sweep −42 dBFS.
   - Tine Piano −44 on one Note and −34 in a chord, where every Voice's offset adds with the same sign.
   - The offset itself is inaudible. Only the Amp Envelope moves it, so it costs headroom and adds a low thump at each start and stop, which is part of FM Bass's ×56 and Tine Piano's ×117 click ratios on C2 (both 0.002 to 0.004 in absolute terms).
7. **Bright at the top.** Glass Shimmer, a Pad, puts 35 % of its energy above 5 kHz on C6 (0 % on C4). Breathing Bell puts 31 % there. They are in the range of older Leads (Screamer 35 %, Sync-ish Lead 85 %) but not of other Pads (at most 3 %).
8. **Near the 6 dB line, not over it.** Glass Pad is 5.6 dB under the Pads and Ring Bell 5.2 dB under the Intervals.

Not new, for context: Stutter (2.36 before the limiter on C6), Laser (1.56), Growl (1.47), Breathing Pad (1.27), Helicopter (1.22), Dark Drone (1.11) and Double Wobble (1.07) all drive the limiter on a single Note.

Not problems: 808 Boom's start (×139, 0.002) is the click its text promises and is gentler than the older Kick's (×220). No release or legato change clicks in any new Preset (all ×2 or less). Zap Pluck's LFO wraps back to full FM at 0.33 s, but by then the Note is 30 dB down, so the second zap is barely there.

## Three for the inbox

- Level jumps: Clang, Zap Tom and Gong play 7 to 8 dB over the other Drums (Zap Tom 15 dB over Tom); Robot is 12 dB under its group (18 dB on C2); Ring Lead, Ring Sweep and Breathing Bell are about 6.5 dB under theirs.
- FM folds back in the top octave: folded energy reaches −13 dB in Clang Alarm on C7 (−42 dB already on C6), −23 dB in Breathing Bell and −28 dB in FM Bell; Ring Octave aliases at every pitch (between-Harmonics −35 dB on C6, against −54 dB at 96 kHz).
- FM with Osc 2 on the Note leaves a DC offset at the output: −19 dBFS in FM Ladder (the Scope's wave shifted by half its peak), −24 in FM Bass, −32 in FM Growl and −34 in a Tine Piano chord.
