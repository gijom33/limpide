# 02: Per-stage Taps and signal-flow layout

**What to build:** The UI becomes the signal-flow diagram: Oscillator → Filter → Amp blocks connected left to right, each with its own Scope and Spectrum showing the Oscillator, Filter and Amp Taps. Turning Cutoff visibly changes the Filter Tap but not the Oscillator Tap. When nothing plays, the Viewers show a flat line and a "press a key or turn on Hold" hint. Dark theme by default, with a light toggle. Usable on a laptop screen.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The engine exposes one analyser per Tap
- [ ] Engine test: with a low Cutoff, high Harmonics are present at the Oscillator Tap and attenuated at the Filter Tap
- [ ] Signal-flow layout with a Scope and Spectrum per block
- [ ] Idle state hint
- [ ] Theme toggle, remembered
