import { bankLetter, C16_BANKS, describeSharedButtons } from '../midi/c16';
import { describeMode } from '../midi/describe';
import type { ControllerId } from '../midi/mappings';
import { DESTINATIONS } from '../modulation/destinations';
import { fmFormula, harmonicFormula, responseFormula, ringFormula, syncedRateUnderTheHood, UNDER_THE_HOOD, underTheHoodAt } from '../music/geek';
import type { Waveform } from '../music/harmonics';
import { preciseFrequencyText } from '../music/pitch';
import { formatSyncedRate, noteHz, TEMPO_STEPS } from '../music/tempo';
import { stepWords } from '../patch/grid';
import { type FilterMode, type FilterSlope, LFO_DESTINATIONS, type LfoDestination, PARAMS, type ParamId, type Patch } from '../patch/patch';
import type { Overlay } from '../viewers/overlays';
import { HISTORY } from './history';
import type { TipContent } from './Tooltip';

/**
 * What an LFO does to each Destination at full Depth (issue 107), keyed by every Destination, so a new one needs its
 * words before it type-checks; the tip lists them in the picker's order.
 */
const LFO_DESTINATION_WORDS: Record<LfoDestination, string> = {
  pitch: 'a semitone each way (vibrato).',
  osc2Pitch: 'Osc 2 alone, an octave each way (sweeps against Osc 1).',
  detune: 'Osc 2 alone, 50 cents each way (a beating chorus).',
  pulseWidth: 'each Oscillator’s (PWM; only heard on a Pulse).',
  fm: 'up to its whole range, but only as far each way as the FM knob leaves room: none at 0, so raise FM first (its partials growing and fading).',
  cutoff: 'two octaves each way (wah).',
  resonance: 'across its range (a vocal, whistling sweep).',
  volume: 'down from the Amp Envelope’s level to silence (tremolo).',
};

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
  midi: { title: 'MIDI', body: '', history: HISTORY.midi },
  quickSetup: {
    title: 'Quick Setup',
    body: 'Maps your Controller in one pass: it asks for a control for each knob and fader played live (the big knobs and the faders), the Filter’s first, then in the page’s order from the Oscillators to the LFOs, then a button for Hold, Freeze, Snapshot, the Preset arrows and Tap Tempo. Settings made once for a sound (Octave, the Waveforms, Filter Mode, Glide, Voices…) are left to MIDI Learn.',
    how: 'Skip any step. Finish (or Escape) keeps what is mapped; Cancel puts back your Mappings from before.',
  },
  c16Layout: {
    title: 'C16 layout',
    body: `Maps the whole TempoPAD C16, a section per bank (${C16_BANKS.map((bank, b) => `${bankLetter(b)} ${bank.name}`).join(', ')}), laid out like the section, row for row where the strips allow: the faders its levels or Envelope, the R buttons its switches and Waveforms. On every bank: ${describeSharedButtons()}. It answers the C16 only, so another keyboard’s pedal and mod wheel keep theirs.`,
    how: 'Set the C16’s knobs to Relative #1 and each button as the card says: Print C16 card, beside this, opens it. Applied by itself the first time a C16 is plugged in while nothing is mapped; this puts it back, replacing your Mappings.',
  },
  c16Card: {
    title: 'Print C16 card',
    body: `Opens a one-page card of the C16 layout to print and keep beside it: every bank’s knobs, faders and buttons, and how to set each button, ${describeMode('trigger')} or ${describeMode('toggle')}.`,
  },
  midiLearn: {
    title: 'MIDI Learn',
    body: 'Map your Controller: click a knob or button here, then move a knob, fader or pad there. Endless encoders and normal knobs are told apart by what they send; a wrong guess is put right in the MIDI panel, Absolute or Relative.',
    how: 'Normal knobs use Pickup: the Parameter waits until the knob passes its value, so nothing jumps. Finish with Escape, or Done in the MIDI panel.',
  },
  tuning: {
    title: 'Tuning',
    body: 'Octave, Semitone and Detune are Osc 2’s offsets from the Note you play; Env Amount lets the Filter Envelope move it from there. They wake up once Osc 2 is heard: mixed in, through Ring, or swinging Osc 1 (FM).',
    history: HISTORY.semitone,
  },
  tapSource: {
    title: 'Viewers follow',
    body: 'All: the Amp Tap carries every Voice at once, so a chord is seen there as it is heard. Newest: the Amp Tap shows only the Note you played last. The Oscillator and Filter Taps, the Harmonic Markers and the Timeline always follow the newest Note, so Cycle Lock stays exact there.',
    how: 'With All, the Amp Scope locks to the newest Note, so the chord\'s other Notes still move across it. One Voice shows the same either way.',
  },
  glow: {
    title: 'Glow',
    body: 'Past traces fade over a quarter of a second (15 frames at 60 a second), as on an analogue oscilloscope: a sound that stands still stays sharp, one that moves (Noise, a detuned Osc 2, a chord, a Filter Envelope’s sweep) leaves a soft glow, fading by half every 70 ms or so. Off: the Scopes and Spectrums show only now. Scopes: the Scopes’ traces glow. All: the Scopes’ traces and the Spectrums’ outlines. Your choice is remembered.',
    how: 'Choose Scopes or All with some Noise in the Mixer: the flicker softens into a cloud.',
  },
  voices: {
    title: 'Voices',
    body: 'How many Notes can sound at once. 1 is the classic monophonic synth: the newest key wins, and Glide slides between Notes. 2 to 8 play chords, each Note on its own Voice.',
    how: 'The Oscillator and Filter Viewers show the newest Note on its own, as if it were played alone; the Amp Viewers show every Voice unless Display says otherwise.',
    history: HISTORY.voices,
  },
  velocityCutoff: {
    title: 'Velocity → Cutoff',
    body: 'How much harder hits open the Filter: up to two octaves for the hardest. Velocity comes from MIDI pads and keys, or from where you click on a piano key.',
    how: 'Turn it up and watch the Cutoff knob: a grey ring (past the Filter Envelope’s white one, when it has one) shows how far a hard Note can open it.',
    history: HISTORY.velocityCutoff,
  },
  sub: {
    title: 'Sub-oscillator',
    body: 'A square or sine an octave below Osc 1 (or two), for weight; its octave and shape are on the Sub & Noise tab, its level on the Mixer. The sound now repeats at the Sub’s pitch, so the Harmonics are counted from it: an octave down, a square Sub fills the odd ones and Osc 1 the even ones.',
    how: 'Turn it up on Hollow Square or Init and watch new Harmonics fill in between the old ones.',
    history: HISTORY.sub,
  },
  subOptions: {
    title: 'Sub',
    body: 'Where the Sub sits, one or two octaves below Osc 1, and its shape: a square for buzz, a sine for a clean, round weight. Two octaves down, the Harmonics count from the Sub and Osc 1 lands on every fourth one.',
    how: 'Raise the Sub fader, pick −2 and Sine, and watch a single low line appear far left in the Spectrum.',
    history: HISTORY.sub,
  },
  keyTrack: {
    title: 'Key Track',
    body: 'How far the Cutoff follows the Note you play, from C4: at 100 % it moves an octave per octave, so high Notes keep as many Harmonics as low ones. At 0 % the Cutoff stays put, and high Notes sound duller.',
    how: 'Play C3 then C5 with a low Cutoff: watch the Response Curve move with the Harmonic Markers.',
    underTheHood: UNDER_THE_HOOD.keyTrack,
    history: HISTORY.keyTrack,
  },
  demo: {
    title: 'Demo',
    body: 'A track of about three minutes, played by Limpide alone: a kick, an acid line, an arpeggio, strings, tremolo keys, a riser, a wobble bass, the wobble doubled by a second LFO, a wide octave bass, a sweeping pad, an organ three octaves wide, FM bells, a gliding, singing lead, the arpeggio again and brass stabs, a Preset each, knobs turning as it builds and drops; then it returns to Init and stops. The page follows the knob being turned; the piano shows the Notes.',
    how: 'Turn a knob or flip a switch while it plays and hear the change; the Demo leaves a knob you turned alone until its next Preset. Scroll yourself and the page stops following until then. Play a Note, or press any other key or control away from the Demo’s card (Page Up and Down aside), to take over; the Demo stops at once. It never changes the Display settings.',
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
    history: HISTORY.hold,
  },
  envAmount: {
    title: 'Envelope Amount',
    body: 'How far the Filter Envelope moves the Cutoff, in octaves: +2 lifts it two octaves at the Envelope’s peak; negative values sweep it down instead.',
    how: 'Turn it up with a short Decay for a pluck. Watch the orange dotted line on the Envelope Timeline.',
    history: HISTORY.envAmount,
  },
  filterMode: {
    title: 'Filter Mode',
    body: 'Which frequencies the Filter keeps. Low-pass keeps those below the Cutoff (darker), high-pass those above (thinner), band-pass a band around it (nasal), notch all but a band (phasey).',
    how: 'Resonance sharpens the peak for low/high-pass, and narrows the band for band-pass and notch.',
    history: HISTORY.filterMode,
  },
  slope: {
    title: 'Slope',
    body: 'How steeply the Filter removes frequencies past the Cutoff: 12 or 24 dB per octave. 24 dB is two Filters in a row, darker and more “synth”.',
    how: 'Compare the Response Curve at each Slope: the 24 dB one falls twice as fast.',
    history: HISTORY.slope,
  },
  ampEnvelope: {
    title: 'Amp Envelope',
    body: 'The loudness of every Note over time: Attack to full, Decay to the Sustain level while the key is held, Release once it is let go. The Timeline draws it.',
    history: HISTORY.stages,
  },
  filterEnvelope: {
    title: 'Filter Envelope',
    body: 'An Attack–Decay–Sustain–Release shape, like the Amp’s, that moves the Cutoff instead of the loudness. Envelope Amount sets how far. It can bend Osc 2’s pitch too, by Osc 2’s own Env Amount: its faders stay lit while either Amount is set.',
    history: HISTORY.filterEnvelope,
  },
  timeline: {
    title: 'LFO & Envelopes',
    body: 'What changes the sound over time: the LFO, and the Envelope Timeline beside it. The Timeline shows the last two seconds (1 to 4 in Display). The violet fill is the Amp Envelope, the orange one the Filter Envelope when its Amount is set. A broken line in its section’s colour is each knob the Filter Envelope or an LFO moves: the Cutoff dotted, what LFO 1 moves dashed, what LFO 2 alone moves dash-dotted. While an LFO is synced and free (Retrigger off), its cycle on the beat, faint broken lines mark the beats.',
    how: 'Play a Note and let go: the Release is drawn after the key comes up.',
  },
  lfo: {
    title: 'LFO',
    body: 'A slow, repeating wave that moves something for you: the Cutoff (wah, wobble), the pitch (vibrato), the Pulse Width (a shimmering PWM chorus), the Volume (tremolo) and more. Depth is how far, Rate how fast. There are two: aim them at different things, or both at one for two speeds of movement. Both are drawn in the same blue.',
    how: 'Turn Depth up and watch the knob it moves: a ring shows how far, a dot where it is now.',
    history: HISTORY.lfo,
  },
  lfoRetrigger: {
    title: 'Retrigger',
    body: 'On: the LFO starts its cycle again at every Note (a legato one aside, with Legato on), so each Note gets the same wobble from its start (key sync). Off: it runs on freely, and each Note catches it wherever it is.',
    how: 'Turn it on with a slow LFO on Cutoff and play a few Notes: each one opens the same way. The plot shows the cycle restart.',
  },
  lfoWaveform: {
    title: 'LFO',
    body: 'The LFO as it moves: its last second, the newest at the right, so 1 Hz is one period. Sine and Triangle sweep smoothly, Square jumps between two values, Saw ramps up and drops, Saw Down drops and ramps down. Its height is the Depth. While it is synced and free (Retrigger off), its cycle on the beat, faint broken lines mark the beats.',
  },
  lfoDestination: {
    title: 'LFO Destination',
    body: `What the LFO moves, at full Depth. ${LFO_DESTINATIONS.map((d) => `${d.label}: ${LFO_DESTINATION_WORDS[d.id]}`).join(' ')}`,
  },
  glide: {
    title: 'Glide',
    body: 'Slides the pitch from one Note to the next instead of jumping, over this long. Off plays Notes at once. It works with one Voice only: with more, each Note starts at its own pitch.',
    how: 'Play two keys one after the other: the Scope\'s wave holds still as Cycle Lock follows the slide, and the Spectrum\'s Harmonics glide to the new Note.',
    underTheHood: UNDER_THE_HOOD.glide,
    history: HISTORY.glide,
  },
  legato: {
    title: 'Legato',
    body: 'On, with one Voice: a key played while another is held only moves the pitch there. The Envelopes carry on with no new Attack, and an LFO set to Retrigger does not start again, as on a classic monosynth. Let go of every key to strike the next Note afresh.',
    how: 'Turn Glide up, hold a key and play others over it: the pitch slides from Note to Note and the Timeline draws one Attack.',
  },
  about: { title: 'About', body: 'The version of Limpide you are playing, who made it, and where its source lives. The logo opens it too.' },
  theme: { title: 'Theme', body: 'Switches between the dark and light look. Your choice is remembered.' },
  bead: {
    title: 'Bead',
    body: 'Bead is the little water drop living on the page, answering what you play and turn. Off keeps it away, remembered, until you switch it on again. While it is on, playing B, E, A, D sends it away for this visit, and the same Notes call it back.',
  },
  // The × of a Preset's description, under the Patch name (issue 153).
  closeDescription: {
    title: 'Close',
    body: 'Closes the Preset’s description; Escape does too. It goes by itself at the first change to the sound. Every Preset’s description shows on its name in the Patches panel.',
  },
  aftertouch: {
    title: 'Aftertouch',
    body: 'Press harder on a held key and this Destination rises, as on a plugin synth: nothing at a light touch and, at the hardest, as far as one LFO at full Depth swings it, on top of its knob and the LFOs; the Resonance only half the way to its top. The Cutoff opens up to two octaves, so pressing brightens the sound. The dot on its knob and its LFO & Envelopes line show the move.',
    how: 'Not every keyboard sends aftertouch: press a held key harder and see whether the Last message says Aftertouch. A keyboard or pad that senses each key’s pressure (polyphonic) moves it by the key pressed hardest.',
  },
  bendRange: {
    title: 'Pitch bend range',
    body: 'How far a keyboard’s bend wheel takes the pitch, up or down, in semitones: 2 is a whole tone, as on most synths. The sustain pedal holds Notes as Hold does, the mod wheel turns LFO 1’s Depth, and a Program Change loads that Preset, each until you map the control to something else.',
    history: HISTORY.bendRange,
  },
  tooltips: {
    title: 'Tooltips',
    body: 'Whether explanations like this one open when you point at a control, reach it with the keyboard, or hold it on a touch screen. Off, they stay closed, and a button showing its icon alone shows just its name; a screen reader still reads them. Your choice is remembered.',
  },
  letterKeys: {
    title: 'Letter keys',
    body: 'Whether the computer keyboard plays Notes (A W S E D F T G…, with Z and X for the octave). Turn them off if you type with a screen reader or speech input, or the keys get in the way. Your choice is remembered.',
  },
  pulseWidth: {
    title: 'Pulse Width',
    body: 'How much of each cycle the pulse spends high. 50% is a square. Narrower pulses sound thinner and add Harmonics that a square lacks.',
    how: 'Each Oscillator has its own, and it only shapes the Pulse Waveform: choose Pulse to hear it.',
    history: HISTORY.pulseWidth,
  },
  osc2: {
    title: 'Osc 2',
    body: 'A second Oscillator that follows the Note, shifted by whole Octaves and Semitones and fine-tuned by Detune; its Env Amount lets the Filter Envelope bend its pitch.',
    how: 'Raise Osc 2 in the Mixer to hear it (Ring and FM use it even with its fader at 0). A few cents of Detune makes the sound beat: watch the Scope swell and fade.',
  },
  detune: {
    title: 'Detune',
    body: 'Fine-tunes Osc 2 in cents (hundredths of a semitone). Two Oscillators a few cents apart drift in and out of step, so the sound swells and fades: the classic thick, chorused sound.',
    underTheHood: UNDER_THE_HOOD.osc2Detune,
    history: HISTORY.detune,
  },
  mixer: {
    title: 'Mixer',
    body: 'Sets how much of each source goes into the Filter. The Oscillator Tap below shows the mix. Several sources at full level can exceed the Scope’s range: what goes past it is drawn squeezed into its edge.',
    history: HISTORY.mixer,
  },
  noise: {
    title: 'Noise',
    body: 'An unpitched sound with energy at every frequency, a hiss in White or a softer rush in Pink (its colour, on the Sub & Noise tab): in the Spectrum it fills the gaps between Harmonics. Filter it for wind, breath or percussion.',
    underTheHood: UNDER_THE_HOOD.noise,
    history: HISTORY.noise,
  },
  crossMod: {
    title: 'FM',
    body: 'To see it clearly, set Osc 1 and Osc 2 to Sine and turn FM up: from a single line, a ladder of new partials grows. On Init’s two saws no new lines appear: the new partials land on the Harmonics already there and only change their heights. FM is Osc 2 swinging Osc 1’s pitch at Osc 2’s own frequency, whatever Osc 2’s own fader: too fast to hear as vibrato, it becomes tone, from a growl to a clang. With Osc 2 in tune or whole octaves away, the partials land on the Harmonics, changing their levels; anywhere else, between them. FM’s depth, how far Osc 1 swings, is set by the knobs (FM and Osc 2’s tuning), not by Env Amount: as the Envelope takes Osc 2 up, the swing stays the same and FM thins, as on an analogue synth. High up, FM holds itself back so they stay under the top of what the browser can play.',
    how: 'Then move Osc 2’s Semitone: the partials leave the Harmonic ladder. The Ideal’s circles follow them while Osc 2 is a Sine, or whole octaves from Osc 1; otherwise they mark plain Osc 1. An LFO aimed at FM swings it too: raise FM first, since the swing goes only as far below the knob as above it.',
    history: HISTORY.fm,
  },
  osc2EnvAmount: {
    title: 'Env Amount',
    body: 'How many semitones the Filter Envelope moves Osc 2 at its peak: Osc 2 jumps by the Amount as a Note starts, then settles with the Envelope’s Decay and Sustain. Up or down, two octaves at most. With FM or Ring, the sweep becomes a zap.',
    how: 'Mix Osc 2 in, set Env Amount to +12 and the Filter Envelope’s Sustain to 0: each Note starts an octave up and falls.',
    history: HISTORY.osc2EnvAmount,
  },
  ring: {
    title: 'Ring',
    body: 'Osc 1 multiplied by Osc 2, whatever their own faders: in place of the two pitches you hear their sum and their difference, for bells, gongs and metallic clangs. Detune or Semitone on Osc 2 changes which. With the two in tune, both waves jump at the same instant, and their product dips for that instant: a faint click once a cycle, at every Harmonic, that the Ideal leaves out.',
    how: 'Pick Sine on both, Ring up and the others down, Osc 2 a fifth up: the Spectrum shows two lines, neither at the Note.',
    history: HISTORY.ring,
  },
  subNoise: {
    title: 'Sub & Noise',
    body: 'The Sub’s octave and shape, and the Noise’s colour. How loud each is, is set on the Mixer.',
  },
  noiseColour: {
    title: 'Noise colour',
    body: 'White Noise has the same energy at every frequency, so it hisses. Pink has the same energy in every octave: it falls 3 dB an octave, a softer rush like rain or surf. Both are equally loud overall.',
    how: 'Raise the Noise fader and switch colours: the Spectrum’s floor tilts down to the right on Pink.',
    underTheHood: UNDER_THE_HOOD.noise,
    history: HISTORY.noiseColour,
  },
  // Issue 49: the core controls and the stages, so a newcomer finds words where they look first.
  oscillators: {
    title: 'Oscillators',
    body: 'Where the sound starts: a tone at the pitch you play, with a shape (the Waveform) that decides which Harmonics it has. Two Oscillators, Ring (the two multiplied), a Sub one or two octaves down and Noise are mixed here, then sent to the Filter.',
    how: 'Pick a Waveform and watch both pictures below change: the Scope draws its shape, the Spectrum its Harmonics.',
    history: HISTORY.oscillators,
  },
  filter: {
    title: 'Filter',
    body: 'Takes Harmonics away. Above the Cutoff (on the default low-pass) they get quieter and quieter, so the sound turns darker. This is the “subtractive” in subtractive synthesis.',
    how: 'Hold a Note and turn the Cutoff down: watch the Harmonics on the right of the Spectrum disappear.',
    history: HISTORY.filter,
  },
  amp: {
    title: 'Amp',
    body: 'Shapes the loudness of each Note over time with its Envelope: how fast it starts, how it settles while held, how it fades when let go. Voices sets how many Notes can sound at once.',
    how: 'Play short and long Notes and watch the Amp Scope grow and fade.',
    history: HISTORY.amp,
  },
  waveform: {
    title: 'Waveform',
    body: 'The Oscillator’s shape, which sets its Harmonics. Sine: the fundamental alone, pure. Triangle: soft, odd Harmonics fading fast. Saw: bright, every Harmonic. Square: hollow, odd ones only. Pulse: a square of any width, set by Pulse Width.',
    how: 'Switch shapes and compare the Spectrum: each line is a Harmonic.',
    history: HISTORY.waveform,
  },
  cutoff: {
    title: 'Cutoff',
    body: 'Where the Filter starts to take Harmonics away. On low-pass, everything above it fades: turn it down for a darker, muffled sound, up for a brighter one.',
    how: 'Watch the dashed Response Curve on the Filter’s Spectrum move, and the Harmonics past its slope shrink.',
    history: HISTORY.cutoff,
  },
  resonance: {
    title: 'Resonance',
    body: 'Boosts the Harmonics right at the Cutoff, so the Filter sings or whistles there. A little adds bite; a lot rings.',
    how: 'Turn it up and watch the bump on the Response Curve, then sweep the Cutoff: the bump lifts each Harmonic as it passes.',
    history: HISTORY.resonance,
  },
  osc1Pitch: {
    title: 'Pitch',
    body: 'Osc 1’s Octave, from the Note you play, and FM: how far Osc 2 swings Osc 1’s pitch at audio rate, which turns Osc 1’s Harmonics into clusters of new ones.',
  },
  osc1Octave: {
    title: 'Octave',
    body: 'Shifts Osc 1 by whole octaves from the Note you play, and the Sub with it: −1 for a bass an octave down. Osc 2 stays on the Note, so the two sit as far apart as Osc 2’s Octave less Osc 1’s: an octave, with this at −1 and Osc 2’s at 0.',
    how: 'Set it to −1 and watch the Spectrum: the Harmonics and their Markers move an octave down. The Scope looks the same: Cycle Lock follows Osc 1 and fits the same number of cycles across its width, each now twice as long.',
    history: HISTORY.octave,
  },
  octave: {
    title: 'Octave',
    body: 'Shifts Osc 2 up or down by whole octaves from the Note you play: 2× or ½× the pitch, the same note higher or lower.',
    underTheHood: UNDER_THE_HOOD.osc2Octave,
    history: HISTORY.octave,
  },
  semitone: {
    title: 'Semitone',
    body: 'Shifts Osc 2 by semitones from the Note you play: +7 is a fifth above, +12 an octave. Two notes at once, from one key.',
    underTheHood: UNDER_THE_HOOD.osc2Semitone,
    history: HISTORY.semitone,
  },
  // Issue 59: the faders, the LFO knobs and the Timeline's key, which had none.
  osc1Level: { title: 'Osc 1', body: 'How much of Osc 1 goes into the Filter: its level in the mix.' },
  osc2Level: { title: 'Osc 2', body: 'How much of Osc 2 goes into the Filter. At 0 it is silent, and its tab and Tuning knobs grey out unless Ring, or FM on an Osc 1 you can hear, still uses it.' },
  attack: {
    title: 'Attack',
    body: 'How long the Envelope takes to rise from nothing to full once a key goes down: short for a sharp start (a pluck), long for a slow swell (a pad).',
    history: HISTORY.stages,
  },
  decay: { title: 'Decay', body: 'How long the Envelope then takes to fall from full to the Sustain level, while the key is held.', history: HISTORY.stages },
  sustain: {
    title: 'Sustain',
    body: 'The level the Envelope holds for as long as the key stays down. A level, not a time: at 0 the sound dies away during the Decay even with the key held.',
    history: HISTORY.stages,
  },
  release: { title: 'Release', body: 'How long the Envelope takes to fall back to nothing once the key comes up.', history: HISTORY.stages },
  volume: {
    title: 'Volume',
    body: 'How loud the Amp lets the sound through, after its Envelope. An LFO aimed at Volume dips it from here, for tremolo: its ring shows how far.',
    history: HISTORY.amp,
  },
  lfoRate: {
    title: 'Rate',
    body: 'How fast the LFO repeats, in cycles a second (Hz): 0.05 Hz is one slow sweep every 20 seconds, 20 Hz a fast flutter.',
    underTheHood: UNDER_THE_HOOD.lfoRate,
    history: HISTORY.lfoRate,
  },
  lfoNote: {
    title: 'Rate',
    body: 'With Sync on, how often the LFO repeats, as a note value at the tempo: 1 bar, 1/4, 1/8 (D dotted, half as long again; T triplet, three in the time of two).',
    underTheHood: UNDER_THE_HOOD.lfoNote,
  },
  lfoSync: {
    title: 'Sync',
    body: 'On: the Rate is a note value at the tempo; with Retrigger off, the LFO’s cycle lands on the beat, and with it on, each Note starts the cycle. A note value is a share of a beat, so its speed follows the tempo: double the BPM and the LFO runs twice as fast, and a synced wobble keeps time with the music. Off: the Rate is in Hz, as it was.',
  },
  tempo: {
    title: 'Tempo',
    body: 'The page’s beats per minute (BPM), which every LFO with Sync on follows: its note value is a share of a beat, so at a new tempo its speed changes with it, and a synced wobble keeps to the beat. Drag it or use the arrows; double-click or Enter to type it. Loading a Preset leaves it as it is.',
    keys: stepWords(TEMPO_STEPS.grid),
  },
  tempoOpen: {
    title: 'Tempo',
    body: 'The page’s beats per minute (BPM), which every LFO with Sync on follows. Press it to set it: the BPM and Tap Tempo open below it. Loading a Preset leaves it as it is.',
  },
  tempoClock: { title: 'Tempo', body: 'Following a MIDI clock: the tempo is the clock’s while it runs, so it cannot be set here. When its ticks stop, its last BPM stays, yours to change.' },
  tapTempo: { title: 'Tap Tempo', body: 'Tap it in time with the music: from the second tap the tempo follows your last four, its beat where you last tapped, and every synced LFO’s speed follows it.' },
  lfoDepth: {
    title: 'Depth',
    body: 'How far the LFO moves its Destination. At 0 it moves nothing.',
    how: 'Turn it up and watch the control it moves: a ring shows how far, a dot where it is now.',
    underTheHood: UNDER_THE_HOOD.lfoDepth,
    history: HISTORY.lfoDepth,
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
    body: 'Orange dotted line: where the Filter’s Cutoff really is, after the Filter Envelope, the LFOs, Velocity, Key Track and a keyboard’s aftertouch, on the frequency scale at the right.',
  },
  envelopeTimeline: {
    title: 'Envelope Timeline',
    body: 'The last two seconds (1 to 4 in Display), the newest at the right: the Amp Envelope (violet fill), and what moves: the Filter Envelope (orange fill, when its Amount is set), the Cutoff (orange dots) and each knob an LFO moves (dashed for LFO 1’s, dash-dotted for LFO 2’s, in its section’s colour).',
    how: 'Play a Note and let go: the Release is drawn after the key comes up.',
  },
} satisfies Record<string, TipContent>;

const LINE_COLOUR = { osc: 'Green', filter: 'Orange', amp: 'Violet' } as const;
/**
 * Each known Controller's tips in the MIDI panel, its layout's and its card's, by its id: a Controller added to the
 * list without them does not compile (issue 196, rather than finding them by name).
 */
export const CONTROLLER_TIPS: Record<ControllerId, { layout: TipContent; card: TipContent }> = {
  c16: { layout: TIPS.c16Layout, card: TIPS.c16Card },
};

/** A Timeline key entry for a Destination an LFO moves (issue 63): its line, in its section's colour. */
export function lfoLineTip(destination: LfoDestination, aftertouch: boolean): TipContent {
  const { label, stage } = DESTINATIONS[destination];
  const colour = LINE_COLOUR[stage];
  // Aftertouch aimed here moves the line too (issue 132).
  const pressure = aftertouch ? ' A keyboard’s aftertouch raises it too, the harder the press.' : '';
  return destination === 'pitch'
    ? { title: label, body: `${colour} broken line: the pitch as the LFO moves it (vibrato), a semitone up at the top and down at the bottom, the Note’s own pitch in the middle.${pressure}` }
    : { title: label, body: `${colour} broken line: the ${label} as the LFO moves it (both LFOs added together when both aim at it), on its knob’s scale, bottom to top.${pressure}` };
}

/**
 * A knob's or fader's tip at its setting: where its formula under the hood works out a live number (an Envelope
 * stage's τ, Glide's: issue 168), that one; otherwise its own tip.
 */
export function paramTipAt(id: ParamId, value: number): TipContent {
  const underTheHood = underTheHoodAt(id, value);
  return underTheHood ? { ...PARAM_TIPS[id], underTheHood } : PARAM_TIPS[id];
}

/**
 * A synced Rate's tip at note value `index` and the tempo: its Hz, which its readout leaves out so its knob keeps one
 * width (issue 176), and under the hood the conversion worked out with the live numbers (issue 137).
 */
export function syncedRateTip(index: number, bpm: number): TipContent {
  const { note } = formatSyncedRate(index, bpm);
  const hz = preciseFrequencyText(noteHz(index, bpm)); // to three figures where slow (issue 225)
  return { ...PARAM_TIPS.lfoNote, body: `${TIPS.lfoNote.body} At ${bpm} BPM, ${note} is ${hz}.`, underTheHood: syncedRateUnderTheHood(index, bpm) };
}

/**
 * The tips whose formula under the hood follows the settings picked (issue 235, from the Viewers): an Oscillator's
 * Waveform its Harmonic series, at its Pulse Width; FM's and Ring's their rules at the knobs; the Filter Mode's and
 * Slope's the response for both. FM's goes to the tip of Osc 1's Pitch, over Octave and FM: FM's own, the tallest tip,
 * has no room left for it on a phone.
 */
export const waveformTip = (waveform: Waveform, pulseWidth: number): TipContent => ({ ...TIPS.waveform, underTheHood: harmonicFormula(waveform, pulseWidth) });
export const osc1PitchTip = (patch: Patch): TipContent => ({ ...TIPS.osc1Pitch, underTheHood: fmFormula(patch) });
export const ringTip = (patch: Patch): TipContent => ({ ...PARAM_TIPS.mixRing, underTheHood: ringFormula(patch) });
export function filterTips(mode: FilterMode, slope: FilterSlope): { mode: TipContent; slope: TipContent } {
  const underTheHood = responseFormula(mode, slope);
  return { mode: { ...TIPS.filterMode, underTheHood }, slope: { ...TIPS.slope, underTheHood } };
}

/** Each Tap's two Viewers (issue 59): what the Scope and the Spectrum there show. */
export const VIEWER_TIPS: Record<'Oscillator' | 'Filter' | 'Amp', { scope: TipContent; spectrum: TipContent }> = {
  Oscillator: {
    scope: {
      title: 'Oscillator Scope',
      body: 'The waveform leaving the Oscillators and the Mixer, before the Filter: a few repeats of it, held still on the Note’s pitch. Height is level.',
      how: 'Pick another Waveform and watch the shape change.',
      underTheHood: UNDER_THE_HOOD.scope,
    },
    spectrum: {
      title: 'Oscillator Spectrum',
      body: 'The same sound as its Harmonics: one line each, low to high, the fundamental first. Their heights are the recipe of the timbre.',
      how: 'Hover a Harmonic to read its frequency and level.',
      underTheHood: UNDER_THE_HOOD.oscillatorSpectrum,
      history: HISTORY.spectrum,
    },
  },
  Filter: {
    scope: {
      title: 'Filter Scope',
      body: 'The waveform after the Filter: with the high Harmonics taken away it rounds off; Resonance adds a ringing ripple.',
      underTheHood: UNDER_THE_HOOD.scope,
    },
    spectrum: {
      title: 'Filter Spectrum',
      body: 'The Harmonics after the Filter. The Curve over them is the Filter’s response: Harmonics under its slope have been turned down.',
      how: 'Turn the Cutoff and watch the slope move across the Harmonics.',
      underTheHood: UNDER_THE_HOOD.spectrum,
      history: HISTORY.spectrum,
    },
  },
  Amp: {
    scope: {
      title: 'Amp Scope',
      body: 'What you hear: the Filter’s output shaped by the Amp Envelope, growing and fading with it.',
      underTheHood: UNDER_THE_HOOD.scope,
    },
    spectrum: {
      title: 'Amp Spectrum',
      body: 'The Harmonics of what you hear: the Filter’s, all rising and falling together with the Amp Envelope.',
      underTheHood: UNDER_THE_HOOD.spectrum,
      history: HISTORY.spectrum,
    },
  },
};

/**
 * Each Parameter's tip, which its knob or fader shows by itself (issue 78), with its steps for the keys (issue 160).
 * Keyed by every Parameter, so a new one needs a tip before it type-checks. The Envelopes' stages share theirs; both
 * Pulse Widths, LFOs' Depths and Rates too.
 */
const PARAM_EXPLAINED: Record<ParamId, TipContent> = {
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
  lfoNote: TIPS.lfoNote,
  lfo2Amount: TIPS.lfoDepth,
  lfo2Rate: TIPS.lfoRate,
  lfo2Note: TIPS.lfoNote,
};
export const PARAM_TIPS = Object.fromEntries(
  (Object.keys(PARAM_EXPLAINED) as ParamId[]).map((id) => {
    const { grid, geekGrid } = PARAMS[id];
    return [id, { ...PARAM_EXPLAINED[id], keys: stepWords(grid), geekKeys: geekGrid && stepWords(geekGrid) }];
  }),
) as Record<ParamId, TipContent>;

export const OVERLAY_TIPS: Record<Overlay, TipContent> = {
  harmonics: {
    title: 'Harmonic Markers',
    body: 'A tick on every Harmonic of the Note, numbered 2, 3, 4… from the fundamental, which is labelled with its note name.',
    history: HISTORY.harmonicMarkers,
  },
  ideal: {
    title: 'Ideal Reference',
    body: 'Marks where theory puts each Harmonic of each Oscillator, at its Mixer level: a circle for Osc 1, a square for Osc 2, a triangle for the Sub, a diamond for Ring. On the Filter Tap they show where each should land after the Filter.',
  },
  curve: {
    title: 'Filter',
    body: 'The Response Curve: the Filter’s gain at every frequency (scale on the right). Harmonics under the slope get quieter; a bump at the Cutoff is Resonance.',
  },
  guides: {
    title: 'Scope guides',
    body: 'Dashed lines at the level the Mixer sends, every source’s level added, so they move with its faders: where one Note peaks. Resonance takes a trace beyond them; the Filter can nudge one a little past, and white Noise well past with the Cutoff near the top; on the Amp Scope, so do several Notes at once, their peaks piling up.',
  },
  geek: {
    title: 'Synth Geek Layer',
    body: 'The numbers under the hood, for the synth geek: Resonance as the Filter’s Q, the Mixer’s levels and the Amp’s Sustain in dB, Osc 2’s tuning as multiples and Detune as beats, each LFO’s swing, the Cutoff at the Note under Key Track, each Scope’s period and frequency, the Cutoff’s value on the Timeline; and, in the tips, a control’s formula under the hood (an LFO Rate’s period among them; the Waveform’s, FM’s (on Osc 1’s Pitch), Ring’s and the Filter’s for the settings picked) and, for one with a musical past, its History: where it comes from.',
  },
};
