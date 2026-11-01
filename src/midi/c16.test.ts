import { describe, expect, it } from 'vitest';
import { addC16Places, buttonCc, C16_BANKS, c16Bank, c16Layout, describeSharedButtons, isC16, upgradeC16Layout } from './c16';
import type { Mapping } from './mappings';

/** What the layout maps a CC on channel 1 to: "param:cutoff", or undefined when it is left free. */
const at = (layout: Mapping[], cc: number) => {
  const m = layout.find((m) => m.control.kind === 'cc' && m.control.channel === 1 && m.control.number === cc);
  return m && `${m.target.kind}:${m.target.id}`;
};
const modeAt = (layout: Mapping[], cc: number) => layout.find((m) => m.control.number === cc)?.mode;
/** A bank's knobs (K1–K8), faders (F1–F4), and buttons by row (M1–M4, S1–S4, R1–R4). */
const bank = (layout: Mapping[], b: number) => ({
  knobs: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => at(layout, 1 + 8 * b + i)),
  faders: [0, 1, 2, 3].map((i) => at(layout, 33 + 4 * b + i)),
  M: [0, 1, 2, 3].map((s) => at(layout, buttonCc(b, 'M', s))),
  S: [0, 1, 2, 3].map((s) => at(layout, buttonCc(b, 'S', s))),
  R: [0, 1, 2, 3].map((s) => at(layout, buttonCc(b, 'R', s))),
});
const SHARED_M = ['action:previousPreset', 'action:nextPreset', 'action:freeze', 'action:hold'];

describe('the C16 layout, strip by strip (issue 145)', () => {
  it('counts the buttons down each strip, then across, as the C16 sends them: M1 49, S1 50, R1 51, M2 52 …', () => {
    expect([buttonCc(0, 'M', 0), buttonCc(0, 'S', 0), buttonCc(0, 'R', 0), buttonCc(0, 'M', 1), buttonCc(0, 'R', 3)]).toEqual([49, 50, 51, 52, 60]);
    expect(buttonCc(1, 'M', 3)).toBe(70); // the owner's bank B M4
  });

  it('gives bank A to the Oscillators, each strip a column of the section', () => {
    expect(bank(c16Layout(), 0)).toEqual({
      knobs: ['param:osc1Octave', 'param:crossMod', 'param:mixRing', 'param:pulseWidth', 'param:osc2Octave', 'param:osc2Semitone', 'param:osc2Detune', 'param:osc2EnvAmount'],
      faders: ['param:mixOsc1', 'param:mixOsc2', 'param:mixNoise', 'param:mixSub'],
      M: SHARED_M,
      S: [undefined, undefined, 'action:snapshot', 'choice:subOctave'],
      R: ['choice:waveform', 'choice:osc2Waveform', 'choice:noiseColour', 'choice:subWaveform'],
    });
  });

  it('gives bank B to the Filter, C to the Amp and D to the LFOs; the free places stay free', () => {
    const layout = c16Layout();
    expect(bank(layout, 1)).toEqual({
      knobs: ['param:cutoff', 'param:resonance', 'param:velocityCutoff', 'param:keyTrack', 'param:filterEnvAmount', 'choice:filterMode', undefined, undefined],
      faders: ['param:filterAttack', 'param:filterDecay', 'param:filterSustain', 'param:filterRelease'],
      M: SHARED_M,
      S: [undefined, undefined, 'action:snapshot', undefined],
      R: ['choice:filterSlope', undefined, undefined, undefined],
    });
    expect(bank(layout, 2)).toEqual({
      knobs: ['choice:voices', 'param:glide', undefined, undefined, undefined, undefined, undefined, 'param:volume'],
      faders: ['param:ampAttack', 'param:ampDecay', 'param:ampSustain', 'param:ampRelease'],
      M: SHARED_M,
      S: [undefined, undefined, 'action:snapshot', undefined],
      R: [undefined, 'choice:legato', undefined, undefined], // Legato under Glide (issue 119)
    });
    expect(bank(layout, 3)).toEqual({
      knobs: [
        'choice:lfoWaveform', 'choice:lfoDestination', 'choice:lfo2Waveform', 'choice:lfo2Destination',
        'param:lfoAmount', 'param:lfoRate', 'param:lfo2Amount', 'param:lfo2Rate',
      ],
      faders: [undefined, undefined, undefined, undefined],
      M: SHARED_M,
      S: [undefined, undefined, 'action:snapshot', undefined],
      R: ['choice:lfoRetrigger', 'choice:lfoSync', 'choice:lfo2Retrigger', 'choice:lfo2Sync'], // each LFO's Retrigger and Sync (issue 112)
    });
    expect(at(layout, 97)).toBeUndefined();
  });

  it('reads the knobs as Relative #1 (64-centred) and the faders as positions', () => {
    const layout = c16Layout();
    expect([1, 9, 18, 32].map((cc) => modeAt(layout, cc))).toEqual(['relative-centred', 'relative-centred', 'relative-centred', 'relative-centred']);
    expect([33, 44].map((cc) => modeAt(layout, cc))).toEqual(['absolute', 'absolute']);
  });

  it('makes the Actions and the Waveform buttons momentary, the two-way switches toggles', () => {
    const layout = c16Layout();
    const modes = (b: number, row: 'M' | 'S' | 'R') => [0, 1, 2, 3].map((s) => modeAt(layout, buttonCc(b, row, s)));
    for (const b of [0, 1, 2, 3]) {
      expect(modes(b, 'M')).toEqual(['trigger', 'trigger', 'trigger', 'trigger']);
      expect(modeAt(layout, buttonCc(b, 'S', 2))).toBe('trigger'); // Snapshot
    }
    expect(modes(0, 'R')).toEqual(['trigger', 'trigger', 'toggle', 'toggle']); // the Waveforms step; Noise Colour, Sub Waveform switch
    expect(modeAt(layout, buttonCc(0, 'S', 3))).toBe('toggle'); // Sub Octave
    expect(modeAt(layout, buttonCc(2, 'R', 1))).toBe('toggle'); // Legato
    expect(modeAt(layout, buttonCc(1, 'R', 0))).toBe('toggle'); // Slope
    expect([0, 2].map((s) => modeAt(layout, buttonCc(3, 'R', s)))).toEqual(['toggle', 'toggle']); // the Retriggers
  });

  it('answers a C16 only: every Mapping of it is marked so', () => {
    expect(c16Layout().every((m) => m.device === 'c16')).toBe(true);
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

  it('finds the buttons the same on every bank, for the printed card’s foot (issue 148)', () => {
    expect(describeSharedButtons()).toBe('M1 Previous Preset, M2 Next Preset, M3 Freeze, M4 Hold, S3 Snapshot');
    // A shared place changed on one bank is no longer on every bank, and the foot follows.
    const banks = C16_BANKS.map((b, i) => (i === 2 ? { ...b, buttons: { ...b.buttons, S: [null, null, null, null] } } : b));
    expect(describeSharedButtons(banks)).toBe('M1 Previous Preset, M2 Next Preset, M3 Freeze, M4 Hold');
  });

  it('knows a C16 by the name it gives, over USB or Bluetooth', () => {
    expect(isC16('Synido TempoPAD C16')).toBe(true);
    expect(isC16('Synido TempoPAD C16 BT Bluetooth')).toBe(true);
    expect(isC16('Arturia KeyStep')).toBe(false);
  });
});

describe('the first C16 layout, brought to today’s (issue 145)', () => {
  const cc = (number: number) => ({ kind: 'cc' as const, channel: 1, number });
  /** The first layout as it was stored, its knobs' modes found on their first turn. */
  const first: Mapping[] = [
    { control: cc(1), target: { kind: 'choice', id: 'waveform' }, mode: 'absolute' },
    { control: cc(7), target: { kind: 'param', id: 'osc2PulseWidth' }, mode: 'relative-centred' },
    { control: cc(9), target: { kind: 'param', id: 'cutoff' }, mode: 'detect' },
    { control: cc(49), target: { kind: 'action', id: 'hold' }, mode: 'toggle' },
  ];

  it('becomes today’s layout, a person’s own Mappings kept', () => {
    const own: Mapping = { control: { kind: 'cc', channel: 2, number: 74 }, target: { kind: 'param', id: 'osc2PulseWidth' }, mode: 'absolute' };
    const upgraded = upgradeC16Layout([...first, own])!;
    expect(upgraded).toEqual([own, ...c16Layout()]);
  });

  it('drops an own Mapping that shares a control or a target with the new layout, which takes that place', () => {
    const onCutoff: Mapping = { control: { kind: 'cc', channel: 3, number: 20 }, target: { kind: 'param', id: 'cutoff' }, mode: 'absolute' };
    expect(upgradeC16Layout([...first, onCutoff])).toEqual(c16Layout());
  });

  it('leaves Mappings alone when none is the first layout’s', () => {
    expect(upgradeC16Layout([])).toBeNull();
    expect(upgradeC16Layout(c16Layout())).toBeNull();
    expect(upgradeC16Layout([{ control: cc(1), target: { kind: 'param', id: 'cutoff' }, mode: 'absolute' }])).toBeNull();
  });
});

describe('issue 145’s layout, brought to today’s (issues 112 and 119)', () => {
  const addedSince145 = (layout: Mapping[]) => layout.filter((m) => m.target.kind === 'choice' && /^(lfo2?Sync|legato)$/.test(m.target.id));
  const before = c16Layout().filter((m) => !addedSince145([m]).length);

  it('gains Legato on bank C’s R2 and each LFO’s Sync on bank D’s R2 and R4, as toggles', () => {
    const added = addC16Places(before)!;
    expect(addedSince145(added).map((m) => [m.control.number, m.target.id, m.mode])).toEqual([
      [buttonCc(2, 'R', 1), 'legato', 'toggle'],
      [buttonCc(3, 'R', 1), 'lfoSync', 'toggle'],
      [buttonCc(3, 'R', 3), 'lfo2Sync', 'toggle'],
    ]);
    expect(added).toHaveLength(c16Layout().length);
  });

  it('leaves a place the person has used since to them, and adds nothing to today’s layout', () => {
    const own: Mapping = { control: { kind: 'cc', channel: 1, number: buttonCc(3, 'R', 1) }, target: { kind: 'action', id: 'tap' }, mode: 'trigger' };
    expect(addedSince145(addC16Places([...before, own])!).map((m) => m.target.id)).toEqual(['legato', 'lfo2Sync']);
    expect(addC16Places(c16Layout())).toBeNull();
  });

  it('adds nothing where the person removed the layout (ADR-0009): none of their Mappings is the layout’s', () => {
    const own: Mapping = { control: { kind: 'cc', channel: 1, number: 20 }, target: { kind: 'param', id: 'cutoff' }, mode: 'absolute' };
    expect(addC16Places([])).toBeNull();
    expect(addC16Places([own])).toBeNull();
  });
});
