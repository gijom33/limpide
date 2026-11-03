import { describe, expect, it } from 'vitest';
import { memoryStorage } from '../test/memoryStorage';
import { c16Layout } from './c16';
import { answeredBy, answers, doubledPorts, knownAmong, knownController, pluggedIn, setAside, takeLayout } from './controller';
import type { Mapping } from './mappings';

// The seam for what a Controller is (issue 149): the rest of the MIDI code asks this module whether an input is a C16
// and whether a Mapping answers it.

const C16_USB = 'Synido TempoPAD C16';
const C16_BLUETOOTH = 'Synido TempoPAD C16 BT Bluetooth';
const KEYSTEP = 'Arturia KeyStep';
const cc = (number: number, channel = 1) => ({ kind: 'cc' as const, channel, number });
const learned: Mapping = { control: cc(74), target: { kind: 'param', id: 'cutoff' }, mode: 'absolute' };
const ofC16: Mapping = { ...learned, mode: 'relative-centred', device: 'c16' };

describe('a Controller, by the name its input gives (issue 149)', () => {
  it('is the C16 over USB and over Bluetooth, shown as "C16"', () => {
    expect(knownController(C16_USB)?.id).toBe('c16');
    expect(knownController(C16_BLUETOOTH)?.id).toBe('c16');
    expect(knownController(C16_USB)?.label).toBe('C16');
  });

  it('is no known Controller for any other name', () => {
    expect(knownController(KEYSTEP)).toBeUndefined();
    expect(knownController('MIDI device')).toBeUndefined();
  });

  it('lists the known Controllers connected once each, two C16s one layout', () => {
    expect(knownAmong([KEYSTEP, C16_USB, C16_BLUETOOTH]).map((k) => k.id)).toEqual(['c16']);
    expect(knownAmong([KEYSTEP])).toEqual([]);
  });
});

describe('which Mappings answer which Controller (ADR-0017, issue 149)', () => {
  const c16 = knownController(C16_USB);
  const other = knownController(KEYSTEP);

  it('a Mapping made by MIDI Learn or Quick Setup answers every Controller', () => {
    expect(answers(learned, c16)).toBe(true);
    expect(answers(learned, other)).toBe(true);
    expect(answeredBy(learned)).toBeUndefined();
  });

  it('a Mapping of the C16 layout answers the C16 only', () => {
    expect(answers(ofC16, c16)).toBe(true);
    expect(answers(ofC16, other)).toBe(false);
    expect(answeredBy(ofC16)?.label).toBe('C16');
  });

  it('the C16 layout is every Mapping the C16’s alone', () => {
    const layout = takeLayout('c16', memoryStorage());
    expect(layout).toEqual(c16Layout());
    expect(layout.every((m) => answers(m, c16) && !answers(m, other))).toBe(true);
  });
});

describe('a known Controller plugged in (ADR-0009, issue 149)', () => {
  /** The first layout's Hold, as stored before issue 145. */
  const firstLayoutHold: Mapping = { control: cc(49), target: { kind: 'action', id: 'hold' }, mode: 'toggle' };

  it('brings its layout in the first time, with nothing mapped, and records it', () => {
    const storage = memoryStorage();
    expect(pluggedIn([C16_USB], [], storage)).toEqual(c16Layout());
    expect(storage.data['limpide.c16Layout']).toBe('3');
  });

  it('brings nothing in once its layout came in, even after every Mapping was removed', () => {
    expect(pluggedIn([C16_USB], [], memoryStorage({ 'limpide.c16Layout': '3' }))).toBeNull();
  });

  it('leaves a person’s own Mappings as they are, recording the layout as in place', () => {
    const storage = memoryStorage();
    expect(pluggedIn([C16_BLUETOOTH], [learned], storage)).toBeNull();
    expect(storage.data['limpide.c16Layout']).toBe('3');
  });

  it('brings the first layout to today’s, once', () => {
    const storage = memoryStorage();
    expect(pluggedIn([C16_USB], [firstLayoutHold], storage)).toEqual(c16Layout());
    expect(pluggedIn([C16_USB], c16Layout(), storage)).toBeNull();
  });

  it('gives issue 145’s layout the places added since', () => {
    const before = c16Layout().filter((m) => !['lfoSync', 'lfo2Sync', 'legato'].includes(m.target.id));
    expect(pluggedIn([C16_USB], before, memoryStorage({ 'limpide.c16Layout': '2' }))).toHaveLength(c16Layout().length);
  });

  it('does nothing for another Controller', () => {
    const storage = memoryStorage();
    expect(pluggedIn([KEYSTEP], [], storage)).toBeNull();
    expect(pluggedIn([KEYSTEP], [firstLayoutHold], storage)).toBeNull();
    expect(storage.data).toEqual({});
  });
});

describe('a known Controller on two ports at once (issue 185)', () => {
  it('is followed on the first connected: the other port’s messages are set aside, and why is told', () => {
    expect(doubledPorts([C16_BLUETOOTH, KEYSTEP, C16_USB])).toEqual([
      { known: expect.objectContaining({ id: 'c16' }), followed: C16_BLUETOOTH, aside: [C16_USB] },
    ]);
  });

  it('sets nothing aside on one port, or for a Controller Limpide does not know, whatever its names', () => {
    expect(doubledPorts([C16_USB, KEYSTEP])).toEqual([]);
    expect(doubledPorts([KEYSTEP, KEYSTEP])).toEqual([]);
    // Two ports under one name cannot be told apart by it: both are heard, rather than neither.
    expect(setAside([C16_USB, C16_USB])).toEqual(new Set());
  });

  it('follows the other port once the first goes', () => {
    expect(doubledPorts([C16_USB])).toEqual([]);
    expect(setAside([C16_USB, C16_BLUETOOTH])).toEqual(new Set([C16_BLUETOOTH]));
    expect(setAside([C16_BLUETOOTH])).toEqual(new Set());
  });
});
