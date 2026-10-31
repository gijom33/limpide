# MPE and per-Note pressure

Limpide takes channel aftertouch, one pressure for the whole keyboard ([issue 132](../docs/issues/132-aftertouch.md)), but not per-Note pressure (polyphonic aftertouch) or MPE, where each Note has its own pitch bend, pressure and slide.

## Why this is out of scope

Few keyboards send it, and each Note moving on its own would leave the Viewers, which follow the newest Note ([ADR-0007](../docs/adr/0007-optional-polyphony-viewers-follow-the-newest-note.md)), showing one Note's story of many. The owner left it out when framing v1, 2026-10-31 ([issue 131](../docs/issues/131-v1.md), decision 5).

## Prior requests

- Claude's list of what a plugin synth is expected to have, in the v1 grilling, 2026-10-31.
