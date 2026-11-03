import { describe, expect, it } from 'vitest';
import { LFO_DESTINATIONS } from '../patch/patch';
import { screenForms } from './shortForms';

describe('a label’s shorter forms (issue 156)', () => {
  it('gives each name its forms on screen, longest first, the shortest a few letters', () => {
    expect(screenForms('Pulse Width')).toEqual(['Pulse Width', 'PW']);
    expect(screenForms('Filter Envelope')).toEqual(['Filter Env', 'F Env', 'FE']);
    expect(screenForms('Amp Envelope')).toEqual(['Amp Env', 'A Env', 'AE']);
    expect(screenForms('Cutoff')).toEqual(['Cutoff', 'Cut']);
    expect(screenForms('Resonance')).toEqual(['Resonance', 'Res']);
  });

  it('gives the MIDI button’s word during MIDI Learn its shorter forms, so it never widens the button (issue 188)', () => {
    expect(screenForms('Learning')).toEqual(['Learning', 'Learn', 'Lrn']);
  });

  it.each([...LFO_DESTINATIONS.map((d) => d.label), 'Filter Envelope', 'Amp Envelope'])('%s: each form no longer than the one before, the last at most 5 letters', (name) => {
    const forms = screenForms(name);
    for (const [i, form] of forms.entries()) if (i) expect(form.length).toBeLessThan(forms[i - 1].length);
    expect(forms.at(-1)!.length).toBeLessThanOrEqual(5);
  });

  it('a name with no shorter form keeps its own', () => {
    expect(screenForms('Retrig')).toEqual(['Retrig']);
  });
});
