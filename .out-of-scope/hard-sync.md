# Hard Sync

Osc 1 does not restart its cycle each time Osc 2 does. FM ([issue 89](../docs/issues/89-cross-modulation.md)) and Ring give Osc 2 its say over Osc 1's sound instead.

## Why this is out of scope

The browser's own oscillators cannot be reset mid-cycle by another, so Hard Sync needs custom audio code, which [ADR-0001](../docs/adr/0001-native-web-audio-nodes-over-custom-dsp.md) rules out. Left out of issue 89, and turned down by the owner in triage on 2026-10-30, [issue 117](../docs/issues/117-more-to-play-and-hear.md), decision 4: "no, while ADR-0001 holds". A superseding ADR would reopen it.

## Prior requests

- The owner's six Oscillator additions, 2026-10-29 (left out of issue 89).
- Claude's brainstorm, 2026-10-30, through the inbox.
