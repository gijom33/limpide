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
