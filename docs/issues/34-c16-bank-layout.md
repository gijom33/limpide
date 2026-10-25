# 34: The C16 layout, one bank per section

**What to build:** A TempoPAD C16 works the moment it is plugged in, with no steps to follow. Its four banks drive Limpide's four sections, so each bank's encoders and faders turn one section's controls, and the buttons do the same thing on every bank. Limpide recognises the C16 by its name and applies the layout when nothing is mapped yet; a "C16 layout" button in the MIDI panel restores it at any time, and MIDI Learn still changes any single control. From trying Quick Setup on the real C16, 2026-10-25: its steps follow the device's controls, so they jump around the page, and a fader paused mid-move can be learned again for the next step.

**Blocked by:** none

**Status:** built, to verify on the real C16. The layout is data in `src/midi/c16.ts` (tested at that seam only, the owner's choice): 58 Mappings on channel 1. It is applied by itself once, the first time a C16 is seen with nothing mapped (`limpide.c16Layout` remembers it, so removing it sticks); the MIDI panel's "C16 layout" button, offered while a C16 is connected, puts it back. Knobs find their Encoder Mode on their first turn (three values, then it is kept); buttons are toggles, so every message is a press, and on a choice (Retrigger) a press steps to the next option. Each bank has its own CCs, so the first control touched after a bank switch tells which bank it is: its section is brought into view (the section strip's follow, on a phone; not while learning). ADR-0009 records the decision to ship this one layout.

| Bank | Encoders 1–8 | Faders 1–4 |
|---|---|---|
| A · Oscillators | Osc 1 Waveform, Pulse Width, Osc 2 Waveform, Octave, Semitone, Detune, Osc 2 Pulse Width, Glide | Mixer: Osc 1, Osc 2, Sub, Noise |
| B · Filter | Cutoff, Resonance, Envelope Amount, Velocity, Key Track, Mode, Slope, free | Filter Envelope: Attack, Decay, Sustain, Release |
| C · Amp | Voices, seven free | Amp Envelope: Attack, Decay, Sustain, Release |
| D · LFO & Envelopes | LFO 1 Waveform, Rate, Depth, Destination; LFO 2 Waveform, Rate, Depth, Destination | free |

Buttons, on every bank: Hold, Freeze, Snapshot, Previous Preset, Next Preset. On bank D also LFO 1 and LFO 2 Retrigger. The free places stay free on purpose: the owner has uses for them as the synth grows.

- [x] What the C16 sends, recorded in the PRD's Further Notes (the owner, 2026-10-25): channel 1; each bank its own CCs; toggle buttons. Its Relative format is found on each knob's first turn
- [x] The layout as data, applied when a C16 is seen and nothing is mapped, restored by a "C16 layout" button in the MIDI panel
- [x] A bank switch brings its section into view (owner's call, 2026-10-25): on the first control touched on the new bank
- [x] Quick Setup kept, for any Controller (owner's call, 2026-10-25): every Parameter played live (ADR-0008's play and fader roles) in the page's order, then the Actions; a control learned for one step is never learned for another, however long it pauses
- [ ] Verified on the real C16, and the MIDI name it gives confirmed (Limpide looks for "TempoPAD C16")

Known limits, from the review: MIDI Learn and Quick Setup map an Action button as a momentary one, so a C16 toggle button relearned for an Action acts on every other press (the layout's own buttons are toggles); a bank's section is followed from the CC alone, so another Controller sending channel-1 CCs in the C16's ranges moves it too. Learning an Action on a new control replaces it on all four banks, as a Mapping's target has one control when learned; the MIDI panel's Remove takes off one control's Mapping.
