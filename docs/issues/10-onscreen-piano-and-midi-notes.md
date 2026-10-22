# 10: On-screen piano, octave shift and MIDI notes

**What to build:** A clickable on-screen piano showing computer-key labels, with octave shift. Web MIDI notes (e.g. the TempoPAD C16 in KEYBOARD mode) play the synth with Velocity scaling the Amp, and an optional Velocity amount on the Effective Cutoff. Connected Controllers are detected, and Safari shows a clear "MIDI not supported" notice while everything else works.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] MIDI byte parsing (note on/off, note-on with velocity 0 treated as off, CC, running status), tested
- [ ] All Note sources merged into one stream under last-note priority, tested
- [ ] Controller connect and disconnect detection via an injectable MIDIAccess-like interface, tested with a fake
- [ ] Piano and octave shift UI
