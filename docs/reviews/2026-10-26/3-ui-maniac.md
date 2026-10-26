# Review 3: The UI maniac (product designer)

Reviewed 26 Oct 2026 on the live site (https://gijom33.github.io/limpide/, version 1.8.1, build 2ba9f3a). Headless Chromium driven by Playwright at 375 × 812, 430 × 932, 601 × 900, 690 × 830, 860 × 900, 861 × 900, 1440 × 900, 1920 × 1080 and 2560 × 1440. Every state was captured in Dark and Light (Osc 1, Osc 2, Mixer, Patch, Display, MIDI, About; welcome skipped with `limpide.welcomed` = `1` except when I reviewed the welcome itself). Along the way I added 1366 × 768 (the most common laptop), 360 and a width sweep from 300 to 2560 px. Every claim below comes from `getBoundingClientRect` / `getComputedStyle` measurements or a `layout-shift` PerformanceObserver. Viewer labels are drawn on canvas, so for those the evidence is zoomed 2× screenshots. Screenshots are in `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/36d37233-05e7-42d9-b44f-0f4198add8ba/scratchpad/reviews/3-ui-maniac/shots/` (below, `…/shots/` means that folder).

## First impression

"Okay, this is a nice dark instrument UI. It has four bordered sections, each with its own colour: green Oscillators, orange Filter, purple Amp, blue LFO & Envelopes. The colour carries through to the knob arcs, the selected segment, the fader fill and the focus ring. The type is small and quiet, with tracked caps for headings and labels. There's a real piano in the header. Someone obviously cares. Then my eye goes to the Amp column: why does 'Voices' start 30 px lower than 'Mode' next door? And why is there a dashed curve running through '−48 dB'?"

## What they tried, in order, and what happened

1. **Laptop, 1440 × 900, Dark.** Everything fits on one screen with no scroll. The three stage columns are 458.7 px wide with 16 px gutters, and LFO & Envelopes spans the full width underneath. The section headings line up at y = 121. The first control rows don't: Osc tabs at y = 159, Filter Mode at 149, Amp Voices at 180, and the Amp "Envelope" label at 282 against Filter's at 299.
2. **Osc 1 → Osc 2 → Mixer tabs.** Switching causes no layout shift. Only the Osc 2 underline looked off. It is 70 px wide where Osc 1 is 57 and Mixer is 59, because a hidden 6 px `.tab-badge` keeps its space.
3. **Hover, focus, pressed.** Hover is one consistent recipe (grey text → white, background to a 12 % grey) on every tool button, radio and tab. Focus rings are visible everywhere but use four different recipes. Pressed and "on" states use three different fills.
4. **Panels at 1440.** Patch and Display drop down at y = 86, and the Display panel is right-aligned to its trigger. MIDI opens in the middle of the screen (x 530–910), 271 px left of the MIDI button. About is a centred modal.
5. **Demo.** I recorded layout shifts. Only the fader caps move (expected), plus the Patch name, which slides 6 px left about 170 ms after "Kick" appears, when the "changed" dot is added.
6. **Width sweep from 300 to 2560 px.** Nothing scrolls sideways at any width (scrollWidth = viewport width every time). But three bands break the Filter Envelope row: 345–369, 601–603 and **1331–1434**. In that last band, the most common laptop size, the Release fader drops onto a line of its own.
7. **2 × 2 (601, 690, 860).** The four sections share one 16 px inner margin, as the owner said. The LFO plots don't respect the content edge, the legend wraps, and at 601 the Osc tabs float 86 px under their heading.
8. **Three across, narrow (861–960).** The stage sections have 8 px side padding and LFO & Envelopes has 16, so their headings sit at x = 25 and x = 33. At 861 the legend runs into the section's border.
9. **Phones (375, 430).** The section strip (Osc / Filter / Amp / LFO & Env) is sticky. Tapping an item lands its section 8 px under the strip every time, and the underline follows the scroll. The header slides up 96 px on the first scroll-down and comes back on any scroll-up, with a 0.2 s ease that helps rather than distracts. Here too the stage sections (12 px side padding) differ from LFO & Envelopes (16 px).
10. **Panels on phones.** Display, Patch and MIDI open at full width under the header. The Patch panel has two scrolls inside one another, and its bottom (name field, Save, Export) is below the fold.
11. **Wide (1920, 2560).** Four across, header items correctly centred on the keyboard. The LFO 2 row is 1.5–2 px right of LFO 1. At 2560 the viewers take 73 % of each section's height.
12. **Light theme, all sizes.** Stage colours are remapped consistently: each section's heading colour equals its selected-control colour in both themes (e.g. Filter #e36b02 in Dark, #973201 in Light). Same geometry, same nitpicks.
13. **Welcome and About.** Clean and centred. The primary "Play the Demo" is in the app accent #ff9a3c, a near neighbour of Filter's #e36b02. "Source on GitHub" breaks across two lines.

## What worked

- No horizontal scroll and no clipped text at any of the 9 listed sizes or anywhere in the 300–2560 sweep. That's rare.
- Colour by stage is truly systematic. In both themes each section's heading, border, selected segment, knob arc, fader fill and focus ring derive from one stage token. The LFO destination chip even carries a dot in the destination's stage colour.
- One hover recipe for every button-like control. Inactive controls are dimmed to 45 % consistently, by one rule (`data-inactive`).
- The 2 × 2 layout now really has one 16 px inner margin on all four sections.
- On phones, the sliding header and the sticky section strip are well done: no jump, an 8 px landing offset every time, and they honour reduced motion.
- Tab switching and opening panels cause zero layout shift.
- A tight type scale: 21 / 13 / 12 / 11 / 10 px. (One exception is noted below.)

## Where they got stuck or gave up

- They didn't give up, but they stopped trusting the layout at **1366 × 768**. On a standard 13–14" laptop the Filter Envelope's Release fader is orphaned on its own line, and the Osc and Amp contents float down to stay centred. It is the first thing a designer on a laptop would see.
- **MIDI**: they clicked the MIDI button and looked under it for the panel. It opened in the middle of the screen instead.
- **Patch panel on a phone**: they scrolled the preset list to the end, then had to scroll the page as well to reach "Name this sound" and Save.

## Would they…

- **Like:** Yes. The stage-colour system and the restraint of the type deserve it, and the 2 × 2 margins show someone sweating details.
- **Share:** Not yet. The orphaned Release fader at 1331–1434 px and the 8 / 16 px margin split at 861–960 are exactly what other designers would screenshot back at them. They'd share after those two are fixed.
- **Come back:** Yes, to check the next release. The bar it sets for itself is high enough to be worth re-checking.
- **Recommend:** Yes, as an example of a colour-coded, signal-flow UI done well, with "look at it on a 1440 or 1920 screen" for now.

## Nitpicks, ranked

1. **Filter Envelope's Release fader wraps onto its own line, and the Osc tabs fall 83 px below their heading**, at 1331–1434 px wide (1366 × 768 included), 601–603 px (86 px gap) and 345–369 px (360 phones). Measured: Release label at y 497 vs 375 for Amount–Sustain at 1366. Osc tablist 83 px under the h2, against 22 px at 1440. At 1366 × 768 the page also becomes 959 px tall and scrolls. Dark and Light. `…/shots/1366x768-home.png`, `…/shots/601-dark-home.png`
2. **Inner margins still differ outside the 2 × 2 layout.** At 375/430 the stage sections have 8 px / 12 px padding (heading at x 21) while LFO & Envelopes has 12 / 16 (heading at x 25): a 4 px step. At 861–960 the stage sections have 12 / 8 px (heading at x 25, 9 px from the border) and LFO & Envelopes 12 / 16 (x 33): an 8 px step. Both themes. `…/shots/z-margins375.png`, `…/shots/861-dark-home.png`
3. **The MIDI panel is centred in the viewport, not anchored to the MIDI button.** At 1440: panel x 530–910, button 1181–1249 (271 px apart). At 1920: 770–1150 vs 1661. At 2560: 1090–1470 vs 2301 (831 px apart). At 690 the panel ends at 535, 11 px left of its own button (546). Display, by contrast, right-aligns to its button. `…/shots/1440-dark-midi.png`
4. **At 861–879 px the timeline legend overflows into the section border.** "Effective Cutoff" spans x 780–845: 17 px past the content edge (828), flush with the border at 845. All three items wrap to two lines (26 px tall), and the legend's top (682) is 5 px above the heading's (687). It's +8 px at 870. `…/shots/z-legend861.png`
5. **Viewer labels collide with data, at every width and in both themes.** Filter "−48 dB" is crossed by the dashed response curve (and "A4", "4" at 601–1366). The spectrum's "1k" and "10k" axis labels are drawn under the harmonic bars. In the LFO & Envelopes plot, "1k" is struck through by the Effective Cutoff line and its end dot. `…/shots/z-filterdb1440.png`, `…/shots/z-tl1k1440.png`, `…/shots/z-lfoplot601.png`, `…/shots/1440-dark-display.png`
6. **Three different "on" fills for toggles.** Song/Demo on: an inverted fill, rgb(230,232,238) with dark text. Hold on, right next to them: dark grey rgb(45,47,51). Display panel toggles (Harmonics, Curve, All, Log…): rgb(67,69,73). 1440, Dark. `…/shots/z-pressed-header.png`
7. **The Patch name jumps when the Demo starts.** "Kick" shifts 6 px left about 170 ms after it appears, when the `.patch-changed` dot is inserted (layout-shift 238.0 → 232.0 at 1440, 241 → 232 at 375). The text should not move when the dot comes and goes. `…/shots/z-patchname-2.png`
8. **The Osc 2 tab is wider than its siblings.** Box 70 px against 57 (Osc 1) and 59 (Mixer), because the hidden 6 px `.tab-badge` keeps its space. The selected underline overhangs "OSC 2" by about 13 px on the right, and the label gaps are uneven (about 12 vs 22 px). All widths. `…/shots/z-osc2-1440.png`
9. **First rows don't line up across columns (three and four across).** The sections vertically centre their content instead of top-aligning it. At 1440 the first control row is at Osc 159 / Filter 149 / Amp 180, and "Envelope" is at Amp 282 vs Filter 299. Amp's Voices row sits 31 px below Filter's Mode row. `…/shots/1440-dark-home.png`, `…/shots/1920-dark-home.png`
10. **LFO plots ignore the content edge in 2 × 2.** At 601 they overhang it by 5 px (plot right edge 573 vs 568, out of line with the timeline plot below). At 690 they stop 40 px short (617 vs 657), and at 860 125 px short (702 vs 827). `…/shots/z-lfoplot601.png`, `…/shots/860-dark-home.png`
11. **LFO 2's row sits 1.5–2 px right of LFO 1's at 1920 and 2560.** Next-destination buttons at 1851.3 vs 1852.8, plots at 1711 vs 1713. The cause: "LFO 2" is 1.5 px wider than "LFO 1" and the label column has no fixed width. `…/shots/z-lforows1920.png`
12. **Four focus-ring recipes.** Buttons and radios: white, 2 px, offset 1. Knobs and faders: stage colour, offset 2. Tabs: stage colour, inset −2. Wordmark: Osc green (in the header, not a stage), offset 3. On inactive faders the ring inherits the 45 % opacity and is barely visible. 1440, Dark. `…/shots/focus/dark-0.png`, `dark-12.png`, `dark-13.png`, `dark-33.png` (same folder)
13. **Panel edges are on no common grid.** At 1440 the Display panel starts at x 31.6, while the page gutter and sections start at 16. At ≤860 Display and Patch run edge to edge (0–375 / 0–430), but at 430 MIDI is inset 25–405. `…/shots/1440-dark-display.png`, `…/shots/375-dark-display.png`
14. **The phone Patch panel nests two scrolls.** The preset list scrolls inside (556 px of 1451) while the panel itself ends at y 910 on an 812 px screen. "Name this sound" is cut by the fold (801–829), and Export / Import / Copy share link are below it. 375 × 812. `…/shots/375-dark-patch.png`
15. **Uneven outer spacing from 861 px up.** The page's bottom margin is 32 px against 16 px at the sides. In three across, the row gap is 12 px (660 → 672) but the column gap is 16. On phones the gap between sections is 12 but the side gutter 8. `…/shots/1440-dark-home.png`
16. **At 860 px, label placement mixes inline and stacked within one section.** Filter "Mode" sits left of its control (68 px column), while "Cutoff" and "Envelope" sit above theirs, full width. Same in Amp: "Voices" inline, "Envelope" above. `…/shots/860-dark-home.png`
17. **The collapsed phone header leaves 4 px above the keys and 8 px below** (keyboard y 4–68, strip from 76), so the keys nearly touch the top of the screen. 375. `…/shots/strip-375-Filter.png`
18. **The accent orange #ff9a3c (Play the Demo, primary buttons) sits next to Filter's #e36b02** (Light: #d96a0b vs #973201). The one non-stage colour reads as "Filter" and blurs colour-by-stage. `…/shots/welcome-1440-light.png`
19. **On phones the LFO 1 / LFO 2 names are hidden.** The two rows differ only in the selected wave's fill (#5b8cff vs #c9d7ff in Dark). 375/430. `…/shots/375-dark-home.png`
20. **Inactive controls are half-dimmed.** The dial, fader and value drop to 45 % opacity while the label stays at 100 % (Pulse Width, the Filter Envelope faders, LFO Rate), which reads as half-disabled. All widths. `…/shots/z-osc1440.png`
21. **Two pickers with the same ‹ name › pattern have different resting text.** The Patch name is grey, rgb(138,145,162), while the LFO destination name is white, rgb(230,232,238). 1440. `…/shots/1440-dark-home.png`
22. **"Source on GitHub" breaks across two lines** in About and the welcome dialog at ≥601 (link box 339 × 34). `…/shots/1440-dark-about.png`, `…/shots/welcome-1440-light.png`
23. **The viewers swamp the controls on wide screens.** At 2560 they take 73 % of each section's height (473 + 473 of 1300 px; 62 % at 1920), while the controls stay 11–13 px type in the top ~230 px. `…/shots/2560-dark-home.png`
24. **The header words under the icons are 9 px** (`font-size: 9px; line-height: 10px`) up to 860 px, below the 10–21 px scale used everywhere else. 375–860. `…/shots/601-dark-home.png`
25. **The Wordmark is a button** (pointer cursor) **but has no hover state:** colour and background are unchanged on hover. 1440.
26. **Tab order runs Octave down (bottom) before Octave up (top),** against the visual order. All widths.

## Three findings, ranked

1. Filter Envelope's Release fader wraps alone onto a second line, and the Osc tabs drop 83 px below their heading, at 1331–1434 px (1366 × 768 included), 601–603 px and 345–369 px phones.
2. Inner margins still differ outside 2 × 2: on phones the stage sections use 12 px and LFO & Envelopes 16 px. At 861–960 the stage sections use 8 px and LFO & Envelopes 16 px.
3. The MIDI panel opens centred in the viewport instead of under the MIDI button: 271 px away at 1440, 831 px at 2560, and at 690 it ends left of its own button.
