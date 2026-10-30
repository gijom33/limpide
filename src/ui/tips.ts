import { DESTINATIONS } from '../modulation/destinations';
import type { LfoDestination, ParamId } from '../patch/patch';
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
  timelineSeconds: {
    title: 'Env Timeline',
    body: 'How many seconds the Envelope Timeline shows, the newest at the right. 1 s spreads a fast Attack or a quick wobble wide; 3 or 4 s fit a slow Swell or a long Release.',
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
    body: 'Octave, Semitone and Detune are Osc 2’s offsets from the Note you play; Env Amount lets the Filter Envelope move it from there. They wake up once Osc 2 is heard: mixed in, through Ring, or swinging Osc 1 (FM).',
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
    how: 'Turn it up and watch the Cutoff knob: a grey ring (past the Filter Envelope’s white one, when it has one) shows how far a hard Note can open it.',
  },
  sub: {
    title: 'Sub-oscillator',
    body: 'A square or sine an octave below Osc 1 (or two), for weight; its octave and shape are on the Sub & Noise tab, its level on the Mixer. The sound now repeats at the Sub’s pitch, so the Harmonics are counted from it: an octave down, a square Sub fills the odd ones and Osc 1 the even ones.',
    how: 'Turn it up on Hollow Square or Init and watch every other rung of the Harmonic ladder fill in.',
  },
  subOptions: {
    title: 'Sub',
    body: 'Where the Sub sits, one or two octaves below Osc 1, and its shape: a square for buzz, a sine for a clean, round weight. Two octaves down, the Harmonics count from the Sub and Osc 1 lands on every fourth one.',
    how: 'Raise the Sub fader, pick −2 and Sine, and watch a single low spike appear far left in the Spectrum.',
  },
  keyTrack: {
    title: 'Key Track',
    body: 'How far the Cutoff follows the Note you play, from C4: at 100 % it moves an octave per octave, so high Notes keep as many Harmonics as low ones. At 0 % the Cutoff stays put, and high Notes sound duller.',
    how: 'Play C3 then C5 with a low Cutoff: watch the Response Curve move with the Harmonic Markers.',
  },
  demo: {
    title: 'Demo',
    body: 'A track of about three minutes, played by Limpide alone: a kick, an acid line, an arpeggio, strings, tremolo keys, a riser, a wobble bass, the wobble doubled by a second LFO, a wide octave bass, a sweeping pad, an organ three octaves wide, FM bells, a gliding, singing lead, the arpeggio again and brass stabs, a Preset each, knobs turning as it builds and drops; then it returns to Init and stops. The page follows the knob being turned; the piano shows the Notes.',
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
    how: 'Turn it up with a short Decay for a pluck. Watch the orange dotted line on the Envelope Timeline.',
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
    body: 'What changes the sound over time: the LFO, and the Envelope Timeline beside it. The Timeline shows the last two seconds (1 to 4 in Display). The violet fill is the Amp Envelope, the orange one the Filter Envelope when its Amount is set. A broken line in its section’s colour is each knob the Filter Envelope or an LFO moves: the Cutoff dotted, what LFO 1 moves dashed, what LFO 2 alone moves dash-dotted.',
    how: 'Play a Note and let go: the Release is drawn after the key comes up.',
  },
  lfo: {
    title: 'LFO',
    body: 'A slow, repeating wave that moves something for you: the Cutoff (wah, wobble), the pitch (vibrato), the Pulse Width (a shimmering PWM chorus), the Volume (tremolo) and more. Depth is how far, Rate how fast. There are two: aim them at different things, or both at one for two speeds of movement. Both are drawn in the same blue.',
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
  tooltips: {
    title: 'Tooltips',
    body: 'Whether explanations like this one open when you point at a control, reach it with the keyboard, or hold it on a touch screen. Off, they stay closed; a screen reader still reads them. Your choice is remembered.',
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
  crossMod: {
    title: 'FM',
    body: 'Frequency modulation (cross-modulation): Osc 2 swings Osc 1’s pitch up and down hundreds of times a second, whatever Osc 2’s own fader. Too fast to hear as vibrato, it becomes tone: new partials fan out either side of each Harmonic, from a growl to a clang. Osc 2’s tuning decides where they land.',
    how: 'Pick Sine on both and turn FM up: the Ideal’s circles fan out into sidebands with the spikes. They are drawn while Osc 2 is a Sine, or whole octaves from Osc 1; otherwise the circles mark plain Osc 1.',
  },
  osc2EnvAmount: {
    title: 'Env Amount',
    body: 'How many semitones the Filter Envelope moves Osc 2 at its peak: Osc 2 jumps by the Amount as a Note starts, then settles with the Envelope’s Decay and Sustain. Up or down, two octaves at most. With FM or Ring, the sweep becomes a zap.',
    how: 'Mix Osc 2 in, set Env Amount to +12 and the Filter Envelope’s Sustain to 0: each Note starts an octave up and falls.',
  },
  ring: {
    title: 'Ring',
    body: 'Osc 1 multiplied by Osc 2, whatever their own faders: in place of the two pitches you hear their sum and their difference, for bells, gongs and metallic clangs. Detune or Semitone on Osc 2 changes which. With the two in tune, both waves jump at the same instant, and their product dips for that instant: a faint click once a cycle, at every Harmonic, that the Ideal leaves out.',
    how: 'Pick Sine on both, Ring up and the others down, Osc 2 a fifth up: the Spectrum shows two spikes, neither at the Note.',
  },
  subNoise: {
    title: 'Sub & Noise',
    body: 'The Sub’s octave and shape, and the Noise’s colour. How loud each is, is set on the Mixer.',
  },
  noiseColour: {
    title: 'Noise colour',
    body: 'White Noise has the same energy at every frequency, so it hisses. Pink has the same energy in every octave: it falls 3 dB an octave, a softer rush like rain or surf. Both are equally loud overall.',
    how: 'Raise the Noise fader and switch colours: the Spectrum’s floor tilts down to the right on Pink.',
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
  osc1Pitch: {
    title: 'Pitch',
    body: 'Osc 1’s Octave, from the Note you play, and FM: how far Osc 2 swings Osc 1’s pitch at audio rate, which turns Osc 1’s Harmonics into clusters of new ones.',
  },
  osc1Octave: {
    title: 'Octave',
    body: 'Shifts Osc 1 by whole octaves from the Note you play, and the Sub with it: −1 for a bass an octave down. Osc 2 stays on the Note, so its Octave now sets how far apart the two are.',
    how: 'Set it to −1 and watch the Scope: each cycle takes twice as long.',
  },
  octave: {
    title: 'Octave',
    body: 'Shifts Osc 2 up or down by whole octaves from the Note you play: 2× or ½× the pitch, the same note higher or lower.',
  },
  semitone: {
    title: 'Semitone',
    body: 'Shifts Osc 2 by semitones from the Note you play: +7 is a fifth above, +12 an octave. Two notes at once, from one key.',
  },
  // Issue 59: the faders, the LFO knobs and the Timeline's key, which had none.
  osc1Level: { title: 'Osc 1', body: 'How much of Osc 1 goes into the Filter: its level in the mix.' },
  osc2Level: { title: 'Osc 2', body: 'How much of Osc 2 goes into the Filter. At 0 it is silent, and its tab and Tuning knobs grey out unless Ring, or FM on an Osc 1 you can hear, still uses it.' },
  attack: {
    title: 'Attack',
    body: 'How long the Envelope takes to rise from nothing to full once a key goes down: short for a sharp start (a pluck), long for a slow swell (a pad).',
  },
  decay: { title: 'Decay', body: 'How long the Envelope then takes to fall from full to the Sustain level, while the key is held.' },
  sustain: {
    title: 'Sustain',
    body: 'The level the Envelope holds for as long as the key stays down. A level, not a time: at 0 the sound dies away during the Decay even with the key held.',
  },
  release: { title: 'Release', body: 'How long the Envelope takes to fall back to nothing once the key comes up.' },
  volume: {
    title: 'Volume',
    body: 'How loud the Amp lets the sound through, after its Envelope. An LFO aimed at Volume dips it from here, for tremolo: its ring shows how far.',
  },
  lfoRate: { title: 'Rate', body: 'How fast the LFO repeats, in cycles a second (Hz): 0.05 Hz is one slow sweep every 20 seconds, 20 Hz a fast flutter.' },
  lfoDepth: {
    title: 'Depth',
    body: 'How far the LFO moves its Destination. At 0 it moves nothing.',
    how: 'Turn it up and watch the control it moves: a ring shows how far, a dot where it is now.',
  },
  timelineAmp: {
    title: 'Amp Envelope',
    body: 'Violet: the newest Note’s Amp Envelope over the last seconds (two, or as set in Display), from nothing to full.',
  },
  timelineFilterEnvelope: {
    title: 'Filter Envelope',
    body: 'Orange fill: the Filter Envelope’s level, nothing to full. Times Envelope Amount, it is how far it pushes the Cutoff.',
  },
  timelineCutoff: {
    title: 'Cutoff',
    body: 'Orange dotted line: where the Filter’s Cutoff really is, after the Filter Envelope, the LFOs, Velocity and Key Track, on the frequency scale at the right.',
  },
  envelopeTimeline: {
    title: 'Envelope Timeline',
    body: 'The last two seconds (1 to 4 in Display), the newest at the right: the Amp Envelope (violet fill), and what moves: the Filter Envelope (orange fill, when its Amount is set), the Cutoff (orange dots) and each knob an LFO moves (dashed for LFO 1’s, dash-dotted for LFO 2’s, in its section’s colour).',
    how: 'Play a Note and let go: the Release is drawn after the key comes up.',
  },
} satisfies Record<string, TipContent>;

const LINE_COLOUR = { osc: 'Green', filter: 'Orange', amp: 'Violet' } as const;
/** A Timeline key entry for a Destination an LFO moves (issue 63): its line, in its section's colour. */
export function lfoLineTip(destination: LfoDestination): TipContent {
  const { label, stage } = DESTINATIONS[destination];
  const colour = LINE_COLOUR[stage];
  return destination === 'pitch'
    ? { title: label, body: `${colour} broken line: the pitch as the LFO moves it (vibrato), a semitone up at the top and down at the bottom, the Note’s own pitch in the middle.` }
    : { title: label, body: `${colour} broken line: the ${label} as the LFO moves it (both LFOs added together when both aim at it), on its knob’s scale, bottom to top.` };
}

/** Each Tap's two Viewers (issue 59): what the Scope and the Spectrum there show. */
export const VIEWER_TIPS: Record<'Oscillator' | 'Filter' | 'Amp', { scope: TipContent; spectrum: TipContent }> = {
  Oscillator: {
    scope: {
      title: 'Oscillator Scope',
      body: 'The waveform leaving the Oscillators and the Mixer, before the Filter: a few repeats of it, held still on the Note’s pitch. Height is level.',
      how: 'Pick another Waveform and watch the shape change.',
    },
    spectrum: {
      title: 'Oscillator Spectrum',
      body: 'The same sound as its Harmonics: one spike each, low to high, the fundamental first. Their heights are the recipe of the timbre.',
      how: 'Hover a spike to read its frequency and level.',
    },
  },
  Filter: {
    scope: {
      title: 'Filter Scope',
      body: 'The waveform after the Filter: with the high Harmonics taken away it rounds off; Resonance adds a ringing ripple.',
    },
    spectrum: {
      title: 'Filter Spectrum',
      body: 'The Harmonics after the Filter. The Curve over them is the Filter’s response: spikes under its slope have been turned down.',
      how: 'Turn the Cutoff and watch the slope move across the Harmonics.',
    },
  },
  Amp: {
    scope: {
      title: 'Amp Scope',
      body: 'What you hear: the Filter’s output shaped by the Amp Envelope, growing and fading with it.',
    },
    spectrum: {
      title: 'Amp Spectrum',
      body: 'The Harmonics of what you hear: the Filter’s, all rising and falling together with the Amp Envelope.',
    },
  },
};

/**
 * Each Parameter's tip, which its knob or fader shows by itself (issue 78). Keyed by every Parameter, so a new one
 * needs a tip before it type-checks. The Envelopes' stages share theirs; both Pulse Widths, LFOs' Depths and Rates too.
 */
export const PARAM_TIPS: Record<ParamId, TipContent> = {
  pulseWidth: TIPS.pulseWidth,
  osc2PulseWidth: TIPS.pulseWidth,
  crossMod: TIPS.crossMod,
  osc2EnvAmount: TIPS.osc2EnvAmount,
  osc1Octave: TIPS.osc1Octave,
  osc2Octave: TIPS.octave,
  osc2Semitone: TIPS.semitone,
  osc2Detune: TIPS.detune,
  mixOsc1: TIPS.osc1Level,
  mixOsc2: TIPS.osc2Level,
  mixRing: TIPS.ring,
  mixNoise: TIPS.noise,
  mixSub: TIPS.sub,
  cutoff: TIPS.cutoff,
  resonance: TIPS.resonance,
  velocityCutoff: TIPS.velocityCutoff,
  keyTrack: TIPS.keyTrack,
  filterEnvAmount: TIPS.envAmount,
  filterAttack: TIPS.attack,
  filterDecay: TIPS.decay,
  filterSustain: TIPS.sustain,
  filterRelease: TIPS.release,
  ampAttack: TIPS.attack,
  ampDecay: TIPS.decay,
  ampSustain: TIPS.sustain,
  ampRelease: TIPS.release,
  volume: TIPS.volume,
  glide: TIPS.glide,
  lfoAmount: TIPS.lfoDepth,
  lfoRate: TIPS.lfoRate,
  lfo2Amount: TIPS.lfoDepth,
  lfo2Rate: TIPS.lfoRate,
};

export const OVERLAY_TIPS: Record<Overlay, TipContent> = {
  harmonics: {
    title: 'Harmonic Markers',
    body: 'A tick on every Harmonic of the Note, numbered 2, 3, 4… from the fundamental, which is labelled with its note name.',
  },
  ideal: {
    title: 'Ideal Reference',
    body: 'Marks where theory puts each Harmonic of each Oscillator, at its Mixer level: a circle for Osc 1, a square for Osc 2, a triangle for the Sub, a diamond for Ring. On the Filter Tap they show where each should land after the Filter.',
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
    body: 'The quantities behind the sound: Resonance as the Filter’s Q, the Mixer’s levels and the Amp’s Sustain in dB, the Harmonic formula of Osc 1’s Waveform on the Oscillator Spectrum, the Response Curve’s formula on the Filter Spectrum, and the Cutoff’s value on the Timeline.',
  },
};
