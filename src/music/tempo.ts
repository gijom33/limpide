/**
 * The tempo (issue 112): the page's, not the Patch's, a whole BPM; an LFO with Sync on repeats once a note value at
 * it. The note values go from 4 bars to 1/32, each straight, dotted (half as long again) and triplet (two thirds as
 * long), slowest first, so the Rate knob turns them faster clockwise as it turns the Hz.
 */
export const TEMPO = { min: 40, max: 240, default: 120 } as const;

/** A BPM the tempo can be: whole, from 40 to 240. */
export const clampBpm = (bpm: number) => Math.min(TEMPO.max, Math.max(TEMPO.min, Math.round(bpm)));

/** The tempo as a control's position (0–1, slowest to fastest), as a knob mapped to it turns it, and back. */
export const bpmPosition = (bpm: number) => (bpm - TEMPO.min) / (TEMPO.max - TEMPO.min);
export const positionBpm = (position: number) => TEMPO.min + position * (TEMPO.max - TEMPO.min);
/** A whole BPM's share of the tempo control's travel. */
export const BPM_STEP = bpmPosition(TEMPO.min + 1);

const STRAIGHT: [name: string, beats: number][] = [
  ['4 bars', 16], ['2 bars', 8], ['1 bar', 4], ['1/2', 2], ['1/4', 1], ['1/8', 0.5], ['1/16', 0.25], ['1/32', 0.125],
];

/** Each note value's name, as the Rate knob reads it ("1/4 D", "1/8 T"), and its length in beats. */
export const NOTE_VALUES: readonly { name: string; beats: number }[] = STRAIGHT.flatMap(([name, beats]) => [
  { name, beats },
  { name: `${name} D`, beats: beats * 1.5 },
  { name: `${name} T`, beats: (beats * 2) / 3 },
]).sort((a, b) => b.beats - a.beats);

/** A note value's place in the list, by its name. */
export const noteIndex = (name: string) => NOTE_VALUES.findIndex((v) => v.name === name);

/** How often a note value repeats at `bpm`, in Hz: beats a second over its beats. */
export const noteHz = (index: number, bpm: number) => bpm / 60 / NOTE_VALUES[index].beats;

/**
 * A synced Rate's note value, which its knob reads, and its Hz to three figures, which its tip gives and the Synth Geek
 * Layer works out ("1/8", "4 Hz", "1.33 Hz").
 */
export function formatSyncedRate(index: number, bpm: number): { note: string; hz: string } {
  return { note: NOTE_VALUES[index].name, hz: `${Number(noteHz(index, bpm).toPrecision(3))} Hz` };
}

/** Taps further apart than the slowest beat start the count again. */
const LONGEST_TAP = 60 / TEMPO.min;
/** How many of the last taps the tempo is taken from. */
export const TAPS = 4;

/**
 * The BPM the taps give (their times in seconds, oldest first): the mean time between the last four, from the second
 * tap on; undefined until then. A pause longer than the slowest beat starts the count again.
 */
export function tappedBpm(times: readonly number[]): number | undefined {
  let first = times.length - 1;
  while (first > 0 && first > times.length - TAPS && times[first] - times[first - 1] <= LONGEST_TAP) first--;
  const taps = times.slice(first);
  if (taps.length < 2) return undefined;
  return clampBpm((60 * (taps.length - 1)) / (taps[taps.length - 1] - taps[0]));
}
