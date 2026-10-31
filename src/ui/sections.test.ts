import { describe, expect, it } from 'vitest';
import { defaultPatch, PARAMS, type Patch } from '../patch/patch';
import { sectionOfField } from './sections';

describe("each Patch field's section (issue 115)", () => {
  it('puts every choice in the section its control sits in, and the keyboard octave in none', () => {
    const fields = Object.keys({ ...defaultPatch(), keyboardOctave: 4 }) as (keyof Patch)[];
    const choices = Object.fromEntries(fields.filter((f) => !(f in PARAMS)).map((f) => [f, sectionOfField(f)]));
    expect(choices).toEqual({
      waveform: 'Oscillators',
      osc2Waveform: 'Oscillators',
      subOctave: 'Oscillators',
      subWaveform: 'Oscillators',
      noiseColour: 'Oscillators',
      filterMode: 'Filter',
      filterSlope: 'Filter',
      lfoWaveform: 'LFO & Envelopes',
      lfoDestination: 'LFO & Envelopes',
      lfo2Waveform: 'LFO & Envelopes',
      lfo2Destination: 'LFO & Envelopes',
      lfoRetrigger: 'LFO & Envelopes',
      lfo2Retrigger: 'LFO & Envelopes',
      voices: 'Amp',
      keyboardOctave: null,
    });
  });

  it('puts a knob in its own section', () => {
    expect(sectionOfField('resonance')).toBe('Filter');
    expect(sectionOfField('lfo2Amount')).toBe('LFO & Envelopes');
    expect(sectionOfField('mixSub')).toBe('Oscillators');
  });
});
