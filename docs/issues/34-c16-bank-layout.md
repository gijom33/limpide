# 34: The C16 layout, one bank per section

**What to build:** A TempoPAD C16 works the moment it is plugged in, with no steps to follow. Its four banks drive Limpide's four sections, so each bank's encoders and faders turn one section's controls, and the buttons do the same thing on every bank. Limpide recognises the C16 by its name and applies the layout when nothing is mapped yet; a "C16 layout" button in the MIDI panel restores it at any time, and MIDI Learn still changes any single control. From trying Quick Setup on the real C16, 2026-10-25: its steps follow the device's controls, so they jump around the page, and a fader paused mid-move can be learned again for the next step.

**Blocked by:** what the C16 sends (below)

**Status:** waiting for the C16's messages

| Bank | Encoders 1–8 | Faders 1–4 |
|---|---|---|
| A · Oscillators | Osc 1 Waveform, Pulse Width, Osc 2 Waveform, Octave, Semitone, Detune, Osc 2 Pulse Width, Glide | Mixer: Osc 1, Osc 2, Sub, Noise |
| B · Filter | Cutoff, Resonance, Envelope Amount, Velocity, Key Track, Mode, Slope, free | Filter Envelope: Attack, Decay, Sustain, Release |
| C · Amp | Voices, seven free | Amp Envelope: Attack, Decay, Sustain, Release |
| D · LFO & Envelopes | LFO 1 Waveform, Rate, Depth, Destination; LFO 2 Waveform, Rate, Depth, Destination | free |

Buttons, on every bank: Hold, Freeze, Snapshot, Previous Preset, Next Preset. On bank D also LFO 1 and LFO 2 Retrigger. The free places stay free on purpose: the owner has uses for them as the synth grows.

- [ ] What the C16 sends, recorded in the PRD's Further Notes: its MIDI name, the channel, the Relative format, momentary or toggle buttons, and what a bank switch changes (CC numbers, channel, or nothing for the faders and buttons)
- [ ] The layout as data, applied when a C16 is seen and nothing is mapped, restored by a "C16 layout" button in the MIDI panel
- [ ] A bank switch brings its section into view (owner's call, 2026-10-25), if the C16's messages say which bank it is on
- [x] Quick Setup kept, for any Controller (owner's call, 2026-10-25): every Parameter played live (ADR-0008's play and fader roles) in the page's order, then the Actions; a control learned for one step is never learned for another, however long it pauses
- [ ] Verified on the real C16
