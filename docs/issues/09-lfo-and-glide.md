# 09: LFO and Glide

**What to build:** One LFO (rate, amount, waveform) targeting pitch, Cutoff or Pulse Width. It is applied both in the audio graph and in the Modulation model (ADR-0003), so the Envelope Timeline and Response Curve show it moving. Glide slides pitch between Notes.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] Modulation model includes the LFO for the Cutoff destination, tested
- [ ] Engine test: the model and the rendered Cutoff modulation agree in rate and depth
- [ ] Glide: pitch over time between two Notes, tested
- [ ] Pulse Width modulation shows in the Harmonic pattern
