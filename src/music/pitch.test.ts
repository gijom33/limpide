import { describe, expect, it } from 'vitest';
import { nearestNote, noteToFrequency } from './pitch';

describe('noteToFrequency', () => {
  it('tunes A4 (MIDI 69) to 440 Hz', () => {
    expect(noteToFrequency(69)).toBe(440);
  });

  it('doubles per octave and follows equal temperament', () => {
    expect(noteToFrequency(81)).toBeCloseTo(880, 6); // A5
    expect(noteToFrequency(45)).toBeCloseTo(110, 6); // A2
    expect(noteToFrequency(60)).toBeCloseTo(261.6256, 3); // middle C
  });
});

describe('nearestNote', () => {
  it('names a frequency by its nearest equal-tempered note', () => {
    expect(nearestNote(440)).toEqual({ name: 'A4', cents: 0 });
    expect(nearestNote(261.63)).toEqual({ name: 'C4', cents: 0 });
    expect(nearestNote(466.16)).toEqual({ name: 'A#4', cents: 0 });
    expect(nearestNote(27.5)).toEqual({ name: 'A0', cents: 0 });
  });

  it('reports how far off the note it is, in whole cents', () => {
    expect(nearestNote(450)).toEqual({ name: 'A4', cents: 39 });
    expect(nearestNote(430)).toEqual({ name: 'A4', cents: -40 });
  });

  it('shows that the 7th Harmonic of A2 sits well below any equal-tempered note', () => {
    expect(nearestNote(110 * 7)).toEqual({ name: 'G5', cents: -31 });
  });
});
