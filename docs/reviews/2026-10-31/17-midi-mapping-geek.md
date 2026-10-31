# Persona review 17: the MIDI mapping geek

Read: `main` at `007d98f`, about 45 minutes: the C16 layout's data (`src/midi/c16.ts`), the Mappings and their targets (`src/midi/mappings.ts`), the control surface and its keyboard defaults (`src/midi/controlSurface.ts`), Encoder Mode detection (`src/midi/encoderMode.ts`), the MIDI inputs (`src/midi/inputs.ts`), every Parameter and choice (`src/patch/patch.ts`), the section components (`src/ui/App.tsx`, `src/ui/LfoControls.tsx`), ADR-0004 and ADR-0009, issue 34, the PRD's MIDI stories and Further Notes, issues 112, 119, 132 and 136, and `CONTEXT.md`. The live site (1.18.0) at 1440 × 900 and 390 × 844, in Playwright Chromium, for where each control sits on screen. The C16 itself from reviews and the owner's facts of 2026-10-31. No hardware: the owner tries the result on the real C16. 2026-10-31.

## The C16, as far as it is known

| Fact | Where it comes from |
|---|---|
| Left half, four strips. Each strip, top to bottom: a knob of the top row (K1–K4), a knob of the second row (K5–K8), a fader (F1–F4), then three buttons: M, S, R (M1–M4, S1–S4, R1–R4) | The owner's product photo, 2026-10-31. Reviews agree: "four columns of knobs, faders, and buttons" ([Guitar Gear Finder](https://guitargearfinder.com/reviews/synido-tempopad-c16/)), M, S and R "just below the faders" ([We Rave You](https://weraveyou.com/2026/05/synido-tempopad-c16-review/)) |
| A big orange endless knob, an OLED and a four-way cross at the top left; 16 pads and the function buttons (CTRL BANK, A–D, TAP TEMPO, OCT−/OCT+, transport) on the right | The owner's photo |
| Channel 1; knobs K1–K8 from CC 1, faders F1–F4 from CC 33, buttons from CC 49, each bank after the last (A, B, C, D) | The owner, 2026-10-25 (PRD Further Notes) |
| The code counts a bank's 12 buttons as M1–M4, S1–S4, R1–R4: bank A's M1 = CC 49, S1 = CC 53, R1 = CC 57 | The owner's naming, 2026-10-31. **Not yet checked on the OLED** (question 1) |
| The knobs are endless but send **Absolute** positions (0–127). The owner's MIDI panel shows K1–K6 as "Absolute, with Pickup" | The owner's screenshot, 2026-10-31. Synido's own page lists "Add relative encoder knob functionality (three modes)" as a plan for end-2025 ([midi.org listing](https://midi.org/?p=5040)), so the factory firmware sent positions. The PRD's "endless (Relative)" is wrong |
| Each button can be a toggle or momentary on the device. All of the owner's are toggles | The owner, 2026-10-31 |
| The device remembers each bank's button states | A user on the [Loopy Pro forum](https://forum.loopypro.com/discussion/67977/synido-tempopad-c16) ("remembers the button states when I switch back"). Not confirmed by the owner |
| The pads send channel aftertouch | [AltWire](https://altwire.net/synido-tempopad-c16-review/), [We Rave You](https://weraveyou.com/2026/05/synido-tempopad-c16-review/) |

No Synido manual could be found online (synido.com refused automated reads), so the factory settings come from the owner alone.

## First impression

"It's a good idea: a bank per section, so CTRL BANK B means the Filter and the page scrolls there. But it reads like a list poured into slots, not a panel. Previous Preset is on M4 and Next Preset on S1, so one is top right and the other is a row down at the far left. The Mixer faders say Sub then Noise, but the screen says Noise then Sub. Bank A spends a knob on Glide, which lives in the Amp on screen. Bank C has seven empty knobs and still doesn't reach Volume. And when I turned K7 it ran backwards."

## What they examined

1. The layout's data against the C16's strips: which knob, fader and button sits over which.
2. Every Parameter and choice in the Patch against the layout: what it reaches and what it doesn't.
3. Each section on screen at 1440 × 900: its rows, left to right. Then at 390 × 844, where the sections stack and the LFOs go one under the other.
4. How a message reaches a Mapping: by channel and CC alone, from any input (`connectMidi` throws the port away before `handle`).
5. What a knob does on its first turn (`detectKnobMode`), and what a button does (`toggle`: act on every message).
6. The controls on their way: Sync (112), Legato (119), aftertouch (132), MIDI clock (136).

## What works

- **A bank per section** stays right. CTRL BANK is a hardware switch the hand learns fast, and the page following the bank on the first touch is the best part of the layout.
- **Envelopes as four faders,** Attack to Release from left to right, the way most hardware synths lay out their ADSR sliders (from experience, not checked against a source). It is right on banks B and C.
- **The Actions on every bank:** Hold never needs a bank switch.
- **Free places kept free:** better than filling them with anything.
- **The C16 is recognised by name,** over USB and over Bluetooth ("Synido TempoPAD C16 BT Bluetooth").

## Where it trips a player

1. **K7 and K8 run wrong.** The knobs send positions, but the layout lets each knob guess its Encoder Mode from its first three values. Three values all within 15 of 64 (other than 64) count as 64-centred Relative, and three within 15 of 0 count as two's-complement. A knob the device holds at 58 that is turned up sends 59, 60, 61, which reads as "−5, −4, −3 steps", so it moves down while it is turned up, until it passes 64. A knob held near the bottom sends 3, 4, 5, which reads as "+3, +4, +5": it only goes up, faster and faster, whichever way it is turned. The guess is stored, so it stays wrong until the layout is put back. The owner's K7 and K8 were guessed Relative.
2. **Another keyboard on channel 1 drives the layout.** A Mapping matches channel and CC from any input. With a keyboard beside the C16:
   - its sustain pedal (CC 64) is bank B's M4, Previous Preset, and a toggle Mapping acts on every message, so one press of the pedal goes back two Presets;
   - its mod wheel (CC 1) is bank A's K1, the Osc 1 Waveform;
   - an expression pedal (CC 11) is bank B's K3;
   - an MPE keyboard's CC 74 is bank C's M2.

   Synth players almost always run a keyboard and a control surface side by side.
3. **The Preset buttons are split.** Previous is M4 (top right) and Next is S1 (second row, far left). Every other pair of ‹ › buttons sits side by side, including the page's own.
4. **Bank A is full of the wrong things.** It gives two knobs to Waveforms, which the screen shows as rows of buttons, and one to Glide, which is in the Amp on screen. A turn of K8 brings the Oscillators into view, so the moving Glide knob is off screen on a phone. Meanwhile Osc 1's Octave, FM, Ring, Env Amount and the three Sub & Noise switches are out of reach.
5. **Screen order is not kept.** On bank B, Env Amount sits between Resonance and Velocity. On bank D the order is Rate, Depth, but the screen has had Depth first, then Rate, since the owner's call of 2026-10-28. The Mixer faders put Sub before Noise.
6. **Retrigger is on S2 and S3, and issue 112 adds Sync on S4 and R1.** That spreads one LFO's two switches over two rows and two strips.
7. **When the layout isn't applied, the C16 falls through to the keyboard defaults.** With older Mappings stored, K1 on bank A turns LFO 1's Depth (the mod-wheel default; the owner hit this today), and bank B's M4 flips the sustain pedal, so Notes hang until the next press.
8. **Lights can disagree.** With toggles, each bank's Hold button has its own light (if the device keeps them per bank), so Hold can be on with bank B's light off. A Preset that changes Retrigger leaves its light as it was. Next Preset's light flips on every other press and means nothing. Limpide sends no MIDI back, so it can't correct the lights.

## The proposal

**Rules:**

- Each strip is a column of the screen and each knob row is a row of the screen, so the top row is K1–K4 and the second row is K5–K8, with the faders under them.
- Levels and Envelopes go on the faders. A choice of two goes on a toggle button, whose light shows it. Longer lists go on knobs, except on bank A, where the knobs run out and a button steps through the list, as the screen's Waveform buttons do.
- The M row is the Actions on every bank, in the page's order: the Preset arrows first (top left on the page), Hold last (top right). Snapshot goes under Freeze.
- The R row holds the section's switches, under the strip they belong to.

Every CC below assumes question 1's answer (M1 = 49, S1 = 53, R1 = 57 on bank A).

### Buttons on every bank: the Actions

| Place | Bank A, B, C, D CC | Proposed | Today | Why |
|---|---|---|---|---|
| M1 | 49, 61, 73, 85 | Previous Preset | Hold | The page's ‹, top left |
| M2 | 50, 62, 74, 86 | Next Preset | Freeze | Beside its pair, as the page's › |
| M3 | 51, 63, 75, 87 | Freeze | Snapshot | The Viewers' actions together |
| M4 | 52, 64, 76, 88 | Hold | Previous Preset | Hold is top right on the page. Side effect: on CC 64 (bank B), a sustain pedal from another keyboard now means Hold while it's pressed rather than two Presets back. This is no fix for finding 2 (a half-pedal sends many values) |
| S1 | 53, 65, 77, 89 | free (for Tap, if issue 112 wants one and the C16's own TAP TEMPO sends no clock; question 5) | Next Preset | The same place on every bank, for a global control |
| S3 | 55, 67, 79, 91 | Snapshot | free (LFO 2 Retrigger on bank D) | Under Freeze, its partner |

### Bank A · Oscillators

The page shows the Oscillators in tabs. Osc 1's tab has the Waveform and Pulse Width in its first row and Octave and FM in its second. Osc 2's tab has the Waveform and Pulse Width in its first row and Octave, Semitone, Detune and Env Amount in its second. The Mixer tab has Osc 1, Osc 2, Ring, Noise and Sub. On the C16, the top row is Osc 1 and what Osc 2 does to it, and the second row is Osc 2's Tuning row exactly. Each fader has its source's switches under it.

| Place | CC | Proposed | Today | Why |
|---|---|---|---|---|
| K1 | 1 | Osc 1 Octave | Osc 1 Waveform | Over Osc 2's Octave: the two Octaves in one strip |
| K2 | 2 | FM | Pulse Width | Osc 1's second-row knob on screen; over Semitone, which sets FM's ratio |
| K3 | 3 | Ring | Osc 2 Waveform | Osc 1 times Osc 2, beside FM. A level on a knob because bank A has four faders and five levels |
| K4 | 4 | Osc 1 Pulse Width | Osc 2 Octave | Right of the Waveform on screen, as here |
| K5 | 5 | Osc 2 Octave | Osc 2 Semitone | The screen's Tuning row, in order |
| K6 | 6 | Osc 2 Semitone | Osc 2 Detune | " |
| K7 | 7 | Osc 2 Detune | Osc 2 Pulse Width | " |
| K8 | 8 | Osc 2 Env Amount | Glide | " (Glide to bank C, where the screen has it) |
| F1 | 33 | Osc 1 | Osc 1 | |
| F2 | 34 | Osc 2 | Osc 2 | |
| F3 | 35 | Noise | Sub | The screen's order: Noise before Sub |
| F4 | 36 | Sub | Noise | " |
| S2 | 54 | free | free | Kept for the Oscillators' growth |
| S4 | 56 | Sub Octave | free | Under the Sub fader; one of two (−1, −2), its light shows −2 |
| R1 | 57 | Osc 1 Waveform | free | Under Osc 1's fader; a press steps to the next of five |
| R2 | 58 | Osc 2 Waveform | free | Under Osc 2's fader |
| R3 | 59 | Noise Colour | free | Under the Noise fader; white or pink |
| R4 | 60 | Sub Waveform | free | Under the Sub fader; square or sine |

Left off the C16: **Osc 2 Pulse Width**. Bank A has one place too few. It is the one used least (3 Presets, against Env Amount's 7 and Ring's 10), and it only matters with a Pulse wave. MIDI Learn reaches it. This is Claude's call, open to the owner. The other choice is Env Amount off and Osc 2 Pulse Width on K8, which breaks the Tuning row.

### Bank B · Filter

On screen, the first row is Mode and Slope. The Cutoff row is Cutoff, Resonance, Velocity, Key Track. The Envelope row is Amount (under Cutoff), then Attack, Decay, Sustain, Release.

| Place | CC | Proposed | Today | Why |
|---|---|---|---|---|
| K1 | 9 | Cutoff | Cutoff | |
| K2 | 10 | Resonance | Resonance | |
| K3 | 11 | Velocity | Env Amount | The screen's Cutoff row, in order |
| K4 | 12 | Key Track | Velocity | " |
| K5 | 13 | Env Amount | Key Track | Under Cutoff, as on screen, and over the Envelope's faders |
| K6 | 14 | Filter Mode | Filter Mode | Four modes: a list, so a knob |
| K7 | 15 | free | Slope | Kept for the Filter's growth |
| K8 | 16 | free | free | " |
| F1–F4 | 37–40 | Filter Attack, Decay, Sustain, Release | the same | |
| S2, S4 | 66, 68 | free | free | |
| R1 | 69 | Slope | free | 12 or 24 dB: a choice of two, lit at 24 |
| R2–R4 | 70–72 | free | free | |

### Bank C · Amp

On screen, the first row is Voices then Glide, and the Envelope row is Attack, Decay, Sustain, Release, then Volume.

| Place | CC | Proposed | Today | Why |
|---|---|---|---|---|
| K1 | 17 | Voices | Voices | Eight values: a knob |
| K2 | 18 | Glide | free | Beside Voices, as on screen; from bank A |
| K3–K7 | 19–23 | free | free | The Amp has nothing else to turn; kept |
| K8 | 24 | Volume | free | Right of the Envelope on screen, here over the Release fader. Not reached today |
| F1–F4 | 41–44 | Amp Attack, Decay, Sustain, Release | the same | |
| S2, S4 | 78, 80 | free | free | |
| R2 | 82 | Legato (issue 119) | free | In Glide's strip, as the screen puts it beside Glide |
| R1, R3, R4 | 81, 83, 84 | free | free | |

### Bank D · LFO & Envelopes

At 1440 the LFOs sit side by side, LFO 1 on the left and LFO 2 on the right. Each has two rows: Waveform and Destination, then Depth, Rate and Retrig. The C16's left two strips become LFO 1 and its right two LFO 2, so the panel reads like the screen. The C16 is played with a computer, since no iPhone browser has Web MIDI, so the screen it mirrors is the wide one.

| Place | CC | Proposed | Today | Why |
|---|---|---|---|---|
| K1 | 25 | LFO 1 Waveform | LFO 1 Waveform | LFO 1's first row |
| K2 | 26 | LFO 1 Destination | LFO 1 Rate | " |
| K3 | 27 | LFO 2 Waveform | LFO 1 Depth | LFO 2's first row |
| K4 | 28 | LFO 2 Destination | LFO 1 Destination | " |
| K5 | 29 | LFO 1 Depth | LFO 2 Waveform | Depth, then Rate (the owner, 2026-10-28). The knobs played most, on the row nearest the hand |
| K6 | 30 | LFO 1 Rate | LFO 2 Rate | " |
| K7 | 31 | LFO 2 Depth | LFO 2 Depth | " |
| K8 | 32 | LFO 2 Rate | LFO 2 Destination | " |
| F1–F4 | 45–48 | free | free | Kept. The LFOs have no faders on screen. If the owner wants them used, the BPM (issue 112) or both Depths ridden like mod wheels are the candidates |
| S2, S4 | 90, 92 | free | LFO 1 Retrigger (S2) | |
| R1 | 93 | LFO 1 Retrigger | free | Under LFO 1's strips, as Retrig follows Rate on screen |
| R2 | 94 | LFO 1 Sync (issue 112) | free | Beside its Retrigger, as issue 112 puts the switch on screen |
| R3 | 95 | LFO 2 Retrigger | free (S3 was LFO 2 Retrigger) | Under LFO 2's strips |
| R4 | 96 | LFO 2 Sync (issue 112) | free | Beside it |

### Not on the C16, on purpose

- **The aftertouch Destination (issue 132):** chosen once in the MIDI panel. The C16's pads send the pressure themselves.
- **The BPM (issue 112):** in the header, and MIDI Learn reaches it. If the C16 sends MIDI clock (question 5), issue 136 makes its own TAP TEMPO and PLAY drive it.
- **Osc 2 Pulse Width:** see bank A.
- **The keyboard's octave:** the C16's OCT−/OCT+ already move the pads' Notes.

### Knob and button settings the layout should expect

- **Knobs: declare Absolute, don't detect.** The owner's C16 sends positions, and the factory firmware had no Relative mode. A guess from three values can't tell a knob near the middle from a 64-centred encoder (finding 1), and a wrong guess makes a knob run backwards, which is worse than any Pickup wait. With Pickup, the OLED shows the knob's value and the page shows the Parameter's, so the player can see which way to turn. If the owner's firmware offers a Relative mode (question 2), it would be better on endless knobs, with no Pickup at all, but the layout should then declare that one mode, since ADR-0009 assumes the device as set. Either way this reverses ADR-0009's "the knobs' Relative format is not assumed", so it needs a new ADR.
- **Buttons: expect toggles, as the factory and the owner's C16 send.** Toggles are right for the R row's switches, whose light shows the state. Momentary would suit the M row's Actions better, since a light on Next Preset means nothing, but asking owners to reset twelve buttons a bank is the opposite of "works the moment it is plugged in".
- **Don't detect the button mode live in the layout.** A momentary press sends 127 and then 0. Two quick presses of a toggle send the same pair, and quick presses are what Hold's tapped rhythm is made of. A wrong guess fires an Action twice or every other time.
- **Do detect it in MIDI Learn,** where one deliberate press is expected. If a 0 follows the 127 while learning, the button is momentary ('trigger'). If nothing follows within about half a second, it is a toggle ('toggle'). That would end issue 34's known limit, where a relearned C16 button acts on every other press.

## Findings, ranked

1. The C16's knobs send Absolute positions, but the layout lets each guess its Encoder Mode, and a knob near 0 or the middle is taken for Relative and runs backwards or one way only (K7, K8 on the owner's C16): declare the knobs Absolute (a new ADR beside ADR-0009).
2. The C16 layout answers any Controller on channel 1: a keyboard's sustain pedal (CC 64) is bank B's M4, Previous Preset, which fires on press and release; its mod wheel (CC 1) steps bank A's Waveform; CC 11 and CC 74 hit bank B's K3 and bank C's M2. Tie the layout's Mappings to the C16's input.
3. Previous Preset (M4) and Next Preset (S1) sit apart on the panel: put the Actions on the M row as the page orders them: Previous, Next, Freeze, Hold, with Snapshot under Freeze (S3).
4. Bank A gives knobs to two Waveforms and Glide while Osc 1 Octave, FM, Ring, Env Amount and the Sub & Noise switches are unreached: the Waveforms and switches go to the R row under their faders, Glide to bank C.
5. A choice of two (Slope, Sub Octave, Sub Waveform, Noise Colour, Retrigger, Sync, Legato) belongs on a toggle button, whose light shows it; lists stay on knobs.
6. Bank D's knobs don't read as the screen does: put LFO 1 on the left two strips and LFO 2 on the right, Waveform and Destination over Depth and Rate.
7. Issue 112 puts LFO Sync on bank D's buttons 8 and 9 (S4 and R1, apart from Retrigger): make R1–R4 LFO 1 Retrigger, LFO 1 Sync, LFO 2 Retrigger, LFO 2 Sync.
8. Bank B puts Env Amount between Resonance and Velocity: K1–K4 as the screen's Cutoff row, Env Amount on K5 under Cutoff, Slope to a button.
9. The Mixer faders put Sub before Noise; the screen puts Noise before Sub.
10. Volume is unreached while bank C has seven free knobs: K8, over the Release fader, as on screen.
11. A C16 seen with other Mappings stored gets no layout and falls through to the keyboard defaults (K1 to LFO 1 Depth, bank B's M4 to the sustain pedal): offer the layout then, and keep C16 messages out of the keyboard defaults.
12. MIDI Learn maps every Action button as momentary: detect toggle or momentary from the one press it learns from.
13. The PRD's Further Notes say the C16's encoders are "endless (Relative)": they send Absolute positions on the owner's device.
14. A toggle button's light can disagree with what it switches (each bank's own Hold light, Retrigger after a Preset change), and Limpide sends nothing back: worth a line in the MIDI panel's tip.

## Questions for the owner

1. **The button CCs, on the OLED:** on bank A, press M1, S1 and R1. Today's tables assume CC#049, 053 and 057. Then turn K5 and move F1: CC#005 and CC#033? A different order reorders the tables.
2. **K7's raw values:** turned slowly up, does it count (61, 62, 63…) and stop at 127? Which firmware is it on, and does the edit mode (hold the orange knob, touch a knob) offer a Relative mode?
3. **The orange knob and the four-way cross:** do they send MIDI in CUSTOM mode? A ninth knob would be a fine home for Volume or the BPM.
4. **The lights:** does each bank keep its own button lights? Does a toggle light follow only the presses, or also values sent back to the C16?
5. **Clock:** does the C16 send MIDI clock, Start and Stop (from PLAY or TAP TEMPO) over USB and Bluetooth? Does TAP TEMPO send anything else? This settles whether S1 needs a Tap (issues 112 and 136).
6. **Aftertouch:** do the pads send channel pressure in KEYBOARD mode? The MIDI panel's Activity Monitor will show it once issue 132 lands.
7. **USB and Bluetooth together:** with both connected, does Limpide list two C16s and receive each message twice? If so, every toggle Action cancels itself out.
