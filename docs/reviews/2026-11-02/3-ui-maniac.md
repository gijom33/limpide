# Persona review 3: the UI maniac

Playwright (the repo's 1.64.1) on the live site, Chromium and WebKit, at 320 × 568, 375 × 667, 393 × 659, 601 × 900, 700 × 830, 861 × 900, 1100 × 800, 1280 × 800, 1440 × 900 and 1920 × 1080, Dark and Light, plus a header sweep from 861 to 1960 px in steps of 13 and 40; about 25 minutes; 2026-11-02; version 1.21.1 (build 3015b1a). A stand-in MIDI Controller (Web MIDI mocked) for the MIDI panel and MIDI Learn. Measurements come from `getBoundingClientRect` / `getComputedStyle`. Screenshots are in `/private/tmp/claude-501/-Users-gijom-Developer-Limpide/db309908-85ae-4d88-90c4-b324c7415143/scratchpad/review-3/shots/`; three are next to this report.

## First impression

"The header finally has a grammar: Hold tall against the keys, then pairs in columns, 4 px inside a use and 14 px between. The MIDI panel is a real panel now. The piano running the full width at 1920 looks generous. Then I pressed MIDI Learn on my phone and the Hold tile slid over Song."

## What they tried

1. **Every size at rest, both engines and themes.** No sideways scroll anywhere (scrollWidth equals the window at all 40 combinations). No two controls overlap at rest. The header's columns at 861, 1100, 1280, 1440 and 1920 are what issue 154 says: pairs as wide as each other, 4 / 14 px gaps, the same in WebKit to the tenth of a pixel.
2. **Header sweep, 861–1960.** The keyboard meets Hold at 8 px up to 913 and from 1290, but at 12 px from 926 to 1277. The leftover room opens between the Patch's › and the octave buttons, so that gap jumps between 8 and 31 px as the window grows (31 at 1225, 12 at 1238). A wider window can show fewer keys: 12 at 1095 and 10 at 1108, 14 at 1277 and 11 at 1290, where the words come in. From 900 to 1099 the button block is centred on a piano that grows taller, so its top drifts from 16 to 22 px while the keys and octave buttons stay at 16 (finding 4).
3. **Panels.** Display drops under the header (y 74–86) and spans the gutter. MIDI (380 px, fixed since last time) and the Tutorial menu drop from the top row at y 47–52, over the bottom row (finding 2). On phones the Display panel is full-bleed (0–375) while MIDI keeps an 8 px gutter. Its Keys | Tips and Bead | Theme pairs make two rows whose dividers do not line up (x 118 and 151 at 375), with the right third empty. At 1440 the View | Axes divider (437) is 6 px off Show | Keys (431).
4. **Tutorial menu.** Each item's mortarboard icon shrinks to make room for its description: 14 px for Bass, 9.7 for Acid. So the names' left edges are ragged by 4.3 px (finding 5).
5. **Patch panel at 1440.** The category chips still wrap: Drums, Movement & Effects and My Patches are on a second row. The row labels are short (Keys & Org, Str & Brass, Move & FX) but their chips are long (Keys & Organs, Strings, Brass & Choir).
6. **Osc tabs.** The tabs abut, with no gap between them. Osc 2 (70.2 px) is still wider than Osc 1 with its dot (68.7). Sub & Noise still starts its pickers at x 188 and leaves a 96 px hole above the Viewers.
7. **Synth Geek Layer on.** The readouts are tidy (Q 1.32, −3.1 dB, ±0.00 oct, 0.50 s) and each Scope gets "2.27 ms · 440 Hz at A4" in its corner. The formulas on the spectra run over the harmonic bars (finding 3).
8. **Demo.** The about line ("Noise, through a singing Filter…") sits under the Patch name with an 11 px indent, aligned with nothing else on the page. The Demo card still covers LFO 2 and the Timeline at 1440.
9. **MIDI Learn.** The dashed boxes are tidy at 1440 and the bar is centred. But "MIDI Learning" widens its column: 28 → 85 px at 861, 75 → 117 at 1440. The header reflows, C6 drops off the piano, and Hold jumps 44 px left. On a phone it overlaps (finding 1).
10. **Bead.** By default it stands on the Amp's top edge at 1440. With MIDI open it moved up onto the piano's last key and Hold (y 5–28). With Display open, and in the Geek Layer, it stood inside the Filter's Viewer. On phones it hovers over the strip's "OSC" and, in the Demo, "LFO & ENV" labels. All of this is issue 181's ground.
11. **About.** The logo and name are centred, with Bead beside the name. At 320 the version line breaks "2 Nov / 2026" across two lines. On a first visit "Play the Demo" opens with its focus ring drawn without a key press (Chromium).

## What worked

- No sideways scroll, and no overlap at rest, at any of the 10 sizes in either engine.
- Issue 154's header is exact: the columns, the 4 / 14 px gaps and Hold as tall as both rows, identical in WebKit.
- The MIDI panel is 380 px wide with readable text, and the Bend choices are inside it (last review's #1).
- An open Display or Tutorial lights its button (last review's #8).
- Display's small settings are on one row from 1280.
- The phone header's two groups line up on 4 px gaps. Short words stay on one line at 320.

## Where they got stuck

- **MIDI Learn on a phone:** Hold drawn over Song.
- **MIDI or Tutorial opened at 861–1920:** the panel hides the very buttons beside them (Display, About, Song, Tap, Hold), so to switch panel you must first close this one.

## Would they

- **Like:** yes. The header is the best it has been.
- **Share:** almost. The MIDI Learn overlap on a phone is the one screenshot they'd send back.
- **Come back:** yes, to see the header settle at 900–1100.
- **Recommend:** yes.

## Since 1.16.0 (review of 2026-10-30)

Fixed: the MIDI panel's width (#1), the staggered header rows (#19, now issue 154's columns), and open panels whose button stayed at rest (#8). Dropped by the owner: the keyboard's centring (#4, issue 154, decision 3). Still open: the first rows not lining up (#5: Osc tabs 180, Filter Mode 171, Amp Voices 202 at 1440), the tab underline and dot space (#6), "−48 dB" crossed by the curve (#7), the Sub & Noise hole (#9), the Demo card over LFO 2 at 1440 (#11), the Patch panel chips wrapping (#15, now three chips), mixed inline and stacked labels (#16, now also at 1100–1919: the Filter's Mode inline, Cutoff and Envelope stacked), the unnamed LFOs on phones (#22), and a focus ring on the welcome without a key press (#20, now on Play the Demo). Not re-checked: #2, #3 and #21.

## Findings, ranked

1. MIDI Learn on a phone, 320–375 px (Chromium and WebKit): the "MIDI Learning" tile widens to 65 px and pushes Hold over Song (15 px overlap at 375, 3 px at 320, read "SoHold"); at 393 the two groups touch (3 px apart). From 861 px the same widening reflows the header and drops a key (C6 at 1440). `3-learn-375-hold-over-song.png`
2. At 861–1920 px (Chromium and WebKit), the MIDI panel and the Tutorial menu drop from the header's top row (y 47–52) over its bottom row and last keys (Hold, Tap, Song, About, Display), while Display's panel opens under the header (y 74–86): two anchoring rules. `3-midi-panel-1100-over-header.png`
3. With the Synth Geek Layer on, the spectra's formulas collide with the data: at 375 px (WebKit, both themes) "bₙ = 2 / (π n) / every n: each Harmonic 1/n of the first" and the Filter's "|H| = 1 / √…" run across the A4, 2 and 3 bars, and their backing washes the bars out; at 1440 px (Chromium) the Osc line ends on the A4 bar. `3-geek-formula-375.png`
4. The header's buttons do not line up with the piano: from 900 to 1099 px their top drifts 16 → 22 px while the keys and octave buttons stay at 16 (bottoms 74 vs 80); from 1100 px they sit 2 px inside the keys (18–78 vs 16–80). The keyboard–Hold gap is 12 px at 926–1277 and 8 px elsewhere. Chromium and WebKit.
5. In the Tutorial menu, at every width (Chromium and WebKit), a long description squashes the mortarboard icon (14 px for Bass, 9.7 for Acid), so the Tutorials' names start 4.3 px apart (1114.5 to 1118.8 at 1440).
