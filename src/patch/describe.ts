import { effectiveCutoff, LFO_LAWS } from '../modulation/modulationModel';
import type { Waveform } from '../music/harmonics';
import { TEMPO } from '../music/tempo';
import { type Lfo, lfoHz, lfos, osc1Heard, osc2Heard, type Patch } from './patch';

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
  return withinWords(sourceForms(patch, sound), parts).reduce((phrase, part) => `${phrase}${part.startsWith('and ') ? ' ' : ', '}${part}`);
}

/** The most words the phrase takes. */
export const MAX_WORDS = 12;

/** A part of the phrase after its source: its words, where it reads (`order`) and how telling it is (`rank`, 1 the most). */
interface Part {
  words: string;
  order: number;
  rank: number;
}

/** The least a Mixer level must be for its source to be named: −20 dB, heard beside the others. */
const HEARD = 0.1;
/** The Noise is heard lower, as a hiss over the tones: −28 dB. */
const NOISE_HEARD = 0.04;
/** Resonance from here up is named: a peak you hear at the Cutoff. */
const RESONANT = 0.6;
/** Resonance at its top: the Filter self-oscillates. */
const SINGING = 0.98;

/** What the Patch sounds from, as the rules below read it. */
interface Sound {
  /** Osc 1 and Osc 2 mixed in on their own faders. */
  one: boolean;
  two: boolean;
  ring: boolean;
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
const referenceNote = (patch: Patch) => 12 * ((patch.keyboardOctave ?? 4) + 1) + 7;
const hz = (note: number) => 440 * 2 ** ((note - 69) / 12);

function soundOf(patch: Patch): Sound {
  const one = patch.mixOsc1 >= HEARD;
  const two = patch.mixOsc2 >= HEARD;
  const ring = patch.mixRing >= HEARD;
  const fm = patch.crossMod > 0 && osc1Heard(patch);
  const note = referenceNote(patch);
  const osc2Shift = patch.osc2Octave + patch.osc2Semitone / 12;
  // Osc 1's, or Osc 2's when it alone is mixed in, or the Sub's when it is the only tone.
  const tonal = one || two || ring || fm;
  const fundamental = hz(note) * 2 ** (one || !two ? patch.osc1Octave + (tonal ? 0 : patch.subOctave) : osc2Shift);
  const rich =
    (one && patch.waveform !== 'sine') || (two && patch.osc2Waveform !== 'sine') || ring || fm || patch.mixNoise >= HEARD;
  return { one, two, ring, fm, rich, fundamental, note };
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

  // The Oscillators, fullest first; `alone`, the louder of two said alone, the last to give way.
  let cores: string[];
  let alone: string | null = null;
  if (sound.one && sound.two) {
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
  } else if (sound.one || sound.two) {
    const lead = sound.one ? w1 : w2;
    const pure = lead === 'sine' && !sound.fm && !sound.ring && patch.mixNoise < NOISE_HEARD;
    cores = [one(`${pure ? 'pure ' : bright ? 'bright ' : ''}${lead}`)];
  } else if (sound.ring) {
    cores = [w1 === w2 ? `two ${plural(w1)} through Ring` : `${one(w1)} times ${one(w2)}`];
  } else cores = [];

  // FM and Ring beside what is mixed in.
  const adds: string[] = [];
  if (sound.fm && cores.length) adds.push(patch.crossMod < 0.2 ? 'a little FM' : 'FM');
  else if (sound.fm) cores = [one(`${w1} swung by FM`)];
  if (sound.ring && (sound.one || sound.two)) adds.push('Ring');
  const join = (core: string, more: string[]) => (more.length ? `${core}${core.includes(' with ') ? ' and ' : ' with '}${more.join(' and ')}` : core);
  cores = cores.map((core) => join(core, adds));
  if (alone) alone = join(alone, adds);

  // The Sub and the Noise, the quieter extras: said last, and the first to go.
  const sub = patch.mixSub >= HEARD ? (patch.subOctave === -2 ? 'a deep Sub' : 'a Sub') : null;
  const colour = patch.noiseColour === 'pink' ? 'pink ' : '';
  const noise = patch.mixNoise >= NOISE_HEARD ? (patch.mixNoise < 0.2 ? `a breath of ${colour}Noise` : `${colour}Noise`) : null;
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
  const waves = [sound.one && patch.waveform, sound.two && patch.osc2Waveform].filter(Boolean);
  if (!waves.length || waves.some((w) => w === 'sine' || w === 'triangle')) return false;
  return patch.filterMode === 'lowpass' && heldCutoff(patch, sound) / sound.fundamental >= 20 && patch.resonance < RESONANT;
}

// ---- The Filter ----

/** The Cutoff while a Note is held at the Filter Envelope's Sustain, softly played, on the Note the rules hear. */
const heldCutoff = (patch: Patch, sound: Sound) => effectiveCutoff(patch, patch.filterSustain, [], 0, sound.note);

function filterParts(patch: Patch, sound: Sound): Part[] {
  if (!sound.rich) return []; // a sine has no Harmonics to shape
  const parts: Part[] = [];
  const held = heldCutoff(patch, sound);
  const h = held / sound.fundamental; // how many Harmonics pass, about
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
  const struck = effectiveCutoff(patch, 1, [], 0, sound.note) / sound.fundamental;
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
  else if (sustain <= 0.35) shape(decay >= 1 ? 'fading slowly' : 'short');
  else shape('sustained', 5);
  if (release >= 2) parts.push({ words: 'with a long tail', order: 6, rank: 4 });
  // Glide: a slide you hear from about 50 ms.
  if (patch.glide >= 0.05) parts.push({ words: 'gliding between Notes', order: 4.5, rank: 4 });
  return parts;
}

// ---- The LFOs ----

/** What one LFO does that is heard, in a few words, or null. */
function motion(patch: Patch, sound: Sound, lfo: Lfo, bpm: number): string | null {
  if (lfo.amount <= 0) return null;
  const rate = lfoHz(lfo, bpm);
  const law = LFO_LAWS[lfo.destination];
  const swingOf = (value: number) => Math.min(law.perDepth * lfo.amount, 'room' in law ? law.room(value) : Infinity);
  switch (lfo.destination) {
    case 'pitch': {
      const cents = 100 * swingOf(0);
      if (cents < 3) return null;
      return rate < 1 ? 'a slow pitch drift' : rate <= 12 ? 'vibrato' : 'a fast warble';
    }
    case 'cutoff': {
      const octaves = swingOf(patch.cutoff);
      if (!sound.rich || octaves < 0.25) return null;
      // A low-pass swung where every Harmonic passes either way moves nothing heard.
      if (patch.filterMode === 'lowpass' && (heldCutoff(patch, sound) * 2 ** -octaves) / sound.fundamental >= 10) return null;
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
      const pulses = (sound.one && patch.waveform === 'pulse') || (sound.two && patch.osc2Waveform === 'pulse');
      const width = sound.one && patch.waveform === 'pulse' ? patch.pulseWidth : patch.osc2PulseWidth;
      return pulses && swingOf(width) >= 0.05 ? 'a moving pulse width' : null;
    }
    case 'fm': {
      if (!osc1Heard(patch) || swingOf(patch.crossMod) < 0.05) return null;
      if (lfo.retrigger === 'note' && lfo.waveform === 'sawDown') return 'FM falling on each Note';
      return lfo.waveform === 'square' ? 'FM switching on and off' : 'FM coming and going';
    }
    case 'detune':
      return osc2Heard(patch) && 50 * lfo.amount >= 3 ? 'a chorus-like drift' : null;
    case 'osc2Pitch': {
      if (!osc2Heard(patch) || 12 * lfo.amount < 0.25) return null;
      const jumps = lfo.waveform === 'square';
      // Osc 2 alone: the sound's own pitch moves.
      if (sound.two && !sound.one && !sound.ring && !sound.fm) return jumps ? 'a pitch that jumps' : 'a sliding pitch';
      return jumps ? 'Osc 2 jumping in pitch' : 'Osc 2 drifting in pitch';
    }
  }
}

function motionParts(patch: Patch, sound: Sound, bpm: number): Part[] {
  const heard = [...new Set(lfos(patch).map((lfo) => motion(patch, sound, lfo, bpm)))].filter((m): m is string => !!m);
  return heard.map((words, i) => ({ words: `${i === 0 ? 'with' : 'and'} ${words}`, order: 5 + i * 0.1, rank: i === 0 ? 1 : 3 }));
}

// ---- Fitting ----

const count = (words: string) => words.split(' ').length;

/**
 * The phrase within `MAX_WORDS`: the fullest source form that leaves room for the telling parts (rank 1 and 2), the
 * other parts by rank as they fit, in reading order.
 */
function withinWords(sources: string[], parts: Part[]): string[] {
  const byRank = [...parts].sort((a, b) => a.rank - b.rank || a.order - b.order);
  const fill = (source: string) => {
    let room = MAX_WORDS - count(source);
    const kept = byRank.filter((p) => {
      if (count(p.words) > room) return false;
      room -= count(p.words);
      return true;
    });
    return { source, kept };
  };
  const tries = sources.map(fill);
  const telling = parts.filter((p) => p.rank <= 2).length;
  const best = tries.find((t) => t.kept.filter((p) => p.rank <= 2).length === telling) ?? tries[tries.length - 1];
  // A second LFO reads "and …" only after the first.
  const kept = best.kept.sort((a, b) => a.order - b.order).map((p) => p.words);
  const firstMotion = kept.findIndex((w) => w.startsWith('and '));
  if (firstMotion >= 0 && !kept.some((w) => w.startsWith('with ') && !w.startsWith('with a long'))) kept[firstMotion] = kept[firstMotion].replace(/^and /, 'with ');
  return [best.source, ...kept];
}
