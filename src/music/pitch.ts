export const A4_MIDI = 69;
const A4_HZ = 440;

/**
 * A frequency as a knob reads it: "2.00 Hz", "300 Hz", "2.50 kHz". A synced Rate's Hz reads the same as the Rate in Hz
 * (issue 193).
 */
export function frequencyText(hz: number): string {
  if (hz >= 1000) return `${(hz / 1000).toFixed(2)} kHz`;
  return hz < 10 ? `${hz.toFixed(2)} Hz` : `${Math.round(hz)} Hz`;
}

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
