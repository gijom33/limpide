import { PRESET_GROUPS, type PresetGroup } from '../patch/presets';

/**
 * The Demo: one Preset from every group, in the groups' order, each with a phrase that suits it. The same every
 * time (ADR-0002 keeps the Viewers out of React; the Demo keeps the Display out of its hands: it only plays).
 */
export interface TourStop {
  group: PresetGroup;
  preset: string;
  bpm: number;
  phrase: string;
}

export const TOUR: readonly TourStop[] = [
  // A minor-key line on the plain saw: the ramps of the Scope, and the ladder of the Spectrum, from the start.
  { group: 'Start', preset: 'Init', bpm: 112, phrase: 'C3:0.5 C3:0.5 G3:0.5 C3:0.5 Bb3:0.5 G3:0.5 F3:0.5 Eb3:0.5 C3:0.5 C3:0.5 G3:0.5 C3:0.5 Bb3:0.5 C4:0.5 Bb3:0.5 G3:0.5 F3:1 Eb3:1 F3:1 G3:1 C3:2 -:2' },
  // Two long Notes, so the Pulse Width sweep has time to breathe in the Scope.
  { group: 'Shapes', preset: 'PWM Morph', bpm: 112, phrase: 'C2:8 G2:8' },
  // A bass line in fifths: the two-cycle pattern stands still at each Note.
  { group: 'Intervals', preset: 'Perfect Fifth', bpm: 112, phrase: 'A2:4 D3:4 E3:4 A2:4' },
  // Short, spaced stabs: each edge rings, then dies, before the next.
  { group: 'Filter', preset: 'Resonant Ring', bpm: 112, phrase: 'A2:0.5 -:0.5 A2:0.5 -:0.5 A2:0.5 A2:0.5 -:1 C3:0.5 -:0.5 C3:0.5 -:0.5 G2:0.5 G2:0.5 -:1 A2:0.5 -:0.5 A2:0.5 -:0.5 A2:0.5 A2:0.5 -:1 E3:0.5 -:0.5 D3:0.5 -:0.5 C3:0.5 G2:0.5 -:1' },
  // Sixteenth-note arpeggios over four chords: every Note a fresh spike on the Timeline.
  { group: 'Envelope', preset: 'Pluck Shape', bpm: 112, phrase: 'C3:0.25 E3:0.25 G3:0.25 C4:0.25 E4:0.25 C4:0.25 G3:0.25 E3:0.25 C3:0.25 E3:0.25 G3:0.25 C4:0.25 E4:0.25 C4:0.25 G3:0.25 E3:0.25 A2:0.25 C3:0.25 E3:0.25 A3:0.25 C4:0.25 A3:0.25 E3:0.25 C3:0.25 A2:0.25 C3:0.25 E3:0.25 A3:0.25 C4:0.25 A3:0.25 E3:0.25 C3:0.25 F2:0.25 A2:0.25 C3:0.25 F3:0.25 A3:0.25 F3:0.25 C3:0.25 A2:0.25 F2:0.25 A2:0.25 C3:0.25 F3:0.25 A3:0.25 F3:0.25 C3:0.25 A2:0.25 G2:0.25 B2:0.25 D3:0.25 G3:0.25 B3:0.25 G3:0.25 D3:0.25 B2:0.25 G2:0.25 B2:0.25 D3:0.25 G3:0.25 B3:0.25 G3:0.25 D3:0.25 B2:0.25' },
  // Two long Notes under a full sweep: the Response Curve crosses the Spectrum twice.
  { group: 'LFO', preset: 'Deep Sweep', bpm: 112, phrase: 'A1:8 E2:8' },
  // A two-bar acid line, twice.
  { group: 'Bass', preset: 'Acid', bpm: 124, phrase: 'A1:0.5 A1:0.5 A2:0.5 A1:0.5 C2:0.5 A1:0.5 G1:0.5 A2:0.5 A1:0.5 A1:0.5 A2:0.5 A1:0.5 D2:0.5 C2:0.5 G1:0.5 A1:0.5 A1:0.5 A1:0.5 A2:0.5 A1:0.5 C2:0.5 A1:0.5 G1:0.5 A2:0.5 A1:0.5 A1:0.5 A2:0.5 A1:0.5 D2:0.5 C2:0.5 G1:0.5 A1:0.5' },
  // A melody that rises and answers itself, with the vibrato on the long Notes.
  { group: 'Leads', preset: 'Lead', bpm: 112, phrase: 'E4:1 G4:1 A4:1.5 G4:0.5 E4:1 D4:1 E4:2 C4:1 D4:1 E4:1.5 D4:0.5 C4:1 A3:1 B3:2' },
  // Broken chords up and down, the way an electric piano is played.
  { group: 'Keys & Plucks', preset: 'Electric Piano', bpm: 112, phrase: 'C3:0.5 E3:0.5 G3:0.5 C4:0.5 E4:0.5 C4:0.5 G3:0.5 E3:0.5 A2:0.5 C3:0.5 E3:0.5 A3:0.5 C4:0.5 A3:0.5 E3:0.5 C3:0.5 F2:0.5 A2:0.5 C3:0.5 F3:0.5 A3:0.5 F3:0.5 C3:0.5 A2:0.5 G2:0.5 B2:0.5 D3:0.5 G3:0.5 B3:0.5 G3:0.5 D3:0.5 B2:0.5' },
  // Chords in the left hand, a line in the right, on eight Voices.
  { group: 'Pianos', preset: 'Piano', bpm: 120, phrase: 'C3+E3+G3+C4:2 E4:0.5 D4:0.5 C4:1 A2+C3+E3+A3:2 C4:0.5 B3:0.5 A3:1 F2+A2+C3+F3:2 A3:0.5 G3:0.5 F3:1 G2+B2+D3+G3:2 B3:0.5 C4:0.5 D4:1' },
  // Four long Notes: the slow Envelopes have time to swell and the Filter to drift.
  { group: 'Pads', preset: 'Pad', bpm: 112, phrase: 'A2:4 F2:4 C3:4 G2:4' },
  // Four held chords, four Voices each.
  { group: 'Chords', preset: 'Chord Pad', bpm: 112, phrase: 'A2+C3+E3+A3:4 F2+A2+C3+F3:4 C3+E3+G3+C4:4 G2+B2+D3+G3:4' },
  // Four on the floor, with pick-ups.
  { group: 'Drums', preset: 'Kick', bpm: 124, phrase: 'C2:1 C2:1 C2:1 C2:1 C2:1 C2:1 C2:0.5 C2:0.5 C2:1 C2:1 C2:1 C2:1 C2:0.5 C2:0.5 C2:0.5 C2:0.5 C2:1 C2:1' },
  // Long Notes under the rocking band-pass.
  { group: 'Movement & Effects', preset: 'Wah', bpm: 112, phrase: 'E2:2 E2:2 G2:2 A2:2 E2:4 D2:2 E2:2' },
];

/** The groups the Demo visits, in order: every group, once. */
export const TOUR_GROUPS: readonly PresetGroup[] = PRESET_GROUPS;
