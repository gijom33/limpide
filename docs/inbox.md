# Inbox

Bugs and ideas as they come up, one line each, before anyone decides what to do with them. Add the screen size and browser when it matters. Triage moves a line out: into a numbered issue in [issues](./issues/), into an existing issue's checklist, or into the dropped list with a reason. GitHub Issues stay for visitors.

## Bugs


## Ideas

## Dropped

## Triaged

2026-10-25: every line went to [29](./issues/29-phone-header.md) (the phone header), [30](./issues/30-small-fixes.md) (small fixes), [31](./issues/31-lfo-retrigger.md) (LFO retrigger) or [32](./issues/32-more-presets.md) (more Presets).
2026-10-25, later: the strip's jump bringing the header back went to [29](./issues/29-phone-header.md); tighter rows in the Oscillators and Amp to [33](./issues/33-tighter-rows.md).
2026-10-25, evening: the call to play a Note to start the sound went to [35](./issues/35-play-to-start.md).
2026-10-25, night: the MIDI messages channel first ("ch 2 · CC 7 · 100", and the Mappings "ch 1 · CC 74"), done at once; the Hold rhythm test found flaky when both browsers run at once, logged under Bugs.
2026-10-25, late night: a default C16 mapping when plugged in went to [34](./issues/34-c16-bank-layout.md), already planned and waiting for the C16's messages; one width for every curve to [37](./issues/37-curve-widths.md).
2026-10-25, near midnight: the three flaky timing tests and the contrast test caught mid fade-in, fixed at once. Under load the test's own calls arrive up to seconds late, after the Filter Decay (0.25 s) or the Glide (1.1 s) is over, and they stretch the Hold taps (a gap over 2 s switches Hold off), so the timed part now runs in the page. The test browsers hold the sound back, so the invitation is always there: the audit waits for its fade-in to end.
2026-10-25, before midnight: the in-between layout for foldables went to [38](./issues/38-in-between-layout.md); multi-touch on the piano to [39](./issues/39-multi-touch-piano.md); a tutorial per Preset to [40](./issues/40-preset-tutorials.md), to grill first since the PRD leaves guided lessons out; the hiss at high Resonance and Cutoff to [41](./issues/41-resonance-hiss.md), a diagnosis first; the persona reviews and the AI Hero code review to [42](./issues/42-reviews.md).
