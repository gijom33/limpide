import type { ParamId, Patch } from '../patch/patch';
import type { ChangeBy } from '../patch/patchStore';

/** The mascot's answers to a control turned (issue 115). */
export type Gesture =
  | 'brighter' // walks right
  | 'darker' // walks left
  | 'higher' // hops up
  | 'lower' // crouches
  | 'taller' // stretches up
  | 'shorter' // squashes down
  | 'rougher' // shivers
  | 'louder' // splashes
  | 'quieter' // winces, eyes shut
  | 'twirl' // wiggles
  | 'slide' // slides along without stepping
  | 'look' // glances aside
  | 'perform' // with nothing played for a while, a funny turn; else a glance
  | 'new'; // a Preset loaded: an excited hop

/** Each knob and fader's answer: one gesture either way, or one for up and one for down. */
const ANSWERS: Record<ParamId, Gesture | readonly [up: Gesture, down: Gesture]> = {
  cutoff: ['brighter', 'darker'],
  filterEnvAmount: ['brighter', 'darker'],
  keyTrack: ['brighter', 'darker'],
  velocityCutoff: ['brighter', 'darker'],
  osc1Octave: ['higher', 'lower'],
  osc2Octave: ['higher', 'lower'],
  osc2Semitone: ['higher', 'lower'],
  osc2EnvAmount: ['higher', 'lower'],
  pulseWidth: ['taller', 'shorter'],
  osc2PulseWidth: ['taller', 'shorter'],
  ampAttack: ['taller', 'shorter'],
  ampDecay: ['taller', 'shorter'],
  ampSustain: ['taller', 'shorter'],
  ampRelease: ['taller', 'shorter'],
  filterAttack: ['taller', 'shorter'],
  filterDecay: ['taller', 'shorter'],
  filterSustain: ['taller', 'shorter'],
  filterRelease: ['taller', 'shorter'],
  resonance: 'rougher',
  crossMod: 'rougher',
  osc2Detune: 'rougher',
  mixRing: 'rougher',
  mixNoise: 'rougher',
  volume: ['louder', 'quieter'],
  mixOsc1: ['louder', 'quieter'],
  mixOsc2: ['louder', 'quieter'],
  mixSub: ['louder', 'quieter'],
  lfoRate: 'twirl',
  lfoAmount: 'twirl',
  lfo2Rate: 'twirl',
  lfo2Amount: 'twirl',
  glide: 'slide',
};

/**
 * What the mascot does when the Patch changes (issue 115), by hand, a Controller, the Demo or a Tutorial: each knob or
 * fader moved its own way, a glance for a choice (a Waveform, a Mode, a Destination), a funny turn on cue for the
 * Filter's Slope, an excited hop for a Preset loaded. The keyboard octave the octave buttons write is not a sound: nothing.
 */
export function gesturesOf(before: Patch, after: Patch, by: ChangeBy): Gesture[] {
  if (by === 'load') return ['new'];
  const gestures = new Set<Gesture>();
  for (const field of Object.keys(after) as (keyof Patch)[]) {
    if (before[field] === after[field] || field === 'keyboardOctave') continue;
    const answer = ANSWERS[field as ParamId];
    // The Filter's Slope cues a funny turn (the owner's, 2026-10-30).
    if (field === 'filterSlope') gestures.add('perform');
    else if (answer === undefined) gestures.add('look');
    else if (typeof answer === 'string') gestures.add(answer);
    else gestures.add((after[field] as number) > (before[field] as number) ? answer[0] : answer[1]);
  }
  return [...gestures];
}
