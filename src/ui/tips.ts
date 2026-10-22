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
    body: 'Your computer keyboard is a piano: A S D F G H J K are the white keys from C, W E T Y U the black keys.',
    how: 'Sound starts with your first key press. Hold a key to hear the Envelope sustain.',
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
    body: 'How steeply the Filter removes frequencies past the Cutoff: 12 dB or 24 dB per octave. 24 dB is two Filters in a row, darker and more “synth”.',
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
