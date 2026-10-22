# SynthView: PRD

Vocabulary follows [CONTEXT.md](../CONTEXT.md). Architectural decisions are in [docs/adr](./adr).

## Problem Statement

I've twisted knobs on synthesizers for years, but I don't really understand *why* turning the Cutoff darkens a saw, why Resonance makes that "wow", or what a Filter Envelope does to a pluck. Ordinary synths give me a sound and a row of knobs. The cause and effect happens in an invisible signal, so I learn by superstition instead of understanding. Generic oscilloscope or analyser plugins show me the *final* output only. They can't show what the Filter removed, which Harmonics were there to begin with, or how the Effective Cutoff is moving over time.

## Solution

SynthView is a browser-based, monophonic subtractive synthesizer laid out as its own signal-flow diagram: Oscillators → Mixer → Filter → Amp, left to right, with Viewers under each stage.

- **Seeing the subtraction:** each Tap has a cycle-locked Scope and a Spectrum. The Filter's real Response Curve is drawn over the Spectrum, and a Ghost shades exactly what the Filter took away.
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
11. As a learner, I want sound to start with my first key press, click or drag, with no button to press first, and a quiet notice only if the browser still holds sound back, so that the browser's autoplay policy never gets in my way or leaves me confused by silence.

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
25. As a player, I want an LFO with rate, amount, waveform and a destination (pitch, Cutoff or Pulse Width), so that I can make vibrato, wah and PWM.
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
35. As a learner, I want a Ghost shading the energy the Filter removed, so that "subtractive" becomes literal.
36. As a learner, I want the Response Curve and Ghost to follow the Effective Cutoff live (envelope, LFO, velocity), so that I can see modulation as well as hear it.
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

### MIDI and the TempoPAD C16
50. As a C16 owner, I want SynthView to detect my Controller when plugged in, so that I know it's connected.
51. As a C16 owner, I want MIDI notes from the pads (KEYBOARD mode) to play the synth with Velocity, so that I can play it like an instrument.
52. As a C16 owner, I want a Quick Setup that asks me to turn each encoder and fader in turn, so that the whole C16 is mapped in about 20 seconds.
53. As a C16 owner, I want the default Quick Setup layout to be: encoders = Cutoff, Resonance, Envelope Amount, Detune, LFO rate, LFO amount, Waveform, Glide; faders = Amp Envelope ADSR; buttons = Hold, Freeze, Snapshot, next Preset. That way the most educational Parameters are under my hands.
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

## Implementation Decisions

- **Platform:** browser app in TypeScript, built with Vite, with React for controls and layout. Chrome and Edge are primary, because Web MIDI doesn't exist in Safari, where MIDI features degrade gracefully.
- **Audio:** native Web Audio nodes only ([ADR-0001](./adr/0001-native-web-audio-nodes-over-custom-dsp.md)). The 24 dB Slope is two cascaded biquads with a compensated per-stage Q. Pulse waves with arbitrary Pulse Width are `PeriodicWave`s built from their Fourier series.
- **Rendering:** the engine and Viewer renderers live outside React. A single animation loop draws every Viewer ([ADR-0002](./adr/0002-viewers-and-engine-live-outside-react.md)).
- **Effective Cutoff:** computed by a pure modulation model that also produces the automation schedule ([ADR-0003](./adr/0003-modulation-model-mirrors-the-audio-graph.md)).
- **Voice:** monophonic with last-note priority ([ADR-0005](./adr/0005-monophonic-by-design.md)).
- **MIDI:** MIDI Learn first, no hard-coded map, Encoder Mode auto-detected, and Pickup for Absolute Mappings ([ADR-0004](./adr/0004-midi-learn-first-no-hardcoded-controller-map.md)).
- **Tuning:** A4 = 440 Hz, equal temperament.

### Modules (deep modules, small interfaces)

- **Patch model.** The Parameter definitions (id, unit, range, Taper, default), the Patch type, validation and migration, and serialising to JSON and to the URL format. Interface: `defaultPatch()`, `setParam(patch, id, value)`, `toJSON` / `fromJSON`, `toURL` / `fromURL`. Unknown or missing fields migrate to defaults.
- **Tapers.** Pure mapping between a control position (0–1) and a Parameter value, in both directions, for each Taper.
- **Note input.** Merges keyboard, on-screen piano and MIDI note events into one Note stream and applies last-note priority. It emits the Gate and the current Note. Hold is part of this module.
- **Modulation model.** Pure: given a Patch, the Gate history, Velocity and time, it returns envelope levels and the Effective Cutoff, and produces the automation schedule.
- **Synth engine.** Owns the `AudioContext` graph. Interface: `start()`, `noteOn(note, velocity)`, `noteOff()`, `applyPatch(patch)`, `taps` (an analyser per Tap), `filterResponse(frequencies)` (delegating to the real biquads at the Effective Cutoff), `now()`.
- **Spectrum analysis.** Pure: turns raw analyser data into display data: Harmonic positions and labels for a fundamental, the Ideal Reference per Waveform and Pulse Width, the Ghost region (Oscillator Tap minus Filter Tap), nearest-note naming, and Cycle Lock alignment (finding the period and phase offset in a time-domain buffer).
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
  3. **App**: one Playwright smoke test (the page loads, starting audio and pressing a key produces a non-silent Amp Tap, and the Viewers draw).
- **Not tested:** pixel output of canvases, and React component internals.
- **Prior art:** none yet (new repo). The first slice establishes the patterns.

## Out of Scope

- Polyphony, unison and chords ([ADR-0005](./adr/0005-monophonic-by-design.md)).
- Effects (delay, reverb, chorus, distortion).
- A modulation matrix beyond one LFO with a single destination.
- Custom DSP or analogue-modelled filters ([ADR-0001](./adr/0001-native-web-audio-nodes-over-custom-dsp.md)).
- Guided lessons. The data model should allow them, but the content comes later.
- Spectrogram and explanatory tooltips, which are next after v1.
- An arpeggiator or sequencer, MIDI output, and audio recording or export.
- Accounts, cloud sync, mobile and touch-first layouts.

## Further Notes

- **Unverified Controller facts:** the C16's default CC assignments and its encoder output format aren't publicly documented, and its USB class compliance is very likely but unconfirmed. The Activity Monitor doubles as the tool for checking these on the real device.
- **Cascaded-biquad Q (settled):** each 24 dB low/high-pass stage gets half the resonant peak in dB. An engine test keeps the peak heights of the two Slopes within 2 dB (ADR-0001).
