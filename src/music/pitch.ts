const A4_MIDI = 69;
const A4_HZ = 440;

/** Equal-tempered frequency of a MIDI note number, tuned to A4 = 440 Hz. */
export function noteToFrequency(midiNote: number): number {
  return A4_HZ * 2 ** ((midiNote - A4_MIDI) / 12);
}
