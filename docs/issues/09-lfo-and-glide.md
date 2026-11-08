# 09: LFO and Glide

**What to build:** One LFO (rate, amount, waveform) targeting pitch, Cutoff or Pulse Width. It is applied both in the audio graph and in the Modulation model (ADR-0003), so the Envelope Timeline and Response Curve show it moving. Glide slides pitch between Notes.

**Blocked by:** 06

**Status:** done

- [x] Modulation model includes the LFO for the Cutoff destination, tested
- [x] Engine test: the model and the rendered Cutoff modulation agree in rate and depth
- [x] Glide: pitch over time between two Notes, tested
- [x] Pulse Width modulation shows in the Harmonic pattern (pulses are now a saw minus a delayed copy, ADR-0001)
  **Since then (2026-11-07, [266](./266-preset-and-tip-words-that-hold.md)):** the pulse is the delayed copy less the saw, so it is high for its Pulse Width, as the glossary says; its Harmonics are the same.
- [x] LFO and Glide controls beside the Envelope Timeline, which shows the LFO moving the Effective Cutoff
