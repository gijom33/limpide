import { describe, expect, it } from 'vitest';
import { createMidiParser } from './parser';

const parse = (...bytes: number[]) => createMidiParser().feed(Uint8Array.from(bytes));

describe('MIDI parser', () => {
  it('reads a note-on, with its channel and Velocity (0–1)', () => {
    expect(parse(0x90, 60, 127)).toEqual([{ type: 'noteOn', channel: 1, note: 60, velocity: 1 }]);
    expect(parse(0x93, 64, 64)).toEqual([{ type: 'noteOn', channel: 4, note: 64, velocity: 64 / 127 }]);
  });

  it('reads a note-off', () => {
    expect(parse(0x80, 60, 0)).toEqual([{ type: 'noteOff', channel: 1, note: 60 }]);
  });

  it('treats a note-on with Velocity 0 as a note-off, as many controllers send', () => {
    expect(parse(0x90, 60, 0)).toEqual([{ type: 'noteOff', channel: 1, note: 60 }]);
  });

  it('reads a control change (a knob or fader)', () => {
    expect(parse(0xb0, 74, 100)).toEqual([{ type: 'cc', channel: 1, controller: 74, value: 100 }]);
  });

  it('follows running status: data bytes without a new status byte reuse the last one', () => {
    expect(parse(0x90, 60, 100, 64, 100, 60, 0)).toEqual([
      { type: 'noteOn', channel: 1, note: 60, velocity: 100 / 127 },
      { type: 'noteOn', channel: 1, note: 64, velocity: 100 / 127 },
      { type: 'noteOff', channel: 1, note: 60 },
    ]);
  });

  it('keeps running status across separate packets', () => {
    const parser = createMidiParser();
    parser.feed(Uint8Array.of(0xb0, 74, 10));
    expect(parser.feed(Uint8Array.of(74, 11))).toEqual([{ type: 'cc', channel: 1, controller: 74, value: 11 }]);
  });

  it('ignores clock and keep-alive bytes, even in the middle of a message, without losing running status', () => {
    expect(parse(0x90, 0xf8, 60, 0xfe, 100, 0xf8, 62, 90)).toEqual([
      { type: 'noteOn', channel: 1, note: 60, velocity: 100 / 127 },
      { type: 'noteOn', channel: 1, note: 62, velocity: 90 / 127 },
    ]);
  });

  it('skips system-exclusive dumps and messages it does not use', () => {
    // Aftertouch, channel (0xd0) and per Note (0xa0), is not used.
    expect(parse(0xf0, 0x7e, 0x01, 0xf7, 0xd0, 64, 0xa0, 60, 30, 0x90, 60, 1)).toEqual([
      { type: 'noteOn', channel: 1, note: 60, velocity: 1 / 127 },
    ]);
  });
});

describe('pitch bend and program changes (issue 52)', () => {
  it('reads the bend wheel as −1 to 1, 0 at rest', () => {
    const parser = createMidiParser();
    expect(parser.feed(Uint8Array.from([0xe0, 0x00, 0x40]))).toEqual([{ type: 'pitchBend', channel: 1, value: 0 }]);
    expect(parser.feed(Uint8Array.from([0xe1, 0x7f, 0x7f]))).toEqual([{ type: 'pitchBend', channel: 2, value: 1 }]);
    expect(parser.feed(Uint8Array.from([0xe0, 0x00, 0x00]))).toEqual([{ type: 'pitchBend', channel: 1, value: -1 }]);
  });
  it('reads a Program Change, one data byte', () => {
    const parser = createMidiParser();
    expect(parser.feed(Uint8Array.from([0xc0, 5, 0xc0, 6]))).toEqual([
      { type: 'program', channel: 1, program: 5 },
      { type: 'program', channel: 1, program: 6 },
    ]);
  });
});
