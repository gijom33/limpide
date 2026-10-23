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

export const TOUR: readonly TourStop[] = [
  // The plain saw, with the Filter opening across the two bars: the ladder of Harmonics appears rung by rung.
  { group: 'Start', preset: 'Init', bpm: 124, phrase: 'C3:0.5 C3:0.5@0.6 G3:0.5 C3:0.5@0.6 Bb3:0.5 G3:0.5@0.6 F3:0.5 Eb3:0.5 C3:0.5 C3:0.5@0.6 G3:0.5 Bb3:0.5 C4:1 G3:0.5 C3:0.5',
    moves: [{ id: 'cutoff', from: 250, to: 9000 }, { id: 'resonance', from: 0.4, to: 0.2 }] },
  // One long Note while the Pulse Width sweep quickens: the Scope breathes, then pants.
  { group: 'Shapes', preset: 'PWM Morph', bpm: 124, phrase: 'C2:8', moves: [{ id: 'lfoRate', from: 0.3, to: 5 }] },
  // The fifth fades in on top of the root: one spike in the Spectrum, then two, and the Scope's pattern doubles.
  { group: 'Intervals', preset: 'Perfect Fifth', bpm: 124, phrase: 'A2:4 D3:4', moves: [{ id: 'mixOsc2', from: 0, to: 1, end: 4 }] },
  // Stabs under a Resonance that climbs until the Filter rings on its own.
  { group: 'Filter', preset: 'Resonant Ring', bpm: 124, phrase: 'A2:0.5 -:0.5 A2:0.5 -:0.5 A2:0.5 A2:0.5 -:1 C3:0.5 -:0.5 G2:0.5 -:0.5 E3:0.5 D3:0.5 C3:0.5 G2:0.5',
    moves: [{ id: 'resonance', from: 0.2, to: 1 }] },
  // Sixteenth-note arpeggios whose plucks grow longer: the spikes on the Timeline turn into tails.
  { group: 'Envelope', preset: 'Pluck Shape', bpm: 124, phrase: 'C3:0.25 E3:0.25@0.6 G3:0.25@0.7 C4:0.25@0.6 E4:0.25 C4:0.25@0.6 G3:0.25@0.7 E3:0.25@0.6 A2:0.25 C3:0.25@0.6 E3:0.25@0.7 A3:0.25@0.6 C4:0.25 A3:0.25@0.6 E3:0.25@0.7 C3:0.25@0.6 F2:0.25 A2:0.25@0.6 C3:0.25@0.7 F3:0.25@0.6 A3:0.25 F3:0.25@0.6 C3:0.25@0.7 A2:0.25@0.6 G2:0.25 B2:0.25@0.6 D3:0.25@0.7 G3:0.25@0.6 B3:0.25 G3:0.25@0.6 D3:0.25@0.7 B2:0.25@0.6',
    moves: [{ id: 'ampDecay', from: 0.08, to: 0.6 }] },
  // Two Notes under a sweep that speeds up: the Response Curve crosses the Spectrum faster and faster.
  { group: 'LFO', preset: 'Deep Sweep', bpm: 124, phrase: 'A1:4 E2:4', moves: [{ id: 'lfoRate', from: 0.25, to: 3 }] },
  // The acid line with the classic move: Cutoff and Resonance both opening across the bars.
  { group: 'Bass', preset: 'Acid', bpm: 128, phrase: 'A1:0.5 A1:0.5@0.6 A2:0.5 A1:0.5@0.6 C2:0.5 A1:0.5@0.6 G1:0.5 A2:0.5 A1:0.5 A1:0.5@0.6 A2:0.5 A1:0.5@0.6 D2:0.5 C2:0.5 G1:0.5 A1:0.5',
    moves: [{ id: 'cutoff', from: 200, to: 2500 }, { id: 'resonance', from: 0.5, to: 0.9 }] },
  // A rising line whose vibrato deepens on the long Notes.
  { group: 'Leads', preset: 'Lead', bpm: 124, phrase: 'E4:0.5 G4:0.5 A4:1 G4:0.5 E4:0.5 D4:1 E4:1.5 G4:0.5 A4:0.5 B4:0.5 A4:1',
    moves: [{ id: 'lfoAmount', from: 0, to: 0.6, start: 2 }] },
  // Broken chords with a lilt, the way an electric piano is played.
  { group: 'Keys & Plucks', preset: 'Electric Piano', bpm: 124, phrase: 'C3:0.5 E3:0.5@0.6 G3:0.5@0.7 C4:0.5@0.6 A2:0.5 C3:0.5@0.6 E3:0.5@0.7 A3:0.5@0.6 F2:0.5 A2:0.5@0.6 C3:0.5@0.7 F3:0.5@0.6 G2:0.5 B2:0.5@0.6 D3:0.5@0.7 G3:0.5@0.6' },
  // Chords and a line on eight Voices, growing louder as it goes.
  { group: 'Pianos', preset: 'Piano', bpm: 124, phrase: 'C3+E3+G3+C4:2@0.6 E4:0.5@0.7 D4:0.5@0.7 C4:1@0.8 F2+A2+C3+F3:2@0.8 A3:0.5@0.9 G3:0.5@0.9 F3:1' },
  // Two long Notes while the Filter opens: dark, then wide.
  { group: 'Pads', preset: 'Pad', bpm: 124, phrase: 'A2:4 F2:4', moves: [{ id: 'cutoff', from: 300, to: 4000 }] },
  // Two held chords, four Voices each, with the LFO's sway deepening.
  { group: 'Chords', preset: 'Chord Pad', bpm: 124, phrase: 'A2+C3+E3+A3:4 F2+A2+C3+F3:4', moves: [{ id: 'lfoAmount', from: 0.1, to: 0.6 }] },
  // Four on the floor, then a fill, and the pitch drop deepening with it.
  { group: 'Drums', preset: 'Kick', bpm: 128, phrase: 'C2:1 C2:1@0.7 C2:1 C2:1@0.7 C2:1 C2:0.5@0.7 C2:0.5@0.8 C2:0.5 C2:0.5@0.8 C2:0.5 C2:0.5@0.9',
    moves: [{ id: 'filterEnvAmount', from: 2, to: 4 }] },
  // Long Notes under a wah that rocks faster and faster.
  { group: 'Movement & Effects', preset: 'Wah', bpm: 124, phrase: 'E2:2 G2:2 A2:2 E2:2', moves: [{ id: 'lfoRate', from: 1.5, to: 7 }] },
];

/** The groups the Demo visits, in order: every group, once. */
export const TOUR_GROUPS: readonly PresetGroup[] = PRESET_GROUPS;
