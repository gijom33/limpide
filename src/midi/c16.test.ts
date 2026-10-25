import { describe, expect, it } from 'vitest';
import { c16Bank, c16Layout, isC16 } from './c16';
import type { Mapping } from './mappings';

/** What the layout maps a CC on channel 1 to: "param:cutoff", or undefined when it is left free. */
const at = (layout: Mapping[], cc: number) => {
  const m = layout.find((m) => m.control.kind === 'cc' && m.control.channel === 1 && m.control.number === cc);
  return m && `${m.target.kind}:${m.target.id}`;
};

describe('the C16 layout', () => {
  it('gives bank A to the Oscillators: knobs on CC 1–8, faders on CC 33–36', () => {
    const layout = c16Layout();
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((cc) => at(layout, cc))).toEqual([
      'choice:waveform', 'param:pulseWidth', 'choice:osc2Waveform', 'param:osc2Octave',
      'param:osc2Semitone', 'param:osc2Detune', 'param:osc2PulseWidth', 'param:glide',
    ]);
    expect([33, 34, 35, 36].map((cc) => at(layout, cc))).toEqual(['param:mixOsc1', 'param:mixOsc2', 'param:mixSub', 'param:mixNoise']);
  });

  it('gives bank B to the Filter, C to the Amp and D to the LFOs, each bank 8 knob CCs and 4 fader CCs on', () => {
    const layout = c16Layout();
    const knobs = (first: number) => [0, 1, 2, 3, 4, 5, 6, 7].map((i) => at(layout, first + i));
    const faders = (first: number) => [0, 1, 2, 3].map((i) => at(layout, first + i));
    expect(knobs(9)).toEqual([
      'param:cutoff', 'param:resonance', 'param:filterEnvAmount', 'param:velocityCutoff',
      'param:keyTrack', 'choice:filterMode', 'choice:filterSlope', undefined,
    ]);
    expect(faders(37)).toEqual(['param:filterAttack', 'param:filterDecay', 'param:filterSustain', 'param:filterRelease']);
    // Free places stay free: the synth will grow into them.
    expect(knobs(17)).toEqual(['choice:voices', undefined, undefined, undefined, undefined, undefined, undefined, undefined]);
    expect(faders(41)).toEqual(['param:ampAttack', 'param:ampDecay', 'param:ampSustain', 'param:ampRelease']);
    expect(knobs(25)).toEqual([
      'choice:lfoWaveform', 'param:lfoRate', 'param:lfoAmount', 'choice:lfoDestination',
      'choice:lfo2Waveform', 'param:lfo2Rate', 'param:lfo2Amount', 'choice:lfo2Destination',
    ]);
    expect(faders(45)).toEqual([undefined, undefined, undefined, undefined]);
  });

  it('puts the same Actions on the first five buttons of every bank (CC 49–60, 61–72…), and Retrigger on bank D’s', () => {
    const layout = c16Layout();
    const buttons = (first: number) => [0, 1, 2, 3, 4, 5, 6].map((i) => at(layout, first + i));
    const actions = ['action:hold', 'action:freeze', 'action:snapshot', 'action:previousPreset', 'action:nextPreset'];
    expect(buttons(49)).toEqual([...actions, undefined, undefined]);
    expect(buttons(61)).toEqual([...actions, undefined, undefined]);
    expect(buttons(73)).toEqual([...actions, undefined, undefined]);
    expect(buttons(85)).toEqual([...actions, 'choice:lfoRetrigger', 'choice:lfo2Retrigger']);
    expect(at(layout, 97)).toBeUndefined();
  });

  it('maps the buttons as toggles (each press sends the other value), the faders as positions', () => {
    const layout = c16Layout();
    const modeAt = (cc: number) => layout.find((m) => m.control.number === cc)?.mode;
    expect([49, 61, 85, 91].map(modeAt)).toEqual(['toggle', 'toggle', 'toggle', 'toggle']);
    expect([33, 41].map(modeAt)).toEqual(['absolute', 'absolute']);
  });

  it('tells a control’s bank (0 for A … 3 for D), so a bank switch can bring its section into view', () => {
    const bankOf = (...ccs: number[]) => ccs.map((number) => c16Bank({ kind: 'cc', channel: 1, number }));
    expect(bankOf(1, 8, 33, 36, 49, 60)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(bankOf(9, 16, 37, 40, 61, 72)).toEqual([1, 1, 1, 1, 1, 1]);
    expect(bankOf(17, 41, 73, 84)).toEqual([2, 2, 2, 2]);
    expect(bankOf(25, 32, 45, 48, 85, 96)).toEqual([3, 3, 3, 3, 3, 3]);
    // Not one of the C16's controls: another channel, a CC outside its ranges, a pad's Note.
    expect(c16Bank({ kind: 'cc', channel: 2, number: 9 })).toBeUndefined();
    expect(bankOf(0, 97)).toEqual([undefined, undefined]);
    expect(c16Bank({ kind: 'note', channel: 1, number: 36 })).toBeUndefined();
  });

  it('knows a C16 by the name it gives', () => {
    expect(isC16('Synido TempoPAD C16')).toBe(true);
    expect(isC16('TempoPAD C16 Bluetooth')).toBe(true);
    expect(isC16('Arturia KeyStep')).toBe(false);
  });

  it('lets each knob find its Encoder Mode on its first turn (the C16 can be set to any)', () => {
    const layout = c16Layout();
    expect([1, 9, 17, 32].map((cc) => layout.find((m) => m.control.number === cc)?.mode)).toEqual(['detect', 'detect', 'detect', 'detect']);
  });
});
