# Limpide: PRD

Vocabulary follows [CONTEXT.md](../CONTEXT.md). Architectural decisions are in [docs/adr](./adr).

## Problem Statement

I've twisted knobs on synthesizers for years, but I don't really understand *why* turning the Cutoff darkens a saw, why Resonance makes that "wow", or what a Filter Envelope does to a pluck. Ordinary synths give me a sound and a row of knobs. The cause and effect happens in an invisible signal, so I learn by superstition instead of understanding. Generic oscilloscope or analyser plugins show me the *final* output only. They can't show what the Filter removed, which Harmonics were there to begin with, or how the Effective Cutoff is moving over time.

## Solution

Limpide (formerly SynthView) is a browser-based subtractive synthesizer laid out as its own signal-flow diagram: Oscillators → Mixer → Filter → Amp, left to right, with Viewers under each stage.

- **Seeing the subtraction:** each Tap has a cycle-locked Scope and a Spectrum. The Filter's real Response Curve is drawn over the Spectrum, so the Harmonics it cuts can be read against it.
- **Harmonics against theory:** Harmonic Markers name each Harmonic, and the Waveform's Ideal Reference shows what theory predicts.
- **Modulation over time:** an Envelope Timeline shows both Envelopes and the Effective Cutoff moving in time.
- **Studying a frame:** Freeze, Snapshot (A/B), axis toggles and a hover readout.
- **Hands-free listening:** Hold sustains the sound while you turn knobs.
- **Playing:** from the computer keyboard, the on-screen piano, or a MIDI Controller. The Synido TempoPAD C16 is the primary target and is mapped in seconds with Quick Setup.
- **Sounds and sharing:** Patches autosave and can be named, exported as JSON, or shared by URL.
- **The maths:** an optional Maths Layer reveals Q, dB values and formulas for those who want it.

## User Stories

### Playing
1. As a learner, I want to play notes from my computer keyboard, so that I can start without any hardware.
2. As a learner, I want an on-screen piano I can click, so that I can play without knowing the key layout.
3. As a learner, I want the on-screen piano to show which keys map to which notes, so that I can learn the keyboard layout.
4. As a learner, I want to shift the keyboard octave up and down, so that I can reach bass and lead ranges.
5. As a player, I want last-note priority when I hold several keys, so that trills and fast lines behave predictably on a mono synth.
6. As a player, I want releasing the newest key to return to the previously held note, so that legato lines work.
7. As a learner, I want a Hold toggle that keeps the sound playing, so that both hands are free to turn knobs while I watch the Viewers.
8. As a player, I want Glide between notes, so that I can hear and see pitch slide.
9. As a player, I want pad Velocity to change loudness, so that the C16 pads feel expressive.
10. As a player, I want an optional Velocity amount on the Effective Cutoff, so that harder hits sound brighter.
11. As a learner, I want sound to start with my first key press, click or drag, with no button to press first: while the browser holds sound back, the piano invites a first Note, and a quiet notice says so if the browser still refuses, so that the browser's autoplay policy never gets in my way or leaves me confused by silence.

### Sound shaping
12. As a learner, I want to choose the Waveform of each Oscillator (sine, triangle, saw, square, pulse), so that I can hear and see how the source's Harmonic content differs.
13. As a learner, I want to adjust Pulse Width, so that I can see the Harmonic pattern change as the pulse narrows.
14. As a player, I want a second Oscillator with Detune in cents, so that I can make thick sounds and see the beating in the Scope.
15. As a player, I want octave or semitone offset on Osc 2, so that I can make intervals and sub-octaves.
16. As a player, I want a Noise source, so that I can make percussion and breath and see a flat spectrum being filtered.
17. As a learner, I want a Mixer with a level per source, so that I understand what goes into the Filter.
18. As a learner, I want Cutoff on a logarithmic Taper, so that the knob feels musical across 20 Hz–20 kHz.
19. As a learner, I want Resonance, so that I can hear and see emphasis at the Cutoff.
20. As a player, I want Filter Modes (low-pass, high-pass, band-pass, notch), so that I can compare what each keeps.
21. As a learner, I want a 12 dB or 24 dB Slope, so that I can see how steeply each removes Harmonics.
22. As a learner, I want an Amp Envelope (ADSR), so that I can shape loudness over time.
23. As a learner, I want a Filter Envelope with a signed Envelope Amount in octaves, so that I can make plucks and swells.
24. As a player, I want envelope times on an exponential Taper from 1 ms to 10 s, so that both snappy and slow settings are reachable.
25. As a player, I want an LFO with rate, amount, waveform and a destination (pitch, Cutoff or Pulse Width), so that I can make vibrato, wah and PWM. (Stories 82 and 83 widen this.)
26. As a learner, I want every Parameter to show its value in real units (Hz, ms, dB, cents, %), so that I connect knob positions to quantities.
27. As a learner, I want to double-click a knob to reset it to its default, so that I can recover from experiments.

### Seeing (the core)
28. As a learner, I want a Scope and a Spectrum at each Tap (Oscillator, Filter, Amp), side by side, so that I can see what each stage changes.
29. As a learner, I want the Scope to Cycle Lock to the Note's period, so that the waveform stands still instead of scrolling.
30. As a learner, I want to choose 1, 2 or 4 cycles in the Scope, so that I can see both detail and beating patterns.
31. As a learner, I want Harmonic Markers labelling the fundamental and Harmonics with number, frequency and note, so that I can read the spectrum like a ladder.
32. As a learner, I want the Waveform's Ideal Reference drawn on the Oscillator Tap's Spectrum, so that I can see that a saw's Harmonics really fall as 1/n.
33. As a learner, I want the Filter's Response Curve drawn over the Spectrum, so that I can see which Harmonics fall in the pass band and which are cut.
34. As a learner, I want the Response Curve to show the Resonance peak, so that I understand what Resonance physically does.
35. ~~As a learner, I want a Ghost shading the energy the Filter removed, so that "subtractive" becomes literal.~~ Dropped on 2026-10-22: in use it was not helpful; the Response Curve and the two Taps side by side already show what the Filter removes.
36. As a learner, I want the Response Curve to follow the Effective Cutoff live (envelope, LFO, velocity), so that I can see modulation as well as hear it.
37. As a learner, I want an Envelope Timeline showing both Envelopes and the Effective Cutoff with a moving playhead, so that I understand ADSR as time.
38. As a learner, I want the Envelope Timeline to show the Release stage after I lift a key, so that I understand why notes ring on.
39. As a learner, I want to Freeze all Viewers with the spacebar, so that I can study a fleeting moment such as the start of a pluck.
40. As a learner, I want to toggle the frequency axis between log and linear, so that I can see the Harmonics either as a musical layout or as an evenly spaced ladder.
41. As a learner, I want to toggle amplitude between dB and linear, so that I understand why dB is used.
42. As a learner, I want a hover readout (frequency, nearest note, level), so that I can measure what I see.
43. As a learner, I want to take a Snapshot and see it as a faint trace against the live Spectrum, so that I can compare before and after a knob change.
44. As a learner, I want to clear the Snapshot, so that I can start a new comparison.
45. As a curious learner, I want a Maths Layer toggle that reveals Q, dB, Harmonic formulas and the Response Curve formula, so that I can go deeper when I'm ready.
46. As a learner, I want the Viewers to keep showing something useful when no note is playing (a flat line and silence, with a hint to press a key or turn on Hold), so that an empty screen doesn't look broken.

### Layout and look
47. As a learner, I want the layout to *be* the signal-flow diagram (blocks connected left to right), so that the UI teaches the structure.
48. As a user, I want a dark theme by default with a light toggle, so that I can work comfortably.
49. As a user, I want the app to stay usable on a laptop-sized screen, so that I don't need a big monitor.

### Look and feel
Judged against [the design principles](./design-principles.md).

69. As a first-time visitor, I want the app to look like a real, beautiful instrument within seconds, so that I want to stay and play.
70. As a player, I want the knobs worth turning while I play to be big and the set-and-forget ones small, so that my hand finds the right control at once.
71. As a learner, I want levels and envelope stages on faders, as on a mixing desk or a classic synth, so that the controls look like what they do.
72. As a learner, I want each control's value drawn as a filled arc in its stage's colour, so that I read settings at a glance.
73. As a learner, I want a modulated control to show the range its modulation reaches and a live dot where it is right now, as Serum does, so that I see the LFO and the Filter Envelope move the Cutoff.
74. As a learner, I want the piano to show the sounding pitch wobble with vibrato and slide with Glide, so that I see pitch modulation even though no knob sets pitch.
75. As a learner, I want the LFO in an LFO & Envelopes section with a live plot of it moving, so that I see what it does before I hear it.
76. As a player, I want Glide beside Voices, so that I see it only acts with one Voice.
77. As a phone visitor, I want a strip naming the stages that shows where I am and jumps to each one, so that I know there is more below the Oscillators.
78. As a phone user, I want a control's value to show only while it moves, in a bubble above my finger while I drag it, so that the screen stays uncluttered and my finger never hides what I'm changing.
79. As a phone user, I want scrolling over a control to scroll the page, so that I never change a sound by accident.
80. As a first-time visitor, I want a welcome that offers to play the Demo (or the sound shared with me), so that I hear what Limpide can do without knowing where to click.
81. As a user, I want About centred on screen and an ⓘ button at every screen size, so that I can always find out what this is.
82. As a sound designer, I want the LFO to reach more destinations (Resonance, Osc 2's pitch and its Detune as well as Cutoff, Pitch and Pulse Width), picked with arrows or from a menu like the Patch bar's, so that one LFO makes more kinds of movement.
83. As a sound designer, I want two LFOs, each with its own Waveform, Rate, Depth and destination, so that I can make vibrato and a filter sweep at once, or two speeds of movement on one control.

### MIDI and the TempoPAD C16
50. As a C16 owner, I want Limpide to detect my Controller when plugged in, so that I know it's connected.
51. As a C16 owner, I want MIDI notes from the pads (KEYBOARD mode) to play the synth with Velocity, so that I can play it like an instrument.
52. As a Controller owner, I want a Quick Setup that asks me for a control for each Parameter played live, in the page's order, then a button for each Action, so that my Controller is mapped in one pass, whichever it is.
53. As a C16 owner, I want my C16 to work the moment it is plugged in, its four banks driving the four sections (Oscillators, Filter, Amp, LFO & Envelopes) and its buttons the Actions, and switching bank to bring that section into view, so that I never have to map it (issue 34).
54. As a user, I want MIDI Learn on any Parameter or Action, so that I can map any control to anything, including on other Controllers.
55. As a user, I want the Encoder Mode detected automatically during Learn, so that endless encoders work whatever my C16's firmware sends.
56. As a user, I want Pickup on Absolute Mappings, so that Parameters don't jump when the knob position and the Patch disagree.
57. As a user, I want to see and remove existing Mappings, so that I can fix mistakes.
58. As a user, I want my Mappings saved across sessions, so that I map once.
59. As a user, I want an Activity Monitor showing the last MIDI message, so that I can tell whether the Controller is sending and what it sends.
60. As a learner, I want an on-screen knob to flash when its hardware control moves it, so that I connect the hardware with the screen.
61. As a Safari user, I want a clear notice that MIDI isn't supported in my browser while everything else still works, so that I'm not confused.

### Patches
62. As a user, I want my current Patch autosaved, so that a reload doesn't lose my sound.
63. As a user, I want to save, name, load and delete my own Patches, so that I can build a library.
64. As a learner, I want Presets (bass, lead, pluck, pad-ish, wobble), so that I can start from good sounds and see how they're built.
65. As a user, I want to step to the next or previous Preset, so that I can browse quickly, including from a Controller button.
66. As a user, I want to export a Patch as JSON and import it, so that I can back up and exchange sounds.
67. As a user, I want a share URL encoding the Patch, so that I can send a sound to a friend in one link.
68. As a user, I want Patches saved by an older version of the app to still load, with sensible defaults for missing Parameters, so that upgrades don't break my library.

### Tutorials

Brought into scope by the grilling of [issue 40](./issues/40-preset-tutorials.md), 2026-10-26.

84. As a learner, I want a Tutorial that rebuilds a Preset from Init one Step at a time, each Step saying what to turn and then what to hear and see in the Viewers, so that I learn why the sound is built that way, not only how.
85. As a learner, I want to turn each control myself, with the control ringed and its target shown, and the Step done once I get close, so that my hands learn the instrument; and a "Do it for me" when I am stuck.
86. As a learner, I want a Tutorial to bring a control on a hidden tab or another phone section into view, and its card never to cover the control, so that I can follow it on any layout.
87. As a learner, I want a Listen button that repeats a short phrase, so that both hands are free to turn knobs, on a phone too.
88. As a learner, I want to explore off the path without being locked, and at the end to see what differs from the Preset and match it in one tap, so that experimenting costs nothing.
89. As a first-time visitor, I want a Tutorial button in the Welcome, and a Tutorials list in the Patches panel, so that I know where to start.

## Implementation Decisions

- **Platform:** browser app in TypeScript, built with Vite, with React for controls and layout. Chrome and Edge are primary, because Web MIDI doesn't exist in Safari, where MIDI features degrade gracefully.
- **Audio:** native Web Audio nodes only ([ADR-0001](./adr/0001-native-web-audio-nodes-over-custom-dsp.md)). The 24 dB Slope is two cascaded biquads with a compensated per-stage Q. Pulse waves with arbitrary Pulse Width are `PeriodicWave`s built from their Fourier series.
- **Rendering:** the engine and Viewer renderers live outside React. A single animation loop draws every Viewer ([ADR-0002](./adr/0002-viewers-and-engine-live-outside-react.md)).
- **Effective Cutoff:** computed by a pure modulation model that also produces the automation schedule ([ADR-0003](./adr/0003-modulation-model-mirrors-the-audio-graph.md)).
- **Voices:** 1 to 8 per Patch; 1 Voice is monophonic with last-note priority and Glide. The Oscillator and Filter Viewers and the Timeline follow the newest Note; the Amp Viewers show every Voice by default ([ADR-0007](./adr/0007-optional-polyphony-viewers-follow-the-newest-note.md)).
- **Controls:** knob size follows the Parameter's role, play or set-and-forget ([ADR-0008](./adr/0008-knob-size-follows-the-parameter-s-role.md)); levels and envelope stages are faders. Modulation rings and the piano's pitch marker are drawn by the render loop from the Modulation model, outside React (ADR-0002, ADR-0003).
- **MIDI:** MIDI Learn first, Encoder Mode auto-detected, and Pickup for Absolute Mappings ([ADR-0004](./adr/0004-midi-learn-first-no-hardcoded-controller-map.md)); one built-in layout, the C16's, a section per bank ([ADR-0009](./adr/0009-a-built-in-layout-for-the-c16.md)).
- **Tuning:** A4 = 440 Hz, equal temperament.

### Modules (deep modules, small interfaces)

- **Patch model.** The Parameter definitions (id, unit, range, Taper, default), the Patch type, validation and migration, and serialising to JSON and to the URL format. Interface: `defaultPatch()`, `setParam(patch, id, value)`, `toJSON` / `fromJSON`, `toURL` / `fromURL`. Unknown or missing fields migrate to defaults.
- **Tapers.** Pure mapping between a control position (0–1) and a Parameter value, in both directions, for each Taper.
- **Note input.** Merges keyboard, on-screen piano and MIDI note events into one Note stream and applies last-note priority. It emits the Gate and the current Note. Hold is part of this module.
- **Modulation model.** Pure: given a Patch, the Gate history, Velocity and time, it returns envelope levels and the Effective Cutoff, and produces the automation schedule.
- **Synth engine.** Owns the `AudioContext` graph. Interface: `start()`, `noteOn(note, velocity)`, `noteOff()`, `applyPatch(patch)`, `taps` (an analyser per Tap), `filterResponse(frequencies)` (delegating to the real biquads at the Effective Cutoff), `now()`.
- **Spectrum analysis.** Pure: turns raw analyser data into display data: Harmonic positions and labels for a fundamental, the Ideal Reference per Waveform and Pulse Width, nearest-note naming, and Cycle Lock alignment (finding the period and phase offset in a time-domain buffer).
- **Viewer renderers.** Draw Scope, Spectrum and Envelope Timeline onto canvases from display data. They hold the viewer state: Freeze, axes, Snapshot, hover.
- **MIDI.** Parses raw MIDI bytes into typed messages. It also holds the Mapping store, the MIDI Learn state machine, Encoder Mode detection, Pickup, and the Quick Setup sequence. Its input is a `MIDIAccess`-like interface, so a fake can be injected.
- **Persistence.** A key–value storage interface (localStorage in the app, in-memory in tests) used for autosave, the named Patch library and Mappings.
- **UI (React).** The signal-flow layout, knobs, piano, MIDI panel, Patch browser and the Maths Layer toggle.

## Testing Decisions

- **What makes a good test:** it exercises behaviour through a module's public interface and asserts on outcomes (frequencies, levels, emitted Notes, resulting Patches), never on internal calls or node wiring.
- **Proposed seams** (the fewest and highest that give confidence):
  1. **Pure modules** (Patch model, Tapers, Note input, Modulation model, Spectrum analysis, MIDI): Vitest unit tests through their public interfaces. This is where most tests live.
  2. **Synth engine**: Vitest in **browser mode (Chromium)** rendering through `OfflineAudioContext`. We test the real Chrome audio implementation, for example:
     - a saw at 110 Hz shows Harmonic levels close to 1/n at the Oscillator Tap
     - with Cutoff at 1 kHz on a 24 dB low-pass, the Harmonics above 2 kHz drop by at least the expected dB
     - `filterResponse` matches the measured attenuation
     - the Modulation model's Effective Cutoff matches the rendered result
  3. **App**: Playwright end-to-end tests in Chromium and WebKit, on the built site: playing (keys, piano, a stand-in MIDI Controller), the layouts at every width, panels, Presets and share links, and the design principles' audit (contrast and touch targets).
- **Not tested:** pixel output of canvases, and React component internals.
- **Prior art:** the first slice established the patterns; measurements shared by the engine tests live in `src/test/measure.ts`.

## Out of Scope

- Unison, and Viewers that show more than one Note at once ([ADR-0007](./adr/0007-optional-polyphony-viewers-follow-the-newest-note.md)).
- Effects (delay, reverb, chorus, distortion).
- A modulation matrix beyond two LFOs with a single destination each.
- Custom DSP or analogue-modelled filters ([ADR-0001](./adr/0001-native-web-audio-nodes-over-custom-dsp.md)).
- A spectrogram.
- An arpeggiator or sequencer, MIDI output, and audio recording or export.
- Accounts and cloud sync. (Phones were out of scope until 1.1.0; they are now a first-class layout.)
- Drawing your own LFO shapes, and graphical envelope editors.

## Further Notes

- **Controller facts, observed on the owner's C16 (MIDI Learn and the Activity Monitor):** it works as a class-compliant USB device in Chrome. Limpide knows it by a MIDI name containing "TempoPAD C16" (the name the device gives is still to confirm). It sends on channel 1. Its 8 encoders are endless (Relative), its 4 faders absolute, its 12 buttons toggles (each press sends the other of 127 and 0). Each of its 4 banks has its own CCs: bank b's encoders send CC 1 + 8b to 8 + 8b (A 1–8, B 9–16, C 17–24, D 25–32), its faders CC 33 + 4b to 36 + 4b (A 33–36 … D 45–48), its buttons CC 49 + 12b to 60 + 12b (A 49–60 … D 85–96). These are factory settings the owner can change on the device: the C16 layout (issue 34) assumes them, MIDI Learn and Quick Setup learn whatever it sends. The Relative format (two's-complement or 64-centred) is not recorded: each knob finds it on its first turn.
- **Cascaded-biquad Q (settled):** each 24 dB low/high-pass stage gets half the resonant peak in dB. An engine test keeps the peak heights of the two Slopes within 2 dB (ADR-0001).
