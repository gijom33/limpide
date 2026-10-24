# 18: Prototypes for the 2.0 look

**What to build:** A throwaway page (`proto.html`, on a branch, deleted after) built from the real tokens, showing two or three variants side by side of each new control, playable with a mouse and on a phone over the local network. The owner picks one variant per row; the picks are written below and become the spec for issues 19–23.

**Blocked by:** none

**Status:** done (look B chosen on 2026-10-24)

- [x] Knob: value arc styles (thin arc, thick arc, arc plus glow while dragging), big and small sizes
- [x] Fader: track and handle styles, with value and label
- [x] Modulation colour: one colour per look (cyan, blue, yellow), dark and light values
- [x] Modulation ring: range arc and live dot, driven by the real Modulation model
- [x] Single-pointer alternative to dragging (WCAG 2.5.7): type the value (A), click the arc (B), − / + steps (C)
- [x] Phone stage strip: chips (A), underlined tabs (B), bottom tab bar (C); the header's row 1 sliding away
- [x] LFO block: one-cycle plot with a playhead (A), the real LFO history scrolling (B), a cycle scaled by Depth (C)
- [x] Picks recorded here

The prototype is kept, never merged, on branch `prototype/2.0-look` (latest `30cf977`): three looks on the real page, switched with `?variant=A|B|C`, and `npm run proto` serves it on the local network. Its code was written to answer "what should it look like", without tests: issues 19–23 rebuild it properly.

## Picks

**Look B ("Serum") throughout**, refined over several rounds with the owner:

- **Panels:** darker than today in the dark theme (page `#08090c`, panels `#0f1115`, borders `#22262e`), so the controls stand out; in the light theme, slightly grey panels (`#eef0f3`) under white caps.
- **Knob:** a thick value arc (6 px big, 4 px small) in the stage colour on a darker track, butt ends; inside it a raised cap (light radial gradient `#555c6b` → `#2c313b` in dark, white in light, a fine light edge and a soft drop shadow).
- **Marker:** one short line, 3 px, in the text colour, the same on every knob and fader. On big knobs it runs from partway in to near the cap's edge; on small knobs it starts at the centre, so it stays readable.
- **Sizes:** big knobs 68 px (60 px on phones), small knobs 52 px, with a 24 px cap. Pulse Width is a small knob (not a play control after all).
- **Fader:** an 8 px track with a fill in the stage colour from the bottom, and a 24 × 14 px handle that is a small cap of the knobs' material with the same marker line across it.
- **No glow**, not while dragging, not when selected. Keyboard focus alone shows a plain 2 px ring in the stage colour; a click or drag shows nothing.
- **Inactive** controls dim their value (arc, track, fill) to 55 %, never their marker, which always shows where the control is set. *Changed in issue 19 at the owner's request: an inactive control greys out as a whole, marker included, to 30 %.*
- **Modulation colour:** blue, `#5b8cff` in dark, `#2f5fe0` in light. The Modulation row (LFO) wears it as its stage colour: border, heading and knob arcs.
- **Modulation ring:** a 2.5 px arc outside the value arc over the reachable range, and a live dot at the Effective value while a Note sounds.
- **Single-pointer alternative:** a click on a knob's arc (without dragging) jumps the value there; a tap on a fader's track (without dragging) jumps there too, while a drag on the track still scrolls the page on touch screens. This replaces "a tap on the track does nothing".
- **Layout:** each control's column is as wide as its dial or its text, whichever is wider, so no two controls are ever closer than 8 px (checked at 375×812, 1000×800 and 1440×900). The Filter Envelope is one row (Amount, then four faders). The heading column is 68 px, the width of WAVEFORM. In a row with a picker and a knob, the picker and heading line up with the dial's visible bottom, as mixed-size knobs line up by their bottoms.
- **LFO block:** the plot shows the LFO's real recent history, scrolling, with the live dot at the right; clicking it steps through the shapes (the shape buttons go). It sits to the right of the Destination selector and shrinks to the room left on a phone.
- **Phone stage strip:** equal tabs (OSC · FILTER · AMP · LFO) with an underline in the stage colour, sticky under the header. Tapping a tab lands that block 8 px under the strip, measured once the header's first row has slid away; the tab of the block a third of the way down the screen is highlighted.
