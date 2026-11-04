# A synced LFO is pulled onto the beat, not restarted on it

**Status:** accepted · **Date:** 2026-11-01 · **Decided by:** Claude's call (the 1.20.0 ear check), accepted by the owner on 2026-11-03 (issue 191, decision 3)

Supersedes one consequence of [ADR-0018](./0018-limpide-keeps-a-tempo.md): that the engine "restarts its oscillator where the beat puts it whenever what it is locked with changes". The 1.20.0 ear check ([review 14](../reviews/2026-11-01/14-ear-stand-in.md)) heard that restart click on the Volume: the Demo's Tremolo Keys dropped 11 dB in 6 ms at bar 6, and turning a synced Rate or tapping the tempo bent the sound up to 121 times more than 1.19.0's free LFO did.

So a synced LFO running freely keeps its phase when its note value, its Waveform or the tempo changes, takes the new Rate from there, and runs a little faster or slower for two cycles, by however far it is off the beat (at most half a cycle, so at most a quarter faster or slower), to end exactly on the beat. The sound and the Modulation model make the same two Rate changes, so they still agree ([ADR-0003](./0003-modulation-model-mirrors-the-audio-graph.md)); a change during a pull starts a new one. A tempo set still starts the beat count again (ADR-0018), but the LFO reaches the new beat over the two cycles instead of jumping. Only a beat count that starts after now (a player's first beat) still restarts the LFO at that beat, a moment with no Note sounding unless the person holds one.

**Consequences:** no click on a synced change; after a tempo set or a Tap the LFO is on the new beat two cycles later rather than at once (Claude's call: two cycles at up to ±25 % rather than one at ±50 % or waiting for the next bar). Built in issue 112's "Since then" (`83014ed`).
