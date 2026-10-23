# 15: UI polish

**What to build:** One set of layout rules applied everywhere, so the instrument reads as one family of controls at every supported window size and in both themes. Four known rough edges first; then an audit of the rest, approved item by item.

**Blocked by:** 13

**Status:** in progress

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
- [x] The SynthView name is visible at every width (test at 872, 1000, 1100 and 1440 px)
- [x] Done lives in the MIDI panel; the header shows Learning; the bar has no button (tests updated)
- [x] One knob pitch per knob size, rows left-aligned, envelope wraps 3+2 in compact mode (test: every row's dial pitch is equal)
- [x] Label and value lines have fixed heights
- [x] Spacing, type and pitch tokens
- [ ] Audit findings listed below with before-screenshots (1440×900, both themes), and ticked as approved

## Audit

_Filled in after the four items land._
