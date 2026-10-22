# 03: Waveforms, Cycle Lock, Harmonic Markers and Ideal Reference

**What to build:** The learner can pick sine, triangle, saw, square or pulse, and adjust Pulse Width. The Scope Cycle Locks to the Note's period so the trace stands still, showing 1, 2 or 4 cycles. The Spectrum labels Harmonics with their number, frequency and nearest note, and the Oscillator Tap shows the Waveform's Ideal Reference next to the measured Harmonics.

**Blocked by:** 02

**Status:** done

- [x] Fourier-series Harmonic amplitudes per Waveform and Pulse Width, tested (saw 1/n; square odd 1/n; triangle odd 1/n²; pulse with |sin(nπd)|/n)
- [x] Every Waveform (not only pulse) plays a `PeriodicWave` built from the same series, so the Ideal Reference is exactly what was synthesised
- [x] Engine test: measured Harmonic levels match the Ideal Reference for saw, square, triangle, and pulse at 25% and 10%. A calibration test pins where the Spectrum draws a given amplitude
- [x] Cycle Lock alignment (phase of the fundamental from a time buffer), tested with synthetic ringing buffers. Pulled forward to fix an unstable Filter Scope. The 1/2/4-cycle choice is done (scopeWindow, tested). Still to do, in ticket 07: a detuned or noisy Cycle Lock test case once Osc 2 and Noise exist
- [x] Nearest-note naming with cents offset, tested
- [x] Harmonic Markers on every Spectrum, labelled where there is room (tested); the Ideal Reference is drawn as hollow rings on the Oscillator Tap
