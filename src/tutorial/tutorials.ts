import type { Step, Tutorial } from './tutorial';

// Steps shared by the Tutorials that start alike, worded for where they come in.
const osc2Square = (level: number, percent: string): Step[] => [
  {
    kind: 'param', id: 'mixOsc2', to: level,
    say: `Raise Osc 2 in the Mixer to ${percent}.`,
    note: 'Louder, not different: Osc 2 is a second saw at the same pitch, so it has the same Harmonics.',
  },
  {
    kind: 'choice', id: 'osc2Waveform', to: 'square',
    say: 'Make Osc 2 a Square.',
    note: 'A square has only the odd Harmonics: the Oscillator Scope’s shape changes, not the pitch.',
    viewer: 'Oscillator Scope',
  },
  {
    kind: 'param', id: 'osc2Octave', to: -1,
    say: 'Set Octave to −1, so Osc 2 plays an octave below Osc 1.',
    note: 'The sound gains a floor. New Harmonics appear below and between Osc 1’s, and the Scope’s pattern repeats half as often.',
    viewer: 'Oscillator Spectrum',
  },
];

// The Steps that end the lessons on an open, steady sound to look at (issue 109).
const open = (heard: string): Step[] => [
  {
    kind: 'param', id: 'cutoff', to: 20000,
    say: 'Turn the Filter’s Cutoff all the way up, to 20 kHz.',
    note: `The Filter now lets every partial through: the Filter Spectrum shows ${heard} just as the Oscillator Spectrum does.`,
    viewer: 'Filter Spectrum',
  },
  {
    kind: 'param', id: 'resonance', to: 0,
    say: 'Pull Resonance all the way down.',
    note: 'Nothing is lifted at the Cutoff any more: wide open, the Filter leaves the sound as it is.',
  },
];

const osc1Sine: Step = {
  kind: 'choice', id: 'waveform', to: 'sine',
  say: 'Make Osc 1 a Sine.',
  note: 'One Harmonic and nothing else: a single spike in the Oscillator Spectrum, the smoothest curve in the Scope. Everything from here grows out of it.',
  viewer: 'Oscillator Spectrum',
};

/** Osc 2 made a Sine while its fader is down: heard only through FM or Ring, which come next. */
const silentOsc2 = (how: string): Step => ({
  kind: 'choice', id: 'osc2Waveform', to: 'sine',
  say: 'Make Osc 2 a Sine.',
  note: `Nothing changes: Osc 2’s fader is down in the Mixer, so it is silent. You will hear it only ${how}.`,
});

const held: Step = {
  kind: 'param', id: 'ampSustain', to: 1,
  say: 'Raise the Amp’s Sustain all the way.',
  note: 'Held Notes stay at their full level, so the picture holds still to read.',
};

const steeper: Step = {
  kind: 'choice', id: 'filterSlope', to: 24,
  say: 'Choose the Filter’s 24 dB Slope.',
  note: 'Above the Cutoff, Harmonics now fall away twice as fast: the Curve steepens and the upper bars sink.',
  viewer: 'Filter Spectrum',
};

/** The four first Tutorials (issue 58), then the lessons of issue 109; the Welcome opens the first. */
export const TUTORIALS: Tutorial[] = [
  {
    preset: 'Bass',
    intro: 'The sound flows left to right: the Oscillators make it, the Filter takes Harmonics away, the Amp shapes how loud it is over time. This Tutorial visits each in turn.',
    bpm: 112,
    phrase: 'A2:.5 A2:.5 -:.5 A2:.5 C3:.5 -:.5 A2:.5 G2:.5 F2:.5 F2:.5 -:.5 F2:.5 G2:.5 -:.5 G2:.5 E2:.5',
    summary: 'A bass from Init, through the whole signal chain: a square an octave down for weight, a dark 24 dB Filter that each Note’s Envelope opens into a thump, and a tight Amp.',
    steps: [
      ...osc2Square(0.5, 'half'),
      {
        kind: 'display', overlay: 'ideal',
        say: 'Open Display and see that Ideal is on (turn it on if not).',
        note: 'Circles mark where Osc 1’s saw puts its Harmonics, squares where Osc 2’s square puts its own: an octave down, they fall in between.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'param', id: 'cutoff', to: 280,
        say: 'Turn the Filter’s Cutoff down to about 280 Hz.',
        note: 'The Filter Spectrum loses its upper Harmonics: the bright buzz becomes a dark hum. The Curve shows where the Filter starts to cut.',
        viewer: 'Filter Spectrum',
      },
      steeper,
      {
        kind: 'param', id: 'resonance', to: 0.35,
        say: 'Raise Resonance to about 35 %.',
        note: 'A small bump rises on the Curve at the Cutoff: the Harmonics there get a lift, a little bite.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'filterEnvAmount', to: 2.5,
        say: 'Set the Filter Envelope’s Amount to +2.5 octaves.',
        note: 'Each Note now opens the Filter, then lets it close again: play one and watch the Curve jump up and fall back.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'filterAttack', to: 0.002,
        say: 'Pull the Filter Envelope’s Attack almost to the bottom, about 2 ms.',
        note: 'The Filter opens at once: each Note starts bright.',
      },
      {
        kind: 'param', id: 'filterDecay', to: 0.18,
        say: 'Set its Decay to about 180 ms.',
        note: 'The brightness falls away quickly. That fall is the thump.',
      },
      {
        kind: 'param', id: 'filterSustain', to: 0.15,
        say: 'Lower its Sustain to about 15 %.',
        note: 'While a key is held, the Filter stays almost closed: the thump, then a dark tone.',
      },
      {
        kind: 'param', id: 'filterRelease', to: 0.15,
        say: 'Shorten its Release to about 150 ms.',
        note: 'Let go, and the Filter closes quickly too.',
      },
      {
        kind: 'param', id: 'ampAttack', to: 0.002,
        say: 'In the Amp Envelope, pull the Attack almost to the bottom, about 2 ms.',
        note: 'Each Note starts at full level, in step with the Filter’s thump.',
      },
      {
        kind: 'param', id: 'ampSustain', to: 0.8,
        say: 'Raise the Amp’s Sustain to 80 %.',
        note: 'Held Notes stay loud: the bass keeps its weight under the thump.',
      },
      {
        kind: 'param', id: 'ampRelease', to: 0.12,
        say: 'Shorten the Amp’s Release to about 120 ms.',
        note: 'Notes stop as soon as you let go, tight, as a bass line needs. The Amp Scope shows each one end.',
        viewer: 'Amp Scope',
      },
    ],
  },
  {
    preset: 'Acid',
    bpm: 124,
    phrase: 'A2:.5 A2:.5@0.5 A3:.5 A2:.5@0.5 C3:.5 A2:.5@0.5 G2:.5 A2:.5 A2:.5 A3:.5@0.5 G3:.5 A2:.5@0.5 E3:.5 D3:.5@0.5 C3:.5 G2:.5',
    summary: 'Acid from Init: a dark, resonant 24 dB Filter swept by a sharp Envelope, harder Notes opening it further, and Glide sliding from Note to Note.',
    steps: [
      steeper,
      {
        kind: 'action', id: 'snapshot',
        say: 'Play a Note or press Listen, then take a Snapshot in Display: a faint copy of the Viewers to compare with.',
        note: 'The Scopes and Spectrums keep a faint trace of this bright saw. Every change from here shows against it.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'cutoff', to: 250,
        say: 'Turn the Cutoff down to about 250 Hz.',
        note: 'The saw goes dark: in the Filter Spectrum only the first few Harmonics are left, and the Snapshot’s faint trace shows all that was taken away.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'resonance', to: 0.8,
        say: 'Raise Resonance to about 80 %.',
        note: 'A tall peak rises on the Curve at the Cutoff, and the Harmonics there ring out: the squelchy, vocal heart of acid.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'filterEnvAmount', to: 3.5,
        say: 'Set the Filter Envelope’s Amount to +3.5 octaves.',
        note: 'Each Note now sweeps the peak up and back down, a “yow” on every Note. Watch it run along the Filter Spectrum.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'filterAttack', to: 0.001,
        say: 'Pull the Filter Envelope’s Attack all the way down.',
        note: 'The sweep starts at the top straight away: a sharper start to each Note.',
      },
      {
        kind: 'param', id: 'filterDecay', to: 0.15,
        say: 'Set its Decay to about 150 ms.',
        note: 'The peak falls back quickly: short, snappy Notes.',
      },
      {
        kind: 'param', id: 'filterSustain', to: 0.05,
        say: 'Lower its Sustain almost to nothing, about 5 %.',
        note: 'Held Notes settle with the Filter nearly shut: each Note is a single “yow”.',
      },
      {
        kind: 'param', id: 'filterRelease', to: 0.1,
        say: 'Shorten its Release to about 100 ms.',
        note: 'Letting go closes the Filter quickly too.',
      },
      {
        kind: 'param', id: 'velocityCutoff', to: 0.5,
        say: 'Raise the Filter’s Velocity to 50 %.',
        note: 'Harder Notes now open the Filter further. Listen plays every other Note softer: those come out darker.',
      },
      {
        kind: 'param', id: 'glide', to: 0.06,
        say: 'In the Amp, set Glide to about 60 ms.',
        note: 'Each Note now slides from the last one’s pitch: the acid slide. Watch the pitch dot glide along the piano.',
      },
      {
        kind: 'param', id: 'ampAttack', to: 0.001,
        say: 'Pull the Amp Envelope’s Attack all the way down.',
        note: 'Notes start at full level at once.',
      },
      {
        kind: 'param', id: 'ampSustain', to: 0.9,
        say: 'Raise the Amp’s Sustain to 90 %.',
        note: 'Held Notes keep their level: the Filter, not the Amp, shapes each Note.',
      },
      {
        kind: 'param', id: 'ampRelease', to: 0.08,
        say: 'Shorten the Amp’s Release to about 80 ms.',
        note: 'Notes stop as soon as they end: a tight line.',
      },
      {
        kind: 'param', id: 'volume', to: 0.6,
        say: 'Last, turn the Amp’s Volume down to 60 %.',
        note: 'A resonant peak makes a loud sound: at 60 % this line plays about as loud as the other basses, with room to spare.',
      },
    ],
  },
  {
    preset: 'Pluck',
    bpm: 120,
    phrase: 'C4:.5 E4:.5 G4:.5 C5:.5 G4:.5 E4:.5 C4:1 A3:.5 C4:.5 E4:.5 A4:.5 E4:.5 C4:.5 A3:1',
    summary: 'A pluck from Init: a pulse that fades away by itself even while held, through a resonant Filter that flashes open at every Note.',
    steps: [
      {
        kind: 'choice', id: 'waveform', to: 'pulse',
        say: 'Make Osc 1 a Pulse.',
        note: 'In the Oscillator Spectrum, gaps open in the row of Harmonics: the Pulse Width (25 %) decides where.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'param', id: 'pulseWidth', to: 0.3,
        say: 'Set Pulse Width to 30 %.',
        note: 'The gaps in the Oscillator Spectrum move closer together, and the tone is a little fuller.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'param', id: 'ampSustain', to: 0,
        say: 'In the Amp Envelope, pull Sustain all the way down.',
        note: 'Hold a key: the Note fades away by itself, even while held. The Amp Scope shows it die out. That fade is a pluck.',
        viewer: 'Amp Scope',
      },
      {
        kind: 'param', id: 'ampDecay', to: 0.45,
        say: 'Set the Amp’s Decay to about 450 ms.',
        note: 'The fade lasts a little longer: a string rather than a click.',
      },
      {
        kind: 'param', id: 'ampAttack', to: 0.001,
        say: 'Pull the Amp’s Attack all the way down.',
        note: 'Each Note starts at its loudest, as a plucked string does.',
      },
      {
        kind: 'param', id: 'ampRelease', to: 0.3,
        say: 'Shorten the Amp’s Release to about 300 ms.',
        note: 'Let go early and the Note still rings on briefly, then stops.',
      },
      steeper,
      {
        kind: 'param', id: 'cutoff', to: 220,
        say: 'Turn the Cutoff down to about 220 Hz.',
        note: 'Muffled: hardly any Harmonics get through. The Filter Envelope will open it for each Note.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'resonance', to: 0.5,
        say: 'Raise Resonance to 50 %.',
        note: 'A peak at the Cutoff gives a hollow, woody colour.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'filterEnvAmount', to: 4,
        say: 'Set the Filter Envelope’s Amount to +4 octaves.',
        note: 'Each Note now flashes bright and darkens: in the Filter Spectrum the Harmonics flash up and vanish.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'filterAttack', to: 0.001,
        say: 'Pull the Filter Envelope’s Attack all the way down.',
        note: 'The flash comes at the very start of the Note.',
      },
      {
        kind: 'param', id: 'filterDecay', to: 0.22,
        say: 'Set its Decay to about 220 ms.',
        note: 'The brightness fades faster than the level: the Note darkens as it dies, like a real string.',
      },
      {
        kind: 'param', id: 'filterSustain', to: 0,
        say: 'Pull its Sustain all the way down.',
        note: 'On a held Note the Filter closes completely.',
      },
      {
        kind: 'param', id: 'filterRelease', to: 0.2,
        say: 'Shorten its Release to about 200 ms.',
        note: 'Letting go closes the Filter quickly.',
      },
    ],
  },
  {
    preset: 'Wobble',
    bpm: 120,
    phrase: 'A2:2 A2:1 C3:1 F2:2 G2:2',
    summary: 'A wobble bass from Init: a square an octave down, a resonant 24 dB Filter, and an LFO sweeping its Cutoff three times a second, started again by every Note.',
    steps: [
      ...osc2Square(0.6, '60 %'),
      steeper,
      {
        kind: 'param', id: 'cutoff', to: 300,
        say: 'Turn the Cutoff down to about 300 Hz.',
        note: 'Dark: only the lowest Harmonics get through. The LFO will open it.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'resonance', to: 0.65,
        say: 'Raise Resonance to about 65 %.',
        note: 'A peak at the Cutoff: when it moves, you will hear it talk.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'lfoAmount', to: 0.7,
        say: 'In LFO 1, raise Depth to 70 %. It is already aimed at the Cutoff.',
        note: 'The Filter now sweeps up and down by itself: the wobble. The ring around the Cutoff knob shows how far it moves.',
      },
      {
        kind: 'param', id: 'lfoRate', to: 3,
        say: 'Set LFO 1’s Rate to 3 Hz.',
        note: 'Faster: three wobbles a second. Watch the LFO’s plot and the Cutoff’s ring keep time.',
      },
      {
        kind: 'choice', id: 'lfoRetrigger', to: 'note',
        say: 'Switch on LFO 1’s Retrigger.',
        note: 'Every Note now starts its wobble from the same point, so it lands on the beat. Watch the Timeline start again at each Note.',
        viewer: 'Envelope Timeline',
      },
      {
        kind: 'param', id: 'ampSustain', to: 1,
        say: 'Raise the Amp’s Sustain all the way.',
        note: 'Held Notes keep their full level: only the LFO moves the sound.',
      },
      {
        kind: 'param', id: 'ampRelease', to: 0.2,
        say: 'Shorten the Amp’s Release to about 200 ms.',
        note: 'Notes stop soon after you let go.',
      },
      {
        kind: 'param', id: 'volume', to: 0.45,
        say: 'Last, turn the Amp’s Volume down to 45 %.',
        note: 'The resonant peak sweeping through the Harmonics makes a loud sound: at 45 % the wobble plays about as loud as the other basses.',
      },
    ],
  },
  // Issue 109: FM, Ring, the Sub's choices and the Noise's colour, each on the Preset that shows it off.
  {
    preset: 'FM Ladder',
    bpm: 90,
    phrase: 'A3:1.5 C4:.5 E4:2 D4:1.5 C4:.5 A3:2',
    summary: 'FM from Init: two sines on the same Note, Osc 2 silent but swinging Osc 1’s pitch, so one Harmonic grows into a whole ladder of them, through a wide-open Filter.',
    steps: [
      osc1Sine,
      silentOsc2('through what it does to Osc 1'),
      {
        kind: 'param', id: 'crossMod', to: 0.5,
        say: 'Beside Osc 1’s Octave, turn FM up to 50 %.',
        note: 'Osc 2 now swings Osc 1’s pitch up and down at its own frequency, the Note’s: too fast to hear as vibrato, it becomes tone. The single spike grows into a ladder of Harmonics in the Oscillator Spectrum, a buzz from two pure tones, and the Ideal’s circles mark each rung.',
        viewer: 'Oscillator Spectrum',
      },
      ...open('the whole ladder'),
      held,
    ],
  },
  {
    preset: 'Ring Bell',
    bpm: 100,
    phrase: 'E4:1 G4:1 A4:2 G4:1 E4:1 D4:2',
    summary: 'A bell from Init: two sines an octave and a minor third apart, multiplied by Ring with neither heard alone, so only their sum and their difference sound, fading slowly as a struck bell does.',
    steps: [
      osc1Sine,
      silentOsc2('through Ring'),
      {
        kind: 'param', id: 'osc2Octave', to: 1,
        say: 'Set Osc 2’s Octave to +1.',
        note: 'Still nothing to hear: Osc 2 now plays an octave above the Note, silent, ready for Ring.',
      },
      {
        kind: 'param', id: 'mixRing', to: 1,
        say: 'Raise Ring in the Mixer all the way.',
        note: 'Ring is Osc 1 times Osc 2. Two sines multiplied give their sum and their difference: here 3 times the Note, a new spike in the Oscillator Spectrum, and 1 times, under Osc 1’s own. The Ideal’s diamonds mark them.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'param', id: 'osc2Semitone', to: 3,
        say: 'Set Osc 2’s Semitone to +3: an octave and a minor third above the Note.',
        note: 'The sum and the difference leave the ladder, at about 3.38 and 1.38 times the Note: the diamonds move between the Harmonics in the Oscillator Spectrum, and the sound turns metallic.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'param', id: 'mixOsc1', to: 0,
        say: 'Pull Osc 1 all the way down in the Mixer.',
        note: 'Ring still sounds, whatever the two faders say: Osc 1’s spike goes from the Oscillator Spectrum, and neither pitch is heard any more, only their sum and difference, an out-of-tune pair that rings like a bell. Quieter, too: two sines multiplied are softer than either alone.',
        viewer: 'Oscillator Spectrum',
      },
      ...open('the two partials'),
      {
        kind: 'param', id: 'ampSustain', to: 0,
        say: 'In the Amp Envelope, pull Sustain all the way down.',
        note: 'Each Note now fades away by itself, even while held: struck, not bowed. The Amp Scope shows it die out.',
        viewer: 'Amp Scope',
      },
      {
        kind: 'param', id: 'ampDecay', to: 1.8,
        say: 'Set the Amp’s Decay to about 1.8 s.',
        note: 'The fade lasts almost two seconds: the long ring of a bell.',
      },
      {
        kind: 'param', id: 'ampRelease', to: 1.8,
        say: 'Set its Release to about 1.8 s too.',
        note: 'Let go early and the bell still rings on.',
      },
    ],
  },
  {
    preset: 'Deep Breath',
    bpm: 80,
    phrase: 'A3:1.5 C4:.5 D4:2 E4:1.5 D4:.5 C4:2',
    summary: 'Deep Breath from Init: a saw over a sine Sub two octaves down, and a breath of Pink Noise filling the gaps between the Harmonics, through a wide-open Filter.',
    steps: [
      {
        kind: 'param', id: 'mixSub', to: 0.8,
        say: 'Raise the Sub in the Mixer to 80 %.',
        note: 'A square an octave below Osc 1: weight under the saw. The Oscillator Spectrum’s ladder now starts an octave lower, the Sub on its odd rungs (the Ideal’s triangles), Osc 1 on the even ones.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'choice', id: 'subOctave', to: -2,
        say: 'On the Sub & Noise tab, set the Sub’s Octave to −2.',
        note: 'Two octaves under Osc 1. The ladder counts from the Sub’s pitch, a quarter of Osc 1’s: in the Oscillator Spectrum the Sub’s square fills the odd rungs, Osc 1 every fourth, and the rungs between stay empty.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'choice', id: 'subWaveform', to: 'sine',
        say: 'Make the Sub a Sine.',
        note: 'The Sub’s odd rungs go, all but the first: one clean spike far left in the Oscillator Spectrum, a deep, round weight with no buzz of its own.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'param', id: 'mixNoise', to: 0.3,
        say: 'Raise Noise in the Mixer to 30 %.',
        note: 'A hiss over the tone. The Noise is White, the same energy at every frequency: in the Oscillator Spectrum it fills the gaps between the rungs, a floor that runs level across.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'choice', id: 'noiseColour', to: 'pink',
        say: 'On the Sub & Noise tab, switch the Noise’s Colour to Pink.',
        note: 'The hiss softens into a rush, like breath or distant surf. Pink has the same energy in every octave, so it falls 3 dB an octave: the Oscillator Spectrum’s floor tilts down to the right. Overall it is as loud as the White was.',
        viewer: 'Oscillator Spectrum',
      },
      ...open('the Noise’s floor and every rung'),
      held,
    ],
  },
];

export const tutorialFor = (preset: string): Tutorial | undefined => TUTORIALS.find((t) => t.preset === preset);
