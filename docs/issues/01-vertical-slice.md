# 01: Vertical slice: saw → low-pass → amp, played from the keyboard

**What to build:** A learner opens the app, clicks "Start audio", and plays notes on the computer keyboard. A saw Oscillator runs through a 12 dB low-pass Filter (Cutoff, Resonance) into the Amp with an Amp Envelope (ADSR). Last-note Note Priority applies. One Scope and one Spectrum show the Amp Tap. Every Parameter shows its value in real units, and double-clicking a knob resets it. This ticket establishes the project scaffold, the test patterns at all three seams, and the module shapes from the PRD.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Vite + React + TypeScript app; Vitest unit tests; Vitest browser-mode (Chromium) engine tests; Playwright smoke test
- [x] Note to frequency with A4 = 440 Hz, tested
- [x] Tapers (linear, log, exponential), both directions, tested; Cutoff spans 20 Hz–20 kHz on a log Taper, and envelope times span 1 ms–10 s on an exponential Taper
- [x] Patch model with Parameter definitions, defaults and `setParam` clamping, tested
- [x] Note input: computer-keyboard layout, last-note priority, Gate, and release returning to the previously held Note, tested
- [x] Synth engine with an offline-render test: a saw at 110 Hz with Cutoff at 1 kHz attenuates Harmonics above 2 kHz relative to those below the Cutoff
- [x] Amp Envelope offline test: silence before noteOn, sustain level reached, decays to silence after release
- [x] A "Start audio" gate that satisfies the autoplay policy
- [x] Scope and Spectrum of the Amp Tap drawn by a renderer outside React
- [x] Smoke test: the page loads, starting audio and pressing a key makes the Amp Tap non-silent, and the canvases draw
