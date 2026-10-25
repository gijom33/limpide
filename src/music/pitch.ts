const A4_MIDI = 69;
const A4_HZ = 440;

/** Equal-tempered frequency of a MIDI note number, tuned to A4 = 440 Hz. */
export function noteToFrequency(midiNote: number): number {
  return A4_HZ * 2 ** ((midiNote - A4_MIDI) / 12);
}

/** The MIDI note number of a frequency, fractional between notes. */
export function frequencyToNote(frequency: number): number {
  return A4_MIDI + 12 * Math.log2(frequency / A4_HZ);
}

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Nearest equal-tempered note to a frequency, and the offset from it in cents (−50…+50). */
export function nearestNote(frequency: number): { name: string; cents: number } {
  const midi = frequencyToNote(frequency);
  const nearest = Math.round(midi);
  const cents = Math.round((midi - nearest) * 100);
  return { name: `${NAMES[((nearest % 12) + 12) % 12]}${Math.floor(nearest / 12) - 1}`, cents: cents === 0 ? 0 : cents };
}
