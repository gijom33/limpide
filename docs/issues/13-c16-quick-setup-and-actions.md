# 13: TempoPAD C16 Quick Setup and Actions

**What to build:** A guided Quick Setup walks a C16 owner through turning each encoder, fader and button in turn. It maps encoders to Cutoff, Resonance, Envelope Amount, Detune, LFO rate, LFO amount, Waveform and Glide; faders to the Amp Envelope ADSR; and buttons to the Actions Hold, Freeze, Snapshot and next Preset. Steps can be skipped, and the whole Setup takes about 20 seconds.

**Blocked by:** 11, 05, 12

**Status:** ready-for-agent

- [ ] Quick Setup sequence as a pure state machine over Learn steps, tested (advance, skip, back, finish, cancel)
- [ ] Actions dispatched from Mappings, tested
- [ ] Verified on the real C16; record the observed CCs and Encoder Mode in the Further Notes of the PRD

## Observed on the real C16

Encoders: endless, CC 1–8. Faders: CC 33–36. Buttons: CC 49–60. Quick Setup still learns every step (the owner can reassign controls on the device), but its prompts can name the expected control, e.g. "Turn encoder 1 (CC 1)", and it can flag a control that differs from these defaults.
