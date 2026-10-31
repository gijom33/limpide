# 145: The C16 layout, strip by strip

**What to build:** A new built-in layout for the TempoPAD C16, from profile 17's review ([report](../reviews/2026-10-31/17-midi-mapping-geek.md)) and the owner's real C16: each strip of the panel (two knobs, a fader, the M, S and R buttons) a column of its section on screen, so a player finds a control without looking. It replaces [34](./34-c16-bank-layout.md)'s layout, and comes with a one-page card to print and keep beside the C16.

**Blocked by:** none. Built before [112](./112-tempo-midi-clock-and-an-arpeggiator.md) and [119](./119-legato-mode.md) at the owner's word (2026-10-31: "implement 145"): their places (bank D's R2 and R4 for Sync, bank C's R2 for Legato) are kept free, and each of those issues fills its own

**Status:** ready-for-agent · enhancement. In v1 ([131](./131-v1.md)), replacing 34's layout. Grilled with the owner, 2026-10-31.

## The C16, as the owner's device shows it (2026-10-31)

- The panel: knobs K1–K4 over K5–K8, faders F1–F4 under them, and under each fader the buttons M, S and R (M1–M4, S1–S4, R1–R4); then 16 pads, and the bank buttons A to D (with CTRL BANK).
- The buttons' CCs count down each strip, then across: bank A's M1 49, S1 50, R1 51, M2 52 … R4 60; each bank 12 more.
- Knobs K1–K8 are CC 1–8 across the rows (K5 under K1), faders F1–F4 CC 33–36, each bank the next 8, 4 and 12 (the user guide V1.0, its companion software's pages).
- The knobs send positions as the owner's C16 is set ([144](./144-c16-knobs-taken-for-relative.md)); the companion editor also offers Relative #1, #2 and #3, which the V1.0 guide does not explain. The owner's test: Relative #1 is centred on 64, sending 65 or 66 turning right and 63 or 62 turning left, two steps when turned fast. Limpide already reads that style (64-centred, with the turn's speed).
- Every button can be set on the device to toggle or momentary; the owner's are all toggles today. Momentary sends 127 on press and 0 on release; toggle sends one message per press, 127 and 0 in turn (the guide).
- Over Bluetooth MIDI it is "Synido TempoPAD C16 BT Bluetooth" ([143](./143-bluetooth-midi.md)).

## Decisions so far

1. **Hold and the Preset arrows are momentary buttons;** the owner will set those buttons so on the C16 once the layout is decided. Decided by the owner, 2026-10-31: "Some buttons like the preeset selector should be a momentary trigger. Same for hold." The other buttons' modes come with the grilling.
2. **A one-page card to print,** showing every bank's knobs, faders and buttons, and each button's mode to set on the device. Decided by the owner, 2026-10-31: "a one pager showing all the settings that I would print and put next to the C16 for reference." Claude's recommendation, open to the owner: made from the layout's own data, so it never disagrees with what Limpide does.

3. **The buttons:** M1 Previous Preset, M2 Next Preset, M3 Freeze, M4 Hold and S3 Snapshot on every bank, all five momentary (Freeze too: a shared toggle would have four lights that disagree; a momentary one lights only under the finger, and the page shows Freeze). Each section's own switches are toggles on its R row and free S places; a button stepping a choice of more than two (a Waveform) is momentary; the free places stay toggles, the factory setting. Profile 17's plan, decided by the owner, 2026-10-31. Stepping a choice from a momentary button needs a change: today such a Mapping does nothing.
4. **The knobs are declared Relative #1** (64-centred), not detected: no Pickup dead zone, no jump after a Preset change. The card says to set every knob to Relative #1. Decided by the owner, 2026-10-31; an ADR beside ADR-0009 records it.
5. **The layout answers the C16 only:** its Mappings hold for messages from the C16's own input, so another Controller's sustain pedal or mod wheel keeps its usual meaning; Mappings made with MIDI Learn still answer any device. Decided by the owner, 2026-10-31.
6. **The card is a page in Limpide,** opened from the MIDI panel and built from the layout's data, printing on one landscape page (A4 or Letter): the four banks drawn as the panel, every place named, each button's mode and the knobs' mode; and a PDF of it for the owner. Decided by the owner, 2026-10-31.

## Agent Brief

**Category:** enhancement
**Summary:** Replace the C16's built-in layout with one where each strip of the panel is a column of its section on screen, the knobs declared Relative, the shared buttons momentary, the layout answering the C16 only; and add a printable one-page card of it.

**Current behavior:** the layout (issue 34) puts each section's controls on its bank in an older order, detects each knob's Encoder Mode from its first turn, treats every button as a toggle, and its Mappings answer any Controller on channel 1. Osc 1 Octave, FM, Ring, Osc 2's Env Amount, Sub Octave, Sub Waveform, Noise Colour and Volume are out of reach.

**Desired behavior:**
- **The places**, by the C16's own names (knobs K1–K8, two rows; faders F1–F4; buttons M, S and R under each fader). CCs: knobs 1–8, faders 33–36, buttons 49–60 counted down each strip (M1, S1, R1, M2 …), each bank the next 8, 4 and 12; all on channel 1.
  - **Every bank:** M1 Previous Preset, M2 Next Preset, M3 Freeze, M4 Hold, S3 Snapshot.
  - **A · Oscillators:** K1 Osc 1 Octave, K2 FM, K3 Ring, K4 Pulse Width; K5 Osc 2 Octave, K6 Semitone, K7 Detune, K8 Osc 2 Env Amount; F1 Osc 1, F2 Osc 2, F3 Noise, F4 Sub (the Mixer's levels); R1 Osc 1 Waveform, R2 Osc 2 Waveform, R3 Noise Colour, R4 Sub Waveform, S4 Sub Octave.
  - **B · Filter:** K1 Cutoff, K2 Resonance, K3 Velocity, K4 Key Track, K5 Env Amount, K6 Mode; F1–F4 the Filter Envelope; R1 Slope.
  - **C · Amp:** K1 Voices, K2 Glide, K8 Volume; F1–F4 the Amp Envelope; R2 Legato.
  - **D · LFO & Envelopes:** K1 LFO 1 Waveform, K2 LFO 1 Destination, K3 LFO 2 Waveform, K4 LFO 2 Destination, K5 LFO 1 Depth, K6 LFO 1 Rate, K7 LFO 2 Depth, K8 LFO 2 Rate; R1 LFO 1 Retrigger, R2 LFO 1 Sync, R3 LFO 2 Retrigger, R4 LFO 2 Sync; faders free.
  - Every other place free.
- **The knobs** are Relative, 64-centred (the C16 editor's "Relative #1": 65 or 66 up, 63 or 62 down, two steps when turned fast), declared, not detected. A stepped choice on a knob steps as today's Relative knobs do.
- **The buttons:** the five shared ones and bank A's R1 and R2 are momentary (an Action or a step on the press, nothing on the release); the switches (Noise Colour, Sub Waveform, Sub Octave, Slope, Legato, Retrigger, Sync) are toggles (each message a press, as today). A momentary button on a choice of more than two steps it on, round to the first; today a momentary Mapping on a choice does nothing.
- **The C16 only:** the layout's Mappings hold for messages from a C16's input (recognised by its name, over USB or Bluetooth); the same CCs from another Controller keep their usual meaning (its sustain pedal, its mod wheel). Mappings made with MIDI Learn or Quick Setup answer any input, as today.
- **Moving to it:** a person whose stored Mappings are the old layout gets the new one (the old layout recognised, not a person's own Mappings); the MIDI panel's "C16 layout" button puts the new one in place at any time.
- **The card:** a page opened from the MIDI panel ("Print C16 card", while a C16 is connected, and from its tip), built from the layout's data so it never disagrees with it: the four banks drawn as the panel (two rows of knobs, the faders, the M, S, R buttons), every place named or marked free, each button marked Momentary or Toggle, and "every knob: Relative #1". It prints on one landscape page, A4 or Letter, in light colours whatever the theme.
- **The record:** an ADR beside ADR-0009 on the knobs declared Relative and the layout answering the C16 only; issue 34's table and the C16's tip in the MIDI panel follow the new layout; the PRD's Further Notes on what the C16 sends corrected.

**Key interfaces:**
- The C16 layout's data, and its Mappings' modes (Relative, momentary, toggle)
- The control surface: a momentary Mapping on a choice; a Mapping tied to an input
- The MIDI inputs: which input a message came from
- The MIDI panel and its tips; a new printable page

**Acceptance criteria:**
- [ ] A unit test per bank: each place's CC gives the right target and mode, every other place free
- [ ] Relative knobs: 65 moves a Parameter one step up, 62 two steps down; a choice steps after its clicks
- [ ] A momentary button fires on 127 and not on 0; a momentary button on a Waveform steps it on, round to the first
- [ ] A message on the layout's CCs from another input (a keyboard's CC 64 or CC 1) does not reach the layout; a MIDI-Learned Mapping still answers any input
- [ ] Stored old-layout Mappings become the new layout; a person's own Mappings are kept
- [ ] The card shows every place of the data and prints on one page, A4 and Letter (an e2e print-size check)
- [ ] Every test passes in Linux's fonts too

**Out of scope:**
- Aftertouch's place ([132](./132-aftertouch.md)), a Tap button ([112](./112-tempo-midi-clock-and-an-arpeggiator.md), [136](./136-following-midi-clock.md)), the faders of bank D
- Sending lights back to the C16

## Decisions (grilling, round 2, 2026-10-31, decided by the owner)

7. **Bank A:** K1–K4 Osc 1 Octave, FM, Ring, Pulse Width; K5–K8 Osc 2 Octave, Semitone, Detune, Env Amount; F1–F4 Osc 1, Osc 2, Noise, Sub (the screen's Mixer order); R1–R4 Osc 1 Waveform, Osc 2 Waveform, Noise Colour, Sub Waveform; S4 Sub Octave. Osc 2's Pulse Width is left to MIDI Learn (3 Presets use it), Glide moves to bank C.
8. **Bank B:** K1–K4 Cutoff, Resonance, Velocity, Key Track; K5 Env Amount under Cutoff; K6 Mode; K7 and K8 free; F1–F4 the Filter Envelope; R1 Slope.
9. **Bank C:** K1 Voices, K2 Glide, K8 Volume over the Release fader; F1–F4 the Amp Envelope; R2 Legato.
10. **Bank D:** LFO 1 on strips 1 and 2, LFO 2 on 3 and 4, Waveform and Destination over Depth and Rate; R1–R4 Retrigger and Sync for each; faders free for now.
11. **Built after 112 and 119,** so Sync and Legato have their places from the start; the card with it. **Since then (2026-10-31):** built first, at the owner's word, the two places kept for 112 and 119 to fill.
12. **The owner's C16 is set:** every knob Relative #1 (2026-10-31). The 22 momentary buttons (M1–M4 and S3 on every bank, R1 and R2 on bank A) are set once this is built: today's layout would read their release as a second press.
