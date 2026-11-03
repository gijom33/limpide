import { startingOctave } from '../input/keyboardLayout';
import { destinationSwings, effectiveCutoff } from '../modulation/modulationModel';
import type { Waveform } from '../music/harmonics';
import { noteToFrequency } from '../music/pitch';
import { TEMPO } from '../music/tempo';
import { type Lfo, lfoHz, lfos, osc2Heard, type Patch } from './patch';

/**
 * A Patch in plain words (issue 123): one short phrase, written by rules from the Patch, naming what matters most in
 * the sound: its source, the Filter's character, the Amp Envelope's shape and an LFO's motion ("two detuned saws,
 * filtered low, opening on each Note"). Each word stands on a threshold the engine bears out, so it never claims what
 * the sound does not do: the Filter is named only where it cuts Harmonics the source has, an LFO only where its Depth
 * moves something heard. At most `MAX_WORDS` words: the least telling parts give way first.
 */
export function describePatch(patch: Patch, bpm: number = TEMPO.default): string {
  const silent = silence(patch);
  if (silent) return silent;
  const sound = soundOf(patch);
  const parts = [...filterParts(patch, sound), ...envelopeParts(patch), ...motionParts(patch, sound, bpm)].sort((a, b) => a.order - b.order);
  const [source, ...kept] = withinWords(sourceForms(patch, sound), parts);
  // The first LFO heard reads "with …" after a comma, any other "and …" after a space.
  let motions = 0;
  return kept.reduce((phrase, part) => {
    if (!part.lfo) return `${phrase}, ${part.words}`;
    return motions++ === 0 ? `${phrase}, with ${part.words}` : `${phrase} and ${part.words}`;
  }, source);
}

/** The most words the phrase takes. */
export const MAX_WORDS = 12;

/** A part of the phrase after its source: its words, where it reads (`order`) and how telling it is (`rank`, 1 the most). */
interface Part {
  words: string;
  order: number;
  rank: number;
  /** An LFO's motion, its words read after "with" or "and" (issue 196: told apart by this, not by its text). */
  lfo?: true;
}

/** The least a Mixer level must be for its source to be named: −20 dB, heard beside the others. */
const HEARD = 0.1;
/** The Noise is heard lower, as a hiss over the tones: −28 dB. */
const NOISE_HEARD = 0.04;
/** Resonance from here up is named: a peak you hear at the Cutoff. */
const RESONANT = 0.6;
/** Resonance at its top (98 % and up): the Filter self-oscillates. */
const SINGING = 0.98;
/** FM from here up is named: an index of 0.12, its first sidebands about −25 dB. */
const FM_HEARD = 0.03;

/** What the Patch sounds from, as the rules below read it. */
interface Sound {
  /** Osc 1 and Osc 2 mixed in on their own faders, Ring, the Sub and the Noise, each at its `floor`. */
  osc1: boolean;
  osc2: boolean;
  ring: boolean;
  sub: boolean;
  noise: boolean;
  /** FM, while Osc 1 is named: it moves Osc 1 alone. */
  fm: boolean;
  /** Whether the sound has Harmonics or partials for a Filter to shape: a waveform other than a sine, FM, Ring, Noise. */
  rich: boolean;
  /** The lowest tone's fundamental on the Note the rules hear (`referenceNote`), in Hz: what the Filter is measured against. */
  fundamental: number;
  /** The Note the rules hear, in MIDI numbering. */
  note: number;
}

/**
 * The Note the rules hear: the G in the middle of the keys the Patch opens on (its keyboard octave, C4 by default), so a
 * bass is heard where it is played. Key Track moves the Cutoff from it as the engine does.
 */
const referenceNote = (patch: Patch) => 12 * (startingOctave(patch) + 1) + 7;
const hz = noteToFrequency;

function soundOf(patch: Patch): Sound {
  // Where every source is quieter than heard beside others, the ones up are what is heard.
  const levels = [patch.mixOsc1, patch.mixOsc2, patch.mixRing, patch.mixSub];
  const quiet = levels.every((l) => l < HEARD) && patch.mixNoise < NOISE_HEARD;
  const [floor, noiseFloor] = quiet ? [Number.MIN_VALUE, Number.MIN_VALUE] : [HEARD, NOISE_HEARD];
  const osc1 = patch.mixOsc1 >= floor;
  const osc2 = patch.mixOsc2 >= floor;
  const ring = patch.mixRing >= floor;
  const sub = patch.mixSub >= floor;
  const noise = patch.mixNoise >= noiseFloor;
  const fm = patch.crossMod >= FM_HEARD && (osc1 || ring);
  const note = referenceNote(patch);
  const osc2Shift = patch.osc2Octave + patch.osc2Semitone / 12;
  // Osc 1's, or Osc 2's when it alone is mixed in, or the Sub's when it is the only tone.
  const tonal = osc1 || osc2 || ring;
  const fundamental = hz(note) * 2 ** (osc1 || !osc2 ? patch.osc1Octave + (tonal ? 0 : patch.subOctave) : osc2Shift);
  const rich =
    (osc1 && patch.waveform !== 'sine') ||
    (osc2 && patch.osc2Waveform !== 'sine') ||
    (sub && patch.subWaveform === 'square') ||
    ring ||
    fm ||
    patch.mixNoise >= HEARD;
  return { osc1, osc2, ring, sub, noise, fm, rich, fundamental, note };
}

/** No sound at all: every source down, or the Volume. */
function silence(patch: Patch): string | null {
  if (patch.volume === 0) return 'silent: the Volume is down';
  const any = patch.mixOsc1 > 0 || patch.mixOsc2 > 0 || patch.mixRing > 0 || patch.mixSub > 0 || patch.mixNoise > 0;
  return any ? null : 'silent: every Mixer fader is down';
}

// ---- The source ----

const article = (word: string) => (/^[aeiou]/.test(word) ? 'an' : 'a');
const one = (word: string) => `${article(word)} ${word}`;
/** A waveform's plain name: a pulse 20 % wide or less (or 80 % or more) a thin one. */
const waveName = (waveform: Waveform, width: number) => (waveform === 'pulse' && (width <= 0.2 || width >= 0.8) ? 'thin pulse' : waveform);
const plural = (word: string) => `${word}${word.endsWith('s') ? 'es' : 's'}`;

const INTERVALS: Record<number, string> = {
  1: 'a semitone', 2: 'a tone', 3: 'a minor third', 4: 'a major third', 5: 'a fourth', 6: 'a tritone', 7: 'a fifth',
  8: 'a minor sixth', 9: 'a major sixth', 10: 'a minor seventh', 11: 'a major seventh', 12: 'an octave', 19: 'a twelfth',
  24: 'two octaves', 36: 'three octaves',
};
const interval = (semitones: number) => INTERVALS[Math.abs(semitones)] ?? `${Math.abs(semitones)} semitones`;
/** Detune from here up is named: two Oscillators a few cents apart beat, slowly at 2 cents. */
const DETUNED = 2;

/**
 * The source in its forms, the fullest first, each shorter than the one before: the two Oscillators and how they
 * stand to each other, FM or Ring when up, then the Sub and the Noise.
 */
function sourceForms(patch: Patch, sound: Sound): string[] {
  const w1 = waveName(patch.waveform, patch.pulseWidth);
  const w2 = waveName(patch.osc2Waveform, patch.osc2PulseWidth);
  // Osc 2 against Osc 1, in semitones (each Oscillator's Octave counts from the Note), and its Detune.
  const apart = 12 * (patch.osc2Octave - patch.osc1Octave) + patch.osc2Semitone;
  const detuned = Math.abs(patch.osc2Detune) >= DETUNED;
  const bright = brightSource(patch, sound);
  const { osc1, osc2 } = sound;

  // The Oscillators, fullest first; `alone`, the louder of two said alone, the last to give way.
  let cores: string[];
  let alone: string | null = null;
  if (osc1 && osc2) {
    // The louder leads; the other is said against it.
    const [lead, other, by] = patch.mixOsc1 >= patch.mixOsc2 ? [w1, w2, apart] : [w2, w1, -apart];
    if (lead === other) {
      const both = `two ${detuned && by === 0 ? 'detuned ' : ''}${bright ? 'bright ' : ''}${plural(lead)}`;
      cores = by === 0 ? [both] : [`${both} ${interval(by)} apart`, both];
    } else {
      const head = one(`${bright ? 'bright ' : ''}${lead}`);
      // Not a sine: the Filter's words, said of the Harmonics, would then fall on a sine.
      if (lead !== 'sine') alone = head;
      if (by === 0) cores = [`${head} with ${one(`${detuned ? 'detuned ' : ''}${other}`)}`, `${head} with ${one(other)}`];
      else cores = [`${head} with ${one(other)} ${interval(by)} ${by > 0 ? 'up' : 'down'}`, `${head} with ${one(other)} ${by > 0 ? 'above' : 'below'}`];
    }
  } else if (osc1 || osc2) {
    const lead = osc1 ? w1 : w2;
    // Pure: nothing beside it with Harmonics of its own.
    const pure = lead === 'sine' && !sound.fm && !sound.ring && !sound.noise && !(sound.sub && patch.subWaveform === 'square');
    cores = [one(`${pure ? 'pure ' : bright ? 'bright ' : ''}${lead}`)];
  } else if (sound.ring) {
    cores = [w1 === w2 ? `two ${plural(w1)} through Ring` : `${one(w1)} times ${one(w2)}`];
  } else cores = [];

  // FM and Ring beside what is mixed in.
  const adds: string[] = [];
  if (sound.fm && cores.length) adds.push(patch.crossMod < 0.2 ? 'a little FM' : 'FM');
  else if (sound.fm) cores = [one(`${w1} swung by FM`)];
  if (sound.ring && (osc1 || osc2)) adds.push('Ring');
  const join = (core: string, more: string[]) => (more.length ? `${core}${core.includes(' with ') ? ' and ' : ' with '}${more.join(' and ')}` : core);
  cores = cores.map((core) => join(core, adds));
  if (alone) alone = join(alone, adds);

  // The Sub and the Noise, the quieter extras: said last, and the first to go.
  const sub = sound.sub ? (patch.subOctave === -2 ? 'a deep Sub' : 'a Sub') : null;
  const colour = patch.noiseColour === 'pink' ? 'pink ' : '';
  const noise = sound.noise ? (patch.mixNoise < 0.2 ? `a breath of ${colour}Noise` : `${colour}Noise`) : null;
  if (!cores.length) {
    // Nothing tonal but the Sub, or the Noise.
    const only = sub ? one(`${patch.subWaveform} Sub${patch.subOctave === -2 ? ' two octaves down' : ''}`) : `${colour}Noise`;
    const rest = sub && noise ? [noise] : [];
    return [join(only, rest), only];
  }
  const extras = [sub, noise].filter((e): e is string => !!e);
  const forms: string[] = [];
  for (const core of cores) forms.push(join(core, extras));
  const shortest = cores[cores.length - 1];
  if (noise && sub) forms.push(join(shortest, [sub]));
  if (extras.length) forms.push(shortest);
  if (alone) forms.push(alone);
  return [...new Set(forms)];
}

/** The Filter wide open on a saw, a square or a pulse: every Harmonic up to the 20th through. */
function brightSource(patch: Patch, sound: Sound) {
  const waves = [sound.osc1 && patch.waveform, sound.osc2 && patch.osc2Waveform].filter(Boolean);
  if (!waves.length || waves.some((w) => w === 'sine' || w === 'triangle')) return false;
  return patch.filterMode === 'lowpass' && heldCutoff(patch, sound) / sound.fundamental >= 20 && patch.resonance < RESONANT;
}

// ---- The Filter ----

/** The Cutoff while a Note is held at the Filter Envelope's Sustain, softly played, on the Note the rules hear. */
const heldCutoff = (patch: Patch, sound: Sound) => effectiveCutoff(patch, patch.filterSustain, [], 0, sound.note);
/** A frequency as a count of the sound's Harmonics: how many lie under it. */
const harmonicsAt = (frequency: number, sound: Sound) => frequency / sound.fundamental;

function filterParts(patch: Patch, sound: Sound): Part[] {
  if (!sound.rich) return []; // a sine has no Harmonics to shape
  const parts: Part[] = [];
  const h = harmonicsAt(heldCutoff(patch, sound), sound); // how many Harmonics lie under the Cutoff, about
  const resonant = patch.resonance >= RESONANT;
  const level = (words: string) => parts.push({ words, order: 1, rank: 1 });
  switch (patch.filterMode) {
    case 'lowpass':
      // Resonance all the way up: the Filter sings a tone of its own at the Cutoff (the Self-Oscillation Preset).
      if (patch.resonance >= SINGING) level('through a singing Filter');
      else if (h < 1.5) level(resonant ? 'through a very low resonant Filter' : 'muffled');
      else if (h < 4) level(resonant ? 'through a low resonant Filter' : 'filtered low');
      else if (h < 10) level(resonant ? 'through a resonant Filter' : 'softly filtered');
      break;
    case 'highpass':
      if (h > 1.5) level('thinned by a high-pass');
      break;
    case 'bandpass':
      level(patch.resonance >= 0.5 ? 'through a narrow band-pass' : 'through a band-pass');
      break;
    case 'notch':
      if (h > 0.7 && h < 30) level('through a notch');
      break;
  }
  const shaping = patch.filterMode !== 'highpass' && patch.filterMode !== 'notch';
  // The Filter Envelope: an octave or more between the strike and the Sustain, where the Harmonics are.
  const swing = patch.filterEnvAmount * (1 - patch.filterSustain);
  if (shaping && swing >= 1 && h < 10) parts.push({ words: patch.filterAttack >= 0.3 ? 'opening slowly on each Note' : 'opening on each Note', order: 2, rank: 2 });
  const struck = harmonicsAt(effectiveCutoff(patch, 1, [], 0, sound.note), sound);
  if (shaping && swing <= -1 && struck < 10) parts.push({ words: 'opening after each strike', order: 2, rank: 2 });
  // Velocity: the hardest hit opens it by up to 2 octaves at full amount.
  if (shaping && patch.velocityCutoff >= 0.25 && h < 10) parts.push({ words: 'brighter played harder', order: 3, rank: 4 });
  return parts;
}

// ---- The Amp Envelope ----

function envelopeParts(patch: Patch): Part[] {
  const { ampAttack: attack, ampDecay: decay, ampSustain: sustain, ampRelease: release } = patch;
  const parts: Part[] = [];
  const shape = (words: string, rank = 2) => parts.push({ words, order: 4, rank });
  if (attack >= 1) shape('a slow swell');
  else if (attack >= 0.3) shape('swelling in');
  else if (sustain <= 0.05) shape(decay < 1.2 ? 'plucked' : 'ringing out');
  // A low Sustain: a louder start that falls to it, slowly or at once, and holds there while the key is down.
  else if (sustain <= 0.35) shape(decay >= 1 ? 'fading slowly' : 'accented');
  else shape('sustained', 5);
  if (release >= 2) parts.push({ words: 'with a long tail', order: 6, rank: 4 });
  // Glide: a slide you hear from about 50 ms.
  if (patch.glide >= 0.05) parts.push({ words: 'gliding between Notes', order: 4.5, rank: 4 });
  return parts;
}

// ---- The LFOs ----

/**
 * What one LFO (`index` 0 or 1) does that is heard, in a few words, or null. Its swing is the Modulation model's, so
 * two LFOs on one Destination share its room, as in the sound (issue 196).
 */
function motion(patch: Patch, sound: Sound, lfo: Lfo, index: number, bpm: number): string | null {
  if (lfo.amount <= 0) return null;
  const rate = lfoHz(lfo, bpm);
  const swingOf = (value: number) => destinationSwings(patch, lfo.destination, value)[index];
  switch (lfo.destination) {
    case 'pitch': {
      const cents = 100 * swingOf(0);
      if (cents < 3) return null;
      return rate < 1 ? 'a slow pitch drift' : rate <= 12 ? 'vibrato' : 'a fast warble';
    }
    case 'cutoff': {
      const octaves = swingOf(patch.cutoff);
      if (!sound.rich || octaves < 0.25) return null;
      // Swung where it shapes no Harmonic either way, it moves nothing heard: a low-pass above the 10th, a high-pass
      // under the fundamental, a notch or band away from them all.
      const held = heldCutoff(patch, sound);
      const [low, high] = [harmonicsAt(held * 2 ** -octaves, sound), harmonicsAt(held * 2 ** octaves, sound)];
      const moves = { lowpass: low < 10, highpass: high > 1.5 && low < 30, bandpass: high > 0.7 && low < 30, notch: high > 0.7 && low < 30 };
      if (!moves[patch.filterMode]) return null;
      const peaked = patch.resonance >= 0.5 && (patch.filterMode === 'lowpass' || patch.filterMode === 'bandpass');
      if (rate < 1) return peaked ? 'a slow resonant sweep' : 'a slow Filter sweep';
      if (rate <= 10) return lfo.waveform === 'square' ? 'a stepped wobble' : 'a wobble';
      return 'a Filter flutter';
    }
    case 'resonance': {
      if (!sound.rich || swingOf(patch.resonance) < 0.1) return null;
      return 'a swelling resonance';
    }
    case 'volume': {
      if (lfo.amount < 0.1) return null;
      if (lfo.waveform === 'square' && lfo.amount >= 0.8 && rate >= 4) return 'a rhythmic chop';
      return rate < 1 ? 'a slow rise and fall' : 'tremolo';
    }
    case 'pulseWidth': {
      const pulses = (sound.osc1 && patch.waveform === 'pulse') || (sound.osc2 && patch.osc2Waveform === 'pulse');
      const width = sound.osc1 && patch.waveform === 'pulse' ? patch.pulseWidth : patch.osc2PulseWidth;
      return pulses && swingOf(width) >= 0.05 ? 'a moving Pulse Width' : null;
    }
    case 'fm': {
      if (!(sound.osc1 || sound.ring) || swingOf(patch.crossMod) < 0.05) return null;
      if (lfo.retrigger === 'note' && lfo.waveform === 'sawDown') return 'FM falling on each Note';
      return lfo.waveform === 'square' ? 'FM switching on and off' : 'FM coming and going';
    }
    case 'detune':
      // Beating against Osc 1: Osc 2 heard itself, mixed in or through Ring, not only swinging Osc 1 by FM.
      return (sound.osc2 || sound.ring) && swingOf(patch.osc2Detune) >= 3 ? 'a chorus-like drift' : null;
    case 'osc2Pitch': {
      if (!osc2Heard(patch) || swingOf(patch.osc2Semitone) < 0.25) return null;
      const jumps = lfo.waveform === 'square';
      // Osc 2 alone: the sound's own pitch moves.
      if (sound.osc2 && !sound.osc1 && !sound.ring && !sound.fm) return jumps ? 'a pitch that jumps' : 'a sliding pitch';
      return jumps ? 'Osc 2 jumping in pitch' : 'Osc 2 drifting in pitch';
    }
  }
}

function motionParts(patch: Patch, sound: Sound, bpm: number): Part[] {
  const heard = [...new Set(lfos(patch).map((lfo, i) => motion(patch, sound, lfo, i, bpm)))].filter((m): m is string => !!m);
  return heard.map((words, i) => ({ words, order: 5 + i * 0.1, rank: i === 0 ? 1 : 3, lfo: true }));
}

// ---- Fitting ----

/** A part's words, an LFO's "with" or "and" counted. */
const count = (part: Part) => part.words.split(' ').length + (part.lfo ? 1 : 0);

/**
 * The phrase within `MAX_WORDS`: the fullest source form that leaves room for the telling parts (rank 1 and 2), the
 * other parts by rank as they fit, in reading order.
 */
function withinWords(sources: string[], parts: Part[]): [string, ...Part[]] {
  const byRank = [...parts].sort((a, b) => a.rank - b.rank || a.order - b.order);
  const fill = (source: string) => {
    let room = MAX_WORDS - source.split(' ').length;
    const kept = byRank.filter((p) => {
      if (count(p) > room) return false;
      room -= count(p);
      return true;
    });
    return { source, kept };
  };
  const tries = sources.map(fill);
  const telling = parts.filter((p) => p.rank <= 2).length;
  const best = tries.find((t) => t.kept.filter((p) => p.rank <= 2).length === telling) ?? tries[tries.length - 1];
  return [best.source, ...best.kept.sort((a, b) => a.order - b.order)];
}
