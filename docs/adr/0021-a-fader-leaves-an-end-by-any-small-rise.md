# MIDI Learn reads a fader leaving an end by any small rise

**Status:** accepted · **Date:** 2026-11-03 · **Decided by:** Claude's call, open to the owner ([issue 227](../issues/227-small-slips-in-the-new-features.md))

Supersedes, in [ADR-0020](./0020-midi-learn-reads-a-knobs-mode-from-its-whole-turn.md), "a lone 1 or 126 (a fader nudged off an end), is Absolute". The 1.23.0 code review found a fader nudged from 0 learned as Absolute only on exact single steps: a lone 2, or 1, 3, 6, 10, learned as Relative, and the fader then moved its knob by steps.

Now values that rise from the bottom without a repeat or a turn back, all from 1 to 15, are Absolute, a lone one too; so are values that fall from the top the same way, all from 113 to 126. A run starting at 127, one that repeats or turns back (2, 5, 7, 3) is still Relative, as ADR-0020 says.

One more turn now reads wrongly, besides ADR-0020's two: a two's-complement encoder turned up faster at each click (1, 2, 4, 7), or one brisk click (3), looks like a fader leaving the bottom. The MIDI panel's Absolute or Relative changes it, as for the others.
