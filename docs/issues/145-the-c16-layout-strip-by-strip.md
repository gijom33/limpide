# 145: The C16 layout, strip by strip

**What to build:** A new built-in layout for the TempoPAD C16, from profile 17's review ([report](../reviews/2026-10-31/17-midi-mapping-geek.md)) and the owner's real C16: each strip of the panel (two knobs, a fader, the M, S and R buttons) a column of its section on screen, so a player finds a control without looking. It replaces [34](./34-c16-bank-layout.md)'s layout, and comes with a one-page card to print and keep beside the C16.

**Blocked by:** none. Built before [112](./112-tempo-midi-clock-and-an-arpeggiator.md) and [119](./119-legato-mode.md) at the owner's word (2026-10-31: "implement 145"): their places (bank D's R2 and R4 for Sync, bank C's R2 for Legato) are kept free, and each of those issues fills its own

**Status:** ready-for-human · enhancement. Built (2026-10-31), not pushed: to try on the owner's C16, its 22 momentary buttons set as the card says. The owner expects some buttons' modes to change after trying.

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
- [x] A unit test per bank: each place's CC gives the right target and mode, every other place free
- [x] Relative knobs: 65 moves a Parameter one step up, 62 two steps down; a choice steps after its clicks
- [x] A momentary button fires on 127 and not on 0; a momentary button on a Waveform steps it on, round to the first
- [x] A message on the layout's CCs from another input (a keyboard's CC 64 or CC 1) does not reach the layout; a MIDI-Learned Mapping still answers any input
- [x] Stored old-layout Mappings become the new layout; a person's own Mappings are kept
- [x] The card shows every place of the data and prints on one page, A4 and Letter (an e2e print-size check)
- [x] Every test passes in Linux's fonts too (the card's spec in Playwright's Linux image; GitHub's Ubuntu runs all at the push)

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
13. **One step a message, however fast the knob turns** (2026-10-31): the owner, trying the knobs at Relative #1, "I think the \"fast mode\" for the knobs is not helpful. The knob in Limpide moves way to fast and creates a disconnect between position and reality." A fast turn's 66 or 62 now moves one step (1 % of the range), as 65 or 63 does, so the knob on screen keeps with the hand. For every Relative Mapping, MIDI-Learned ones too. Decided by the owner; how, Claude's call, open to the owner: if one step is still too fast or too slow for the C16's turn, the step's size is the next tweak.


**Since then (2026-10-31):** decision 13 is undone. The owner found a fast turn then fell short ("If I move the knob fast, it has not moved enough in Limpide"): the C16 sends one message per stretch of turning and packs two when turned fast, so 66 is two real steps, not a speed bonus. Every step counts again, each 1 % of the range: a full turn at a reasonable speed sends about 50 steps, half the range, and the owner tried it and kept it ("Yes 1% seems fine"), finer than one turn end to end, which matters as the C16's knobs send nothing when turned very slowly, in every mode, on its latest firmware (the owner, 2026-10-31). Decided by the owner.

14. **The C16's knobs are paced to the hand** (2026-10-31): the owner's log of one full turn: slow, 46 messages of 65; fast, 136 messages of 66 and 2 of 65 in a third of a second, six times the steps. The C16 accelerates, so a fast turn's messages cannot measure it. Each message of a C16 knob counts as one step in its direction, at most one every 7 ms (a third of a second over 46 steps), with up to 3 at once after a pause, as messages come in bursts: a full turn is about 46 steps, half the range, at any speed. Other Controllers' Relative knobs keep their own steps. Claude's call on the owner's wish that the knob on screen keep with the hand, open to the owner.

15. **One step for each bit of turning** (2026-10-31), replacing decision 14's pacing, which let a burst count three steps and so still accelerated past a speed (the owner: "When the speed reaches a threshold it accelerates too quick"). The owner's log of 1.125 turns from slow to fast shows the C16 sending each bit as one 65 when slow and, past a speed, as a burst of eight 66s a millisecond apart, at the same pace as the bits before: 54 events, 1.125 × 46. So a C16 knob's message within 10 ms of its last belongs to that bit; any other is one step in its direction. Claude's call, open to the owner.

16. **A bit is timed by when its messages arrived** (2026-10-31): decision 15 timed it by when the page handled each message, and a fast turn's messages queue behind a render (17 to 41 ms each), then are handled within a millisecond or two, so separate bits passed for one burst (the owner: "it works at low speed and when going faster, hardly anything happens"). Web MIDI stamps each message on arrival; that stamp is used. The rest of a bit no longer touches the Patch, so a burst draws once, not eight times. Claude's mistake, fixed; open to the owner.

17. **A burst's 66 is an eighth of a step, counted by message, not time** (2026-10-31), replacing decisions 15 and 16: the owner's third log (half a turn slow, 0.625 fast), plotted, shows the bursts reach the page split (1 + 7 messages, 19 ms apart) and merged (two bursts 3 ms apart), so no time rule can tell bits apart; the owner then needed four turns for the full range ("That's ridiculous"). Counted as an eighth each, the three logs give 46, 54 and 47 steps for 1, 1.125 and 1.125 turns. The C16 sends fewer bursts than bits in its fastest turns, so those fall a little short; none runs ahead. Claude's call, open to the owner.

18. **One full turn of a C16 knob sweeps the whole range** (2026-10-31): each bit is 1/46 of the range, so a turn is end to end; decision 13's "Since then" kept 1 % and two turns, which the owner tried and changed: "One turn". Other Controllers' Relative knobs keep 1 % a step. Decided by the owner.

**Since then (2026-10-31):** back to 1 % a bit, a 65 one step and a 66 an eighth, about two turns end to end: the owner, "No let's keep the 1% increment with the 65 message."

**Since then (2026-10-31):** a 66 counts a quarter of a step, not an eighth, the owner's trial ("Make 66 one quarter to see."); the fast turns, which the C16 under-reports, then go further.

**Since then (2026-10-31):** half a step, the owner's next trial ("Make 66 half a step").

## Comments

- 2026-10-31, the owner, turning the C16's knobs (over Bluetooth, on the development server): "There seems to be a delay between the move and the actual impact on screen." Measured with a stand-in C16 in Chromium at 1440 × 900: one message reaches the knob on screen in 17 ms on the built site and 41 ms on the development server, and turns of 20 and 60 messages a second, or 10 at once, leave nothing queued (no long task). So the page keeps up; Bluetooth MIDI's own latency is the likeliest cause, the development server and decision 13's slower fast turn the others. Waiting on the owner's test over USB.

## How it was built

- **The layout's data** (`src/midi/c16.ts`): `C16_BANKS`, each bank's knobs, faders and M, S, R buttons as places with a target and the card's short name; `knobCc`, `faderCc` and `buttonCc` (down each strip, then across); `buttonMode` (toggle for a choice of two, momentary otherwise); `c16Layout()` marks every Mapping `device: 'c16'`, knobs `relative-centred`, faders `absolute`. `upgradeC16Layout` recognises the first layout's Mappings (issue 34's, CC by CC) and swaps them for the new one, keeping a person's own; the MIDI hook runs it whenever a C16 is connected.
- **The C16 alone** (`src/midi/inputs.ts`, `src/midi/controlSurface.ts`, `src/ui/hooks/useMidi.ts`): each message comes with its Controller's name; `handle(message, fromC16)` skips a `device: 'c16'` Mapping for any other Controller, which then falls through to the keyboard defaults (the sustain pedal, the mod wheel). The bank follow keys on the C16 too.
- **Momentary buttons on choices:** `moveChoice` steps on a press (127) and not on the release (0), round to the first; Actions share the same press detection.
- **The MIDI panel:** modes read Momentary or Toggle, the layout's Mappings say "C16 only", and "Print C16 card" opens the card in a new tab; the C16 layout's tip describes the strips.
- **The card** (`src/ui/C16Card.tsx`, its styles at the end of `src/styles.css`): `#c16-card` renders it instead of the app (`src/main.tsx`); one landscape sheet, light whatever the theme. `npm run c16-card` (with `npm run dev` running) prints it to `docs/c16-card.pdf` (A4) and `test-results/c16-card-letter.pdf`, each checked to be one page; `e2e/c16Card.spec.ts` checks the same in A4 and Letter.
- **The record:** [ADR-0017](../adr/0017-the-c16-layout-strip-by-strip.md), ADR-0009's Status line, the PRD's Controller facts, issues 34 and 144 superseded by this one, 112 and 119 pointed at their places.
- Not tried on the real C16 yet: the owner's 22 buttons are still toggles, and the layout reads its momentary ones as momentary.
