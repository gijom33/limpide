# 145: The C16 layout, strip by strip

**What to build:** A new built-in layout for the TempoPAD C16, from profile 17's review ([report](../reviews/2026-10-31/17-midi-mapping-geek.md)) and the owner's real C16: each strip of the panel (two knobs, a fader, the M, S and R buttons) a column of its section on screen, so a player finds a control without looking. It replaces [34](./34-c16-bank-layout.md)'s layout, and comes with a one-page card to print and keep beside the C16.

**Blocked by:** the grilling, and the hardware facts below

**Status:** needs-triage · enhancement. In v1 ([131](./131-v1.md)), with 34. To grill with the owner. Claude's call, open to the owner.

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

## To grill

- Each bank's places, from the review's proposal: what goes where, what stays free.
- The review's other findings (11 to 14) and its questions that only the device answers.
