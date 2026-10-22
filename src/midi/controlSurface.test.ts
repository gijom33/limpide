import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParamId } from '../patch/patch';
import { memoryStorage } from '../test/memoryStorage';
import { createControlSurface } from './controlSurface';
import { createMappingStore } from './mappings';
import type { MidiMessage } from './parser';

const cc = (controller: number, value: number, channel = 1): MidiMessage => ({
  type: 'cc',
  channel,
  controller,
  value,
});
const noteOn = (note: number, channel = 10): MidiMessage => ({
  type: 'noteOn',
  channel,
  note,
  velocity: 0.8,
});
const noteOff = (note: number, channel = 10): MidiMessage => ({
  type: 'noteOff',
  channel,
  note,
});
const cutoff = { kind: 'param', id: 'cutoff' } as const;
const resonance = { kind: 'param', id: 'resonance' } as const;
const hold = { kind: 'action', id: 'hold' } as const;

/** A synth stand-in: Parameter positions (0–1), plus a record of Actions, played Notes and knob touches. */
function rig(round = (p: number) => p) {
  const positions: Partial<Record<ParamId, number>> = {
    cutoff: 0.5,
    resonance: 0.2,
  };
  const actions: string[] = [];
  const notes: string[] = [];
  const touched: string[] = [];
  const store = createMappingStore(memoryStorage());
  const surface = createControlSurface({
    store,
    position: (id) => positions[id] ?? 0,
    setPosition: (id, p) => void (positions[id] = round(p)),
    action: (id) => void actions.push(id),
    press: (note) => void notes.push(`on ${note}`),
    release: (note) => void notes.push(`off ${note}`),
    touched: (target, state) => void touched.push(`${target.id} ${state}`),
  });
  const send = (...messages: MidiMessage[]) => messages.forEach((m) => surface.handle(m));
  return { positions, actions, notes, touched, store, surface, send };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('MIDI Learn', () => {
  it('maps the selected Parameter to the next control moved, detecting its Encoder Mode from what it sends', () => {
    const { surface, store, send } = rig();
    surface.startLearn();
    surface.select(cutoff);
    expect(surface.learnState()).toEqual({ phase: 'armed', target: cutoff });
    send(cc(74, 1), cc(74, 1), cc(74, 1), cc(74, 1));
    expect(store.list()).toEqual([
      {
        control: { kind: 'cc', channel: 1, number: 74 },
        target: cutoff,
        mode: 'relative-twos',
      },
    ]);
    // Still learning, ready for the next target.
    expect(surface.learnState()).toMatchObject({
      phase: 'armed',
      target: null,
      learned: { target: cutoff },
    });
  });

  it('completes a short turn after a moment, from what arrived so far', () => {
    const { surface, store, send } = rig();
    surface.startLearn();
    surface.select(cutoff);
    send(cc(20, 40), cc(20, 42));
    expect(store.list()).toEqual([]);
    expect(surface.learnState()).toMatchObject({
      phase: 'listening',
      target: cutoff,
    });
    vi.advanceTimersByTime(600);
    expect(store.find({ kind: 'cc', channel: 1, number: 20 })?.mode).toBe('absolute');
  });

  it('does not move the Parameter while learning it', () => {
    const { surface, positions, send } = rig();
    surface.startLearn();
    surface.select(cutoff);
    send(cc(74, 100), cc(74, 101), cc(74, 102), cc(74, 103));
    expect(positions.cutoff).toBe(0.5);
  });

  it('maps an Action to a pad (a note) at once, and that pad no longer plays', () => {
    const { surface, store, notes, send } = rig();
    surface.startLearn();
    surface.select(hold);
    send(noteOn(36), noteOff(36));
    expect(store.find({ kind: 'note', channel: 10, number: 36 })).toEqual({
      control: { kind: 'note', channel: 10, number: 36 },
      target: hold,
      mode: 'trigger',
    });
    expect(notes).toEqual([]);
  });

  it('lets pads keep playing while a Parameter waits for a knob', () => {
    const { surface, store, notes, send } = rig();
    surface.startLearn();
    surface.select(cutoff);
    send(noteOn(60), noteOff(60));
    expect(notes).toEqual(['on 60', 'off 60']);
    expect(store.list()).toEqual([]);
  });

  it('cancels: stopping before a control moves maps nothing, and later messages act normally', () => {
    const { surface, store, positions, send } = rig();
    surface.startLearn();
    surface.select(cutoff);
    surface.stopLearn();
    expect(surface.learnState()).toEqual({ phase: 'off' });
    send(cc(74, 1), cc(74, 1), cc(74, 1), cc(74, 1));
    expect(store.list()).toEqual([]);
    expect(positions.cutoff).toBe(0.5);
  });

  it('re-learning replaces: a target moved to another knob leaves the old knob free', () => {
    const { surface, store, send } = rig();
    surface.startLearn();
    surface.select(cutoff);
    send(cc(74, 1), cc(74, 1), cc(74, 1), cc(74, 1));
    surface.select(cutoff);
    send(cc(71, 65), cc(71, 65), cc(71, 65), cc(71, 65));
    expect(store.list()).toEqual([
      {
        control: { kind: 'cc', channel: 1, number: 71 },
        target: cutoff,
        mode: 'relative-centred',
      },
    ]);
    surface.select(resonance);
    send(cc(71, 1), cc(71, 1), cc(71, 1), cc(71, 1)); // the knob now drives Resonance instead
    expect(store.list().map((m) => m.target)).toEqual([resonance]);
  });
});

describe('Mapped controls', () => {
  const absoluteCutoff = {
    control: { kind: 'cc', channel: 1, number: 20 },
    target: cutoff,
    mode: 'absolute',
  } as const;

  it('Pickup: an Absolute knob is ignored until it passes the Parameter’s value, then followed', () => {
    const { store, positions, touched, send } = rig(); // Cutoff sits at 0.5
    store.set(absoluteCutoff);
    send(cc(20, 10), cc(20, 30)); // below, moving up but not there yet
    expect(positions.cutoff).toBe(0.5);
    expect(touched).toEqual(['cutoff waiting', 'cutoff waiting']);
    send(cc(20, 70)); // crossed 0.5 (63.5) between two messages
    expect(positions.cutoff).toBeCloseTo(70 / 127);
    send(cc(20, 20)); // now it follows, wherever it goes
    expect(positions.cutoff).toBeCloseTo(20 / 127);
    expect(touched.at(-1)).toBe('cutoff moved');
  });

  it('Pickup: a knob landing on the value picks up straight away, from either side', () => {
    const { store, positions, send } = rig();
    store.set(absoluteCutoff);
    send(cc(20, 64)); // within one step of 0.5
    expect(positions.cutoff).toBeCloseTo(64 / 127);
  });

  it('Pickup: once the Parameter is changed elsewhere (on screen, a Preset), the knob has to catch it again', () => {
    const { store, positions, send } = rig();
    store.set(absoluteCutoff);
    send(cc(20, 64), cc(20, 65));
    positions.cutoff = 0.9; // turned on screen
    send(cc(20, 66));
    expect(positions.cutoff).toBe(0.9);
    send(cc(20, 120)); // passes 0.9 (114)
    expect(positions.cutoff).toBeCloseTo(120 / 127);
  });

  it('Pickup keeps following a stepped Parameter, which rounds what it is given', () => {
    const { store, positions, send } = rig((p) => Math.round(p * 10) / 10); // takes tenths only
    store.set(absoluteCutoff);
    send(cc(20, 64), cc(20, 70), cc(20, 80), cc(20, 90));
    expect(positions.cutoff).toBe(0.7);
  });

  it('a Relative encoder nudges the Parameter from wherever it is, in either direction, within 0–1', () => {
    const { store, positions, send } = rig();
    store.set({
      control: { kind: 'cc', channel: 1, number: 21 },
      target: cutoff,
      mode: 'relative-twos',
    });
    send(cc(21, 1), cc(21, 1), cc(21, 3));
    expect(positions.cutoff).toBeCloseTo(0.55);
    send(cc(21, 127));
    expect(positions.cutoff).toBeCloseTo(0.54);
    store.set({
      control: { kind: 'cc', channel: 1, number: 22 },
      target: resonance,
      mode: 'relative-centred',
    });
    for (let i = 0; i < 30; i++) send(cc(22, 54)); // fast down, far past the end
    expect(positions.resonance).toBe(0);
  });

  it('an Action fires once per press, from a pad (note) or a button (CC), and a mapped pad plays no Note', () => {
    const { store, actions, notes, send } = rig();
    store.set({
      control: { kind: 'note', channel: 10, number: 36 },
      target: hold,
      mode: 'trigger',
    });
    store.set({
      control: { kind: 'cc', channel: 1, number: 80 },
      target: { kind: 'action', id: 'freeze' },
      mode: 'trigger',
    });
    send(noteOn(36), noteOff(36), noteOn(36), noteOff(36));
    send(cc(80, 127), cc(80, 0), cc(80, 127), cc(80, 0));
    expect(actions).toEqual(['hold', 'hold', 'freeze', 'freeze']);
    expect(notes).toEqual([]);
  });

  it('unmapped controls do nothing, and unmapped pads play as before', () => {
    const { positions, notes, actions, send } = rig();
    send(cc(5, 100), noteOn(40), noteOff(40));
    expect(positions).toEqual({ cutoff: 0.5, resonance: 0.2 });
    expect(actions).toEqual([]);
    expect(notes).toEqual(['on 40', 'off 40']);
  });
});
