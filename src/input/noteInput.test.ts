import { describe, expect, it } from 'vitest';
import { createNoteInput, type VoiceEvent } from './noteInput';

function setup() {
  const events: VoiceEvent[] = [];
  const input = createNoteInput((e) => events.push(e));
  return { input, events };
}

describe('Note input with last-note priority', () => {
  it('opens the Gate on the first Note', () => {
    const { input, events } = setup();
    input.press(60, 0.8);
    expect(events).toEqual([{ type: 'noteOn', note: 60, velocity: 0.8 }]);
  });

  it('lets the newest held Note win', () => {
    const { input, events } = setup();
    input.press(60, 1);
    input.press(64, 1);
    expect(events.at(-1)).toEqual({ type: 'noteOn', note: 64, velocity: 1 });
  });

  it('returns to the previously held Note when the newest is released, without closing the Gate', () => {
    const { input, events } = setup();
    input.press(60, 1);
    input.press(64, 1);
    input.release(64);
    expect(events.at(-1)).toEqual({ type: 'pitchChange', note: 60 });
  });

  it('stays silent about releasing a held Note that is not sounding', () => {
    const { input, events } = setup();
    input.press(60, 1);
    input.press(64, 1);
    input.release(60);
    expect(events).toHaveLength(2);
    input.release(64);
    expect(events.at(-1)).toEqual({ type: 'noteOff' });
  });

  it('closes the Gate when the last Note is released', () => {
    const { input, events } = setup();
    input.press(60, 1);
    input.release(60);
    expect(events.at(-1)).toEqual({ type: 'noteOff' });
  });

  it('ignores a repeated press of a Note already held (keyboard auto-repeat)', () => {
    const { input, events } = setup();
    input.press(60, 1);
    input.press(60, 1);
    expect(events).toHaveLength(1);
  });
});

describe('Hold', () => {
  it('keeps the Note sounding after the key is released', () => {
    const { input, events } = setup();
    input.setHold(true);
    input.press(60, 1);
    input.release(60);
    expect(events).toEqual([{ type: 'noteOn', note: 60, velocity: 1 }]);
  });

  it('lets a new key replace the held Note', () => {
    const { input, events } = setup();
    input.setHold(true);
    input.press(60, 1);
    input.release(60);
    input.press(64, 0.7);
    input.release(64);
    expect(events.at(-1)).toEqual({ type: 'noteOn', note: 64, velocity: 0.7 });
  });

  it('closes the Gate when switched off with no key down', () => {
    const { input, events } = setup();
    input.setHold(true);
    input.press(60, 1);
    input.release(60);
    input.setHold(false);
    expect(events.at(-1)).toEqual({ type: 'noteOff' });
  });

  it('leaves a key that is still down sounding when switched off', () => {
    const { input, events } = setup();
    input.setHold(true);
    input.press(60, 1);
    input.setHold(false);
    expect(events).toHaveLength(1);
    input.release(60);
    expect(events.at(-1)).toEqual({ type: 'noteOff' });
  });

  it('does nothing when switched on or off with nothing playing', () => {
    const { input, events } = setup();
    input.setHold(true);
    input.setHold(false);
    expect(events).toEqual([]);
  });

  it('keeps last-note priority among keys held down', () => {
    const { input, events } = setup();
    input.setHold(true);
    input.press(60, 1);
    input.press(64, 1);
    input.release(64);
    expect(events.at(-1)).toEqual({ type: 'pitchChange', note: 60 });
    input.release(60);
    expect(events.at(-1)).toEqual({ type: 'pitchChange', note: 60 });
  });
});

describe('several Note sources at once (computer keyboard, piano, MIDI)', () => {
  it('keeps a Note sounding until every source holding it lets go', () => {
    const { input, events } = setup();
    input.press(60, 1); // computer keyboard
    input.press(60, 0.7); // the same Note on a MIDI pad
    input.release(60); // the pad lets go
    expect(events.at(-1)).toEqual({ type: 'noteOn', note: 60, velocity: 1 });
    input.release(60); // the key lets go
    expect(events.at(-1)).toEqual({ type: 'noteOff' });
  });

  it('reports which Notes are held, for the on-screen piano to light up', () => {
    const held: number[][] = [];
    const input = createNoteInput(() => {}, (notes) => held.push(notes));
    input.press(60, 1);
    input.press(64, 1);
    input.release(60);
    expect(held).toEqual([[60], [60, 64], [64]]);
  });
});
