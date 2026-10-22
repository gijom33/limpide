# 11: MIDI Learn, Encoder Mode detection, Pickup and Activity Monitor

**What to build:** Any Parameter or Action can be MIDI-learned: select it, move a Controller control, and they're mapped. During Learn the Encoder Mode is detected (Relative when values cluster at 1/127 or 63/65, otherwise Absolute), and Absolute Mappings use Pickup. Mappings can be listed and removed, and they persist. The Activity Monitor shows the last message, and on-screen knobs flash when hardware moves them.

**Blocked by:** 10

**Status:** ready-for-agent

- [ ] Learn state machine, tested (select → receive → mapped; cancel; re-learn replaces)
- [ ] Encoder Mode detection, tested with sample streams for Absolute, two's-complement and 64-centred input
- [ ] Pickup, tested (ignore until crossing, then follow)
- [ ] Mapping store persisted through the Persistence interface, tested
- [ ] Activity Monitor and knob flash
