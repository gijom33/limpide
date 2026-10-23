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
    body: 'Your computer keyboard is a piano: the letters on these keys. Z and X shift the octave. Or click the keys: lower on a key plays harder.',
    how: 'Sound starts with your first key press. Drag across the keys to slide from Note to Note.',
  },
  midi: { title: 'MIDI', body: '' },
  quickSetup: {
    title: 'Quick Setup',
    body: 'Maps a whole TempoPAD C16 in about 20 seconds: it asks for each encoder, fader and button in turn. Encoders get Cutoff, Resonance, Envelope Amount, Detune, LFO Rate and Depth, Waveform and Glide; faders the Amp Envelope; buttons Hold, Freeze, Snapshot and the Preset arrows.',
    how: 'Skip any step. Finish (or Escape) keeps what is mapped; Cancel puts back your Mappings from before.',
  },
  midiLearn: {
    title: 'MIDI Learn',
    body: 'Map your Controller: click a knob or button here, then move a knob, fader or pad there. Endless encoders and normal knobs are told apart by what they send.',
    how: 'Normal knobs use Pickup: the Parameter waits until the knob passes its value, so nothing jumps. Escape or Done ends Learn.',
  },
  velocityCutoff: {
    title: 'Velocity → Cutoff',
    body: 'How much harder hits open the Filter: up to two octaves for the hardest. Velocity comes from MIDI pads and keys, or from where you click on a piano key.',
  },
  hold: {
    title: 'Hold',
    body: 'Keeps the Note sounding after you let go of the key, so both hands are free to turn knobs while you watch.',
    how: 'Press a new key to change the Note. Switch Hold off to release it.',
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
  filterEnvelope: {
    title: 'Filter Envelope',
    body: 'An Attack–Decay–Sustain–Release shape, like the Amp’s, that moves the Cutoff instead of the loudness. Envelope Amount sets how far.',
  },
  timeline: {
    title: 'Envelope Timeline',
    body: 'The last four seconds. Violet: the Amp Envelope (loudness). Orange: the Effective Cutoff, with the frequencies the Filter lets through shaded below it. The faint dashed line is the Cutoff knob itself.',
    how: 'Play a Note and let go: the Release is drawn after the key comes up.',
  },
  lfo: {
    title: 'LFO',
    body: 'A slow, repeating wave that moves something for you: the Cutoff (wah, wobble), the pitch (vibrato) or the Pulse Width (a shimmering PWM chorus). Rate is how fast, Depth how far.',
    how: 'Turn Depth up and watch the Envelope Timeline and the Response Curve move with it.',
  },
  lfoDestination: {
    title: 'LFO Destination',
    body: 'What the LFO moves. Cutoff: up to two octaves each way (wah). Pitch: up to a semitone each way (vibrato). Width: each Oscillator’s Pulse Width (PWM; only heard on a Pulse).',
  },
  glide: {
    title: 'Glide',
    body: 'Slides the pitch from one Note to the next instead of jumping, over this long. Off plays Notes at once.',
    how: 'Play two keys one after the other and watch the Scope stretch or squeeze as the pitch slides.',
  },
  theme: { title: 'Theme', body: 'Switches between the dark and light look. Your choice is remembered.' },
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
    body: 'Sets how much of each source goes into the Filter. The Oscillator Tap below shows the mix. Three sources at full level can exceed the Scope’s range (OVER).',
  },
  noise: {
    title: 'Noise',
    body: 'An unpitched hiss with energy at every frequency: in the Spectrum it fills the gaps between Harmonics. Filter it for wind, breath or percussion.',
  },
  oscillatorTap: {
    title: 'Oscillator Tap',
    body: 'The Mixer’s output: the raw sources, before the Filter shapes them. The Oscillators run all the time, even between Notes: the Amp decides when you hear them.',
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
  ghost: {
    title: 'Ghost',
    body: 'Teal shading shows the energy the Filter removed: the "subtractive" in subtractive synthesis. Orange shows energy Resonance added.',
  },
  guides: {
    title: 'Scope guides',
    body: 'Dashed lines at the Oscillator’s level. A trace inside them has only lost energy; one beyond them has been boosted by Resonance.',
  },
};
