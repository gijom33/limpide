# 15: UI polish

**What to build:** One set of layout rules applied everywhere, so the instrument reads as one family of controls at every supported window size and in both themes. Four known rough edges first; then an audit of the rest, approved item by item.

**Blocked by:** 13

**Status:** done. A10 landed with the Spectrum work on 2026-10-22 (`8efbea9`) and was checked again on 2026-10-26.

## Rules

- **Supported range:** windows 860 px wide and up, in both themes, including the compact knob mode. Narrower windows must not overlap or spill, but get no layout of their own (the PRD keeps mobile and touch-first layouts out of scope).
- **Hard constraints kept:** the whole instrument fits 1440×900 and 1710×1060 without scrolling; every knob on the page is one size; the three stages' Viewers are the same size and line up. Tests are rewritten to the new rules, never loosened.
- **Wordmark:** the full name shows at every width, at full size. (It was hidden below 1100 px to make room for the Viewer toolbar, which now lives behind the Display button.)
- **Leaving MIDI Learn:** the control you used to enter is the control you use to leave. The header's MIDI button takes an accent "Learning" state while Learn is on; in the MIDI panel the MIDI Learn button becomes a filled "Done" at the top, and Quick Setup is hidden until Learn ends. The bottom bar keeps its instructions and the last Mapping, loses its button, and says where to finish (Esc, or MIDI › Done). Quick Setup keeps its own panel and buttons; the header shows the same Learning state during it.
- **Knob pitch:** every knob occupies a fixed column width per knob size, so the dial-to-dial distance is the same in every row of the page. Labels are centred under the dial and may be wider than the column. Rows start at the left edge of their section. The Filter Envelope no longer stretches across its block; in compact mode it wraps to the 3+2 layout (Amount beside the four envelope knobs) when five do not fit.
- **Knobs never move:** the readout reserves the widest value it can show (already), and the label and value lines have fixed heights, so a dial never shifts sideways or vertically as text changes.
- **Tokens:** a spacing scale, a small type scale, and a knob pitch per size as CSS variables; scattered literal values use them.

## Checklist

- [x] Ticket written; rules agreed
- [x] The Limpide name is visible at every width (test at 872, 1000, 1100 and 1440 px)
- [x] Done lives in the MIDI panel; the header shows Learning; the bar has no button (tests updated)
- [x] One knob pitch per knob size, rows left-aligned, envelope wraps 3+2 in compact mode (test: every row's dial pitch is equal)
- [x] Label and value lines have fixed heights
- [x] Spacing, type and pitch tokens
- [x] Audit findings listed below with before-screenshots (1440×900, both themes), and ticked as approved

## Audit

Taken after the four items landed (commit 8642393), at 1440×900 in both themes and at 1000×800 (compact):
[dark](./15-ui-polish/dark-1440x900.png) · [light](./15-ui-polish/light-1440x900.png) · [compact](./15-ui-polish/dark-1000x800.png).
Each finding names where it is, the rule it breaks, and the fix. Tick to approve; an unticked item is left as it is.

- [x] **A1 Mixer knobs do not line up with the Oscillator knobs.** Oscillators block. Rule: columns line up across the rows of a block. The MIXER heading sits beside its row in a 44 px column, so its knobs start 64 px to the right of Pulse Width above. Fix: the heading goes above its row, as FILTER ENVELOPE does; costs one 20 px line in the controls row at 1440×900 (Viewers 123 → ~105 px, floor 78).
- [x] **A2 Four uppercase label styles.** Stage headings 13 px, sub-block headings and tabs 11 px, toolbar group titles, MIDI panel and Patch panel headings 10 px, Learn bar 11 px at a different tracking. Rule: one type scale, two label levels. Fix: section headings stay 13 px; every other small-caps label is 11 px with 0.08 em tracking.
- [x] **A3 Sizes off the type scale.** Piano key letters 9 px, the audio-blocked hint 14 px, the Quick Setup prompt 15 px. Fix: 10 px, 13 px and 15 px → 13 px bold.
- [x] **A4 Three panel shadows.** Tooltip 0 6 24 at 28 %, Display/Patch/MIDI panels 0 10 32 at 35 %, Learn bar and Quick Setup 0 10 32 at 45 %. Rule: one elevation. Fix: one `--shadow-panel` token for all floating panels.
- [x] **A5 Radii.** Panels 10, tooltip and audio-blocked hint 8, controls 7, Waveform buttons and canvases 6, kbd 4. Fix: tokens `--radius-panel` 10, `--radius-control` 7, `--radius-inner` 6; the tooltip and the hint become panels (10), Waveform buttons become controls (7).
- [x] **A6 Patch panel buttons are 26 px tall** where every other control is 28 px (`--control-h`). Fix: use the token.
- [x] **A7 Inactive knobs are unreadable in the light theme.** Osc 1 Pulse Width, Filter Envelope stages, LFO Rate at 40 % opacity: the value is near-invisible on white. Rule: dimmed still means legible. Fix: 55 % opacity, and only the dial and value dim; the label keeps full colour.
- [x] **A8 Wording against the glossary.** LFO destination "Width" → "Pulse Width" (done). Osc 2 knob "Semi" → "Semitone" (done in fa6b9c4, with Key Track).
- [x] **A9 Amp block is mostly empty** at 1440 and above: four knobs, then the height of the Filter's two rows. Rule: no decision needed; it is the price of the three stages sharing one controls row so the Viewers line up. Decided: left as it is.
- [x] **A10 Spectrum axis labels collide** in the Filter Viewer: "0 dB / −24 dB" overprint the harmonic numbers 26 and 36 at the top right. Viewer code (src/viewers), which another session is active in; Handed to the session working in the Spectrum viewer. Fixed there (`8efbea9`, 2026-10-22): where the dB scale reaches the labels' row, the Harmonic labels stop short of it and every Harmonic keeps its tick (unit test in `harmonicMarkers.test.ts`). Checked 2026-10-26 at 880 × 920, the shortest Viewers: the labels end at 15, clear of "0 dB".
- [x] **A12 The Timeline plot outgrew its controls.** After the window was narrowed and widened again, the plot's canvas drove the row's height from its own pixel aspect ratio, and the stage Viewers paid for it. Rule: the plot is exactly as tall as the LFO and Glide controls beside it. Fix: the canvas fills a box sized by the controls and never sizes the row (tested across a resize).
- [x] **A11 Dividers in the Timeline.** The LFO and Glide groups have no divider between them while every other sibling group has one; the Glide knob also has no heading. Decided: left as it is (the knob label names it; a divider would split a 3-knob row).

Since then (2026-10-29, [issue 82](./82-top-row-centres-the-piano.md), decided by the owner): the full name still shows at every width, at full size; in three across it sits over the Patch picker rather than on the header's line.
