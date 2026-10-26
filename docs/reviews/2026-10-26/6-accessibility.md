# Review 6: Accessibility (keyboard only and screen reader)

Reviewed 26 Oct 2026 on the live site (https://gijom33.github.io/limpide/, version 1.8.1, build 2ba9f3a). Headless Chromium at 1440 × 900, driven only with `page.keyboard` (Tab, Shift+Tab, arrows, Enter, Space, Escape, Home, End, Page Up, and the note letters). For the screen reader I used Playwright's `ariaSnapshot()` and read the DOM's roles, names, values and live regions. No real VoiceOver or NVDA was run, so anything about what a screen reader *says* is based on the accessibility tree, not on listening. I also ran axe-core 4.10.2 from cdnjs.

Two people, one review: **Kai** uses only the keyboard; **Rosa** uses a screen reader.

## First impression

**Kai:** "First Tab lands on the Limpide logo, with a clear green ring, and the header goes left to right like I'd expect. Then a lot of Tabs. Every knob and fader is a stop, and they all move with the arrow keys. Nice. I pressed A without focusing anything and heard a note. That's a good start."

**Rosa:** "The page is one `main` with a level-1 heading 'Limpide' and four regions with level-2 headings: Oscillators, Filter, Amp, LFO & Envelopes. Knobs are sliders with names and real values ('Cutoff, 2.00 kHz'), and their tooltip text is wired up as a description. Better than most synths. But the pictures, which seem to be the whole point ('shows you what each stage does to the sound'), come through only as 'figure, Oscillator Tap' with nothing inside."

## What they tried, in order, and what happened

1. **Welcome on a fresh visit.** A modal dialog named "Limpide" opens with focus on "Play the Demo". Tab cycles through Play the Demo, Explore, the build link and Source on GitHub, then out to the browser's own controls and back. That's normal for a native dialog and not a trap. Escape closes it and sets `limpide.welcomed`. **But after Escape, Explore or Play the Demo, focus drops to the page body, and the next Tab lands on the "Osc 1" tab, skipping the whole header** (Patch, Demo, Song, Hold, MIDI, Display, About). Also, while the welcome dialog is open, pressing A still plays C4 behind it.
2. **Tab order of the main page** (with the welcome skipped). 72 stops, recorded in the appendix. The header order is Wordmark, Previous Preset, Patch, Next Preset, Demo, Song, Hold, Octave down, Octave up, MIDI, Display, About, which matches the visual order. The piano's 17 keys are buttons with `tabindex="-1"`, so they are not Tab stops. Two things to note: Octave down comes before Octave up although "+" sits above "−", and there is no skip link (the first stop is the Wordmark).
3. **Focus visibility.** I took screenshots at stops 3 (Patch), 13 (Osc 1 tab), 14 (Sine), 31 (Velocity knob) and the Amp Attack fader. The focus ring was visible at every stop I checked: a 2 px outline in white on buttons and radios, and in the section colour on knobs (green, orange, purple, blue). The fader ring is drawn around the small 24 × 14 px cap, so it's thin but visible. Focusing a knob or the Patch button also shows its tooltip, which can cover nearby controls. For example, the Velocity tooltip covers Amount and Attack, and the Display tooltip covers the right end of the Display panel. Escape dismisses the tooltip and keeps focus. Good.
4. **Playing notes.** A, D and F with focus on the body, on the Wordmark button and on a slider all played (C4, E4, F4 lit and the Amp level rose). X then Z shifted the octave. Typing "awaswz x" into the Patch name field typed the text and played nothing. The two don't collide. The piano group's description explains the key layout ("A to ; are the white keys…"), so a screen reader user can find out about it.
5. **Changing the sound.** On Cutoff, Up, Right, Down and Left all step the value, Shift+Up makes a fine step, and the spoken value updates ("2.00 kHz" → "2.30 kHz"). **Home, End and Page Up did nothing** on the knob, and End did nothing on the Amp Attack fader. While holding F, ten presses of Up moved Cutoff from 2.67 to 9.27 kHz, and the Viewers showed the brighter sound.
6. **Radios (waveforms, filter mode, slope, voices, LFO waves, Display options).** Each option is a separate Tab stop, and the arrow keys do not move between them. Enter selects. **Space does not select: it freezes the Viewers instead.** Space on the "Square" radio left Square unchecked and put "FROZEN" on all three Viewers, with a dot on the Display button. The same happened on Hold and on the LFO destination button: Space did nothing to the control.
7. **Tabs (Osc 1 / Osc 2 / Mixer).** One Tab stop, and arrows switch and select tabs. Correct pattern. The Mixer faders (Osc 1, Osc 2, Noise, Sub) are reachable and named.
8. **Header buttons with Enter.** Demo starts and shows "pressed". Song plays. Hold latches a tapped note (G4 kept sounding) and releases it when turned off. Octave down and up shift the piano. Next Preset loads "Pure Sine": the Patch button's name changes, but focus stays on "Next Preset" and I found no live region in the header, so nothing would announce the new Preset name.
9. **Patch panel.** Enter opens it (`aria-expanded` becomes true) and focus stays on the Patch button. The panel is a non-modal `role="dialog"` named "Patches". Tab goes Next Preset, then into the panel: 100+ Preset buttons in labelled groups (Start, Shapes, Intervals, Filter…), then Patch name, Save, Export file, Copy share link, then out to Demo. The panel stays open when you Tab out, and Escape from outside closes it. **Loading a Preset with Enter (Vowel) closes the panel and sends focus to the page body.** So does Escape from inside. Save works and its `role="status"` line reads "Saved 'awaswz x'." **"Import file" is a label around a `hidden` file input and is not reachable by keyboard.**
10. **Display panel.** Enter opens it, focus stays on the button, and Tab goes into Freeze, Snapshot, Voices All/Newest, Freq Log/Lin, Level dB/Lin, Cycles 1/2/4, Harmonics, Ideal, Curve, Guides, Maths, Dark/Light. It has no dialog role or name and no `aria-controls`. **Escape from inside it closes it and focus goes to the body.**
11. **MIDI panel.** It's a `role="dialog"` named "MIDI". In headless Chromium it says MIDI access was not allowed, and MIDI Learn and Quick Setup are disabled. The "MIDI activity" `role="status"` is there. Escape closes it.
12. **About (and the Wordmark, which opens the same dialog).** Modal, focus on the first link, Close button, Escape closes and **focus returns to the button that opened it**. This one is right.
13. **LFO destination menu.** Enter opens a `menu` with `menuitemradio` items grouped Oscillators and Filter, and focus goes to the checked item. Arrows move and wrap, Enter picks (Cutoff became Resonance), and Escape closes. In both cases focus returns to the destination button. Tab from inside the menu closes it and drops focus to the body. Space on the destination button does not open the menu.
14. **Viewers (canvases).** Each canvas has an `aria-label` ("Oscillator Scope", "Filter Spectrum", "Envelope Timeline"…) but no role, so the tree does not expose those names. Rosa gets "figure, Oscillator Tap" (or "Oscillator Tap: Frozen") and nothing about what is drawn. The Envelope Timeline does not appear in the tree at all, apart from its legend text "Amp Envelope Filter Envelope Effective Cutoff". The LFO plots are `role="img"` named "LFO 1" and "LFO 2", with no description.
15. **Names with no section context.** The two envelopes both have sliders named "Attack", "Decay", "Sustain" and "Release". The two LFOs both have "Rate", "Depth", "Previous destination" and "Next destination", and their waveform radios are "Sine", "Triangle"…. The regions and groups help in browse mode, but when Tabbing the names alone are ambiguous.
16. **axe-core.** The only violation was `color-contrast` (serious), on 10 nodes. These are the dimmed value labels of currently inactive knobs (for example Pulse Width "25 %", #464b54 on #0f1115, 2.15:1).

## What worked

- Every knob and fader is a named `slider` with a spoken value (`aria-valuetext`), operable with the arrow keys plus Shift for fine steps. Tooltips are linked as descriptions and close with Escape.
- Notes play from the computer keyboard whatever has focus, and typing in the Patch name field does not trigger them.
- Focus was visible at every stop I checked.
- Real landmarks and headings, a proper tab pattern for Osc 1 / Osc 2 / Mixer, a proper menu for LFO destinations, `aria-pressed` on Demo, Song, Hold and Retrigger, and `aria-expanded` on Patch, MIDI and Display.
- The About dialog and the LFO menu return focus correctly. Nothing traps focus.
- **Success criterion met:** Kai made a sound (A, F) and changed it (Cutoff from 2.67 to 9.27 kHz while holding F, Low-pass to High-pass, the Preset to Vowel) without touching the mouse.

## Where they got stuck or gave up

- **Kai:** "I pressed Space on Hold and on a waveform, which is what Space is for, and the screens froze instead. It took a while to work out that only Enter works."
- **Kai:** "Every time I load a Preset or press Escape, I lose my place. The next Tab sends me back to Demo, or after the welcome all the way down to Osc 1."
- **Kai:** "Forty-odd radio buttons, one Tab each, and a hundred Presets one Tab each. Reaching the Save field took about 110 Tabs."
- **Kai:** "Import file: I can't reach it at all."
- **Rosa:** "The Viewers are the reason this app exists, and I get nothing from them. Not even a sentence like 'Saw wave, bright, harmonics to 8 kHz'."
- **Rosa:** "Next Preset changes the sound, but nothing tells me which Preset I'm on unless I move back to the Patch button."
- **Rosa (an inference from the tree, not tested with a real screen reader):** in browse mode, NVDA and VoiceOver take letters like A, D and F for quick navigation, so the computer-keyboard piano probably only works once focus is on a control in focus mode. The piano keys themselves cannot be reached with Tab.

## Would they…

- **Like it?** Kai: yes. The controls are real sliders and buttons, which is rare for a synth. Rosa: yes, with reservations. The controls are well named, but the visual half of the app is silent.
- **Share it?** Kai: yes, as an example of a web synth that mostly works by keyboard. Rosa: not yet. She would share it once the Viewers say something.
- **Come back?** Kai: yes, if Space works on buttons and focus stops jumping. Rosa: maybe, to play Presets. There's little to learn from the pictures today.
- **Recommend it?** Kai: yes, to keyboard users, with "use Enter, not Space" as a warning. Rosa: no, not to blind learners until the Viewers have text alternatives.

## Three findings, ranked

1. Space on any focused button or radio (Hold, waveforms, filter mode, LFO destination…) toggles Freeze instead of activating the control; only Enter works. This breaks the expected button and radio keyboard behaviour (WCAG 2.1.1 Keyboard; ARIA APG button and radio patterns).
2. Focus drops to the page body when a panel closes: loading a Preset, Escape in the Patch or Display panel, and Explore, Play the Demo or Escape in the welcome dialog. The next Tab jumps to Demo, or skips the whole header to Osc 1 (WCAG 2.4.3 Focus Order).
3. The Viewers have no text alternative: canvas `aria-label`s are not exposed without a role, the taps are only "figure, Oscillator Tap", the Envelope Timeline is absent from the tree, and the LFO plots are bare "img, LFO 1" (WCAG 1.1.1 Non-text Content).

Also worth an inbox line: "Import file" is not reachable by keyboard (hidden file input inside a label; WCAG 2.1.1). Radio groups are one Tab stop per option and ignore the arrow keys. Home, End and Page Up do nothing on knobs and faders. No live announcement after Next or Previous Preset (WCAG 4.1.3). Duplicate slider names across the two envelopes and the two LFOs (WCAG 2.4.6). The letter-key notes cannot be turned off (WCAG 2.1.4 Character Key Shortcuts). Dimmed inactive values have 2.15:1 contrast (axe). There is no skip link, though landmarks and headings exist (WCAG 2.4.1 is met through them).

## Appendix: Tab order (main page, welcome skipped, 1440 × 900)

Recorded by pressing Tab from page load. After stop 72, focus leaves the page. Names are accessible names. Values are as read at load time.

| # | Role | Name (value) |
|---|---|---|
| 1 | button | Limpide (opens the About dialog) |
| 2 | button | Previous Preset |
| 3 | button | Patch: Init (expanded false) |
| 4 | button | Next Preset |
| 5 | button | Demo (pressed false) |
| 6 | button | Song (pressed false) |
| 7 | button | Hold (pressed false) |
| 8 | button | Octave down |
| 9 | button | Octave up |
| 10 | button | MIDI (expanded false) |
| 11 | button | Display (expanded false) |
| 12 | button | About |
| 13 | tab | Osc 1 (selected) |
| 14 | radio | Sine |
| 15 | radio | Triangle |
| 16 | radio | Saw (checked) |
| 17 | radio | Square |
| 18 | radio | Pulse |
| 19 | slider | Pulse Width ("25 %") |
| 20 | slider | Octave ("0 oct") |
| 21 | slider | Semitone ("0 st") |
| 22 | slider | Detune ("0 ¢") |
| 23 | radio | Low-pass (checked) |
| 24 | radio | High-pass |
| 25 | radio | Band-pass |
| 26 | radio | Notch |
| 27 | radio | 12 dB (checked) |
| 28 | radio | 24 dB |
| 29 | slider | Cutoff ("2.00 kHz") |
| 30 | slider | Resonance ("20 %") |
| 31 | slider | Velocity ("0 %") |
| 32 | slider | Key Track ("0 %") |
| 33 | slider | Amount ("0 oct") |
| 34 | slider | Attack ("5.00 ms"), Filter envelope |
| 35 | slider | Decay ("250 ms") |
| 36 | slider | Sustain ("30 %") |
| 37 | slider | Release ("400 ms") |
| 38–45 | radio | Voices 1 (checked) to 8 |
| 46 | slider | Glide ("Off") |
| 47 | slider | Attack ("10.0 ms"), Amp envelope |
| 48 | slider | Decay ("300 ms") |
| 49 | slider | Sustain ("70 %") |
| 50 | slider | Release ("400 ms") |
| 51–55 | radio | LFO 1: Sine (checked), Triangle, Square, Saw, Saw Down |
| 56 | button | Previous destination |
| 57 | button | LFO 1 Destination: Cutoff (expanded false) |
| 58 | button | Next destination |
| 59 | slider | Rate ("2.00 Hz") |
| 60 | slider | Depth ("0 %") |
| 61 | button | LFO 1 Retrigger (pressed false) |
| 62–66 | radio | LFO 2: Sine (checked), Triangle, Square, Saw, Saw Down |
| 67 | button | Previous destination |
| 68 | button | LFO 2 Destination: Pitch (expanded false) |
| 69 | button | Next destination |
| 70 | slider | Rate ("2.00 Hz") |
| 71 | slider | Depth ("0 %") |
| 72 | button | LFO 2 Retrigger (pressed false) |

Not in the Tab order: the 17 piano keys (buttons named C4…E5, `tabindex="-1"`) and the Viewers.

With the Mixer tab selected, stops 14–22 become the Osc 1, Osc 2, Noise and Sub faders. With the Patch panel open, its Preset buttons, Patch name, Save, Export file and Copy share link come after Next Preset. With the Display panel open, its 18 controls come after Display.
