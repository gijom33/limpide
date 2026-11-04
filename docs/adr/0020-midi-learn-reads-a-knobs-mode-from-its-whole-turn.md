# MIDI Learn reads a knob's mode from its whole turn, and the panel can change it

**Status:** accepted; superseded in part by [ADR-0021](./0021-a-fader-leaves-an-end-by-any-small-rise.md) · **Date:** 2026-11-02 · **Decided by:** Claude's call, open to the owner ([issue 186](../issues/186-midi-learn-reads-modes-right.md))

Supersedes the detection rule of [ADR-0004](./0004-midi-learn-first-no-hardcoded-controller-map.md): "values near 0 or 64 that repeat or step by one are Relative". Review 17 found it learned an accelerated encoder turned briskly (66, 69, 71, 67) as Absolute with Pickup, after which the knob moved nothing, and a fader nudged once off the bottom (1) as Relative.

Now Learn reads the values of its whole window. Values all within 15 of 64, or of 0 and 127, are Relative, with or without a repeat. A steady run of single steps one way (40, 41, 42), or a lone 1 or 126 (a fader nudged off an end), is Absolute, and so is anything far from 0 and 64.

Some turns still read wrongly: a single click up of a two's-complement encoder (1) looks like a nudged fader, and an encoder speeding up one value at a time (65, 66, 67) like a fader's run. So each knob's Mapping in the MIDI panel shows Absolute or Relative, and a click changes it, remembered with the Mapping. Switched to Relative, a Mapping takes the kind its knob's last value says (near 0: two's-complement; otherwise 64-centred).
