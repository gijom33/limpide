# 187: Song Position Pointer

**What to build:** Review 17's finding 5 on 1.21.1 ([report](../reviews/2026-11-02/17-midi-mapping-geek.md)): a DAW playing from anywhere but its start sends a Song Position Pointer, then Continue (MIDI 1.0); Limpide skips the pointer, so its beats go on from where the last Stop left them, up to half a beat off the DAW's, and a synced LFO peaks off the beat. Song Position Pointer was out of issue [136](./136-following-midi-clock.md)'s scope.

**Blocked by:** none

**Status:** needs-triage · enhancement. v2, not committed (Claude's call, open to the owner): beyond what 136 set for v1, by the scope rule ([131](./131-v1.md)); small, as the parser already reads its two bytes, so the owner may move it into v1
