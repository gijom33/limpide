# A chord locks to its newest Note at the Amp Tap too

**Status:** accepted · **Date:** 2026-11-04 · **Decided by:** the owner ([issue 180](../issues/180-steadier-scopes.md), decision 7); recorded here as Claude's call, let stand by the owner in 1.24.0 ([issue 225](../issues/225-words-and-docs-after-1-22-and-1-23.md))

Supersedes, in [ADR-0007](./0007-optional-polyphony-viewers-follow-the-newest-note.md), "the Amp Scope is the only Viewer that cannot Cycle Lock during a chord". Since issue 180 (1.22.0), the Amp Scope Cycle Locks during a chord as every Scope does: to the newest Note, starting on a rising zero of its fundamental and, of the starts one cycle apart, on the one most like the last frame's trace, never older. With Viewers follow on All, the chord's other Notes, summed into the Amp Tap, still move across the trace; the newest Note's part of it stands still.

The rest of ADR-0007 stands: the Oscillator and Filter Taps, the Markers and the Timeline follow the newest Note, and the Amp Tap carries every Voice by default.

## Considered

- **Lock to the chord's shared period:** a chord whose Notes share a period (an octave, a fifth) would stand still whole. Rejected in issue 180 (decision 7): the trace freezes, then jumps.
