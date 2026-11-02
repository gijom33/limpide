export type MidiMessage =
  | { type: 'noteOn'; channel: number; note: number; velocity: number }
  | { type: 'noteOff'; channel: number; note: number }
  | { type: 'cc'; channel: number; controller: number; value: number }
  /** The pitch bend wheel, −1 (all the way down) to 1, 0 at rest (issue 52). */
  | { type: 'pitchBend'; channel: number; value: number }
  /** A Program Change: the program number, 0 to 127. */
  | { type: 'program'; channel: number; program: number }
  /** Channel aftertouch: how hard the keys are pressed, one pressure for the whole keyboard, 0 to 1 (issue 132). */
  | { type: 'pressure'; channel: number; value: number };

/**
 * A MIDI clock's real-time messages (issue 136): a tick, 24 to the beat, and the transport's Start (the next tick is
 * the first beat), Continue (from where it stopped) and Stop. A keyboard's or a DAW's, whichever channel it plays on.
 */
export type ClockMessage = { type: 'clock' } | { type: 'start' } | { type: 'continue' } | { type: 'stop' };

/** The real-time bytes Limpide reads; the rest (keep-alive, reset, the undefined two) are skipped. */
const CLOCK_BYTES: Record<number, ClockMessage> = {
  0xf8: { type: 'clock' }, 0xfa: { type: 'start' }, 0xfb: { type: 'continue' }, 0xfc: { type: 'stop' },
};

/** Data bytes each channel message carries, by its high nibble. */
const DATA_BYTES: Record<number, number> = { 0x80: 2, 0x90: 2, 0xa0: 2, 0xb0: 2, 0xc0: 1, 0xd0: 1, 0xe0: 2 };

/**
 * A streaming MIDI parser: feed it the bytes of each incoming packet. It follows running status (data bytes
 * reuse the last status), reads the clock's real-time bytes wherever they fall, even inside another message, without
 * touching running status (issue 136), skips keep-alive and system-exclusive dumps, and reports only what Limpide uses:
 * notes, control changes, pitch bend, program changes, channel aftertouch (per-Note pressure is read past and dropped,
 * issue 132) and the clock.
 */
export function createMidiParser() {
  let status = 0;
  let data: number[] = [];
  let inSysex = false;
  let systemBytesToSkip = 0;

  return {
    feed(bytes: Uint8Array): (MidiMessage | ClockMessage)[] {
      const out: (MidiMessage | ClockMessage)[] = [];
      for (const byte of bytes) {
        if (byte >= 0xf8) {
          // Real-time: may appear anywhere, never affects running status.
          if (CLOCK_BYTES[byte]) out.push({ ...CLOCK_BYTES[byte] });
          continue;
        }
        if (byte >= 0x80) {
          data = [];
          if (byte === 0xf0) {
            inSysex = true;
            status = 0;
          } else if (byte === 0xf7) {
            inSysex = false;
          } else if (byte >= 0xf0) {
            status = 0; // system common cancels running status
            systemBytesToSkip = byte === 0xf2 ? 2 : byte === 0xf1 || byte === 0xf3 ? 1 : 0;
          } else {
            status = byte;
          }
          continue;
        }
        if (inSysex) continue;
        if (systemBytesToSkip > 0) {
          systemBytesToSkip--;
          continue;
        }
        if (!status) continue;
        data.push(byte);
        if (data.length < DATA_BYTES[status & 0xf0]) continue;
        const message = toMessage(status, data);
        if (message) out.push(message);
        data = [];
      }
      return out;
    },
  };
}

function toMessage(status: number, [a, b]: number[]): MidiMessage | undefined {
  const channel = (status & 0x0f) + 1;
  switch (status & 0xf0) {
    case 0x90:
      return b > 0 ? { type: 'noteOn', channel, note: a, velocity: b / 127 } : { type: 'noteOff', channel, note: a };
    case 0x80:
      return { type: 'noteOff', channel, note: a };
    case 0xb0:
      return { type: 'cc', channel, controller: a, value: b };
    case 0xe0: {
      // 14 bits, the low 7 first; 8192 is the centre. The ends reach exactly ±1.
      const raw = a | (b << 7);
      return { type: 'pitchBend', channel, value: raw >= 8192 ? (raw - 8192) / 8191 : (raw - 8192) / 8192 };
    }
    case 0xc0:
      return { type: 'program', channel, program: a };
    case 0xd0:
      return { type: 'pressure', channel, value: a / 127 };
    default:
      return undefined;
  }
}
