# Persona review 3: the UI maniac

Ran on version 1.26.1 (build 38df0ad) on 2026-11-07, on the live site. Playwright (the repo's 1.64.1), Chromium and WebKit, headless, at 320 × 568, 375 × 812, 430 × 932, 601 × 900, 690 × 830, 860 × 900, 861 × 900, 1000, 1100 × 800, 1280 × 800, 1440 × 900, 1920 × 1080 and 2560 × 1440, Dark and Light, plus a header sweep from 861 to 1953 px in steps of 13 and a tab-strip sweep from 1920 to 2560. Web MIDI mocked with a stand-in Controller for MIDI Learn. Measurements from `getBoundingClientRect` / `getComputedStyle`. About 25 minutes. Screenshots and scripts are in `/private/tmp/ui-maniac-1107/` (the ones named below are there).

## First impression

"Dark by default, even though my system asked for Light: fine, it's an instrument. The welcome card is centred and calm, the logo is lovely. Panels sit on a clean 16 px gutter and the header's right edge meets the panels' right edge to the pixel. Then I looked across at the two Envelope rows, Filter and Amp, side by side, and they don't share a line."

## What they tried

1. **Every size at rest, both engines, both themes.** No sideways scroll anywhere (scrollWidth equals the window in all 54 combinations). No two controls overlap at rest (the piano's black keys aside). Light and Dark carry the same colour by stage: green, orange, purple, blue, and the LFO destination dots take the target stage's colour.
2. **Header sweep, 861–1953.** The buttons now meet the keys exactly: top 16, bottom on the keys' bottom, Hold 8 px from the last key at every step. Two old wobbles remain: the slack still pours into the gap between the Patch's › and the octave buttons (8 to 31 px as the window grows), and a wider window can show fewer keys (12 at 1095, 10 at 1108; 14 at 1277, 11 at 1290).
3. **Rows across the panels.** At 1440 the first rows still sit at different heights (Osc tabs 180, Filter Mode 171, Amp Voices 201). Worse, the two Envelope rows, same faders, side by side: Filter's label at y 307 and its names at 383, Amp's at 289 and 365. 18 px off from 1100 to 2560, 23 px at 861 (finding 3, `f-env-rows-1440.png`).
4. **Osc tabs.** Osc 1 with its dot is 68.7 px, Osc 2 is 70.2. From about 2100 px the tabs move 80 px right inside their strip (first tab at x 113 while the heading and every other row start at 33); at 2040 and below they start at 33 (`f-osctabs-2560.png`). Sub & Noise still leaves about 120 px of nothing above the Viewers at 1440.
5. **Panels.** Display, MIDI and the Tutorial menu now all drop from the header's bottom plus 6 px (74 / 84 / 86 at 861 / 1100 / 1440), and on a phone Display, MIDI and Patch are all full-bleed. The Patch panel at 1440: Drums, Movement & Effects and My Patches still wrap to a second row, and its bottom edge cuts LFO labels in half behind it (Depth, Rate, Retrig, Sync peek out). In mixed rows, the Tutorial chips sit 1 px lower than their neighbours (227 vs 226, 260 vs 259, 388 vs 387; both engines).
6. **MIDI panel without MIDI** (Chromium: access not allowed; WebKit: not supported). MIDI Learn and Quick Setup are `disabled`, yet they have the enabled colour, a pointer cursor, they light up on hover and show the tooltip "Map your Controller: click a knob or button here…". A click does nothing (finding 2).
7. **MIDI Learn** (mocked Controller). On a phone the button now reads "Lrn" and nothing in the header moves. At 861 the MIDI tile still widens 28 → 42 px and the right group shifts 14 px left (no key lost). At 1440 nothing moves. The dashed boxes are tidy, but the Learn bar at the bottom sits over LFO 2's Depth and Rate values, slicing "0 %" and "2.00 Hz" in half, at 861 × 900, 1100 × 800, 1280 × 800 (even scrolled to the bottom) and 1440 × 900; it clears at 1920 × 1080 (finding 1, `f-learnbar-1440.png`).
8. **Demo.** At 1440 the card now covers only the Env Timeline (no longer LFO 2). At 861 it still covers LFO 2's Viewer and reaches its Sync (`st-demo-861-light-chromium.png`). The Kick's about line sits under the Patch, in the 16 px between header and panels.
9. **Synth Geek Layer.** The formulas are off the spectra now (they live in the Viewer's tooltip, "Under the hood"); each Scope gets "2.27 ms · 440 Hz". Tidy.
10. **States.** Hover is the same everywhere (fill plus text to full contrast) in both themes; pressed equals hover. Focus rings: knobs and faders take their stage's colour at a 2 px offset, but the selectors, Legato and LFO buttons in the same stage take the neutral ring at 1 px, the Osc tab an inset stage-coloured ring (−2 px), and the logo a green one at 3 px. Four offsets and two colour rules in one section.
11. **Tooltips.** With Tips off, the icon-only header now names each button on hover. But closing Display with Escape focuses its button and shows its tooltip, so with the pointer resting on something else, two tooltips show at once (Display + Demo at 1000, Display + Oscillator Scope on the phone in WebKit).
12. **Phones.** The LFO rows are still unnamed (no "LFO 1" / "LFO 2" under 601). The Display panel shows the Space key hint on Freeze on a touch phone (pointer coarse, no keyboard), which also makes Freeze taller than Snapshot beside it. Keys | Tips and Bead | Theme dividers still sit at different x (about 120 and 152 at 375).
13. **About.** At 320 the version line still breaks "7 Nov / 2026". On a first visit "Play the Demo" opens with its focus ring drawn without a key press (Chromium, `:focus-visible` true).

## What worked

- No sideways scroll and no overlap at rest, at every size, both engines and themes.
- The header is exact now: buttons on the keys' top and bottom, Hold 8 px from the keys from 861 to 1953.
- All panels share one anchoring rule, and on phones one full-bleed rule.
- MIDI Learn on a phone no longer moves anything ("Lrn").
- The Tutorial menu's icons are all 14 px; the names line up to the tenth of a pixel.
- Hover is one system across every button kind, in both themes.
- The inactive rule is applied everywhere I looked: Filter Envelope faders, Pulse Width, LFO Rate at Depth 0, Osc 1 during the Kick.

## Where they got stuck

- **MIDI panel in a browser without MIDI:** I hovered MIDI Learn, it lit up and told me how to map, I clicked, nothing. Only the panel's first sentence says why.
- **Mapping LFO 2 on a laptop:** the Learn bar hides the very values I'm about to map, and at 900 px tall the page cannot scroll them out from under it.

## Would they

- **Like:** yes. Most of last round's list is fixed, and fixed precisely.
- **Share:** yes, with designers; the envelope rows are the screenshot they'd send back.
- **Come back:** yes, to see the rows line up.
- **Recommend:** yes.

## Since the last run (2026-11-02, version 1.21.1)

Fixed: MIDI Learn pushing Hold over Song on phones (#1), the two anchoring rules for panels (#2), the Geek formulas over the spectra (#3), the header buttons drifting off the keys (#4), the squashed Tutorial icons (#5), and (from 2026-10-30) the wordless icon header with Tips off. The Demo card no longer covers LFO 2 at 1440. Still open: the first rows across panels, the Osc tab widths, "−48 dB" crossed by the curve and axis labels under the bars, the Sub & Noise hole, the Patch chips wrapping, the unnamed LFOs on phones, the welcome's focus ring, "7 Nov / 2026" at 320, the phone Display dividers, the Patch › gap and fewer keys in a wider window, and the Demo card over LFO 2 at 861. New: findings 1–3, the Tutorial chips 1 px low, the Osc tabs shifting at ≥ 2100, the focus ring's four offsets, two tooltips at once, and the Space hint on phones.

## Three findings, ranked

1. In MIDI Learn at 861–1440 px (Chromium, both themes), the Learn bar sits over LFO 2's Depth and Rate values and slices "0 %" and "2.00 Hz" in half; at 1440 × 900 the page cannot scroll them clear (it clears at 1920 × 1080). `f-learnbar-1440.png`
2. In a browser without MIDI (Chromium blocked, WebKit unsupported), the disabled MIDI Learn and Quick Setup look enabled: same colour, pointer cursor, they light up on hover and show the how-to-map tooltip, and a click does nothing. `midi-panel-hover-webkit.png`
3. The Filter and Amp Envelope rows, side by side, sit 18 px apart at 1100–2560 px (names at y 383 vs 365 at 1440) and 23 px at 861: the same faders on two baselines. Both engines and themes. `f-env-rows-1440.png`
