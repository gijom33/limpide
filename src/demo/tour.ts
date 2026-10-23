import { type ParamId } from '../patch/patch';
import { PRESET_GROUPS, type PresetGroup } from '../patch/presets';

/**
 * The Demo: one Preset from every group, in the groups' order, each with a phrase that suits it. The same every
 * time (ADR-0002 keeps the Viewers out of React; the Demo keeps the Display out of its hands: it only plays).
 */
/** A knob turned while the phrase plays: from one value (the Preset's own, if none is given) to another. */
export interface KnobMove {
  id: ParamId;
  from?: number;
  to: number;
  /** In beats from the phrase's start; the whole phrase when left out. */
  start?: number;
  end?: number;
}

export interface TourStop {
  group: PresetGroup;
  preset: string;
  bpm: number;
  phrase: string;
  moves?: KnobMove[];
}

// The phrases are two bars from pieces everyone knows, all long out of copyright, each picked for its sound.
export const TOUR: readonly TourStop[] = [
  // Beethoven, Ode to Joy, on the plain saw, with the Filter opening: the Harmonics appear rung by rung.
  { group: 'Start', preset: 'Init', bpm: 120, phrase: 'E3:1 E3:1 F3:1 G3:1 G3:1 F3:1 E3:1 D3:1',
    moves: [{ id: 'cutoff', from: 250, to: 9000 }, { id: 'resonance', from: 0.4, to: 0.2 }] },
  // Pachelbel's Canon, the bass, while the Pulse Width sweep quickens: the Scope breathes, then pants.
  { group: 'Shapes', preset: 'PWM Morph', bpm: 112, phrase: 'D2:1 A1:1 B1:1 F#1:1 G1:1 D1:1 G1:1 A1:1', moves: [{ id: 'lfoRate', from: 0.3, to: 5 }] },
  // Strauss, Also sprach Zarathustra: three Notes in fifths, with the fifth above fading in.
  { group: 'Intervals', preset: 'Perfect Fifth', bpm: 112, phrase: 'C2:3 G2:3 C3:2', moves: [{ id: 'mixOsc2', from: 0, to: 1, end: 5 }] },
  // Grieg, In the Hall of the Mountain King, with the Resonance climbing until the Filter rings on its own.
  { group: 'Filter', preset: 'Resonant Ring', bpm: 124, phrase: 'B2:0.5 C#3:0.5 D3:0.5 E3:0.5 F#3:0.5 D3:0.5 F#3:1 F3:0.5 C#3:0.5 F3:1 E3:0.5 C3:0.5 E3:1',
    moves: [{ id: 'resonance', from: 0.2, to: 1 }] },
  // Bach, Prelude in C: sixteenth-note arpeggios whose plucks grow longer on the Timeline.
  { group: 'Envelope', preset: 'Pluck Shape', bpm: 120, phrase: 'C3:0.25 E3:0.25 G3:0.25 C4:0.25 E4:0.25 G3:0.25 C4:0.25 E4:0.25 C3:0.25 E3:0.25 G3:0.25 C4:0.25 E4:0.25 G3:0.25 C4:0.25 E4:0.25 C3:0.25 D3:0.25 A3:0.25 D4:0.25 F4:0.25 A3:0.25 D4:0.25 F4:0.25 C3:0.25 D3:0.25 A3:0.25 D4:0.25 F4:0.25 A3:0.25 D4:0.25 F4:0.25',
    moves: [{ id: 'ampDecay', from: 0.08, to: 0.6 }] },
  // Bach, Toccata in D minor, under a sweep that speeds up.
  { group: 'LFO', preset: 'Deep Sweep', bpm: 112, phrase: 'A3:0.25 G3:0.25 A3:1.5 G3:0.25 F3:0.25 E3:0.25 D3:0.25 C#3:1 D3:2 -:2', moves: [{ id: 'lfoRate', from: 0.25, to: 3 }] },
  // Beethoven's Fifth as an acid riff, Cutoff and Resonance opening across the bars.
  { group: 'Bass', preset: 'Acid', bpm: 124, phrase: 'G2:0.5 G2:0.5 G2:0.5 Eb2:2 -:0.5 F2:0.5 F2:0.5 F2:0.5 D2:2 -:0.5',
    moves: [{ id: 'cutoff', from: 200, to: 2500 }, { id: 'resonance', from: 0.5, to: 0.9 }] },
  // Beethoven, Für Elise, with the vibrato deepening.
  { group: 'Leads', preset: 'Lead', bpm: 124, phrase: 'E4:0.5 D#4:0.5 E4:0.5 D#4:0.5 E4:0.5 B3:0.5 D4:0.5 C4:0.5 A3:2 C3:0.5 E3:0.5 A3:0.5 B3:0.5',
    moves: [{ id: 'lfoAmount', from: 0, to: 0.5, start: 3 }] },
  // Beethoven, Moonlight Sonata: the broken chords, the way an electric piano is played.
  { group: 'Keys & Plucks', preset: 'Electric Piano', bpm: 112, phrase: 'C#3:0.5 E3:0.5@0.7 G#3:0.5@0.8 C#3:0.5 E3:0.5@0.7 G#3:0.5@0.8 C#3:0.5 E3:0.5@0.7 G#3:0.5@0.8 B2:0.5 E3:0.5@0.7 G#3:0.5@0.8 B2:0.5 E3:0.5@0.7 G#3:0.5@0.8 B2:0.5' },
  // Pachelbel's Canon, the chords, on eight Voices.
  { group: 'Pianos', preset: 'Piano', bpm: 112, phrase: 'D3+F#3+A3:1@0.7 A2+C#3+E3:1@0.7 B2+D3+F#3:1@0.8 F#2+A2+C#3:1@0.8 G2+B2+D3:1@0.9 D3+F#3+A3:1@0.9 G2+B2+D3:1 A2+C#3+E3:1' },
  // Amazing Grace, slow, while the Filter opens: dark, then wide.
  { group: 'Pads', preset: 'Pad', bpm: 100, phrase: 'D3:1 G3:1.5 B3:0.25 G3:0.25 B3:2 A3:1 G3:2', moves: [{ id: 'cutoff', from: 300, to: 4000 }] },
  // Pachelbel's Canon, the chords held, with the LFO's sway deepening.
  { group: 'Chords', preset: 'Chord Pad', bpm: 112, phrase: 'D3+F#3+A3:2 A2+C#3+E3:2 B2+D3+F#3:2 F#2+A2+C#3:2', moves: [{ id: 'lfoAmount', from: 0.1, to: 0.6 }] },
  // Stomp, stomp, rest: the beat everyone claps to, with the pitch drop deepening.
  { group: 'Drums', preset: 'Kick', bpm: 120, phrase: 'C2:0.5 C2:0.5@0.8 -:1 C2:0.5 C2:0.5@0.8 -:1 C2:0.5 C2:0.5@0.8 -:1 C2:0.5 C2:0.5@0.8 -:1',
    moves: [{ id: 'filterEnvAmount', from: 2, to: 4 }] },
  // Mozart, Eine kleine Nachtmusik, under a wah that rocks faster and faster.
  { group: 'Movement & Effects', preset: 'Wah', bpm: 124, phrase: 'G2:1 -:0.5 D2:0.5 G2:1 -:0.5 D2:0.5 G2:0.5 D2:0.5 G2:0.5 B2:0.5 D3:2', moves: [{ id: 'lfoRate', from: 1.5, to: 7 }] },
];

/** The groups the Demo visits, in order: every group, once. */
export const TOUR_GROUPS: readonly PresetGroup[] = PRESET_GROUPS;
