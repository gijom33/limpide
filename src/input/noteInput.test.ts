import { describe, expect, it } from 'vitest';
import { createNoteInput, type VoiceEvent } from './noteInput';

function setup() {
  const events: VoiceEvent[] = [];
  const reports: number[][] = [];
  const input = createNoteInput((e) => events.push(e), (notes) => reports.push(notes));
  /** The Notes the on-screen piano lights now. */
  const lit = () => reports.at(-1) ?? [];
  return { input, events, lit };
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
  it('keeps the held Note lit on the piano after its key is released, until Hold is switched off', () => {
    const { input, lit } = setup();
    input.setHold(true);
    input.press(60, 1);
    input.release(60);
    expect(lit()).toEqual([60]);
    input.setHold(false);
    expect(lit()).toEqual([]);
  });

  it('lights the Note that Hold keeps sounding, and moves the light to a new key that replaces it', () => {
    const { input, lit } = setup();
    input.setHold(true);
    input.press(60, 1);
    input.press(64, 1);
    input.release(64); // back to C4
    input.release(60);
    expect(lit()).toEqual([60]);
    input.press(67, 1);
    input.release(67);
    expect(lit()).toEqual([67]);
  });

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

describe('several Voices (polyphony, ADR-0007)', () => {
  const poly = (count: 2 | 3 | 4 = 4) => {
    const s = setup();
    s.input.setVoices(count);
    return s;
  };

  it('starts a Note On for every key pressed, so a chord sounds', () => {
    const { input, events } = poly();
    input.press(60, 1);
    input.press(64, 0.5);
    expect(events).toEqual([
      { type: 'noteOn', note: 60, velocity: 1 },
      { type: 'noteOn', note: 64, velocity: 0.5 },
    ]);
  });

  it('releases only the Note whose key went up; the others keep sounding', () => {
    const { input, events } = poly();
    input.press(60, 1);
    input.press(64, 1);
    input.release(60);
    expect(events.at(-1)).toEqual({ type: 'release', note: 60 });
    input.release(64);
    expect(events.at(-1)).toEqual({ type: 'release', note: 64 });
  });

  it('with Hold, keeps released Notes sounding until Hold is switched off', () => {
    const { input, events } = poly();
    input.setHold(true);
    input.press(60, 1);
    input.release(60);
    expect(events.filter((e) => e.type === 'release')).toHaveLength(0);
    input.setHold(false);
    expect(events.at(-1)).toEqual({ type: 'release', note: 60 });
  });

  it('with Hold, released Notes stay lit until Hold is switched off or the Voices change', () => {
    const { input, lit } = poly();
    input.setHold(true);
    input.press(60, 1);
    input.press(64, 1);
    input.release(60);
    input.release(64);
    expect(lit()).toEqual([60, 64]);
    input.press(67, 1);
    expect(lit()).toEqual([60, 64, 67]);
    input.setHold(false);
    expect(lit()).toEqual([67]);
    input.release(67);
    input.setHold(true);
    input.press(60, 1);
    input.release(60);
    input.setVoices(2);
    expect(lit()).toEqual([]);
  });

  it('with Hold, keeps at most as many Notes as Voices: a Note beyond them lets the oldest go', () => {
    const { input, events, lit } = poly(2);
    input.setHold(true);
    for (const note of [60, 64]) {
      input.press(note, 1);
      input.release(note);
    }
    input.press(67, 1);
    expect(lit()).toEqual([64, 67]);
    expect(events.slice(-2)).toEqual([{ type: 'noteOn', note: 67, velocity: 1 }, { type: 'release', note: 60 }]);
    input.release(67);
    input.press(72, 1);
    expect(lit()).toEqual([67, 72]);
    input.setHold(false);
    expect(events.filter((e) => e.type === 'release').map((e) => (e as { note: number }).note).sort()).toEqual([60, 64, 67]);
  });

  it('lights at most as many keys as Voices: the newest, which are the ones sounding', () => {
    const { input, lit } = poly(2);
    input.press(60, 1);
    input.press(64, 1);
    input.press(67, 1);
    expect(lit()).toEqual([64, 67]);
    input.release(67);
    expect(lit()).toEqual([64]);
  });

  it('with Hold, pressing a held Note again retriggers it rather than releasing it', () => {
    const { input, events } = poly();
    input.setHold(true);
    input.press(60, 1);
    input.release(60);
    input.press(60, 0.8);
    expect(events.at(-1)).toEqual({ type: 'noteOn', note: 60, velocity: 0.8 });
    input.setHold(false); // the key is down again, so Hold off releases nothing
    expect(events.filter((e) => e.type === 'release')).toHaveLength(0);
  });

  it('keeps a Note sounding until every source holding it lets go', () => {
    const { input, events } = poly();
    input.press(60, 1);
    input.press(60, 1);
    input.release(60);
    expect(events.filter((e) => e.type === 'release')).toHaveLength(0);
    input.release(60);
    expect(events.at(-1)).toEqual({ type: 'release', note: 60 });
  });

  it('changing the number of Voices releases everything sounding, once', () => {
    const { input, events } = setup();
    input.press(60, 1);
    input.setVoices(4);
    expect(events.at(-1)).toEqual({ type: 'noteOff' });
    input.press(64, 1);
    input.press(67, 1);
    input.setVoices(1);
    expect(events.at(-1)).toEqual({ type: 'noteOff' });
    input.setVoices(1); // the same again: nothing happens
    expect(events.filter((e) => e.type === 'noteOff')).toHaveLength(2);
  });

  it('is last-note priority again back at one Voice', () => {
    const { input, events } = poly();
    input.setVoices(1);
    input.press(60, 1);
    input.press(64, 1);
    input.release(64);
    expect(events.at(-1)).toEqual({ type: 'pitchChange', note: 60 });
  });
});
