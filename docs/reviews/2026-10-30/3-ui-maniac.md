# Persona review 3: the UI maniac

Headless Chromium (Playwright) on the live site at 375 × 812, 430 × 932 (touch, mobile), 601 × 900, 690 × 830 (touch), 860 × 900, 861 × 900, 1440 × 900, 1920 × 1080 and 2560 × 1440, Dark and Light, plus a width sweep from 320 to 2560 px; about 20 minutes; 2026-10-30; version 1.16.0 (build 328a370). A stand-in MIDI Controller (Web MIDI mocked) for the MIDI panel and MIDI Learn. Measurements come from `getBoundingClientRect` / `getComputedStyle` and a `layout-shift` observer. Screenshots are in `/private/tmp/claude-501/-Users-gijom-Documents-Claude-Projects-Limpide/d1f576f6-669d-4a14-a3cd-b26eeb51b2fc/scratchpad/review-3/shots/`.

## First impression

"The header grew up: the Patch picker sits with the logo, the piano is dead centre at 1440, and the buttons sit in two tidy rows on the right. The Oscillators as four tabs is cleaner, and a silent source's controls fade to 30 % while their names stay readable, as the rule says. The Demo card's segments are a nice touch. Then I clicked MIDI and got a 60 px wide strip of text, one word per line, spilling over the Amp section."

## What they tried

1. **1440, Dark, at rest.** No scroll, sections on a 16 px gutter, keyboard centred to the pixel (500–940, centre 720). Two button rows right-aligned to 1424.
2. **Oscillator tabs.** Osc 1, Osc 2, Sub & Noise, Mixer: the viewers stay at y 421 on every tab, so nothing jumps. Osc 2 and Sub & Noise grey out as a whole (pickers and knob dials at opacity 0.3, names at 1). The sounding dot moves to whichever tab sounds (Sub & Noise during the Demo's Kick).
3. **Panels.** Patch and Display now span the page gutter (16–1424). The Tutorial menu drops under its button. The MIDI panel is broken (nitpick 1).
4. **MIDI Learn.** Dashed boxes on every mappable control, a mapped dot on Cutoff, and the Learn bar at the bottom. The Patch name gets its changed dot without moving.
5. **Demo.** The card shows a row of segments that fill. A layout-shift observer saw no shift on the Patch name in the first 1.5 s (in 1.8.1 it moved 6 px). At 1440 the card floats over LFO 2's knobs.
6. **Tooltips.** On: a calm card in both themes (12 px text, 10/12 padding, radius 10). Off: the icon-only header from 861 px has no words left (nitpick 3).
7. **2 × 2 (601–860).** Values show only while changing. With a mouse the value takes the name's place ("Resonance" becomes "50 %").
8. **Width sweep, 320–2560.** No sideways scroll anywhere. The Filter Envelope row never wraps and the tabs never wrap. The keyboard is off-centre between 602 and 1204 px.
9. **Phones (375, 430).** Header in three rows (logo and Patch; labelled icon tiles; keys), sticky section strip. The Patch panel's name field and Save are now above the fold.
10. **Light theme, every state.** The same geometry and the same nitpicks. Greyed controls nearly vanish on the light panels.

## What worked

- Still no horizontal scroll at any of the 9 sizes or anywhere from 320 to 2560 px.
- The Release fader no longer wraps at 1331–1434, 601–603 or 345–369. The sweep found no wrap at any width.
- Margins: at 861 all four sections now use 12 / 8 px padding (in 1.8.1 the stage sections used 8 and LFO & Envelopes 16).
- Display and Patch panels now sit on the page gutter, the Patch name no longer jumps when the Demo starts, and "Source on GitHub" stays on one line.
- Hold-on and Demo-on now share one "on" fill (the inverted one).
- The greyed-out rule is applied the same way on every tab: pickers, dials and markers at 30 %, names at full strength.
- Tab switching moves nothing below the tab panel.

## Where they got stuck

- **MIDI**, at every width from 601 up: the panel is the width of the MIDI button, so its text reads one word per line, MIDI Learn and Quick Setup are clipped, and the Bend choices hang outside the panel over Amp. They had to guess what "Quick Setu" was.
- **The Patch name at 601–609 px**: every Preset reads "I…", "K…", "S…". At 861–1100 the longer names are cut too ("Split…").
- **Display › Tips › Off at 861–1204 px**: seven bare icons with no word anywhere, not even on hover.

## Would they

- **Like:** yes. The tabs, the 30 % greyed-out rule and the gutter-aligned panels are real craft progress.
- **Share:** not yet. The MIDI panel at 1440 is exactly what a designer would screenshot back, and the truncated Patch name at 601 is a close second.
- **Come back:** yes. Most of the 1.8.1 list is fixed, so the next release is worth checking.
- **Recommend:** yes, with "don't open MIDI yet".

## Since 1.8.1

Fixed: the Release wrap (1.8.1 #1), the 861–960 margin split (#2), the legend overflow at 861 (#4), the Patch name jump (#7), the off-grid panel edges (#13), the phone Patch panel's buried Save (#14), the half-dimmed inactive controls (#20, now a 30 % rule), and "Source on GitHub" breaking (#22). MIDI is now anchored under its button (#3), but the anchoring broke its width (new #1 below). Hold and Demo share one "on" fill (#6, partly fixed). Still open: first rows not aligned (#9), viewer labels colliding (#5), the tab underline overhang (#8, now on two tabs), the four focus-ring recipes (#12), the LFO 2 offset (#11), the mixed inline and stacked labels (#16), the accent next to Filter (#18, now also a CTA in Osc green), and the hidden LFO names on phones (#19).

## Nitpicks, ranked

1. **The MIDI panel is as wide as the MIDI button.** It measures 59.6 px wide at 1440 and 1920 and 34 px at 690, while its content needs 105 px (scrollWidth). The text wraps one word per line, "MIDI Learn" and "Quick Setup" are clipped at the right, and the Bend choices 2 / 7 / 12 stack vertically outside the panel's border over the Amp faders. All widths ≥ 601, both themes. Cause: `width: min(380px, 100%)` is measured against `.midi-menu`, which turns `position: relative` from 601 px. `1440-dark-midi.png`, `690-dark-midi.png`
2. **The Patch name is cut even when it is short.** At 601 the name field is 62 px with a 17 px text box: "Init" shows as "I…", and so does every other Preset. "Kick" is still cut at 605 and "Breathing Pad" at 610. At 861 the field is 86 px ("Split Octave Bass" shows as "Split…"), and at 900–1000 it is still cut (59 px of 103). At 1100 "Split Octave Bass" is cut (89 of 103). Both themes. `z-patchname-601.png`, `z-patchname-861.png`
3. **With Tips off, the icon-only header has no words.** From 861 to about 1204 px, Hold, MIDI, Display, About, Demo, Tutorial and Song are bare icons with no title and no visible label. With Display › Tips › Off, hovering them shows nothing. The design principle "Icons carry words where hover cannot" is then broken on a pointer screen. The icons' widths also differ in that row: Demo and Song 25 px, Tutorial 28 (861). `tip-1000-off-dark-demo.png` vs `tip-1000-on-dark-demo.png`
4. **The keyboard is off-centre outside 1205–1924 px.** At 863–1204 it is up to 93 px right of the window's centre (centre 512 vs 430.5 at 861, +91 to +93 at 881–947). At 602–862 it is 16 px right, because the group with the octave buttons is what's centred. It is exactly centred at 1205–1924 and 16 px off again from 1925. `861-dark-home.png`
5. **First rows still don't line up across columns.** At 1440 the first control rows are at Osc tabs 159, Filter Mode 149, Amp Voices 180. At 1920 they are Osc 169, Filter 149, Amp 180, LFO 149. Amp's content still floats down. `1440-dark-home.png`, `1920-dark-home.png`
6. **Two tabs keep a hidden dot's space.** Osc 2 is 70.2 px and Sub & Noise 112.8 px wide, against Osc 1 at 68.7 (dot shown) and Mixer at 59.2. The selected underline overhangs the label about 23 px on the right and 10 px on the left. All widths. `z-osc2-dark.png`, `z-subnoise-dark.png`
7. **Viewer labels still collide with data.** "−48 dB" is crossed by the dashed response curve. "1k" and "10k" sit under the harmonic bars. On the Timeline, "100" sits under the curves' end dots. All widths, both themes. `1440-dark-home.png`, `1440-light-demo2.png`
8. **Open panels leave their button at rest.** With Display, Tutorial or MIDI open, the button stays transparent with muted text (rgb(138,145,162)), the same as at rest. Hold-on and Demo-on use the inverted fill, and the Display panel's toggles a grey rgb(67,69,73). 1440. `1440-dark-display.png` (the highlight there is hover only)
9. **Sub & Noise has its own label system and a hole.** It uses caps "SUB" / "NOISE" plus sentence-case "Octave" / "Waveform" / "Colour". Its pickers start at x 185, while every other tab's controls start at x 113. Its content ends at y 303 in a panel that runs to 399, which leaves 96 px of nothing above the viewers. 1440. `z-subnoise-dark.png`
10. **Stage colours on buttons that are not stages.** About's "Play the Demo" is exactly the Oscillators green (#08ad72; Light #06915f). "Follow the Tutorial" and the Demo card's progress use the accent #ff9a3c beside Filter's #e36b02 (Light #d96a0b vs #973201). All widths. `1440-light-about.png`, `1440-light-demo2.png`
11. **The Demo card covers controls at 1440.** The card spans x 361–1079, y 797–886 and sits on LFO 2's Depth and Rate knobs and the Timeline's bottom. `1440-dark-demo.png`
12. **The MIDI Learn bar sits on LFO & Envelopes' value row** (y 852–884 over LFO 2's "0 %" and "2.00 Hz"). The dashed Learn boxes on the Filter Envelope nearly touch (about 4 px apart). 1440. `1440-dark-midi-learn2.png`
13. **LFO 2's row is still 1.5 px right of LFO 1's** at 1920 and 2560 (Next destination 1879.3 vs 1880.8). `1920-dark-home.png`
14. **Five focus-ring recipes.** Buttons and radios: white, offset 1. Knobs and faders: stage colour, offset 2. Tabs: Osc green, inset −2. Wordmark: Osc green, offset 3. Viewers: white, offset 2. 1440, Dark.
15. **Patch panel chips at 1440.** The "My Patches" category chip wraps alone onto a second row, and the "Movement & Effects" row label breaks over two lines. `1440-dark-patch.png`
16. **Inline and stacked labels mix within one section** on phones and 2 × 2. Filter "Cutoff" is inline but "Envelope" is stacked, and the same goes for Amp "Voices" and "Envelope". 375–860. `375-dark-home-full.png`
17. **On 2 × 2 with a mouse, a drag hides the name.** The value takes the name's place ("Resonance" becomes "50 %"), so mid-drag nothing says which knob it is. 690. `z-drag-690.png`
18. **Greyed controls nearly vanish in Light.** Light caps at 30 % on a light panel (Osc 2's Octave, Semitone, Env Amount). This conforms to the rule but reads as missing rather than off. `z-osc2-light.png`
19. **The two header rows stagger.** At 1440 the top row starts at x 1130 and the bottom one at 1212 (82 px). At 861 they start at 709 and 751. `1440-dark-home.png`
20. **The first-visit welcome opens with a focus ring on the build link** (328a370) though no key was pressed. The rule is "a ring for keyboard focus only". `probe-welcome.png`
21. **The theme ignores the system setting.** A visitor whose system is set to Light still gets Dark on a first visit (`prefers-color-scheme` is not read). Both themes.
22. **On phones LFO 1 and LFO 2 are still unnamed.** 375 and 430. `375-dark-home-full.png`

## Three findings, ranked

1. The MIDI panel is as wide as the MIDI button from 601 px up (59.6 px at 1440 and 1920, 34 px at 690): its text wraps one word per line, MIDI Learn and Quick Setup are clipped, and the Bend choices spill over the Amp section.
2. The Patch name is cut even when short: at 601 px every Preset shows as "I…" or "S…" (a 17 px text box), and at 861–1100 px longer names like "Split Octave Bass" show as "Split…".
3. With Display › Tips › Off, the icon-only header buttons at 861–1204 px (Hold, MIDI, Display, About, Demo, Tutorial, Song) have no word at all, not even on hover.
