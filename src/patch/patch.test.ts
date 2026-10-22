import { describe, expect, it } from 'vitest';
import { defaultPatch, formatParam, PARAMS, setParam, setWaveform } from './patch';

describe('defaultPatch', () => {
  it('starts every Parameter at its declared default', () => {
    const patch = defaultPatch();
    for (const def of Object.values(PARAMS)) {
      expect(patch[def.id]).toBe(def.default);
    }
  });

  it('gives the Voice an Oscillator, a Filter and an Amp Envelope', () => {
    expect(Object.keys(PARAMS).sort()).toEqual(
      ['ampAttack', 'ampDecay', 'ampRelease', 'ampSustain', 'cutoff', 'pulseWidth', 'resonance'].sort(),
    );
  });

  it('starts on a saw, the classic subtractive source', () => {
    expect(defaultPatch().waveform).toBe('saw');
  });
});

describe('setParam', () => {
  it('returns a new Patch with the value changed, leaving the original untouched', () => {
    const before = defaultPatch();
    const after = setParam(before, 'cutoff', 500);
    expect(after.cutoff).toBe(500);
    expect(before.cutoff).toBe(PARAMS.cutoff.default);
  });

  it('clamps to the Parameter range', () => {
    expect(setParam(defaultPatch(), 'cutoff', 99999).cutoff).toBe(20000);
    expect(setParam(defaultPatch(), 'ampSustain', -1).ampSustain).toBe(0);
  });
});

describe('setWaveform', () => {
  it('returns a new Patch with the Waveform changed, keeping every Parameter', () => {
    const before = setParam(defaultPatch(), 'cutoff', 500);
    const after = setWaveform(before, 'pulse');
    expect(after.waveform).toBe('pulse');
    expect(after.cutoff).toBe(500);
    expect(before.waveform).toBe('saw');
  });
});

describe('Pulse Width', () => {
  it('stays between 5% and 95%, where a pulse still has a pitch', () => {
    expect(setParam(defaultPatch(), 'pulseWidth', 0).pulseWidth).toBe(0.05);
    expect(setParam(defaultPatch(), 'pulseWidth', 1).pulseWidth).toBe(0.95);
    expect(formatParam('pulseWidth', 0.25)).toBe('25 %');
  });
});

describe('formatParam', () => {
  it('shows frequencies in Hz and kHz', () => {
    expect(formatParam('cutoff', 440)).toBe('440 Hz');
    expect(formatParam('cutoff', 2500)).toBe('2.50 kHz');
  });

  it('shows times in ms below a second and s above', () => {
    expect(formatParam('ampAttack', 0.0123)).toBe('12.3 ms');
    expect(formatParam('ampRelease', 1.5)).toBe('1.50 s');
  });

  it('shows levels as percentages', () => {
    expect(formatParam('ampSustain', 0.7)).toBe('70 %');
    expect(formatParam('resonance', 0.255)).toBe('26 %');
  });
});
