# 03: Waveforms, Cycle Lock, Harmonic Markers and Ideal Reference

**What to build:** The learner can pick sine, triangle, saw, square or pulse, and adjust Pulse Width. The Scope Cycle Locks to the Note's period so the trace stands still, showing 1, 2 or 4 cycles. The Spectrum labels Harmonics with their number, frequency and nearest note, and the Oscillator Tap shows the Waveform's Ideal Reference next to the measured Harmonics.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Fourier-series Harmonic amplitudes per Waveform and Pulse Width, tested (saw 1/n; square odd 1/n; triangle odd 1/n²; pulse with |sin(nπd)|/n)
- [ ] A pulse `PeriodicWave` built from the same series
- [ ] Engine test: measured Harmonic levels match the Ideal Reference within tolerance for saw and square
- [x] Cycle Lock alignment (phase of the fundamental from a time buffer), tested with synthetic ringing buffers. Pulled forward to fix an unstable Filter Scope. Still to do: the 1/2/4-cycle choice, plus a detuned or noisy test case once Osc 2 and Noise exist
- [ ] Nearest-note naming with cents offset, tested
- [ ] Harmonic Markers and the Ideal Reference drawn
