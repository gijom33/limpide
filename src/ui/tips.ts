import type { Overlay } from '../viewers/overlays';
import type { TipContent } from './Tooltip';

// Every explanation in one place: what the control does, in plain words, then how to use it.
export const TIPS = {
  freeze: {
    title: 'Freeze',
    body: 'Stops the pictures, not the sound. Every Scope and Spectrum holds the frame it is showing, so you can study a moment that would otherwise fly past, such as the start of a Note.',
    how: 'Hover a frozen Spectrum to measure it. Press Freeze again, or Space, to go live.',
  },
  snapshot: {
    title: 'Snapshot',
    body: 'Saves what every Scope and Spectrum shows right now as a faint grey trace, which stays put while the live trace keeps moving.',
    how: 'Take one, then turn a knob: the coloured trace is now, the grey trace is before. × removes it.',
  },
  clearSnapshot: { title: 'Clear Snapshot', body: 'Removes the grey comparison traces from every Scope and Spectrum.' },
  frequencyAxis: {
    title: 'Frequency axis',
    body: 'Log gives every octave the same width, as a piano keyboard does. Lin (0–5 kHz) gives every Harmonic the same spacing, so they line up like a ladder.',
  },
  levelAxis: {
    title: 'Level axis',
    body: 'dB shows quiet Harmonics as clearly as loud ones, as your ear hears them. Lin shows raw amplitude: the quiet ones almost vanish.',
  },
  cycles: {
    title: 'Scope cycles',
    body: 'How many repeats of the waveform each Scope shows. More cycles make slow changes, such as beating between detuned Oscillators, visible.',
  },
  keyboard: {
    title: 'Playing',
    body: 'Your computer keyboard is a piano: A to ; are the white keys from the C shown, W E T Y U O P the black ones. Z and X shift the octave. Or click the keys: lower on a key plays harder.',
    how: 'Sound starts with your first key press. Drag across the keys to slide from Note to Note.',
  },
  midi: { title: 'MIDI', body: '' },
  quickSetup: {
    title: 'Quick Setup',
    body: 'Maps your Controller in one pass: it asks for a control for each knob and fader played live (the big knobs and the faders), in the page’s order from the Oscillators to the LFOs, then a button for Hold, Freeze, Snapshot and the Preset arrows. Settings made once for a sound (Octave, the Waveforms, Filter Mode, Glide, Voices…) are left to MIDI Learn.',
    how: 'Skip any step. Finish (or Escape) keeps what is mapped; Cancel puts back your Mappings from before.',
  },
  c16Layout: {
    title: 'C16 layout',
    body: 'Maps the whole TempoPAD C16, a section per bank: A the Oscillators, B the Filter, C the Amp, D the LFOs. On every bank, buttons 1 to 5 are Hold, Freeze, Snapshot and the Preset arrows; on D, 6 and 7 Retrigger the LFOs. Each knob sets itself up on its first turn.',
    how: 'Applied by itself the first time a C16 is plugged in. This puts it back, replacing your Mappings; MIDI Learn changes any single control.',
  },
  midiLearn: {
    title: 'MIDI Learn',
    body: 'Map your Controller: click a knob or button here, then move a knob, fader or pad there. Endless encoders and normal knobs are told apart by what they send.',
    how: 'Normal knobs use Pickup: the Parameter waits until the knob passes its value, so nothing jumps. Finish with Escape, or Done in the MIDI panel.',
  },
  tuning: {
    title: 'Tuning',
    body: 'Octave, Semitone and Detune are Osc 2’s offsets from Osc 1, whichever tab is showing. Osc 1 is the pitch you play; they wake up once Osc 2 is mixed in.',
  },
  tapSource: {
    title: 'Viewers follow',
    body: 'All: the Amp Tap carries every Voice at once, so a chord is seen there as it is heard. Newest: the Amp Tap shows only the Note you played last. The Oscillator and Filter Taps, the Harmonic Markers and the Timeline always follow the newest Note, so Cycle Lock stays exact there.',
    how: 'With All, the Amp Scope cannot lock to a chord. One Voice shows the same either way.',
  },
  voices: {
    title: 'Voices',
    body: 'How many Notes can sound at once. 1 is the classic monophonic synth: the newest key wins, and Glide slides between Notes. 2 to 8 play chords, each Note on its own Voice.',
    how: 'The Oscillator and Filter Viewers show the newest Note on its own, as if it were played alone; the Amp Viewers show every Voice unless Display says otherwise.',
  },
  velocityCutoff: {
    title: 'Velocity → Cutoff',
    body: 'How much harder hits open the Filter: up to two octaves for the hardest. Velocity comes from MIDI pads and keys, or from where you click on a piano key.',
  },
  sub: {
    title: 'Sub-oscillator',
    body: 'A square wave an octave below Osc 1, for weight. The sound now repeats an octave lower, so the Harmonics are counted from the Sub: it fills the odd ones, and Osc 1 the even ones.',
    how: 'Turn it up on Hollow Square or Init and watch every other rung of the Harmonic ladder fill in.',
  },
  keyTrack: {
    title: 'Key Track',
    body: 'How far the Cutoff follows the Note you play, from C4: at 100 % it moves an octave per octave, so high Notes keep as many Harmonics as low ones. At 0 % the Cutoff stays put, and high Notes sound duller.',
    how: 'Play C3 then C5 with a low Cutoff: watch the Response Curve move with the Harmonic Markers.',
  },
  demo: {
    title: 'Demo',
    body: 'A track of a minute and a quarter, played by Limpide alone: a kick, an acid line, an arpeggio, strings, a riser, a wobble bass and brass stabs, one Preset each, knobs turning as it builds and drops; then it returns to Init and stops. The page follows the knob being turned; the piano shows the Notes.',
    how: 'Turn a knob or flip a switch while it plays and hear the change; the Demo leaves a knob you turned alone until its next Preset. Scroll yourself and the page stops following until then. Press any key, play a Note, or touch any other control to take over; the Demo stops at once. It never changes the Display settings.',
  },
  song: {
    title: 'Song',
    body: 'A house loop in C minor that plays on the sound you have loaded and never changes it. It only uses the keys the piano shows, and moves when you change the octave. One Voice plays it as a single line; give the Patch more Voices and its chords sound in full.',
    how: 'Start it, then turn knobs, flip switches, change Voices or load Presets, and hear the sound change under the tune. Play a Note, or press Song again, to stop it.',
  },
  hold: {
    title: 'Hold',
    body: 'Keeps the Note sounding after you let go of the key, so both hands are free to turn knobs while you watch.',
    how: 'Press a new key to change the Note. Switch Hold off to release it. Tap Hold a few more times quickly before playing, and the held Notes repeat on that rhythm, the last tap starting it over; with several Voices, the rhythm plays once as single Notes in turn, then once as the chord.',
  },
  envAmount: {
    title: 'Envelope Amount',
    body: 'How far the Filter Envelope moves the Cutoff, in octaves: +2 lifts it two octaves at the Envelope’s peak; negative values sweep it down instead.',
    how: 'Turn it up with a short Decay for a pluck. Watch the orange line on the Envelope Timeline.',
  },
  filterMode: {
    title: 'Filter Mode',
    body: 'Which frequencies the Filter keeps. Low-pass keeps those below the Cutoff (darker), high-pass those above (thinner), band-pass a band around it (nasal), notch all but a band (phasey).',
    how: 'Resonance sharpens the peak for low/high-pass, and narrows the band for band-pass and notch.',
  },
  slope: {
    title: 'Slope',
    body: 'How steeply the Filter removes frequencies past the Cutoff: 12 or 24 dB per octave. 24 dB is two Filters in a row, darker and more “synth”.',
    how: 'Compare the Response Curve at each Slope: the 24 dB one falls twice as fast.',
  },
  ampEnvelope: {
    title: 'Amp Envelope',
    body: 'The loudness of every Note over time: Attack to full, Decay to the Sustain level while the key is held, Release once it is let go. The Timeline draws it.',
  },
  filterEnvelope: {
    title: 'Filter Envelope',
    body: 'An Attack–Decay–Sustain–Release shape, like the Amp’s, that moves the Cutoff instead of the loudness. Envelope Amount sets how far.',
  },
  timeline: {
    title: 'LFO & Envelopes',
    body: 'What changes the sound over time: the LFO, and the Envelope Timeline beside it. The Timeline shows the last four seconds. Violet: the Amp Envelope (loudness; an LFO on Volume ripples it). Orange: the Effective Cutoff, with the frequencies the Filter lets through shaded below it. The faint dashed line is the Cutoff knob itself.',
    how: 'Play a Note and let go: the Release is drawn after the key comes up.',
  },
  lfo: {
    title: 'LFO',
    body: 'A slow, repeating wave that moves something for you: the Cutoff (wah, wobble), the pitch (vibrato), the Pulse Width (a shimmering PWM chorus), the Volume (tremolo) and more. Rate is how fast, Depth how far. There are two: aim them at different things, or both at one for two speeds of movement (LFO 2 draws in a lighter blue).',
    how: 'Turn Depth up and watch the knob it moves: a ring shows how far, a dot where it is now.',
  },
  lfoRetrigger: {
    title: 'Retrigger',
    body: 'On: the LFO starts its cycle again at every Note, so each Note gets the same wobble from its start (key sync). Off: it runs on freely, and each Note catches it wherever it is.',
    how: 'Turn it on with a slow LFO on Cutoff and play a few Notes: each one opens the same way. The plot shows the cycle restart.',
  },
  lfoWaveform: {
    title: 'LFO',
    body: 'The LFO as it moves: its last second, the newest at the right, so 1 Hz is one period. Sine and Triangle sweep smoothly, Square jumps between two values, Saw ramps up and drops, Saw Down drops and ramps down. Its height is the Depth.',
  },
  lfoDestination: {
    title: 'LFO Destination',
    body: 'What the LFO moves, at full Depth. Pitch: a semitone each way (vibrato). Osc 2 Pitch: Osc 2 alone, an octave each way (sweeps against Osc 1). Detune: Osc 2 alone, 50 cents each way (a beating chorus). Pulse Width: each Oscillator’s (PWM; only heard on a Pulse). Cutoff: two octaves each way (wah). Resonance: across its range (a vocal, whistling sweep). Volume: down from the Amp Envelope’s level to silence (tremolo).',
  },
  glide: {
    title: 'Glide',
    body: 'Slides the pitch from one Note to the next instead of jumping, over this long. Off plays Notes at once. It works with one Voice only: with more, each Note starts at its own pitch.',
    how: 'Play two keys one after the other and watch the Scope stretch or squeeze as the pitch slides.',
  },
  about: { title: 'About', body: 'The version of Limpide you are playing, who made it, and where its source lives. The logo opens it too.' },
  theme: { title: 'Theme', body: 'Switches between the dark and light look. Your choice is remembered.' },
  bendRange: {
    title: 'Pitch bend range',
    body: 'How far a keyboard’s bend wheel takes the pitch, up or down, in semitones: 2 is a whole tone, as on most synths. The sustain pedal holds Notes as Hold does, the mod wheel turns LFO 1’s Depth, and a Program Change loads that Preset, each until you map the control to something else.',
  },
  letterKeys: {
    title: 'Letter keys',
    body: 'Whether the computer keyboard plays Notes (A W S E D F T G…, with Z and X for the octave). Turn them off if you type with a screen reader or speech input, or the keys get in the way. Your choice is remembered.',
  },
  pulseWidth: {
    title: 'Pulse Width',
    body: 'How much of each cycle the pulse spends high. 50% is a square. Narrower pulses sound thinner and add Harmonics that a square lacks.',
    how: 'Each Oscillator has its own, and it only shapes the Pulse Waveform: choose Pulse to hear it.',
  },
  osc2: {
    title: 'Osc 2',
    body: 'A second Oscillator that follows the Note, shifted by whole Octaves and Semitones and fine-tuned by Detune.',
    how: 'Raise Osc 2 in the Mixer to hear it. A few cents of Detune makes the sound beat: watch the Scope swell and fade.',
  },
  detune: {
    title: 'Detune',
    body: 'Fine-tunes Osc 2 in cents (hundredths of a semitone). Two Oscillators a few cents apart drift in and out of step, so the sound swells and fades: the classic thick, chorused sound.',
  },
  mixer: {
    title: 'Mixer',
    body: 'Sets how much of each source goes into the Filter. The Oscillator Tap below shows the mix. Several sources at full level can exceed the Scope’s range: what goes past it is drawn squeezed into its edge.',
  },
  noise: {
    title: 'Noise',
    body: 'An unpitched hiss with energy at every frequency: in the Spectrum it fills the gaps between Harmonics. Filter it for wind, breath or percussion.',
  },
  // Issue 49: the core controls and the stages, so a newcomer finds words where they look first.
  oscillators: {
    title: 'Oscillators',
    body: 'Where the sound starts: a tone at the pitch you play, with a shape (the Waveform) that decides which Harmonics it has. Two Oscillators, a Sub an octave down and Noise are mixed here, then sent to the Filter.',
    how: 'Pick a Waveform and watch both pictures below change: the Scope draws its shape, the Spectrum its Harmonics.',
  },
  filter: {
    title: 'Filter',
    body: 'Takes Harmonics away. Above the Cutoff (on the default low-pass) they get quieter and quieter, so the sound turns darker. This is the “subtractive” in subtractive synthesis.',
    how: 'Hold a Note and turn the Cutoff down: watch the Harmonics on the right of the Spectrum disappear.',
  },
  amp: {
    title: 'Amp',
    body: 'Shapes the loudness of each Note over time with its Envelope: how fast it starts, how it settles while held, how it fades when let go. Voices sets how many Notes can sound at once.',
    how: 'Play short and long Notes and watch the Amp Scope grow and fade.',
  },
  waveform: {
    title: 'Waveform',
    body: 'The Oscillator’s shape, which sets its Harmonics. Sine: the fundamental alone, pure. Triangle: soft, odd Harmonics fading fast. Saw: bright, every Harmonic. Square: hollow, odd ones only. Pulse: a square of any width, set by Pulse Width.',
    how: 'Switch shapes and compare the Spectrum: the spikes are the Harmonics.',
  },
  cutoff: {
    title: 'Cutoff',
    body: 'Where the Filter starts to take Harmonics away. On low-pass, everything above it fades: turn it down for a darker, muffled sound, up for a brighter one.',
    how: 'Watch the dashed Response Curve on the Filter’s Spectrum move, and the Harmonics past its slope shrink.',
  },
  resonance: {
    title: 'Resonance',
    body: 'Boosts the Harmonics right at the Cutoff, so the Filter sings or whistles there. A little adds bite; a lot rings.',
    how: 'Turn it up and watch the bump on the Response Curve, then sweep the Cutoff: the bump lifts each Harmonic as it passes.',
  },
  octave: {
    title: 'Octave',
    body: 'Shifts Osc 2 up or down by whole octaves from the Note you play: 2× or ½× the pitch, the same note higher or lower.',
  },
  semitone: {
    title: 'Semitone',
    body: 'Shifts Osc 2 by semitones from the Note you play: +7 is a fifth above, +12 an octave. Two notes at once, from one key.',
  },
} satisfies Record<string, TipContent>;

export const OVERLAY_TIPS: Record<Overlay, TipContent> = {
  harmonics: {
    title: 'Harmonic Markers',
    body: 'A tick on every Harmonic of the Note, numbered 2, 3, 4… from the fundamental, which is labelled with its note name.',
  },
  ideal: {
    title: 'Ideal Reference',
    body: 'Rings where theory puts each Harmonic of Osc 1’s Waveform, at its Mixer level. On the Filter Tap they show where each Harmonic should land after the Filter.',
  },
  curve: {
    title: 'Response Curve',
    body: 'The Filter’s gain at every frequency (scale on the right). Harmonics under the slope get quieter; a bump at the Cutoff is Resonance.',
  },
  guides: {
    title: 'Scope guides',
    body: 'Dashed lines at the Oscillator’s level. A trace inside them has only lost energy; one beyond them has been boosted by Resonance.',
  },
  maths: {
    title: 'Maths Layer',
    body: 'The quantities behind the sound: Resonance as the Filter’s Q, the Mixer’s levels and the Amp’s Sustain in dB, the Harmonic formula of Osc 1’s Waveform on the Oscillator Spectrum, the Response Curve’s formula on the Filter Spectrum, and the Effective Cutoff’s value on the Timeline.',
  },
};
