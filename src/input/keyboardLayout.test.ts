import { describe, expect, it } from 'vitest';
import { keyToNote, octaveKey, shiftOctave } from './keyboardLayout';

describe('computer-keyboard layout', () => {
  it('maps the home row to white keys starting at C of the chosen octave', () => {
    expect(keyToNote('KeyA', 4)).toBe(60); // C4
    expect(keyToNote('KeyS', 4)).toBe(62); // D4
    expect(keyToNote('KeyK', 4)).toBe(72); // C5
  });

  it('maps the row above to black keys', () => {
    expect(keyToNote('KeyW', 4)).toBe(61); // C#4
    expect(keyToNote('KeyU', 4)).toBe(70); // A#4
  });

  it('follows the octave', () => {
    expect(keyToNote('KeyA', 2)).toBe(36);
  });

  it('ignores keys that are not part of the layout', () => {
    expect(keyToNote('Space', 4)).toBeUndefined();
  });
});

describe('octave shift', () => {
  it('moves down with Z and up with X', () => {
    expect(octaveKey('KeyZ')).toBe(-1);
    expect(octaveKey('KeyX')).toBe(1);
    expect(octaveKey('KeyA')).toBe(0);
  });

  it('stays within the playable range', () => {
    expect(shiftOctave(4, 1)).toBe(5);
    expect(shiftOctave(0, -1)).toBe(0);
    expect(shiftOctave(7, 1)).toBe(7);
  });
});
