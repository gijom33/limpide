import { describe, expect, it } from 'vitest';
import { noteToFrequency } from './pitch';

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
