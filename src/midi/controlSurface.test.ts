import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChoiceId, ParamId } from '../patch/patch';
import { memoryStorage } from '../test/memoryStorage';
import { createControlSurface, type LearnState } from './controlSurface';
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

/** What a synth stand-in leaves as it is: each control turns its own Parameter, and no tempo moves (issue 112). */
const untouched = { turned: (id: ParamId) => id, tempoPosition: () => 0, setTempoPosition: () => {} };

/** A synth stand-in: Parameter positions (0–1), plus a record of Actions, played Notes and knob touches. */
function rig(round = (p: number) => p) {
  const positions: Partial<Record<ParamId, number>> = { cutoff: 0.5, resonance: 0.2 };
  const choices: Partial<Record<ChoiceId, number>> = { waveform: 2 }; // the third of five
  const actions: string[] = [];
  const notes: string[] = [];
  const touched: string[] = [];
  const learns: LearnState[] = [];
  const store = createMappingStore(memoryStorage());
  const surface = createControlSurface({
    ...untouched,
    store,
    position: (id) => positions[id] ?? 0,
    setPosition: (id, p) => void (positions[id] = round(p)),
    action: (id) => void actions.push(id),
    choice: (id) => ({ index: choices[id] ?? 0, count: id === 'waveform' ? 5 : 2 }),
    setChoice: (id, index) => void (choices[id] = index),
    press: (note) => void notes.push(`on ${note}`),
    release: (note) => void notes.push(`off ${note}`),
    touched: (target, state) => void touched.push(`${target.id} ${state}`),
    learnChanged: (state) => void learns.push(state),
  });
  const send = (...messages: MidiMessage[]) => messages.forEach((m) => surface.handle(m));
  return { positions, choices, actions, notes, touched, learns, store, surface, send };
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

  it('never learns a control it was told to avoid; that control keeps driving its own target', () => {
    const { surface, store, positions, send } = rig();
    store.set({ control: { kind: 'cc', channel: 1, number: 74 }, target: cutoff, mode: 'absolute' });
    surface.startLearn();
    surface.select(resonance, [{ kind: 'cc', channel: 1, number: 74 }]);
    send(cc(74, 60), cc(74, 70), cc(74, 80), cc(74, 90)); // crosses the Cutoff's 0.5: Pickup follows
    expect(store.list()).toHaveLength(1);
    expect(surface.learnState()).toMatchObject({ phase: 'armed', target: { id: 'resonance' } });
    expect(positions.cutoff).toBeCloseTo(90 / 127);
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
    vi.advanceTimersByTime(600); // a moment's pause before reusing the knob
    send(cc(71, 1), cc(71, 1), cc(71, 1), cc(71, 1)); // the knob now drives Resonance instead
    expect(store.list().map((m) => m.target)).toEqual([resonance]);
  });
});

describe('MIDI Learn, one control after another', () => {
  it('the rest of a turn on the knob just learned is not learned for the next target', () => {
    const { surface, store, positions, send } = rig();
    surface.startLearn();
    surface.select(cutoff);
    send(cc(74, 1), cc(74, 1), cc(74, 1), cc(74, 1)); // learned…
    surface.select(resonance);
    send(cc(74, 1), cc(74, 1)); // …and still turning
    expect(store.list().map((m) => m.target)).toEqual([cutoff]);
    expect(positions.cutoff).toBeCloseTo(0.52); // it already drives Cutoff
    send(cc(71, 1), cc(71, 1), cc(71, 1), cc(71, 1));
    expect(store.find({ kind: 'cc', channel: 1, number: 71 })?.target).toEqual(resonance);
  });

  it('once that knob has been still for a moment, it can be learned again (moved to another target)', () => {
    const { surface, store, send } = rig();
    surface.startLearn();
    surface.select(cutoff);
    send(cc(74, 1), cc(74, 1), cc(74, 1), cc(74, 1));
    surface.select(resonance);
    vi.advanceTimersByTime(600);
    send(cc(74, 1), cc(74, 1), cc(74, 1), cc(74, 1));
    expect(store.list().map((m) => m.target)).toEqual([resonance]);
  });

  it('the button just learned is not learned again for the next Action (issue 147)', () => {
    const { surface, store, actions, send } = rig();
    surface.startLearn();
    surface.select(hold);
    send(cc(49, 127), cc(49, 0));
    surface.select({ kind: 'action', id: 'freeze' });
    send(cc(49, 127), cc(49, 0)); // pressed again at once: it is Hold's now
    expect(store.list().map((m) => m.target)).toEqual([hold]);
    expect(actions).toEqual(['hold']);
    send(cc(50, 127), cc(50, 0));
    expect(store.find({ kind: 'cc', channel: 1, number: 50 })?.target).toEqual({ kind: 'action', id: 'freeze' });
  });
});

describe('MIDI Learn tells a toggle button from a momentary one (issue 147)', () => {
  const button = { kind: 'cc', channel: 1, number: 49 } as const;

  it('a press and its release within half a second: momentary, firing once a press', () => {
    const { surface, store, actions, send } = rig();
    surface.startLearn();
    surface.select(hold);
    send(cc(49, 127));
    vi.advanceTimersByTime(150);
    send(cc(49, 0));
    expect(store.find(button)?.mode).toBe('trigger');
    expect(actions).toEqual([]); // the release that ended Learn fired nothing
    surface.stopLearn();
    send(cc(49, 127), cc(49, 0), cc(49, 127), cc(49, 0));
    expect(actions).toEqual(['hold', 'hold']);
  });

  it('a press with no release for half a second: a toggle, firing on every message after', () => {
    const { surface, store, actions, send } = rig();
    surface.startLearn();
    surface.select(hold);
    send(cc(49, 127));
    expect(store.find(button)).toBeUndefined(); // waiting for a release
    vi.advanceTimersByTime(600);
    expect(store.find(button)?.mode).toBe('toggle');
    expect(actions).toEqual([]);
    surface.stopLearn();
    send(cc(49, 0), cc(49, 127), cc(49, 0));
    expect(actions).toEqual(['hold', 'hold', 'hold']);
  });

  it('a first message at or below the middle, alone: a toggle whose light was on', () => {
    const { surface, store, send } = rig();
    surface.startLearn();
    surface.select(hold);
    send(cc(49, 0));
    vi.advanceTimersByTime(600);
    expect(store.find(button)?.mode).toBe('toggle');
  });

  it('a knob turned on an Action stays momentary, as before: the rest of its turn fires nothing', () => {
    const { surface, store, actions, send } = rig();
    surface.startLearn();
    surface.select({ kind: 'action', id: 'nextPreset' });
    send(cc(20, 30), cc(20, 31), cc(20, 32), cc(20, 33), cc(20, 34));
    expect(store.find({ kind: 'cc', channel: 1, number: 20 })?.mode).toBe('trigger');
    expect(actions).toEqual([]);
  });

  it('another target selected while a button is heard out: nothing is learned or fired, and its release is not learned next', () => {
    const { surface, store, actions, send } = rig();
    surface.startLearn();
    surface.select(hold);
    send(cc(49, 127));
    surface.select({ kind: 'action', id: 'freeze' }); // Quick Setup's Skip, or a click on screen
    send(cc(49, 0)); // letting go
    vi.advanceTimersByTime(600);
    expect(store.list()).toEqual([]);
    expect(actions).toEqual([]);
    send(cc(50, 127), cc(50, 0));
    expect(store.find({ kind: 'cc', channel: 1, number: 50 })?.target).toEqual({ kind: 'action', id: 'freeze' });
  });

  it('the release ends Learn once: one Mapping made, so Quick Setup moves on one step', () => {
    const { surface, learns, send } = rig();
    surface.startLearn();
    surface.select(hold);
    send(cc(49, 127), cc(49, 0));
    vi.advanceTimersByTime(600);
    expect(learns.filter((s) => s.phase === 'armed' && s.learned)).toHaveLength(1);
  });

  it('a pad (a note) on an Action stays momentary, learned at once', () => {
    const { surface, store, send } = rig();
    surface.startLearn();
    surface.select(hold);
    send(noteOn(36));
    expect(store.find({ kind: 'note', channel: 10, number: 36 })?.mode).toBe('trigger');
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

  it('a Relative encoder nudges the Parameter as far as it turned, in either direction, within 0–1 (a fast turn’s 3 is three steps, issue 145)', () => {
    const { store, positions, send } = rig();
    store.set({
      control: { kind: 'cc', channel: 1, number: 21 },
      target: cutoff,
      mode: 'relative-twos',
    });
    send(cc(21, 1), cc(21, 1), cc(21, 3)); // a fast turn packs three steps into one message: they all count
    expect(positions.cutoff).toBeCloseTo(0.55);
    send(cc(21, 125));
    expect(positions.cutoff).toBeCloseTo(0.52);
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

describe('Choices from a Controller', () => {
  const waveform = { kind: 'choice', id: 'waveform' } as const;

  it('MIDI Learn maps a choice (a Waveform) like a Parameter, detecting the Encoder Mode', () => {
    const { surface, store, send } = rig();
    surface.startLearn();
    surface.select(waveform);
    send(cc(7, 1), cc(7, 1), cc(7, 1), cc(7, 1));
    expect(store.find({ kind: 'cc', channel: 1, number: 7 })).toEqual({
      control: { kind: 'cc', channel: 1, number: 7 },
      target: waveform,
      mode: 'relative-twos',
    });
  });

  it('an endless encoder steps through the choices, two clicks each, stopping at either end', () => {
    const { store, choices, touched, send } = rig();
    store.set({ control: { kind: 'cc', channel: 1, number: 7 }, target: waveform, mode: 'relative-twos' });
    send(cc(7, 1));
    expect(choices.waveform).toBe(2); // half way to the next
    send(cc(7, 1));
    expect(choices.waveform).toBe(3);
    send(cc(7, 1), cc(7, 1), cc(7, 1), cc(7, 1), cc(7, 1), cc(7, 1));
    expect(choices.waveform).toBe(4); // the last
    send(cc(7, 127), cc(7, 127));
    expect(choices.waveform).toBe(3); // and straight back, without unwinding the turns past the end
    for (let i = 0; i < 20; i++) send(cc(7, 125));
    expect(choices.waveform).toBe(0);
    expect(touched.at(-1)).toBe('waveform moved');
  });

  it('a knob or fader picks the choice by zone: its travel split evenly between them', () => {
    const { store, choices, send } = rig();
    store.set({ control: { kind: 'cc', channel: 1, number: 33 }, target: waveform, mode: 'absolute' });
    send(cc(33, 0));
    expect(choices.waveform).toBe(0);
    send(cc(33, 60));
    expect(choices.waveform).toBe(2);
    send(cc(33, 127));
    expect(choices.waveform).toBe(4);
  });
});

describe('a keyboard’s own controls, while nothing is mapped to them (issue 52)', () => {
  function keyboardRig() {
    const positions: Partial<Record<ParamId, number>> = { lfoAmount: 0 };
    const heard: string[] = [];
    const store = createMappingStore(memoryStorage());
    const surface = createControlSurface({
      ...untouched,
      store,
      position: (id) => positions[id] ?? 0,
      setPosition: (id, p) => void (positions[id] = p),
      action: () => {},
      choice: () => ({ index: 0, count: 2 }),
      setChoice: () => {},
      press: () => {},
      release: () => {},
      bend: (amount) => void heard.push(`bend ${amount}`),
      pedal: (down) => void heard.push(`pedal ${down ? 'down' : 'up'}`),
      program: (n) => void heard.push(`program ${n}`),
    });
    return { surface, positions, heard, store };
  }

  it('the bend wheel bends, the sustain pedal holds, a Program Change loads, the mod wheel turns LFO 1’s Depth', () => {
    const { surface, positions, heard } = keyboardRig();
    surface.handle({ type: 'pitchBend', channel: 1, value: 0.5 });
    surface.handle(cc(64, 127));
    surface.handle(cc(64, 0));
    surface.handle({ type: 'program', channel: 1, program: 7 });
    surface.handle(cc(1, 127));
    expect(heard).toEqual(['bend 0.5', 'pedal down', 'pedal up', 'program 7']);
    expect(positions.lfoAmount).toBe(1);
  });

  it('a Mapping takes over: the mod wheel learned for the Cutoff no longer turns the Depth', () => {
    const { surface, positions, store } = keyboardRig();
    store.set({ control: { kind: 'cc', channel: 1, number: 1 }, target: cutoff, mode: 'absolute' });
    positions.cutoff = 0;
    surface.handle(cc(1, 0));
    surface.handle(cc(1, 64));
    expect(positions.lfoAmount).toBe(0);
    expect(positions.cutoff).toBeCloseTo(64 / 127, 5);
  });

  it('MIDI Learn takes the bend wheel, then the wheel drives what it learned instead of the pitch', () => {
    const { surface, positions, heard } = keyboardRig();
    positions.cutoff = 0.5;
    surface.startLearn();
    surface.select(cutoff);
    for (const value of [0, 0.25, 0.5, 0.75, 1]) surface.handle({ type: 'pitchBend', channel: 1, value });
    expect(surface.learnState()).toMatchObject({ phase: 'armed', learned: { control: { kind: 'cc', number: 128 }, target: cutoff } });
    surface.stopLearn();
    surface.handle({ type: 'pitchBend', channel: 1, value: 0 }); // the wheel's centre, where the Cutoff is (Pickup)
    surface.handle({ type: 'pitchBend', channel: 1, value: 1 });
    expect(positions.cutoff).toBe(1);
    expect(heard.filter((h) => h.startsWith('bend'))).toEqual([]);
  });
});

describe('the C16 layout’s buttons and its own input (issue 145)', () => {
  const waveform = { kind: 'choice', id: 'waveform' } as const;

  it('steps a choice on a momentary button’s press, not on its release, round to the first', () => {
    const r = rig();
    r.store.set({ control: { kind: 'cc', channel: 1, number: 51 }, target: waveform, mode: 'trigger' });
    r.send(cc(51, 127), cc(51, 0));
    expect(r.choices.waveform).toBe(3);
    r.send(cc(51, 127), cc(51, 0), cc(51, 127), cc(51, 0));
    expect(r.choices.waveform).toBe(0); // the fifth, then round to the first
  });

  it('fires a momentary Action once a press, a toggle Action on every message', () => {
    const r = rig();
    r.store.set({ control: { kind: 'cc', channel: 1, number: 52 }, target: { kind: 'action', id: 'nextPreset' }, mode: 'trigger' });
    r.store.set({ control: { kind: 'cc', channel: 1, number: 55 }, target: { kind: 'action', id: 'freeze' }, mode: 'toggle' });
    r.send(cc(52, 127), cc(52, 0), cc(55, 127), cc(55, 0));
    expect(r.actions).toEqual(['nextPreset', 'freeze', 'freeze']);
  });

  it('lets a C16 Mapping answer a C16 only: another Controller’s sustain pedal and mod wheel keep their meaning', () => {
    const r = rig();
    const pedal: string[] = [];
    const surface = createControlSurface({
      ...untouched,
      store: r.store,
      position: (id) => r.positions[id] ?? 0,
      setPosition: (id, p) => void (r.positions[id] = p),
      action: (id) => void r.actions.push(id),
      choice: (id) => ({ index: r.choices[id] ?? 0, count: 5 }),
      setChoice: (id, index) => void (r.choices[id] = index),
      press: () => {},
      release: () => {},
      pedal: (down) => void pedal.push(down ? 'down' : 'up'),
    });
    r.store.set({ control: { kind: 'cc', channel: 1, number: 64 }, target: { kind: 'action', id: 'nextPreset' }, mode: 'trigger', device: 'c16' });
    r.store.set({ control: { kind: 'cc', channel: 1, number: 1 }, target: { kind: 'param', id: 'cutoff' }, mode: 'relative-centred', device: 'c16' });
    surface.handle(cc(64, 127));
    surface.handle(cc(1, 127));
    expect(pedal).toEqual(['down']);
    expect(r.actions).toEqual([]);
    expect(r.positions.cutoff).toBe(0.5);
    expect(r.positions.lfoAmount).toBe(1); // the mod wheel
    surface.handle(cc(64, 127), true);
    surface.handle(cc(1, 66), true);
    expect(r.actions).toEqual(['nextPreset']);
    expect(r.positions.cutoff).toBeGreaterThan(0.5); // a third of a step up
  });

  it('lets a Mapping learned from any Controller answer every Controller', () => {
    const r = rig();
    r.store.set({ control: { kind: 'cc', channel: 1, number: 74 }, target: cutoff, mode: 'relative-centred' });
    r.surface.handle(cc(74, 65), true);
    const fromC16 = r.positions.cutoff!;
    expect(fromC16).toBeGreaterThan(0.5);
    r.surface.handle(cc(74, 65), false);
    expect(r.positions.cutoff).toBeGreaterThan(fromC16);
  });
});

describe('the Rate, a note value with Sync on, and the tempo (issue 112)', () => {
  /** A synth whose LFO 1 Rate knob turns its note value (positions in steps of 1/23), with a tempo from 40 to 240. */
  const synced = () => {
    const positions: Partial<Record<ParamId, number>> = { lfoRate: 0.5, lfoNote: 13 / 23 };
    let tempo = 80 / 200; // 120 BPM
    const actions: string[] = [];
    const store = createMappingStore(memoryStorage());
    const surface = createControlSurface({
      store,
      position: (id) => positions[id] ?? 0,
      setPosition: (id, p) => void (positions[id] = id === 'lfoNote' ? Math.round(p * 23) / 23 : p),
      turned: (id) => (id === 'lfoRate' ? 'lfoNote' : id),
      tempoPosition: () => tempo,
      setTempoPosition: (p) => void (tempo = Math.round(p * 200) / 200),
      action: (id) => void actions.push(id),
      choice: () => ({ index: 0, count: 5 }),
      setChoice: () => {},
      press: () => {},
      release: () => {},
    });
    return { positions, store, surface, actions, tempo: () => 40 + tempo * 200 };
  };

  it('turns the note value from a control mapped to the Rate: a step for every two clicks of a Relative knob, a C16’s thirds gathered', () => {
    const r = synced();
    r.store.set({ control: { kind: 'cc', channel: 1, number: 30 }, target: { kind: 'param', id: 'lfoRate' }, mode: 'relative-centred', device: 'c16' });
    r.surface.handle(cc(30, 65), true);
    expect(r.positions.lfoNote).toBeCloseTo(13 / 23, 9); // half a step: not yet
    r.surface.handle(cc(30, 65), true);
    expect(r.positions.lfoNote).toBeCloseTo(14 / 23, 9);
    for (let i = 0; i < 6; i++) r.surface.handle(cc(30, 66), true); // six thirds: two clicks, one step
    expect(r.positions.lfoNote).toBeCloseTo(15 / 23, 9);
    expect(r.positions.lfoRate).toBe(0.5); // the Hz kept for when Sync goes off
  });

  it('maps the tempo to a knob, a BPM a step, and Tap to a button', () => {
    const r = synced();
    r.store.set({ control: { kind: 'cc', channel: 1, number: 31 }, target: { kind: 'tempo', id: 'bpm' }, mode: 'relative-twos' });
    r.store.set({ control: { kind: 'cc', channel: 1, number: 32 }, target: { kind: 'action', id: 'tap' }, mode: 'trigger' });
    r.surface.handle(cc(31, 1));
    r.surface.handle(cc(31, 1));
    expect(r.tempo()).toBe(124);
    r.surface.handle(cc(31, 127));
    expect(r.tempo()).toBe(122);
    r.surface.handle(cc(32, 127));
    r.surface.handle(cc(32, 0));
    expect(r.actions).toEqual(['tap']);
  });
});

describe('the C16’s knobs: a 65 one step, a 66 a third of one (issue 145)', () => {
  /** A C16 knob on the Cutoff, from 0. */
  const c16Knob = () => {
    const positions: Partial<Record<ParamId, number>> = { cutoff: 0 };
    const store = createMappingStore(memoryStorage());
    const surface = createControlSurface({
      ...untouched,
      store,
      position: (id) => positions[id] ?? 0,
      setPosition: (id, p) => void (positions[id] = p),
      action: () => {},
      choice: () => ({ index: 0, count: 5 }),
      setChoice: () => {},
      press: () => {},
      release: () => {},
    });
    store.set({ control: { kind: 'cc', channel: 1, number: 24 }, target: cutoff, mode: 'relative-centred', device: 'c16' });
    const send = (value: number, times = 1) => {
      for (let i = 0; i < times; i++) surface.handle(cc(24, value), true);
    };
    return { positions, send };
  };

  it('counts each 65 of a slow turn as a step of 1 %: one full turn, 46 messages (the owner’s log), is 46 %', () => {
    const { positions, send } = c16Knob();
    send(65, 46);
    expect(positions.cutoff).toBeCloseTo(0.46);
  });

  it('counts a fast turn’s 66 as a third of a step, however its bursts arrive', () => {
    // Half a turn slow, then 11 bits fast as the owner's log sends them: 88 66s, bursts split and merged on the way.
    const { positions, send } = c16Knob();
    send(65, 23);
    send(66, 17);
    send(66, 7);
    send(66, 64);
    expect(positions.cutoff).toBeCloseTo(0.23 + 0.88 / 3);
  });

  it('turns back at once, and leaves other Controllers’ knobs as they send', () => {
    const { positions, send } = c16Knob();
    send(65, 10);
    send(66, 8);
    send(63);
    expect(positions.cutoff).toBeCloseTo(0.09 + 0.08 / 3);
    const r = rig();
    r.store.set({ control: { kind: 'cc', channel: 1, number: 22 }, target: resonance, mode: 'relative-centred' });
    r.send(cc(22, 66), cc(22, 66));
    expect(r.positions.resonance).toBeCloseTo(0.24); // two steps a message, as it sends them
  });
});
