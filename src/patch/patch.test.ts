import { describe, expect, it } from 'vitest';
import { CHOICES, defaultPatch, formatParam, PARAMS, setFilter, setLfo, setParam, setWaveform } from './patch';

describe('defaultPatch', () => {
  it('starts every Parameter at its declared default', () => {
    const patch = defaultPatch();
    for (const def of Object.values(PARAMS)) {
      expect(patch[def.id]).toBe(def.default);
    }
  });

  it('gives the Voice an Oscillator, a Filter and an Amp Envelope', () => {
    expect(Object.keys(PARAMS).sort()).toEqual(
      [
        'ampAttack', 'ampDecay', 'ampRelease', 'ampSustain', 'cutoff', 'pulseWidth', 'resonance',
        'filterEnvAmount', 'filterAttack', 'filterDecay', 'filterSustain', 'filterRelease',
        'osc2Octave', 'osc2Semitone', 'osc2Detune', 'osc2PulseWidth', 'mixOsc1', 'mixOsc2', 'mixNoise', 'mixSub',
        'lfoRate', 'lfoAmount', 'lfo2Rate', 'lfo2Amount', 'glide', 'velocityCutoff', 'keyTrack',
      ].sort(),
    );
  });

  it('starts on a saw, the classic subtractive source', () => {
    expect(defaultPatch().waveform).toBe('saw');
  });
});

describe('control', () => {
  // ADR-0008: the knobs worth turning while playing are big, the set-and-forget ones small; levels and envelope
  // stages are faders.
  it('gives each Parameter the control its role calls for', () => {
    const of = (control: string) => Object.values(PARAMS).filter((d) => d.control === control).map((d) => d.id).sort();
    expect(of('play')).toEqual(['cutoff', 'filterEnvAmount', 'lfo2Amount', 'lfo2Rate', 'lfoAmount', 'lfoRate', 'osc2Detune', 'resonance']);
    expect(of('set')).toEqual(['glide', 'keyTrack', 'osc2Octave', 'osc2PulseWidth', 'osc2Semitone', 'pulseWidth', 'velocityCutoff']);
    expect(of('fader')).toEqual([
      'ampAttack', 'ampDecay', 'ampRelease', 'ampSustain', 'filterAttack', 'filterDecay', 'filterRelease', 'filterSustain',
      'mixNoise', 'mixOsc1', 'mixOsc2', 'mixSub',
    ]);
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

describe('Osc 2 and the Mixer', () => {
  it('start so that only Osc 1 is heard, exactly as before Osc 2 existed', () => {
    const p = defaultPatch();
    expect([p.mixOsc1, p.mixOsc2, p.mixNoise]).toEqual([1, 0, 0]);
    expect([p.osc2Octave, p.osc2Semitone, p.osc2Detune]).toEqual([0, 0, 0]);
    expect(p.osc2Waveform).toBe('saw');
  });

  it('moves Octave and Semitone in whole steps', () => {
    expect(setParam(defaultPatch(), 'osc2Octave', 1.4).osc2Octave).toBe(1);
    expect(setParam(defaultPatch(), 'osc2Octave', -7).osc2Octave).toBe(-2);
    expect(setParam(defaultPatch(), 'osc2Semitone', 6.6).osc2Semitone).toBe(7);
  });

  it('shows the offsets in their own units', () => {
    expect(formatParam('osc2Octave', 1)).toBe('+1 oct');
    expect(formatParam('osc2Semitone', -5)).toBe('−5 st');
    expect(formatParam('osc2Detune', 7.4)).toBe('+7 ¢');
    expect(formatParam('osc2Detune', 0)).toBe('0 ¢');
  });

  it('gives Osc 2 its own Pulse Width, starting where Osc 1’s does', () => {
    const p = setParam(defaultPatch(), 'osc2PulseWidth', 0.1);
    expect(p.osc2PulseWidth).toBe(0.1);
    expect(p.pulseWidth).toBe(0.25);
    expect(defaultPatch().osc2PulseWidth).toBe(defaultPatch().pulseWidth);
  });

  it('sets either Oscillator’s Waveform independently', () => {
    const p = setWaveform(setWaveform(defaultPatch(), 'square', 'osc2'), 'sine');
    expect([p.waveform, p.osc2Waveform]).toEqual(['sine', 'square']);
  });
});

describe('LFO and Glide', () => {
  it('start with the LFO aimed at the Cutoff but turned down, and Glide off', () => {
    const p = defaultPatch();
    expect([p.lfoWaveform, p.lfoDestination, p.lfoAmount]).toEqual(['sine', 'cutoff', 0]);
    expect(formatParam('glide', p.glide)).toBe('Off');
  });

  it('show slow Rates with decimals and Glide in time', () => {
    expect(formatParam('lfoRate', 0.25)).toBe('0.25 Hz');
    expect(formatParam('lfoRate', 6)).toBe('6.00 Hz');
    expect(formatParam('glide', 0.2)).toBe('200 ms');
  });

  it('change Waveform and Destination independently', () => {
    const p = setLfo(setLfo(defaultPatch(), { waveform: 'square' }), { destination: 'pulseWidth' });
    expect([p.lfoWaveform, p.lfoDestination]).toEqual(['square', 'pulseWidth']);
  });

  it('come in five shapes, the falling saw last', () => {
    expect(CHOICES.lfoWaveform).toEqual(['sine', 'triangle', 'square', 'saw', 'sawDown']);
  });

  it('reach seven destinations in the order of the stages: the Oscillators’, the Filter’s, then the Amp’s Volume', () => {
    expect(CHOICES.lfoDestination).toEqual(['pitch', 'osc2Pitch', 'detune', 'pulseWidth', 'cutoff', 'resonance', 'volume']);
    expect(CHOICES.lfo2Destination).toEqual(CHOICES.lfoDestination);
  });

  it('come as two: LFO 2 starts silent (Depth 0), on Pitch, so a Patch from before it sounds as it did', () => {
    const p = defaultPatch();
    expect([p.lfo2Waveform, p.lfo2Destination, p.lfo2Amount, p.lfo2Rate]).toEqual(['sine', 'pitch', 0, 2]);
  });

  it('LFO 2 changes without touching LFO 1', () => {
    const p = setLfo(defaultPatch(), { waveform: 'saw', destination: 'resonance' }, 2);
    expect([p.lfo2Waveform, p.lfo2Destination, p.lfoWaveform, p.lfoDestination]).toEqual(['saw', 'resonance', 'sine', 'cutoff']);
  });
});

describe('Voices', () => {
  it('start at 1, monophonic, so every Patch from before polyphony sounds as it did', () => {
    expect(defaultPatch().voices).toBe(1);
    expect(CHOICES.voices).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe('Filter Mode and Slope', () => {
  it('start as a 12 dB low-pass, the classic subtractive Filter', () => {
    expect(defaultPatch().filterMode).toBe('lowpass');
    expect(defaultPatch().filterSlope).toBe(12);
  });

  it('change independently, keeping every Parameter', () => {
    const before = setParam(defaultPatch(), 'cutoff', 700);
    const after = setFilter(setFilter(before, { mode: 'bandpass' }), { slope: 24 });
    expect([after.filterMode, after.filterSlope, after.cutoff]).toEqual(['bandpass', 24, 700]);
    expect(before.filterMode).toBe('lowpass');
  });
});

describe('Envelope Amount', () => {
  it('starts at zero, so the Filter Envelope changes nothing until you turn it up', () => {
    expect(defaultPatch().filterEnvAmount).toBe(0);
  });

  it('spans five octaves either way, shown signed in octaves', () => {
    expect(setParam(defaultPatch(), 'filterEnvAmount', 9).filterEnvAmount).toBe(5);
    expect(setParam(defaultPatch(), 'filterEnvAmount', -9).filterEnvAmount).toBe(-5);
    expect(formatParam('filterEnvAmount', 2)).toBe('+2.0 oct');
    expect(formatParam('filterEnvAmount', -1.25)).toBe('−1.3 oct');
    expect(formatParam('filterEnvAmount', 0)).toBe('0 oct');
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
