# 10: On-screen piano, octave shift and MIDI notes

**What to build:** A clickable on-screen piano showing computer-key labels, with octave shift. Web MIDI notes (e.g. the TempoPAD C16 in KEYBOARD mode) play the synth with Velocity scaling the Amp, and an optional Velocity amount on the Effective Cutoff. Connected Controllers are detected, and Safari shows a clear "MIDI not supported" notice while everything else works.

**Blocked by:** 01

**Status:** done

- [x] MIDI byte parsing (note on/off, note-on with velocity 0 treated as off, CC, running status), tested
- [x] All Note sources merged into one stream under last-note priority, tested
- [x] Controller connect and disconnect detection via an injectable MIDIAccess-like interface, tested with a fake
- [x] Piano and octave shift UI: 17 keys at the bottom (beside the LFO), letters on the keys, lit from any source; press lower for harder; drag to slide; octave −/+ buttons and Z/X
- [x] Velocity → Cutoff amount in the Filter (model and engine, tested); MIDI indicator with device tooltip
- [x] Unplugging a Controller releases its held Notes (no stuck Notes)
