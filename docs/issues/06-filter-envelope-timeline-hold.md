# 06: Filter Envelope, Envelope Timeline and Hold

**What to build:** A Filter Envelope (ADSR) with a signed Envelope Amount in octaves moves the Effective Cutoff, and the Response Curve and Ghost follow it. An Envelope Timeline plots both Envelopes and the Effective Cutoff with a playhead, including Release after key-up. Hold keeps the Gate on so the learner can turn knobs hands-free.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Modulation model: envelope levels over time for any Gate history (including retrigger mid-release) and the Effective Cutoff with Envelope Amount, tested
- [ ] The model produces the automation schedule applied by the engine
- [ ] Engine test: the rendered brightness over time tracks the model's Effective Cutoff
- [ ] Hold in Note input, tested
- [ ] Envelope Timeline drawn with a playhead
