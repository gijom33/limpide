# 06: Filter Envelope, Envelope Timeline and Hold

**What to build:** A Filter Envelope (ADSR) with a signed Envelope Amount in octaves moves the Effective Cutoff, and the Response Curve and Ghost follow it. An Envelope Timeline plots both Envelopes and the Effective Cutoff with a playhead, including Release after key-up. Hold keeps the Gate on so the learner can turn knobs hands-free.

**Blocked by:** 04

**Status:** done

- [x] Modulation model: envelope levels over time for any Gate history (including retrigger mid-release) and the Effective Cutoff with Envelope Amount, tested
- [x] The model produces the automation schedule applied by the engine
- [x] Engine test: the rendered filtering matches the model's Effective Cutoff while the Envelope is held (1.6 kHz) and after Release (200 Hz); the Amp Tap matches the model's Amp Envelope; past moments use the Patch in force then
- [x] Hold in Note input, tested
- [x] Envelope Timeline: a scrolling 4-second strip ('now' at the right edge) of the Amp Envelope, the Effective Cutoff and the Cutoff knob, computed from the model; it freezes with the Viewers
