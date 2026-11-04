import { noteIndex } from '../music/tempo';
import type { Tutorial } from './tutorial';

/*
 * The words (issue 129): light and warm, short sentences, one idea a Step, an everyday image now and then. Each synth
 * word is said in plain words the first time a Tutorial uses it, even if another Tutorial did, since people take them
 * in any order (words.test.ts holds the list). Harmonic is the idea; on a Spectrum, the Harmonics' lines.
 */

/** How every Tutorial goes, on its first card after its own words. */
export const FROM_INIT = 'Start from Init, the plain sound every Tutorial begins with, and change one control at a time. Play any Note, or press Listen, to hear each change.';

/** The four first Tutorials (issue 58), then the lessons of issue 109; the Tour's last card opens the first (issue 128). */
export const TUTORIALS: Tutorial[] = [
  {
    preset: 'Bass',
    intro: 'A bass line, built one stage at a time. The sound flows left to right: the Oscillators make it, the Filter, a tone knob, takes the brightness away, and the Amp sets how loud it is over time. You will hear a buzzy saw turn into a dark, punchy bass.',
    teaches: 'the whole chain, one stage at a time',
    bpm: 112,
    phrase: 'A2:.5 A2:.5 -:.5 A2:.5 C3:.5 -:.5 A2:.5 G2:.5 F2:.5 F2:.5 -:.5 F2:.5 G2:.5 -:.5 G2:.5 E2:.5',
    summary: 'Your bass: a square an octave down for weight, a dark, steep Filter that every Note kicks open into a thump, and an Amp that stops the moment you let go.',
    steps: [
      {
        kind: 'param', id: 'mixOsc2', to: 0.5,
        say: 'Osc 2 is the second Oscillator, silent for now. In the Mixer, where each one gets its level, raise it to half.',
        note: 'Louder, not different: Osc 2 is a second saw at the same pitch, so it has the same Harmonics, the stack of pitches every Note is made of.',
      },
      {
        kind: 'choice', id: 'osc2Waveform', to: 'square',
        say: 'Make Osc 2 a Square.',
        note: 'Hollower, like a clarinet: a square keeps only every other Harmonic. The Oscillator Scope, the picture of the wave, changes shape; the pitch does not.',
        viewer: 'Oscillator Scope',
      },
      {
        kind: 'param', id: 'osc2Octave', to: -1,
        say: 'Set Osc 2’s Octave to −1: an octave down, half the pitch.',
        note: 'The sound gains a floor. On the Oscillator Spectrum, where each Harmonic is a line, new lines appear below and between Osc 1’s.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'display', overlay: 'ideal',
        say: 'Open Display and turn on Ideal, small marks for where each wave’s Harmonics should land.',
        note: 'Circles mark where Osc 1’s saw puts its Harmonics, squares where Osc 2’s square puts its own. One octave down, the squares slot in between the circles.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'param', id: 'cutoff', to: 280,
        say: 'Turn the Cutoff down to about 280 Hz. The Cutoff is where the Filter starts to cut; Hz counts vibrations a second, so 280 is low.',
        note: 'Only the bottom of the sound gets through: the bright buzz becomes a dark hum. On the Filter Spectrum, the high lines are gone.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'choice', id: 'filterSlope', to: 24,
        say: 'Choose the Filter’s 24 dB Slope, the steeper one. (dB, decibels, is how loudness is counted.)',
        note: 'Steeper: above the Cutoff, the sound now fades twice as fast. The Filter cuts like a thick blanket instead of a thin sheet.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'resonance', to: 0.35,
        say: 'Raise Resonance to about 35 %. Resonance lifts the pitches right at the Cutoff.',
        note: 'A small bump rises on the dashed line, the Filter’s shape, at the Cutoff. The Harmonics there get a lift: a little bite.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'filterEnvAmount', to: 2.5,
        say: 'The Filter has an Envelope too, a shape over time that opens and closes it on every Note. Set its Amount, how far it opens, to +2.5 octaves.',
        note: 'Now each Note flings the Filter open, then lets it close again. Play one and watch the dashed line jump up and fall back on the Filter Spectrum.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'filterAttack', to: 0.002,
        say: 'Its Attack is how fast it opens. Pull it almost to the bottom, about 2 ms, two thousandths of a second.',
        note: 'Instant: each Note starts bright.',
      },
      {
        kind: 'param', id: 'filterDecay', to: 0.18,
        say: 'Its Decay is how fast it closes back down. Make it short, about 180 ms.',
        note: 'The brightness falls away quickly. That fall is the thump.',
      },
      {
        kind: 'param', id: 'filterSustain', to: 0.15,
        say: 'Its Sustain is where it settles while you hold a Note. Lower it to about 15 %.',
        note: 'Hold a Note: a thump, then a dark tone underneath.',
      },
      {
        kind: 'param', id: 'filterRelease', to: 0.15,
        say: 'Its Release is how long it takes to close once you let go. Shorten it to about 150 ms.',
        note: 'Let go, and the Filter shuts quickly too.',
      },
      {
        kind: 'param', id: 'ampAttack', to: 0.002,
        say: 'Now the Amp’s own Envelope, for loudness. Pull its Attack almost to the bottom, about 2 ms.',
        note: 'Each Note starts at full level, right on the Filter’s thump.',
      },
      {
        kind: 'param', id: 'ampSustain', to: 0.8,
        say: 'Raise the Amp’s Sustain to 80 %.',
        note: 'Held Notes stay loud: the bass keeps its weight under the thump.',
      },
      {
        kind: 'param', id: 'ampRelease', to: 0.12,
        say: 'Shorten the Amp’s Release to about 120 ms.',
        note: 'Notes stop as soon as you let go: tight, as a bass line needs. The Amp Scope shows each one end.',
        viewer: 'Amp Scope',
      },
    ],
  },
  {
    preset: 'Acid',
    intro: 'A squelchy, talking bass, the sound of acid house. A sharp peak in the Filter, the sound’s tone knob, sweeps up and down on every Note, so each one goes “yow”, and the Notes slide into each other.',
    teaches: 'a talking bass, with a peak that sweeps and Notes that slide',
    bpm: 124,
    phrase: 'A2:.5 A2:.5@0.5 A3:.5 A2:.5@0.5 C3:.5 A2:.5@0.5 G2:.5 A2:.5 A2:.5 A3:.5@0.5 G3:.5 A2:.5@0.5 E3:.5 D3:.5@0.5 C3:.5 G2:.5',
    summary: 'Your acid line: a dark, steep Filter with a tall peak, swept open by every Note, harder Notes opening it further, and each Note sliding into the next.',
    steps: [
      {
        kind: 'choice', id: 'filterSlope', to: 24,
        say: 'Choose the Filter’s 24 dB Slope, the steeper one. (dB, decibels, is how loudness is counted.)',
        note: 'Steeper: the Filter now cuts the highs twice as fast. Acid needs that sharp edge.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'action', id: 'snapshot',
        say: 'Play a Note or press Listen, then take a Snapshot in Display, a faint copy of the pictures to compare with.',
        note: 'The pictures now keep a faint trace of this bright saw. Every change from here shows against it.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'cutoff', to: 250,
        say: 'Turn the Cutoff down to about 250 Hz. The Cutoff is where the Filter starts to cut; Hz counts vibrations a second, so 250 is low.',
        note: 'The saw goes dark. A Note is a stack of pitches, its Harmonics, and the Filter Spectrum draws each as a line: only the first few are left. The faint trace shows what was taken away.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'resonance', to: 0.8,
        say: 'Raise Resonance to about 80 %. Resonance lifts the pitches right at the Cutoff.',
        note: 'A tall peak rises at the Cutoff, and the Harmonics there ring out: the squelchy, talking heart of acid.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'filterEnvAmount', to: 3.5,
        say: 'The Filter has an Envelope too, a shape over time that opens and closes it on every Note. Set its Amount, how far it opens, to +3.5 octaves (an octave doubles the pitch).',
        note: 'Each Note now sweeps the peak up and back down: a “yow” on every Note. Watch it run along the Filter Spectrum.',
        viewer: 'Filter Spectrum',
      },
      // Issue 190, decision 3: the Envelope's four faders in one Step, the drill met in Bass.
      {
        kind: 'params', faders: [{ id: 'filterAttack', to: 0.001 }, { id: 'filterDecay', to: 0.15 }, { id: 'filterSustain', to: 0.05 }, { id: 'filterRelease', to: 0.1 }],
        say: 'Now its Envelope’s four faders, in one Step. Attack, how fast it opens: all the way down. Decay, how fast it closes back: about 150 ms, thousandths of a second. Sustain, where it settles while you hold a Note: about 5 %. Release, once you let go: about 100 ms.',
        note: 'A sharp start, a quick drop, the Filter nearly shut while held: each Note is a single, snappy “yow”, and letting go closes it quickly too.',
      },
      {
        kind: 'param', id: 'velocityCutoff', to: 0.5,
        say: 'Raise the Filter’s Velocity to 50 %. Velocity is how hard you play a Note.',
        note: 'Harder Notes now open the Filter further. Listen plays every other Note softer: those come out darker.',
      },
      {
        kind: 'param', id: 'glide', to: 0.06,
        say: 'In the Amp, the stage that sets how loud, set Glide to about 60 ms. Glide makes each Note slide into the next.',
        note: 'Each Note now slides from the last one’s pitch: the acid slide. Watch the pitch dot glide along the piano.',
      },
      {
        kind: 'param', id: 'ampAttack', to: 0.001,
        say: 'The Amp has an Envelope too, for loudness. Pull its Attack all the way down.',
        note: 'Notes start at full level, at once.',
      },
      {
        kind: 'param', id: 'ampSustain', to: 0.9,
        say: 'Raise the Amp’s Sustain to 90 %.',
        note: 'Held Notes keep their level: the Filter, not the Amp, shapes each Note now.',
      },
      {
        kind: 'param', id: 'ampRelease', to: 0.08,
        say: 'Shorten the Amp’s Release to about 80 ms.',
        note: 'Notes stop the moment they end: a tight, bouncy line.',
      },
      {
        kind: 'param', id: 'volume', to: 0.6,
        say: 'Last, turn the Amp’s Volume down to 60 %.',
        note: 'A resonant peak is loud. At 60 % this line plays about as loud as the other basses, with room to spare.',
      },
    ],
  },
  {
    preset: 'Pluck',
    intro: 'A plucked string, like a harp or a guitar. You will make a Note that fades away by itself even while you hold it, then give it a bright flash at the start that darkens as it dies.',
    teaches: 'a Note that fades by itself, like a plucked string',
    bpm: 120,
    phrase: 'C4:.5 E4:.5 G4:.5 C5:.5 G4:.5 E4:.5 C4:1 A3:.5 C4:.5 E4:.5 A4:.5 E4:.5 C4:.5 A3:1',
    summary: 'Your pluck: a pulse that fades away by itself even while held, through a Filter that flashes open at every Note and darkens as it dies.',
    steps: [
      {
        kind: 'choice', id: 'waveform', to: 'pulse',
        say: 'Osc 1 is the Oscillator that makes the sound. Make it a Pulse.',
        note: 'A Note is a stack of pitches, its Harmonics, and the Oscillator Spectrum draws each as a line. Look: a Pulse leaves gaps in the row, every fourth line missing.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'param', id: 'pulseWidth', to: 0.3,
        say: 'Set Pulse Width, how long each pulse stays up, to 30 %.',
        note: 'The gaps in the Oscillator Spectrum move closer together, and the tone gets a little fuller.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'param', id: 'ampSustain', to: 0,
        say: 'The Amp sets how loud, with an Envelope, a shape over time for every Note. Pull its Sustain, the level a held Note keeps, all the way down.',
        note: 'Hold a Note: it fades away by itself, even while held. The Amp Scope, the picture of the wave, shows it die out. That fade is a pluck.',
        viewer: 'Amp Scope',
      },
      {
        kind: 'param', id: 'ampDecay', to: 0.45,
        say: 'Its Decay is how long that fade takes. Set it to about 450 ms, thousandths of a second: nearly half a second.',
        note: 'The fade lasts a little longer: a string rather than a click.',
      },
      {
        kind: 'param', id: 'ampAttack', to: 0.001,
        say: 'Its Attack is how fast a Note rises. Pull it all the way down.',
        note: 'Each Note starts at its loudest, as a plucked string does.',
      },
      {
        kind: 'param', id: 'ampRelease', to: 0.3,
        say: 'Its Release is how long a Note rings once you let go. Shorten it to about 300 ms.',
        note: 'Let go early and the Note still rings on briefly, then stops.',
      },
      {
        kind: 'choice', id: 'filterSlope', to: 24,
        say: 'Now the Filter, the sound’s tone knob. Choose its 24 dB Slope, the steeper one. (dB, decibels, is how loudness is counted.)',
        note: 'Steeper: the Filter now cuts the highs twice as fast, ready to muffle the pluck.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'cutoff', to: 220,
        say: 'Turn the Cutoff down to about 220 Hz. The Cutoff is where the Filter starts to cut; Hz counts vibrations a second, so 220 is low.',
        note: 'Muffled: hardly any Harmonics get through. Soon an Envelope will open it for each Note.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'resonance', to: 0.5,
        say: 'Raise Resonance, a lift right at the Cutoff, to 50 %.',
        note: 'A peak at the Cutoff gives a hollow, woody colour.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'filterEnvAmount', to: 4,
        say: 'The Filter has an Envelope too, opening and closing it on every Note. Set its Amount, how far it opens, to +4 octaves, the pitch doubled four times over.',
        note: 'Each Note now flashes bright, then darkens: on the Filter Spectrum the lines flash up and vanish.',
        viewer: 'Filter Spectrum',
      },
      // Issue 190, decision 3: the Envelope's four faders in one Step, the drill met in Bass.
      {
        kind: 'params', faders: [{ id: 'filterAttack', to: 0.001 }, { id: 'filterDecay', to: 0.22 }, { id: 'filterSustain', to: 0 }, { id: 'filterRelease', to: 0.2 }],
        say: 'Now the Filter Envelope’s four faders, in one Step. Attack, how fast it opens: all the way down. Decay, how fast it closes back: about 220 ms. Sustain, where it settles while you hold a Note: all the way down. Release, once you let go: about 200 ms.',
        note: 'The flash comes at the very start, then fades faster than the loudness, nearly shut on a held Note: the Note darkens as it dies, like a real string.',
      },
    ],
  },
  {
    preset: 'Wobble',
    intro: 'A wobble bass, the “wub wub” of dubstep. An LFO, a slow invisible hand, opens and closes the Filter, the sound’s tone knob, three times a second; then you tie it to the beat, and it starts over on every Note.',
    teaches: 'an LFO, a slow hand that turns a knob for you',
    bpm: 120,
    phrase: 'A2:2 A2:1 C3:1 F2:2 G2:2',
    summary: 'Your wobble: a square an octave down, a steep Filter with a peak, and an LFO sweeping it three times every two beats, tied to the tempo and starting over on every Note.',
    steps: [
      {
        kind: 'param', id: 'mixOsc2', to: 0.6,
        say: 'Osc 2 is the second Oscillator, the one that makes a second sound. In the Mixer, where each one gets its level, raise it to 60 %.',
        note: 'More weight, same colour: Osc 2 is a second saw on the same Note, so its Harmonics, the stack of pitches a Note is made of, land on Osc 1’s.',
      },
      {
        kind: 'choice', id: 'osc2Waveform', to: 'square',
        say: 'Make Osc 2 a Square.',
        note: 'Hollower: a square keeps only every other Harmonic. The Oscillator Scope, the picture of the wave, shows its new shape.',
        viewer: 'Oscillator Scope',
      },
      {
        kind: 'param', id: 'osc2Octave', to: -1,
        say: 'Set Osc 2’s Octave to −1: an octave down, half the pitch.',
        note: 'Now the bass has a floor to stand on. On the Oscillator Spectrum, a line for each Harmonic, new lines fill in below and between Osc 1’s.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'choice', id: 'filterSlope', to: 24,
        say: 'Choose the Filter’s 24 dB Slope, the steeper one. (dB, decibels, is how loudness is counted.)',
        note: 'Steeper: the Filter now cuts the highs twice as fast, so the wobble will come out bold.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'cutoff', to: 300,
        say: 'Turn the Cutoff down to about 300 Hz. The Cutoff is where the Filter starts to cut; Hz counts vibrations a second, so 300 is low.',
        note: 'Dark: only the lowest Harmonics get through. The LFO will open it.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'resonance', to: 0.65,
        say: 'Raise Resonance, a lift right at the Cutoff, to about 65 %.',
        note: 'A peak at the Cutoff: when it moves, you will hear it talk.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'lfoAmount', to: 0.7,
        say: 'In LFO 1, raise Depth, how far it swings, to 70 %. It is already aimed at the Cutoff.',
        note: 'The Filter now sweeps up and down by itself: the wobble. The ring around the Cutoff knob shows how far it moves.',
      },
      {
        kind: 'param', id: 'lfoRate', to: 3,
        say: 'Set LFO 1’s Rate, how fast it swings, to 3 Hz: three times a second.',
        note: 'Faster: three wobbles a second. Watch the LFO’s plot and the Cutoff’s ring keep time.',
      },
      // Issue 137: Sync, the wobble locked to Listen's beat, then the note value that sounds as the 3 Hz did.
      {
        kind: 'choice', id: 'lfoSync', to: 'on',
        say: 'Switch on LFO 1’s Sync, the switch with a note on it. Sync ties the Rate to the tempo, the beats per minute (BPM) the music counts in.',
        note: 'The Rate now counts in beats, not seconds: 1/4, one wobble on every beat. Press Listen: each “wub” lands on the loop’s beat, at its 120 BPM, and at another tempo it would follow.',
      },
      {
        kind: 'param', id: 'lfoNote', to: noteIndex('1/4 T'),
        say: 'Turn the Rate to 1/4 T, a triplet, three wobbles in the time of two beats.',
        note: 'At 120 BPM that is three a second again, the speed you set by hand, but held to the beat: every second beat, a wobble starts right on it.',
      },
      {
        kind: 'choice', id: 'lfoRetrigger', to: 'note',
        say: 'Switch on LFO 1’s Retrigger, so every Note starts the wobble over.',
        note: 'Each Note now starts its wobble from the same point, even one that comes in mid-wobble. Watch the Envelope Timeline, the last few seconds drawn left to right, start again at each Note.',
        viewer: 'Envelope Timeline',
      },
      {
        kind: 'param', id: 'ampSustain', to: 1,
        say: 'The Amp sets how loud, with an Envelope, a shape over time for every Note. Raise its Sustain, the level a held Note keeps, all the way.',
        note: 'Held Notes keep their full level: only the LFO moves the sound.',
      },
      {
        kind: 'param', id: 'ampRelease', to: 0.2,
        say: 'Its Release is how long a Note fades once you let go. Shorten it to about 200 ms, thousandths of a second.',
        note: 'Notes stop soon after you let go.',
      },
      {
        kind: 'param', id: 'volume', to: 0.45,
        say: 'Last, turn the Amp’s Volume down to 45 %.',
        note: 'The peak sweeping through the Harmonics is loud. At 45 % the wobble plays about as loud as the other basses.',
      },
    ],
  },
  // Issue 109: FM, Ring, the Sub's choices and the Noise's colour, each on the Preset that shows it off.
  {
    preset: 'FM Ladder',
    intro: 'A bright, buzzy tone from two pure ones. The two Oscillators, which make the sound, start as plain sines; then one, unheard, bends the other’s pitch so fast that a whole new tone appears.',
    teaches: 'FM, one wave bending another’s pitch',
    bpm: 90,
    phrase: 'A3:1.5 C4:.5 E4:2 D4:1.5 C4:.5 A3:2',
    summary: 'Your FM ladder: two sines on the same Note, Osc 2 unheard but bending Osc 1’s pitch, so one line grows into a whole ladder of them, through a wide-open Filter.',
    steps: [
      {
        kind: 'choice', id: 'waveform', to: 'sine',
        say: 'Make Osc 1 a Sine, the purest wave.',
        note: 'A Note is a stack of pitches, its Harmonics, and the Oscillator Spectrum draws each as a line. A sine is just one line, and the Scope draws its smoothest shape. Everything grows out of it.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'choice', id: 'osc2Waveform', to: 'sine',
        say: 'Make Osc 2 a Sine too.',
        note: 'Nothing changes: Osc 2’s fader is down in the Mixer, where each one gets its level. You will hear it only through what it does to Osc 1.',
      },
      {
        kind: 'param', id: 'crossMod', to: 0.5,
        say: 'In Osc 1, turn FM up to 50 %. FM, frequency modulation, lets Osc 2 bend Osc 1’s pitch.',
        note: 'Osc 2 now bends Osc 1’s pitch up and down hundreds of times a second, too fast to hear as a wobble, so it turns into tone. On the Oscillator Spectrum the single line grows a ladder of new ones: a buzz from two pure tones.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'param', id: 'cutoff', to: 20000,
        say: 'Get the Filter, the sound’s tone knob, out of the way. Turn its Cutoff, the point where it starts to cut, all the way up: 20 kHz, 20,000 vibrations a second.',
        note: 'Wide open, the Filter lets every line through: the Filter Spectrum now matches the Oscillator Spectrum, ladder and all.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'resonance', to: 0,
        say: 'Pull Resonance, the lift at the Cutoff, all the way down.',
        note: 'Nothing is lifted any more: the Filter leaves the ladder as it is.',
      },
      {
        kind: 'param', id: 'ampSustain', to: 1,
        say: 'In the Amp, the stage that sets how loud, raise Sustain, the level a held Note keeps, all the way.',
        note: 'Held Notes stay at full level, so the ladder holds still to read.',
      },
    ],
  },
  {
    preset: 'Ring Bell',
    intro: 'A bell, from two pure tones. Multiply them and something odd happens: you hear neither, only two new pitches that do not sit in the usual row. That is what makes metal sound like metal.',
    teaches: 'Ring, two waves multiplied into a bell',
    bpm: 100,
    phrase: 'E4:1 G4:1 A4:2 G4:1 E4:1 D4:2',
    summary: 'Your bell: two sines an octave and three semitones apart, multiplied by Ring with neither heard alone, so only two new, out-of-tune pitches sound, fading slowly as a struck bell does.',
    steps: [
      {
        kind: 'choice', id: 'waveform', to: 'sine',
        say: 'Make Osc 1, the Oscillator that makes the sound, a Sine: the purest wave.',
        note: 'A Note is a stack of pitches, its Harmonics, and the Oscillator Spectrum draws each as a line. A sine is only the first: one line, and the Scope draws its smoothest shape.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'choice', id: 'osc2Waveform', to: 'sine',
        say: 'Make Osc 2 a Sine too.',
        note: 'Nothing to hear yet: Osc 2’s fader is down in the Mixer, where each one gets its level. It will sound only through Ring, which multiplies it with Osc 1.',
      },
      {
        kind: 'param', id: 'osc2Octave', to: 1,
        say: 'Set Osc 2’s Octave to +1: an octave up, double the pitch.',
        note: 'Still silent: Osc 2 waits an octave above the Note, ready for Ring.',
      },
      {
        kind: 'param', id: 'mixRing', to: 1,
        say: 'In the Mixer, raise Ring all the way. Ring multiplies the two waves.',
        note: 'Two new pitches appear, one above Osc 2 and one below: on the Oscillator Spectrum, a new line further up the row, and another right on top of Osc 1’s.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'param', id: 'osc2Semitone', to: 3,
        say: 'Move Osc 2’s Semitone to +3, three piano keys up.',
        note: 'The small numbers along the Oscillator Spectrum’s top mark where each Harmonic belongs: 2 at twice the Note’s pitch, 3 at three times. The two new pitches slide off them and land in between. That is what makes metal sound like metal: the tone turns into a bell.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'param', id: 'mixOsc1', to: 0,
        say: 'Pull Osc 1 all the way down in the Mixer.',
        note: 'Ring still sounds: it needs the two waves, not their faders. Osc 1’s line goes from the Oscillator Spectrum, and only the two new pitches are left, an out-of-tune pair that rings like a bell. Quieter, too: two sines multiplied are softer than either alone.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'param', id: 'cutoff', to: 20000,
        say: 'Open the Filter, the sound’s tone knob, all the way: its Cutoff, the point where it starts to cut, up to 20 kHz, 20,000 vibrations a second.',
        note: 'Wide open: the Filter Spectrum now shows the bell’s two pitches just as the Oscillator Spectrum does.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'resonance', to: 0,
        say: 'Pull Resonance, the lift at the Cutoff, all the way down.',
        note: 'No lift anywhere now: the bell comes through untouched.',
      },
      {
        kind: 'param', id: 'ampSustain', to: 0,
        say: 'The Amp sets how loud, with an Envelope, a shape over time for every Note. Pull its Sustain, the level a held Note keeps, all the way down.',
        note: 'Each Note now fades away by itself, even while held: struck, not bowed. The Amp Scope, the picture of the wave, shows it die out.',
        viewer: 'Amp Scope',
      },
      {
        kind: 'param', id: 'ampDecay', to: 1.8,
        say: 'Its Decay is how long that fade takes. Set it to about 1.8 s.',
        note: 'The fade lasts almost two seconds: the long ring of a bell.',
      },
      {
        kind: 'param', id: 'ampRelease', to: 1.8,
        say: 'Its Release is how long a Note rings once you let go. Set it to about 1.8 s too.',
        note: 'Let go early, and the bell still rings on.',
      },
    ],
  },
  {
    preset: 'Deep Breath',
    intro: 'A deep, round hum with a breath of air on top. Osc 1, the Oscillator that makes the sound, plays a saw; under it goes a very low sine, and over it a soft Noise, a hiss like wind.',
    teaches: 'weight from a Sub below, air from a hiss of Noise',
    bpm: 80,
    phrase: 'A3:1.5 C4:.5 D4:2 E4:1.5 D4:.5 C4:2',
    summary: 'Your deep breath: a saw over a sine Sub two octaves down, and a breath of Pink Noise filling the gaps between the lines, through a wide-open Filter.',
    steps: [
      {
        kind: 'param', id: 'mixSub', to: 0.8,
        say: 'The Sub is an extra wave below Osc 1. In the Mixer, where each one gets its level, raise it to 80 %.',
        note: 'Weight under the saw: the Sub is a square an octave below, at half the pitch. A Note is a stack of pitches, its Harmonics, and the Oscillator Spectrum draws each as a line: the row now starts an octave lower.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'choice', id: 'subOctave', to: -2,
        say: 'On the Sub & Noise tab, set the Sub’s Octave to −2: two octaves down, a quarter of the pitch.',
        note: 'Deeper still. The Oscillator Spectrum now counts from the Sub’s much lower pitch: the small numbers along its top mark where each Harmonic belongs, 2 at twice that pitch, 3 at three times. The Sub’s square fills every other place, Osc 1 every fourth, and some places stay empty.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'choice', id: 'subWaveform', to: 'sine',
        say: 'Make the Sub a Sine.',
        note: 'The Sub’s buzz goes: one clean line far left in the Oscillator Spectrum, a deep, round weight.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'param', id: 'mixNoise', to: 0.3,
        say: 'In the Mixer, raise Noise, a hiss with no pitch at all, to 30 %.',
        note: 'A hiss over the tone. This Noise is White, as strong at every pitch: in the Oscillator Spectrum it fills the gaps between the lines, a floor that runs level across.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'choice', id: 'noiseColour', to: 'pink',
        say: 'On the Sub & Noise tab, switch the Noise’s Colour to Pink, a softer, darker hiss.',
        note: 'The hiss softens into a rush, like breath or distant surf. Pink is White with the high hiss turned down: the Oscillator Spectrum’s floor tilts down to the right. Overall it is as loud as the White was.',
        viewer: 'Oscillator Spectrum',
      },
      {
        kind: 'param', id: 'cutoff', to: 20000,
        say: 'The Filter, the sound’s tone knob, is next. Turn its Cutoff, the point where it starts to cut, right up to 20 kHz, 20,000 vibrations a second.',
        note: 'Wide open: on the Filter Spectrum the Noise’s floor and every line come through, just as on the Oscillator Spectrum.',
        viewer: 'Filter Spectrum',
      },
      {
        kind: 'param', id: 'resonance', to: 0,
        say: 'Pull Resonance, the lift at the Cutoff, all the way down.',
        note: 'Nothing lifted, nothing cut: the breath comes through as it is.',
      },
      {
        kind: 'param', id: 'ampSustain', to: 1,
        say: 'In the Amp, the stage that sets how loud, raise Sustain, the level a held Note keeps, all the way.',
        note: 'Held Notes stay at full level: the hum holds steady, and so does the picture.',
      },
    ],
  },
];

/** The Tutorial after this one in the menu's order, which its end card's button starts (issue 190, decision 1). */
export const nextTutorial = (tutorial: Tutorial): Tutorial | undefined => TUTORIALS[TUTORIALS.indexOf(tutorial) + 1];

/** The end card's last line: the next Tutorial and what it teaches, or that this one was the last (decision 8). */
export function endLine(tutorial: Tutorial): string {
  const next = nextTutorial(tutorial);
  return next
    ? `Next comes ${next.preset}: ${next.teaches}.`
    : 'That was the last Tutorial. The synth is yours now: start from Init and make a sound of your own.';
}

export const tutorialFor = (preset: string): Tutorial | undefined => TUTORIALS.find((t) => t.preset === preset);
