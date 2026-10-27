# Inbox

Bugs and ideas as they come up, one line each, before anyone decides what to do with them. Add the screen size and browser when it matters. Triage moves a line out: into a numbered issue in [issues](./issues/), into an existing issue's checklist, or into the dropped list with a reason. GitHub Issues stay for visitors.

## Bugs

- For some reason the demo deactivates the ideal rings display. (The owner, 2026-10-27)
- Favicon still not showing in Safari.
- A square or saw LFO on Volume overshoots its edges (the LFO's Fourier series, Gibbs, about ±1.18): at full Depth the gain passes the Envelope's level by about 9 % and dips below 0 (polarity flips) for well under a millisecond at each edge, where the model stays at exactly ±1. The same overshoot reaches every destination. From the 1.12.0 code review.

## Ideas

- Ok I see the 3 buttons now. Make the buttons a bit smaller, use color for the “Play the Demo and “Follow the Tutorial” ones. Remove “Explore”. Keep those buttons in the about menu at all times. (The owner, 2026-10-27, on the welcome card)
- The Harmonic Markers' ticks still draw over an empty Spectrum after a reload; only the Ideal rings hide. The owner wrote "ideal harmonic markers": to confirm whether the ticks should hide too. From the 1.12.1 review.
- The Timeline key's tooltips are reached by hover and long press only: its entries are not focusable and have no description for screen readers. From the 1.12.1 review.
- Folding the Demo card hides its caption, which is also what a screen reader hears change (aria-live). From the 1.12.1 review.
- The cards' phone breakpoint (600 px) is written in `cardPlacement.tsx` as well as the CSS; the clamp uses innerWidth, so a card can slide under a scroll bar. From the 1.12.1 review.
- Two inbox rules slipped on 2026-10-27: the Ideal-rings and Waveform-alignment reports were fixed without an inbox line first. From the 1.12.1 review.
- One list per LFO Destination: a new one meant editing the type and both CHOICES lists (`patch.ts`), the Tutorials' names (`tutorial.ts`), the picker's labels and stages (`DestinationPicker.tsx`, its stage type repeating STAGES) and the CSS; the label "Volume" is written twice. From the 1.12.0 code review.
- `tremolo()` writes out `lfoOffset`'s sum again rather than calling it (to compute the swings once). From the 1.12.0 code review.
- ADR-0006's "at full Sustain the Amp Tap equals the Filter Tap" holds only without an LFO on Volume; the ADR is frozen (ADR-0010), so a note needs a new ADR or a line elsewhere. From the 1.12.0 code review.

## Dropped

## Triaged

2026-10-25: every line went to [29](./issues/29-phone-header.md) (the phone header), [30](./issues/30-small-fixes.md) (small fixes), [31](./issues/31-lfo-retrigger.md) (LFO retrigger) or [32](./issues/32-more-presets.md) (more Presets).
2026-10-25, later: the strip's jump bringing the header back went to [29](./issues/29-phone-header.md); tighter rows in the Oscillators and Amp to [33](./issues/33-tighter-rows.md).
2026-10-25, evening: the call to play a Note to start the sound went to [35](./issues/35-play-to-start.md).
2026-10-25, night: the MIDI messages channel first ("ch 2 · CC 7 · 100", and the Mappings "ch 1 · CC 74"), done at once; the Hold rhythm test found flaky when both browsers run at once, logged under Bugs.
2026-10-25, late night: a default C16 mapping when plugged in went to [34](./issues/34-c16-bank-layout.md), already planned and waiting for the C16's messages; one width for every curve to [37](./issues/37-curve-widths.md).
2026-10-25, near midnight: the three flaky timing tests and the contrast test caught mid fade-in, fixed at once. Under load the test's own calls arrive up to seconds late, after the Filter Decay (0.25 s) or the Glide (1.1 s) is over, and they stretch the Hold taps (a gap over 2 s switches Hold off), so the timed part now runs in the page. The test browsers hold the sound back, so the invitation is always there: the audit waits for its fade-in to end.
2026-10-25, before midnight: the in-between layout for foldables went to [38](./issues/38-in-between-layout.md); multi-touch on the piano to [39](./issues/39-multi-touch-piano.md); a tutorial per Preset to [40](./issues/40-preset-tutorials.md), to grill first since the PRD leaves guided lessons out; the hiss at high Resonance and Cutoff to [41](./issues/41-resonance-hiss.md), a diagnosis first; the persona reviews and the AI Hero code review to [42](./issues/42-reviews.md).
2026-10-26: a four-across layout for wide screens went to [43](./issues/43-four-across.md).
2026-10-26: the knob test that timed out in WebKit, fixed at once. A hundred round trips (a turn, a read, a look at every knob, twenty times for five knobs) took 33 to 43 s under 8 workers and passed 60 s under a full run; the turning and looking now run in the page, one round trip a knob, 7 to 9 s under the same load, and the test still fails when a value can resize its knob.
2026-10-26: the header on the wider layouts (the phone's structure and piano for 2 × 2, a bigger piano and one order of buttons everywhere) went to [44](./issues/44-header-across-layouts.md), decisions open.
2026-10-26, the persona reviews ([42](./issues/42-reviews.md)): their 33 lines went to [45](./issues/45-timeline-draw-cost.md) (the Timeline's draw cost), [46](./issues/46-robust-start.md) (Firefox, storage refused, MIDI asked at load), [47](./issues/47-layout-polish.md) (layout polish), [48](./issues/48-credit-and-contact.md) (who built it and how, a way to reach the author), [49](./issues/49-explanations-everywhere.md) (tooltips for the core controls, on touch too), [50](./issues/50-demo-on-a-phone.md) (the Demo on a phone), [51](./issues/51-keyboard-and-screen-reader.md) (keyboard and screen reader), [52](./issues/52-midi-keyboards.md) (MIDI keyboards), [53](./issues/53-presets-and-synth-features.md) (Presets and synth features), [54](./issues/54-docs-and-ci-truth.md) (docs and CI), [55](./issues/55-app-into-hooks.md) (App.tsx by concern) and [56](./issues/56-ready-for-contributors.md) (contributors and process); the visible signal chain and a "start here" to [40](./issues/40-preset-tutorials.md).
2026-10-26, evening: the Demo's first sound too quiet on a phone went to [50](./issues/50-demo-on-a-phone.md) (it is the Kick, mostly below what a phone speaker plays); a guided tutorial per Preset to [40](./issues/40-preset-tutorials.md), the same idea, still to grill; an open-source legal expert to [42](./issues/42-reviews.md) as profile 11, to run.
2026-10-26, night: the legal review's three bugs fixed at once. The build writes `third-party-notices.txt` (React, react-dom with its Modernizr notice, scheduler), linked from About; the README and a Privacy line in About say what the counter receives; the counter loads only where the deploy sets `GOATCOUNTER_URL`, which the workflow does for this repository alone.
2026-10-26, night: the favicon missing in Safari fixed at once, to confirm in Safari after the next deploy: the PNG is now the last icon listed (Safari takes the last, and doesn't draw the SVG that was there).
2026-10-26, night: the Demo's Kick hard to hear went to [50](./issues/50-demo-on-a-phone.md), done there: the Kick now starts from the Preset's own drop, from 440 Hz, which a phone speaker plays, rather than from 155 Hz.
2026-10-27: done at once: the call to play in large letters, in the middle of the keys; the GoatCounter script pinned to its versioned file with an integrity hash (`vite.config.ts`).
2026-10-27: the owner's Hold idea (a key pressed again lets its held Note go) done at once: `src/input/noteInput.ts`, with unit tests for one Voice and several and a piano test. It reverses the earlier rule that a re-pressed held Note retriggers.
2026-10-27: the owner's selection bug (a mouse drag selected the page's text and Viewers) fixed at once: the whole page is unselectable with any pointer, as it already was on touch screens; text fields stay editable. Test in `e2e/layoutPolish.spec.ts`.
2026-10-27: the owner's idea to move and fold the docked card went to [59](./issues/59-tutorials-after-review-5.md), grilled and built there (it answers 59's "the card covers the pictures").
2026-10-27: the owner's Demo ideas (smoother changes, a longer track) and the tremolo Presets went to [60](./issues/60-demo-longer-smoother.md), grilled and built there.
2026-10-27: the owner's Patch selector idea done at once, the owner choosing among three looks shown as screenshots: the name bright and bold, a brighter border and a ▾ (A); a "PATCH" caption (B) cost the piano its key widths, and the accent colour (C) already marks a Tutorial's control.
