# Review 14: the ear stand-in

Rendered offline in Chromium through `createSynthEngine` (OfflineAudioContext, 48 kHz, velocity 1), in Vitest's browser mode with the engine project's set-up, with the safety limiter's curve swapped for a straight line so the numbers are what reaches it. 1.20.0 changes two Presets (Talking Filter, retuned in issue 166, and Portamento, given a Filter Envelope and Legato in issue 119) and no Preset's LFO became a note value (that is issue 137's, not built). So every one of the 142 Presets was rendered on C2, C4, C6 and C7 (MIDI 36, 60, 84, 96), held for its Attack and 1.2 s and then released, through 1.20.0's engine and through v1.19.0's (taken from the tag, with its own Presets), and the two renders were compared sample by sample, to find every sound the engine changes of issues 112, 119 and 166 touched. Talking Filter was also held 4 s on C2 to C7; Portamento was played legato (C, the fifth over it, the octave over that, all let go, then C struck afresh) on C2, C4 and C6; the Presets the Cutoff clamp touched were compared Harmonic by Harmonic on C6 and C7. The Demo's three parts whose Rates became note values (Tremolo Keys, Wobble, Double Wobble) were played as the Demo plays them, their phrase and knob moves on the player's 40 ms ticks with its 150 ms look-ahead, on both engines.

How to read the tables. **Peak** is the largest sample in any of a Preset's renders; the limiter bends anything above 0.8. **RMS** is the loudest 100 ms on C4, in dBFS, and **vs group** compares it with the median of the rest of its group. **Worst click** is the largest sample-to-sample bend (second difference) in the 5 ms after a Note starts, is released, changes or a knob jumps, as a multiple of the largest bend in the steady sound beside it. Bends under 0.001 are left out. **> 5 kHz** is the largest share of energy above 5 kHz across the four Notes. **DC** is the worst mean level while the Gate is open. **Difference** is the 1.20.0 render minus the 1.19.0 one, against the 1.19.0 one, in dB.

## The two changed Presets

| Preset | Group | Voices | Peak | RMS (C4) | vs group | Limiter | Worst click | > 5 kHz | DC | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| Talking Filter | Movement & Effects | 1 | 0.25 | −21.7 | +0.4 | no | ×1 | 1 % (C7) | −83 | fine |
| Portamento | Leads | 1 | 0.47 | −17.9 | 0.0 | no | ×1 (legato ×0.6) | 26 % (C7) | −69 | fine |

Group medians on C4 (the rest of the group): Leads −17.8, Movement & Effects −22.1 dBFS. Neither Preset reaches the limiter, holds a NaN or leaves anything after its Release.

- **Talking Filter** keeps its level on C4 to C7 (−21.7, −21.3, −21.3, −22.5 dBFS, against 1.19.0's −21.8 to −22.5), but plays 4 dB quieter on C2 (−26.0 against −22.0), 3.7 dB under the group's median there (−22.3). Its 50 ms levels on C4 span 17 dB as LFO 2's square switches between the wide and the narrow band, as in 1.19.0 (−39.0 to −21.7, against −41.3 to −22.2). LFO 2's switches don't click: no 50 ms window bends more than 2.5 times the median. In 1.19.0 the unfiltered half bent three times more (0.18 against 0.06 at most) and put up to 35 % of its energy above 4 kHz on C7; 1.20.0 puts at most 4 % there on C4 to C6 and 12 % on C7. The narrow half rings a little higher (peak 0.25 against 0.16), far from the limiter.
- **Portamento** sits on the Leads' median, between Screamer and Whistle (−17.4 each). The Filter Envelope's bite comes on the first Note only: the share above 5 kHz on C4 is 0.2 % on the first strike, 0.07 % on a legato Note and 3.5 % on the afresh strike, which glides down from the octave and so starts with Key Track's brighter Cutoff. No legato change clicks (×0.4 to ×0.6), nor does the afresh strike (×0.3) or any release (×1 or less). On C7 the Cutoff clamp takes some of the attack's top: 23 % above 5 kHz against 33 % in 1.19.0. Everything between its Harmonics measures the same at 48 and 96 kHz (−7.1 and −7.6 dB on C7, the fifth's own partials), so nothing folds back.

## What the engine changes touched

The other 127 Presets render as in 1.19.0 on all four Notes, to −94 dB of difference or lower. Thirteen differ, on C6 and C7 only: the Notes where the Envelope, Velocity or Key Track took the Cutoff past 20 kHz, which issue 166 now holds at 20 kHz.

| Preset | Group | C7 RMS, 1.19.0 → 1.20.0 | C7 peak | Largest Harmonic change above 10 kHz | Verdict |
|---|---|---|---|---|---|
| Screamer | Leads | −20.8 → −20.4 | 0.22 → 0.27 | **+20.1 dB** at 19.9 kHz (C6 attack), **+12.6 dB** at 18.8 kHz (C7, held) | check |
| Analog Drift Lead | Leads | −18.9 → −18.9 | 0.35 | **+6.9 dB** at 18.8 kHz (C7 attack) | check |
| Glide Slide | Movement & Effects | −22.6 → −22.5 | 0.09 → 0.10 | +2.9 dB at 18.8 kHz (C7) | fine |
| Piano | Pianos | −25.9 → −25.9 | 0.10 → 0.12 | +1.0 dB at 17.8 and 18.8 kHz (attack) | fine |
| Honky-Tonk | Pianos | −27.5 → −27.5 | 0.10 → 0.11 | +1.0 dB at 17.8 and 18.8 kHz (attack) | fine |
| Pick Pluck | Plucks & Mallets | −26.4 → −26.3 | 0.17 | −6.2 dB at 16.7 kHz, +5.4 at 14.7 kHz (C7 attack, 46 dB under the loudest) | fine |
| Flute, House Organ, Harp, Kalimba, Toy Piano, FM Bell | | no change over 0.1 dB | no change | 0.5 dB or less | fine |
| Riser | Movement & Effects | −22.6 → −22.6 | 0.27 | from 3 s on C7: silent before, **−27 dBFS** now, 65 % of it above 20 kHz | check |

The Demo's synced parts, against 1.19.0:

| Part | Level | Difference | Worst click at a note value's jump | Verdict |
|---|---|---|---|---|
| Tremolo Keys | −22.8 (−23.9 before) | −7 dB (the tremolo now on the beat) | **×16** (0.003) at bar 6, 1.19.0 ×1 | check |
| Wobble | −19.7 (the same) | −28 dB | ×1 | fine |
| Double Wobble | −17.1 (the same) | −39 dB | ×1 | fine |

## Problems

1. **A synced free LFO jumps when its note value or the tempo changes.** The engine locks the LFO to the beat again at once, and a new oscillator takes over mid-cycle (issue 112's lock). On the Volume it clicks:
   - The Demo's Tremolo Keys switches from 1/8 to 1/16 at bar 6. The player sets the note value when the bar line comes into its 150 ms look-ahead, 110 to 150 ms early, so the tremolo leaves 1/8's phase for 1/16's in the middle of a chord. The sound drops from −25.8 to −37.1 dBFS within 6 ms, a bend ×16 (0.0027). 1.19.0's change of Hz there bent ×1.
   - Turning the note value by hand while a chord sounds, Tremolo Keys synced at 1/8 with Depth 0.8: ×5 to ×121 (up to 0.024), the level stepping by up to 8 dB in 6 ms. Setting the tempo by one BPM, or by a Tap, under it: ×14 to ×42. The same move with Sync off bends ×1.
   - Wobble and Double Wobble, retriggered on each Note, are not locked and change smoothly (×1).
2. **The Cutoff clamp adds a Resonance peak at 20 kHz.** Before, the Cutoff passed Nyquist and the low-pass was flat at the top. Now it stops at 20 kHz and its Resonance peaks there, so a resonant Preset's top Harmonics get louder. Issue 166 says they lose 0.2 to 3 dB. Screamer's 19th Harmonic on C6 (19.9 kHz) is 20 dB louder in the attack, 13 dB under its loudest Harmonic. Its 9th on C7 (18.8 kHz) is 12.6 dB louder for as long as the Note is held, and its C7 peak goes from 0.22 to 0.27. Analog Drift Lead gains 6.9 dB and Glide Slide 2.9 dB at 18.8 kHz on C7. That is fizz at the edge of hearing, louder for younger ears, and only on the top octave. No Harmonic loses more than 0.2 dB, apart from Pick Pluck's 8th on C7, 46 dB under the loudest.
3. **Riser on C7 plays ultrasound.** Its Filter Envelope takes the high-pass past the top with Key Track at full. In 1.19.0 the Note fell silent from about 3 s to the Release. In 1.20.0 the high-pass held at 20 kHz passes what is above it, as the Response Curve draws, so the last four seconds play at −27 dBFS with 65 % of that energy above 20 kHz. What can be heard is a faint hiss, and the speakers get the rest. C6 and below are unchanged.
4. **Talking Filter is 4 dB quieter on C2** than in 1.19.0 (−26.0 against −22.0 dBFS), 3.7 dB under its group there. That is inside the 6 dB line, so it doesn't go to the inbox.

Not problems: Portamento's afresh strike is brighter than its first (3.5 % above 5 kHz against 0.2 % on C4) because it glides down from the last Note, which a Glide on every Note does by design. Tremolo Keys' tremolo now lands on the beat, so its 1.20.0 render differs from 1.19.0's by −7 dB and its loudest 100 ms is 1.1 dB higher: that is the phase, not the level. Wobble and Double Wobble play as before, with −28 and −39 dB of difference (rounding in the Rate's taper) and the same level. No render of any Preset reaches 0.8 or holds a NaN, on either engine.

## Three for the inbox

- A synced free LFO jumps to its new phase when its note value or the tempo changes under a Note: the Demo's Tremolo Keys clicks at bar 6 (×16, 0.003, an 11 dB drop in 6 ms), by hand up to ×121, and one BPM step or Tap up to ×42.
- The Cutoff held at 20 kHz adds a Resonance peak there: Screamer's top Harmonic +20 dB in the attack on C6 and +12.6 dB held on C7, Analog Drift Lead +6.9 dB and Glide Slide +2.9 dB on C7, against issue 166's "lose about 0.2 to 3 dB".
- Riser on C7 now plays its last four seconds at −27 dBFS, 65 % of it above 20 kHz, where 1.19.0 fell silent.
