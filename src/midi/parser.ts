export type MidiMessage =
  | { type: 'noteOn'; channel: number; note: number; velocity: number }
  | { type: 'noteOff'; channel: number; note: number }
  | { type: 'cc'; channel: number; controller: number; value: number };

/** Data bytes each channel message carries, by its high nibble. */
const DATA_BYTES: Record<number, number> = { 0x80: 2, 0x90: 2, 0xa0: 2, 0xb0: 2, 0xc0: 1, 0xd0: 1, 0xe0: 2 };

/**
 * A streaming MIDI parser: feed it the bytes of each incoming packet. It follows running status (data bytes
 * reuse the last status), ignores real-time bytes (clock, keep-alive) wherever they fall, skips system-exclusive
 * dumps, and reports only what SynthView uses: notes and control changes.
 */
export function createMidiParser() {
  let status = 0;
  let data: number[] = [];
  let inSysex = false;
  let systemBytesToSkip = 0;

  return {
    feed(bytes: Uint8Array): MidiMessage[] {
      const out: MidiMessage[] = [];
      for (const byte of bytes) {
        if (byte >= 0xf8) continue; // real-time: may appear anywhere, never affects running status
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
    default:
      return undefined;
  }
}
