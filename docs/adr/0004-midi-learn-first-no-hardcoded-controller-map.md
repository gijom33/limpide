# MIDI Learn first; no hard-coded Controller map

**Status:** accepted; superseded in part by [ADR-0009](./0009-a-built-in-layout-for-the-c16.md) · **Date:** 2026-10-21 · **Decided by:** Claude, accepted by the owner

The C16 now has a built-in layout: [ADR-0009](./0009-a-built-in-layout-for-the-c16.md) supersedes the "no hard-coded CC table" rule for it alone.

We target the Synido TempoPAD C16, which has 8 endless encoders, 4 faders, 16 velocity pads and 12 buttons. But its default CC and note assignments aren't published, every control is user-assignable on the device, and its encoders may report Absolute or Relative values depending on firmware. So Limpide ships no hard-coded CC table. Every Mapping is created by MIDI Learn, guided by a Quick Setup that works for any Controller. During Learn the Encoder Mode is detected from the values received: values near 0 or 64 that repeat or step by one are Relative (two's-complement or 64-centred), anything else is Absolute with Pickup. Mappings are saved locally.
