/**
 * The History lines (issue 134): where a control comes from, one sentence each, shown last in its tip while the Synth
 * Geek Layer is on. Every fact is sourced in docs/research/134-history-in-the-tooltips.md: `sources` are its numbers
 * there ([S1] is 'S1'), never shown, and a unit test fails on a line citing none, or one graded below B. No "first"
 * (decision 6); the old instruments' own labels in quotation marks, the glossary's words for Limpide's own.
 */
export interface HistoryLine {
  line: string;
  sources: readonly `S${number}`[];
}

/** Attack, Decay, Sustain and Release share one line, on the four stages (decision 13), and the Amp Envelope with them. */
const STAGES: HistoryLine = {
  line: 'Buchla’s 1964 Dual Attack Generator had an attack, a duration and a decay; ARP’s 2600 manual (1971) named four stages “Attack-Decay-Sustain-Release”.',
  sources: ['S7', 'S5'],
};

export const HISTORY = {
  // The Filter.
  filter: {
    line: 'Robert Moog patented his ladder Filter in 1969, filed in 1966: four identical transistor stages in a row, as a low-pass or a high-pass.',
    sources: ['S1'],
  },
  cutoff: {
    line: 'Moog’s 1964 paper set a Filter’s frequency by a voltage, so a keyboard or another module could move it; the Minimoog named its knob “Cutoff Frequency”.',
    sources: ['S2', 'S3'],
  },
  resonance: {
    line: 'In Moog’s patent, Resonance is feedback from the Filter’s output to its input, and enough of it sets the Filter oscillating; the Minimoog called it “Emphasis”.',
    sources: ['S1', 'S3'],
  },
  filterMode: {
    line: 'Robert Moog’s 1964 paper built low-pass, high-pass and band-pass Filters, each from his voltage-controlled amplifier.',
    sources: ['S2'],
  },
  slope: {
    line: 'Moog’s ladder Filter falls through four stages in a row, and ARP’s 2600 manual (1971) gave its own low-pass the steep Slope, “24Db per octave”.',
    sources: ['S1', 'S5'],
  },
  keyTrack: {
    line: 'The Minimoog had it as two “Keyboard Control” switches: with both on, its Filter followed the keys in full, so high Notes stayed as bright as low ones.',
    sources: ['S3'],
  },
  velocityCutoff: {
    line: 'In 1964 Robert Moog was already sensing how fast a musician’s hand moved, its velocity giving each Note a percussive start.',
    sources: ['S2'],
  },
  envAmount: {
    line: 'The Minimoog’s knob for this was “Amount of Contour”: how far its Filter’s Envelope swept the Cutoff.',
    sources: ['S3'],
  },
  // The Envelopes.
  stages: STAGES,
  filterEnvelope: {
    line: 'The Minimoog gave its Filter a contour generator of its own beside the loudness one: the same shape, moving the brightness instead of the level.',
    sources: ['S3'],
  },
  // The Oscillators.
  oscillators: {
    line: 'In October 1964 Robert Moog described to the Audio Engineering Society an oscillator whose pitch is set by a voltage, so a keyboard or a knob can play it.',
    sources: ['S2'],
  },
  waveform: {
    line: 'Moog’s 1964 oscillator gave a Saw, a Triangle and a Pulse; the Minimoog’s manual says its triangle has “the least harmonic content”.',
    sources: ['S2', 'S3'],
  },
  pulseWidth: {
    line: 'Robert Moog’s 1964 oscillator had a “Pulse Width” control, from 10 % to 50 % of each cycle, 50 % being a square.',
    sources: ['S2'],
  },
  octave: {
    line: 'The Minimoog’s “Range” switch moved its oscillators by octaves marked in feet, 32′, 16′, 8′ and on, with a sub-audio “Lo” below them.',
    sources: ['S3'],
  },
  semitone: {
    line: 'The Minimoog tuned its oscillators 2 and 3 by ear, up to a major sixth from oscillator 1: a fifth held across the keyboard, two Notes from one key.',
    sources: ['S3'],
  },
  detune: {
    line: 'The Minimoog’s manual tunes its oscillator 2 “nearly in unison” with oscillator 1, so the two drift in and out of step.',
    sources: ['S3'],
  },
  osc2EnvAmount: {
    line: 'Sequential’s Prophet-5 (1978) did this with “Poly Mod”: the Filter Envelope bending an oscillator’s pitch, for a brass Note’s slight rise and fall.',
    sources: ['S16', 'S17'],
  },
  // What Limpide does first, the famous story second (decision 9).
  fm: {
    line: 'One Oscillator bends another’s pitch here, as the Prophet-5’s “Poly Mod” did (1978); John Chowning’s digital FM (1973), Yamaha’s from 1975, made the DX7.',
    sources: ['S16', 'S17', 'S13', 'S15', 'S33'],
  },
  ring: {
    line: 'Ring Modulation was built for telephones: four rectifiers, in Clyde Keith’s Bell Labs patent (filed 1929) and Frank Cowan’s for AT&T (1934).',
    sources: ['S9', 'S10'],
  },
  sub: {
    line: 'Roland’s SH-101 (1982) had one beside its single oscillator: a square one or two octaves down, or a pulse two octaves down.',
    sources: ['S20'],
  },
  noise: {
    line: 'Buchla’s 100 Series (1964) made Noise a module of its own, the Model 160 “White Noise Generator”.',
    sources: ['S7'],
  },
  noiseColour: {
    line: 'The Minimoog had both colours on one switch, white, “high-pitched”, and pink, “low-pitched”, in its own words.',
    sources: ['S3'],
  },
  mixer: {
    line: 'The Minimoog put a Mixer between its sources and its Filter, as here: three oscillators, the noise and a microphone input.',
    sources: ['S3'],
  },
  // The Amp.
  amp: {
    line: 'Robert Moog’s 1964 paper described the voltage-controlled amplifier: its loudness set by a voltage, so an Envelope can shape each Note.',
    sources: ['S2'],
  },
  voices: {
    line: 'The Minimoog played one Note, the lowest key held; the Prophet-5 (1978) played five, “fully-programmable”, in Sequential’s words.',
    sources: ['S3', 'S17'],
  },
  // The LFOs.
  lfo: {
    line: 'The Minimoog had no LFO of its own: its oscillator 3, slowed below hearing, did the job; ARP’s 3620 keyboard (1976) had one, named “LFO”.',
    sources: ['S3', 'S6'],
  },
  lfoRate: {
    line: 'ARP’s 2600 (1971) could slow each oscillator to .03 Hz, “one cycle approximately every 30 seconds”; its manual makes a smoother vibrato with a slow sine.',
    sources: ['S5'],
  },
  lfoDepth: {
    line: 'On the Minimoog the “Modulation” wheel was “in effect a level control” for the slowed oscillator 3: how far it moved the sound.',
    sources: ['S3'],
  },
  // Playing.
  glide: {
    line: 'The theremin (1920) slid between pitches as the hand moved; the Minimoog put the slide on a knob, “Glide”, its amount of portamento.',
    sources: ['S2', 'S21', 'S3'],
  },
  bendRange: {
    line: 'The Minimoog’s “Pitch” wheel bent half an octave up or down, a detent holding it at the middle, its “Modulation” wheel beside it.',
    sources: ['S3'],
  },
  hold: {
    line: 'The Minimoog did it with a foot switch on its “S-Trig” plug, which kept its Envelopes “on” continuously.',
    sources: ['S3'],
  },
  midi: {
    line: 'In January 1983, at Winter NAMM, a Prophet 600 played a Jupiter 6 over MIDI; Dave Smith and Ikutaro Kakehashi won a Technical Grammy for it in 2013.',
    sources: ['S18', 'S19'],
  },
  // The Viewers (decision 11): the Spectrum and the Harmonic Markers, not the Scope.
  spectrum: {
    line: 'A Spectrum is a fast Fourier transform, the shortcut James Cooley and John Tukey published in 1965, run many times a second.',
    sources: ['S27'],
  },
  harmonicMarkers: {
    line: 'That a repeating wave is a sum of sines at whole multiples of its pitch is Fourier’s (1822); Helmholtz (1863) heard timbre as their mix.',
    sources: ['S25', 'S26'],
  },
} satisfies Record<string, HistoryLine>;
