# Persona review 17: the MIDI mapping geek

Ran on version 1.26.1 (build `38df0ad`), 2026-11-07.

Read: the live site at 1440 × 900 and 412 × 915 (Chromium, headless Playwright from the repository's own `node_modules`), driven by a stand-in Web MIDI built as `e2e/fakeMidi.ts` builds it: a "TempoPAD C16", then the C16 beside an "Arturia KeyStep 37", then the C16 on USB and Bluetooth at once. Every place of the four banks was played (knobs as Relative #1, faders swept, buttons as the card sets them) and the stored Patch compared before and after. Then the layout's data (`src/midi/c16.ts`), the control surface's keyboard defaults, ADR-0009 and ADR-0017, issues 145, 241 and 250, and my report of 2026-10-31. The printed card at `#c16-card`. No hardware: the owner tries the result on the real C16. About 45 minutes.

## First impression

"This is my layout now, and it reads like a panel: bank A's top row is Osc 1 and what Osc 2 does to it, the second row is Osc 2's Tuning row exactly, the faders are the Mixer, and the Waveforms sit under their faders. The Preset arrows are side by side on M1 and M2, Hold is top right. The card on one landscape page is the thing I would actually tape next to the C16. Then I opened the MIDI panel and scrolled through 68 identical-looking rows, four of them 'Previous Preset', and not one told me which knob it was."

## What I tried, in order

1. **Every place, bank by bank.** All 52 filled places drive what the card says, in the screen's order. A bank A knob brings the right tab forward (K3 Ring opens Mixer, K5 Osc 2, S4 Sub & Noise); on a phone, each bank's first touch scrolls its section into view (bank D to the LFOs, C's K8 to Volume). R1 and R2 step the Waveforms left to right and wrap from Pulse to Sine; the two-way switches set by value (127 on, 0 off).
2. **Relative #1.** A 65 is one step of the Grid (a semitone of Cutoff, a cent of Detune); eight 66s are two and two thirds; Voices needs two clicks a voice. With Sync on, bank D's K6 turns LFO 1's note value instead of Hz.
3. **A factory C16 (knobs sending positions).** Bank B's K1 turned up from 40 to 48: Cutoff went down, 2000 → 1682 Hz. Turned from 80 to 88 it went up. The MIDI panel showed "ch 1 · CC 10 · 35" and nothing else.
4. **A keyboard beside the C16.** Its mod wheel (CC 1) turns LFO 1's Depth, not bank A's K1; its sustain (CC 64) holds Notes, not Next Preset; CC 7, 11 and 74 do nothing; it does not drag the page to a bank. Bank Select 1 and Program 0 load Wind (the 129th), Program 13 Machine Chatter (the 142nd), Program 20 nothing. Issue 241 works.
5. **MIDI Learn and a Program button (issue 250).** Learn armed on Resonance; the keyboard sends CC 0, CC 32 and Program 7 at once: Learn passes over, the Preset loads, and the next knob (CC 71) is learned. With 700 ms between CC 0 and the Program Change, CC 0 is learned for Key Track and that keyboard's banks stop working. Real keyboards send the three together, so this is the edge decision 2 of issue 250 accepts.
6. **Learning around the layout:**
   - the keyboard's mod wheel learned onto Cutoff: the bar says "Mapped Cutoff ← ch 1 · CC 1". Bank A's K1 Osc 1 Octave and bank B's K1 Cutoff are both gone from the list. Bank A's K1 now drives Cutoff as an Absolute knob: three clicks up took it from 4361 to 686 Hz;
   - the keyboard's filter knob, on channel 2 so no CC is shared: bank B's K1 goes dead, as Cutoff can have one control;
   - Hold learned on a keyboard pad: M4 no longer holds on any of the four banks;
   - a free C16 knob (bank C K3, CC 19) learned for Osc 2 Pulse Width: it is learned as Relative but answers any Controller, so the keyboard's CC 19 at 100 jumped it 36 steps, 25 → 61 %;
   - a free C16 button (bank A S1, a toggle) learned for Tap Tempo: learned as Toggle, rightly.
7. **"C16 layout" pressed again:** the 68 places come back and every Mapping of mine goes, the ones on free places and the keyboard's own among them (its tip says "replacing your Mappings").
8. **USB and Bluetooth at once:** the panel says it follows one port; a toggle pressed once flips once, a click moves one step, Next Preset moves one Preset.
9. **A two-way toggle after a Preset change:** a Preset with Slope 24 loaded while R1's light was off; the next press (127) changes nothing, the one after (0) sets 12. Light and Slope agree after one press.
10. **The card** (`#c16-card`): four banks drawn as the panel, row for row, every place named or "free", each button Momentary or Toggle, "every knob Relative #1", the shared buttons in the footer.

## What worked

- **The layout itself.** Each strip is a column of its section, each knob row a row of the screen. Of my fourteen findings of 2026-10-31, eleven are built as proposed (see below).
- **"C16 only".** A keyboard's pedal, mod wheel and expression keep their meaning beside the C16. This was the worst trap last time.
- **Declared modes.** Endless knobs with no Pickup and no jump after a Preset; momentary Actions; toggles set by value, so a light and its switch fall back into step after one press.
- **Bank Select and Program Change** reach all 142 Presets, and Learn no longer takes a Program button's bank.
- **The card,** made from the layout's data, so it cannot drift from what Limpide does.

## Where I got stuck

- **Learn and the layout don't coexist.** One control per target and one target per control, with no word of what was replaced. A desk of controllers is exactly where two controls want the same Parameter: the keyboard's Cutoff knob and the C16's.
- **The MIDI panel can't be read as a C16 map.** 68 rows in the layout's order, each "ch 1 · CC n · C16 only" with an Absolute/Relative switch, no bank or place named, my own Mappings mixed in among them. The Last message names no place either ("ch 1 · CC 15 · 65" is bank B's K7, free).
- **A factory C16 gets no hint.** The knobs run the wrong way below the middle, and the only fix is on the card.

## Would I…

- **Like:** yes. The layout is what I would have built, and it plays as drawn.
- **Share:** yes, to anyone with a C16, with the card. Not yet to someone with a keyboard and a C16 who will start learning things.
- **Come back:** yes, to try Learn once it stops eating the layout.
- **Recommend:** yes, with "set the knobs to Relative #1 before you touch anything".

## Since the last run (1.18.0, 2026-10-31)

My findings 1 to 10 and 12 are built: the knobs are declared Relative #1 (ADR-0017), the layout answers the C16 alone, the Actions sit on M1–M4 and S3, the Waveforms and switches are on the R row under their faders, Glide and Volume are on bank C, bank B and D follow the screen, Noise comes before Sub, and Learn tells a toggle from a momentary button. Questions 1 (button CCs) and 7 (USB with Bluetooth) are answered and handled. Since 1.26.0, Bank Select reaches every Preset (issue 241), and since 1.26.1 MIDI Learn passes over a Program button's Bank Select (issue 250); both work as their issues say. Still open: finding 11's "keep C16 messages out of the keyboard defaults" (an unmapped C16 CC 1 or 64 would still be the mod wheel or the pedal, but the layout leaves neither free), finding 14's lights (now a dead first press rather than a wrong light), and the layout's Tap and bank D's faders, which issue 145 left out of scope.

## The layout, bank by bank

The places as they are on 1.26.1. **Bold** is a change I propose; everything else stays, for the reason given.

### Every bank (shared)

| Place | Today | Proposed | Why |
|---|---|---|---|
| M1, M2 | Previous, Next Preset (momentary) | same | The page's ‹ ›, side by side |
| M3, M4 | Freeze, Hold (momentary) | same | Hold top right, as on the page |
| S3 | Snapshot (momentary) | same | Under Freeze, its partner |
| S1 | free (A, B, C, D) | **Tap Tempo, momentary** | Tap has been a Target since issue 112 and has no C16 place, and the one control per target rule means a person can learn it only once, on one bank. Every bank's S1 is free today, top-left of the buttons the hand already uses for the Actions. Leave it free instead if the C16's own TAP TEMPO sends clock (question 1) |

### Bank A · Oscillators (full)

| Place | Today | Why it stays |
|---|---|---|
| K1–K4 | Osc 1 Octave, FM, Ring, Pulse Width | Osc 1's row and what Osc 2 does to it; Ring on a knob because there are five levels for four faders |
| K5–K8 | Osc 2 Octave, Semitone, Detune, Env Amount | The screen's Tuning row, in order |
| F1–F4 | Osc 1, Osc 2, Noise, Sub levels | The Mixer's order, Ring aside |
| S1, S2 | free | S1 for Tap (above); S2 kept for the Oscillators' growth |
| S4 | Sub Octave (toggle) | Under the Sub fader |
| R1–R4 | Osc 1 Waveform, Osc 2 Waveform (momentary), Noise Colour, Sub Waveform (toggle) | Each under its source's fader |

Not on bank A: Osc 2 Pulse Width, left to Learn (3 Presets use it). The card and the panel call K4 just "Pulse Width": **"Osc 1 Pulse Width"** (or "Osc 1 PW" on the card), since Osc 2 has one too.

### Bank B · Filter

| Place | Today | Why it stays |
|---|---|---|
| K1–K4 | Cutoff, Resonance, Velocity, Key Track | The screen's Cutoff row |
| K5, K6 | Env Amount, Mode | Amount under Cutoff, as on screen; Mode is a list of four, so a knob |
| K7, K8 | free | Kept for the Filter's growth |
| F1–F4 | Filter Attack, Decay, Sustain, Release | Envelopes as four faders |
| S1, S2, S4 | free | S1 for Tap; the rest kept |
| R1 | Slope (toggle) | A choice of two, lit at 24 dB |
| R2–R4 | free | Kept |

### Bank C · Amp

| Place | Today | Why it stays |
|---|---|---|
| K1, K2 | Voices, Glide | Beside each other, as on screen |
| K3–K7 | free | The Amp has nothing else to turn; kept |
| K8 | Volume | Over the Release fader, right of the Envelope as on screen |
| F1–F4 | Amp Attack, Decay, Sustain, Release | Envelopes as four faders |
| S1, S2, S4 | free | S1 for Tap; the rest kept |
| R2 | Legato (toggle) | In Glide's strip |
| R1, R3, R4 | free | Kept |

### Bank D · LFO & Envelopes

| Place | Today | Why it stays |
|---|---|---|
| K1–K4 | LFO 1 Waveform, Destination; LFO 2 Waveform, Destination | Each LFO's first row, LFO 1 on the left strips |
| K5–K8 | LFO 1 Depth, Rate; LFO 2 Depth, Rate | The knobs played most, nearest the hand; Rate turns the note value while Sync is on |
| F1–F4 | free | Kept free. The LFOs have no faders on screen, and Depth on an endless knob has no Pickup wait after a Preset change, which a fader would. The BPM on a fader (127 positions, Pickup) is worse than Tap |
| S1, S2, S4 | free | S1 for Tap; the rest kept |
| R1–R4 | LFO 1 Retrigger, Sync; LFO 2 Retrigger, Sync (toggles) | Each LFO's two switches side by side under its strips |

### Not on the C16, on purpose

- **The BPM:** Tap on S1, or the C16's clock (issue 136); MIDI Learn reaches the BPM itself.
- **Osc 2 Pulse Width:** see bank A.
- **The aftertouch Destination and the Bend range:** set once in the MIDI panel; the C16's pads send the pressure.
- **The keyboard's octave:** the C16's OCT− and OCT+ move its pads.

## Three findings, ranked

1. **MIDI Learn silently strips the C16 layout:** learning a keyboard's Cutoff knob kills bank B's K1, Hold on a pad kills M4 on all four banks, and the mod wheel (CC 1) learned onto anything removes bank A's K1 and leaves that C16 knob driving the new target as Absolute (Cutoff 4361 → 686 Hz in three clicks up). The bar says only "Mapped". Let a C16-only Mapping and a learned one live side by side (one control per target per Controller), or at least name what is replaced.
2. **A factory C16 (knobs sending positions) runs backwards below the middle:** Cutoff 2000 → 1682 Hz for 40…48 turned up, and nothing on the page says why. When a C16 knob sends positions (values far from 64, moving one by one), the MIDI panel could say "Set the C16's knobs to Relative #1: see the card".
3. **The MIDI panel can't be read as a C16 map:** the layout is 68 flat rows (Previous Preset four times, "ch 1 · CC 61 · C16 only"), none names its place, a person's own Mappings are buried among them, and the Last message for a free place reads "ch 1 · CC 15 · 65". Fold the layout into one entry with its card, list the person's own Mappings first, and name C16 places ("C16 B · K7, free").

## For the inbox

1. MIDI Learn silently strips the C16 layout: a keyboard's Cutoff knob learned kills bank B's K1, Hold on a pad kills M4 on all four banks, and the mod wheel learned removes bank A's K1 and leaves that C16 knob driving the new target as Absolute (Cutoff 4361 → 686 Hz in three clicks); the bar says only "Mapped".
2. A C16 in its factory settings (knobs sending positions) runs backwards below the middle (Cutoff 2000 → 1682 Hz turned up from 40), and the MIDI panel gives no hint to set the knobs to Relative #1.
3. The MIDI panel lists the C16 layout as 68 flat rows naming no place (Previous Preset four times), with a person's own Mappings buried among them, and the Last message names no C16 place: fold the layout into one entry, own Mappings first.
4. "C16 layout" pressed again removes every own Mapping, those on the layout's free places and another keyboard's included: keep the ones that clash with nothing.
5. A learned Mapping answers any Controller: a C16 free knob learned as Relative is jumped 36 steps by a keyboard's CC 19 at 100. Record the input Learn heard, as the layout already does for the C16.
6. Tap Tempo has no C16 place: S1 on every bank, momentary (all four are free).
7. The card and the panel call bank A's K4 "Pulse Width" while Osc 2 has one too: "Osc 1 Pulse Width".
8. A two-way toggle after a Preset change can need a dead first press (Slope already at 24, light off): a line on the card's footer would do.

## Question for the owner

1. **The C16's TAP TEMPO and PLAY:** do they send MIDI clock, or anything, over USB and Bluetooth? If they do, Tap on S1 is not needed and the four S1 places stay free.
