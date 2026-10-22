# 05: Viewer controls: Freeze, axes, hover readout, Snapshot

**What to build:** Spacebar Freezes all Viewers while the sound continues. Each Spectrum toggles between a log and a linear frequency axis, and between dB and linear amplitude. Hovering shows the frequency, nearest note and level. "Snapshot" keeps the current Spectrum as a faint trace for A/B comparison, and it can be cleared.

**Blocked by:** 02

**Status:** done

- [x] Axis mappings (frequency ↔ x for log and linear, level ↔ y for dB and linear), both directions, tested
- [x] Viewer state (Freeze, axes, Snapshot) as a pure reducer, tested
- [x] Spacebar Freeze doesn't conflict with the computer-keyboard Notes
- [x] Hover readout (snaps to the nearest peak; frequency and level interpolated between FFT bins, tested) and the Snapshot trace drawn
- Linear frequency axis spans 0–5 kHz, where the Harmonic ladder is readable. The linear level axis tops out at the Oscillator's level
