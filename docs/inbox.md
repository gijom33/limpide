# Inbox

Bugs and ideas as they come up, one line each, before anyone decides what to do with them. Add the screen size and browser when it matters. Triage moves a line out: into a numbered issue in [issues](./issues/), into an existing issue's checklist, or into the dropped list with a reason. GitHub Issues stay for visitors.

## Bugs

- Timing tests fail now and then when both browsers run at once, and pass alone: the Hold rhythm (e2e/holdRhythm.spec.ts, no strikes counted), the Glide marker sliding (e2e/pitchMarker.spec.ts:54) and the live dot with the Filter Envelope alone (e2e/modulationRing.spec.ts:53). One or two of them in most full runs; seen 2026-10-25.
- The contrast test (e2e/designPrinciples.spec.ts) can catch the "Play to start the sound" label mid fade-in: 3.32:1 in the light theme on a laptop, once in two runs. Seen 2026-10-25.

## Ideas


## Dropped

## Triaged

2026-10-25: every line went to [29](./issues/29-phone-header.md) (the phone header), [30](./issues/30-small-fixes.md) (small fixes), [31](./issues/31-lfo-retrigger.md) (LFO retrigger) or [32](./issues/32-more-presets.md) (more Presets).
2026-10-25, later: the strip's jump bringing the header back went to [29](./issues/29-phone-header.md); tighter rows in the Oscillators and Amp to [33](./issues/33-tighter-rows.md).
2026-10-25, evening: the call to play a Note to start the sound went to [35](./issues/35-play-to-start.md).
2026-10-25, night: the MIDI messages channel first ("ch 2 · CC 7 · 100", and the Mappings "ch 1 · CC 74"), done at once; the Hold rhythm test found flaky when both browsers run at once, logged under Bugs.
2026-10-25, late night: a default C16 mapping when plugged in went to [34](./issues/34-c16-bank-layout.md), already planned and waiting for the C16's messages; one width for every curve to [37](./issues/37-curve-widths.md).
