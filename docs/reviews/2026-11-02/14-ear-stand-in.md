# Review 14: the ear stand-in

Rendered offline in Chromium through `createSynthEngine` (OfflineAudioContext, 48 kHz, velocity 1), in Vitest's browser mode with the engine project's set-up, with the safety limiter's curve swapped for a straight line so the numbers are what reaches it. Changes made during a render (a knob, a tempo, a pressure) were made at their moment, the render suspended there. 1.21.0 changes the sound of five Presets, whose LFOs became note values (issue 137: Wobble, Double Wobble, Growl, Trance Gate, Stutter), and the words of two (issue 139: FM Bass, Poly Mod Zap). All seven were rendered on C2, C4, C6 and C7 (MIDI 36, 60, 84, 96), held for their Attack and 1.2 s and then released, through 1.21.0's engine and through v1.20.0's (taken from the tag, with its own Presets), and compared sample by sample; Trance Gate also as a chord (C4 E4 G4). The five synced Presets were then played at 90, 120, 140 and 174 BPM, Notes on the beat, to hear whether the wobble keeps to it. The Wobble Tutorial was played through, each step taken in the middle of a held Note of its Listen loop. Two engine changes reach every Patch: aftertouch (issue 132), rendered at no pressure and at full pressure on the Cutoff and the Resonance of resonant Presets; and the MIDI clock (issue 136), reached by feeding the clock follower ticks a little off a whole BPM, a little late or early, and handing its tempo to the engine on each beat, as the tempo store does.

How to read the tables. **Peak** is the largest sample in any of a Preset's renders; the limiter bends anything above 0.8. **RMS** is the loudest 100 ms on C4, in dBFS, and **vs group** compares it with the median of the rest of its group. **Worst click** is the largest sample-to-sample bend (second difference) in the 5 ms after a Note starts, is released, changes or a knob jumps, as a multiple of the largest bend in the steady sound beside it. Bends under 0.001 are left out. **> 5 kHz** is the largest share of energy above 5 kHz across the four Notes. **DC** is the worst mean level while the Gate is open. **Difference** is the 1.21.0 render minus the 1.20.0 one, against the 1.20.0 one, in dB.

## The seven changed Presets

| Preset | Group | Voices | Peak | RMS (C4) | vs group | Limiter | Worst click | > 5 kHz | DC | Difference | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Wobble | Bass | 1 | 0.42 | −13.9 | +0.6 | no | ×0.6 | 0 % | −71 | identical | fine |
| Double Wobble | Bass | 1 | 0.47 | −14.4 | +0.1 | no | ×0.5 | 0 % | −63 | −107 or lower | fine |
| Growl | Bass | 1 | 0.69 | −14.6 | −0.2 | not on these four Notes (see 1) | ×237 (0.002, C6 release: the square's own step) | 0 % | −67 | −116 or lower | check |
| Trance Gate | Pads | 8 | 0.18 (chord 0.32) | −25.2 (chord −21.0) | −2.0 | no | ×0.2 | 0.1 % | −70 (chord) | −131 or lower | fine |
| Stutter | Movement & Effects | 1 | 0.55 | −21.2 | +0.9 | no | ×0.2 | 0 % | −68 | identical | fine |
| FM Bass | Bass | 1 | 0.44 | −15.9 | −1.5 | no | ×56 (0.004, C2 start, as in review 14 of 2026-10-30) | 0 % | −64 | identical | fine |
| Poly Mod Zap | Leads | 1 | 0.47 | −17.7 | +0.2 | no | ×1 | 0.1 % | −65 | identical | fine |

Group medians on C4 (the rest of the group): Bass −14.5, Leads −17.9, Pads −23.2, Movement & Effects −22.1 dBFS. No render holds a NaN, and every one falls silent after its Release.

At the page's own 120 BPM the five synced Presets play exactly as before: each note value is the Hz it replaces at 120 (1/4 T is 3 Hz, 1/4 is 2, 1/8 is 4, 1/16 is 8), and Growl, the one that runs freely, counts its beats from where its LFO used to start. FM Bass and Poly Mod Zap changed only in words and render bit for bit as in 1.20.0. Growl's ×237 is its square's step on the Cutoff landing in the 5 ms after the Note's release on C6, the same in 1.20.0.

## At other tempos, and on the beat

| Preset | Note value | Loudest 100 ms, 90 / 120 / 140 / 174 BPM | Period, measured against the note value | Lag behind the beat | Verdict |
|---|---|---|---|---|---|
| Wobble | 1/4 T, retriggered | −17.0 / −17.1 / −17.2 / −17.1 | within 1 % | 18 / 13 / 11 / 8 ms | fine |
| Double Wobble | 1/4 and 1/16, retriggered | −17.6 / −17.2 / −17.3 / −17.6 | within 1.4 % | 8 to 9 ms | fine |
| Growl | 1/8, free | −16.0 / −15.9 / −15.8 / −16.2 | within 1 % | 5 to 8 ms | fine |
| Trance Gate | 1/16, retriggered | −23.6 / −25.2 / −25.8 / −26.0 | exact | 5 to 6 ms | fine |
| Stutter | 1/16, retriggered | −25.3 / −25.8 / −22.2 / −25.1 | within 1 % | 6 to 8 ms | fine |

The lag is where the brightness of the sound best matches the LFO's own wave drawn on the beat grid (a correlation of 0.77 to 0.94). Five to nine milliseconds is the 24 dB Filter's delay and the measuring window, the same at every tempo, and far under what is heard as late. Wobble's sine lags by a steady 4 % of its cycle: its brightness peaks a little after the LFO does, as a resonant Filter rising and falling is not symmetric. Its "wub" has no sharp front, so 18 ms at 90 BPM does not read as off the beat. A square LFO on the Volume (a probe, a sine through it) switches 4 ms after the grid at 122 BPM, every switch within 0.5 ms of the others. No tempo moves a level by more than 3.6 dB (Stutter's loudest 100 ms, which falls on the chop differently at each tempo).

## The Wobble Tutorial

Its end Patch is the Wobble Preset but for the keyboard octave, which the Bass group sets. Every step, taken in the middle of a held A2 at its 120 BPM, bends ×1 or less. Sync coming on with the LFO at 3 Hz free bends ×0.1; it is pulled onto the beat rather than jumping. The note value turned to 1/4 T ×0.2, Retrigger ×0.7. The Demo's Wobble and Double Wobble parts set their own note values: their first two bars render as in 1.20.0 (identical, and −115 dB).

## Aftertouch (issue 132)

**At no pressure nothing changes.** Pressure set to nothing on the Cutoff, then the Resonance, then Pitch, during a held Note, renders as the same Note with no pressure ever sent, to −128 dB or lower, on Init, Acid, Screamer, Self-Oscillation, Tremolo Keys, Talking Filter, FM Bass and Poly Mod Zap. Each of those also renders as in 1.20.0, to −119 dB or lower.

**At full pressure.** A held C3, pressed to full and let go, as a jump, as a hard press (ten messages over 30 or 100 ms) and as a slow one (all 127 steps over 300 ms):

| Preset | Destination | Level, unpressed → pressed | Peak | Worst bend while pressing, against the steady sound | Steps against ten times finer |
|---|---|---|---|---|---|
| Acid | Cutoff | −17.7 → −21.6 | 0.37 | ×0.8 to ×1 | −28.5 dB |
| Acid | Resonance | −17.7 → −14.7 | 0.39 | ×1 | −49.2 dB |
| Screamer | Cutoff | −18.8 → −23.3 | 0.65 | ×1 (jump), ×1.6 (pressing through) | −29.5 dB |
| Screamer | Resonance | −18.8 → −19.3 | 0.65 | ×1 | −51.9 dB |
| Wobble | Cutoff | −15.9 → −19.2 | 0.42 | ×0.6 | −30.2 dB |
| Wobble | Resonance | −15.9 → **−7.8** | **0.89** | ×1 | −45.3 dB |
| Self-Oscillation | Cutoff | −18.9 → −22.7 | 0.29 | ×0.7 | −24.4 dB |

No step clicks: none bends more than the sound does held on either side. Even a jump from nothing to full doesn't, the Filter moving two octaves at once. Screamer's ×1.6 comes only while pressing through the middle, not on the jump: a Cutoff partway up rings on a Harmonic, brighter than either end. The pressure is applied unsmoothed, as a turned knob is: each step sets the Cutoff at once. The last column renders the slow press again in 1,270 steps and compares the two. On the Cutoff they differ by −24 to −30 dB, the most on Self-Oscillation, whose singing Filter follows each 0.19-semitone step. On the Resonance they differ by −45 dB or less. Pressing the Cutoff opens it and takes the Resonance's peak off the strongest Harmonics, so every resonant Preset gets 3.3 to 4.5 dB quieter under it.

## The MIDI clock (issue 136)

A clock at 121.6 BPM ticking up to 1 ms late or early, at 128 BPM up to 2 ms, and at 97.3 BPM on time; the follower reads 122, 128 and 97, and hands the tempo over on each of the clock's beats (13 to 18 times in 8 s):

- **On the beat.** A synced square on the Volume keeps to the clock's own beats, not the rounded BPM's. The switches come 2.5 to 6 ms after them, every switch within a millisecond of the others, the count exact, with no drift over 8 s. At 97.3 read as 97 the LFO would slip 9 ms a beat on its own; each handover pulls it back.
- **No clicks.** Tremolo Keys synced at 1/8 at Depth 0.8, the case that clicked ×16 to ×121 in the last review when the note value or tempo jumped: no handover bends more than ×1. On Growl, the square's switches next to a handover bend as the others do (0.001 to 0.002, at worst 0.003 against 0.002, with 2 ms of jitter). A first measure that gave ×15 to ×18 was the square's own switch falling in the 5 ms after the handover, as it should on the beat.

## Problems

1. **Growl reaches the limiter, on B2 and from C#5 to G#5.** The square LFO drops the Cutoff of a resonant 24 dB Filter at once, and the Filter rings over: the samples past 0.8 all come 4 to 10 ms after a downward step. B2 peaks at 0.91, F5 and F#5 at 1.22, on 1.20.0 the same to the sample (at 120 BPM the two play alike). At other tempos the steps fall elsewhere in the wave: up to 1.39 at 128 BPM (F5), 1.05 at 97. C2 to C4, where the Bass group's keyboard plays, peaks at 0.6 apart from B2. Not new in 1.21.0, but the four Notes this review used to render missed it.
2. **Aftertouch on Resonance takes Wobble past the limiter.** Full pressure raises its Resonance from 0.65 to the top. The Filter starts to sing, 8 dB louder (−7.8 dBFS), peaking at 0.89. That is what the Destination does by design: at full it is Resonance at 1. But it is the one pressure render that reaches the limiter.
3. **Aftertouch on Cutoff steps, as a knob does.** Unsmoothed, each pressure message sets the Cutoff at once. No step clicks, but on a singing Filter the whistle's pitch follows the steps (−24 dB against ten times finer steps on Self-Oscillation). A keyboard that sends fewer, larger steps would make them larger. This is an ear question, not a measurement one: see below.

Not problems: Wobble's steady 4 % lag (above); the levels' spread across tempos, all under 4 dB; FM Bass's ×56 on the C2 start, as on 2026-10-30 and unchanged. The last review's first problem, a synced free LFO jumping when its note value or tempo changed, is gone. The LFO is now pulled onto the beat (×0.1 when Sync comes on in the Tutorial, ×1 at every clock handover).

No fix was made: nothing measured is both clearly broken and small.

## For the owner's ears before the release

- Self-Oscillation, or Acid, with the MIDI panel's Aftertouch on the Cutoff, pressed slowly and then quickly on a real keyboard: does the whistle glide, or does it step?
- Wobble with Aftertouch on the Resonance at full: wanted, or too loud?

## Two for the inbox

- Growl reaches the limiter on B2 (0.91) and from C#5 to G#5 (up to 1.22 at 120 BPM, 1.39 at 128), 4 to 10 ms after its square drops the resonant Filter's Cutoff; the same in 1.20.0.
- Aftertouch at full on the Resonance takes Wobble to self-oscillation, 8 dB louder and peaking at 0.89, past the limiter's 0.8.
