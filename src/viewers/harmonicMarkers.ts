import { nearestNote } from '../music/pitch';

export interface HarmonicMarker {
  n: number;
  frequency: number;
  /** Nearest note, with the cents offset when it isn't in tune, e.g. "G5 −31¢". */
  note: string;
  /** Whether there is room to print the label without colliding with the previous one. */
  labelled: boolean;
}

interface Options {
  maxFrequency: number;
  xOf(frequency: number): number;
  minLabelGap: number;
}

/** Harmonic Markers for a fundamental: one per Harmonic, labelled only where the axis has room. */
export function harmonicMarkers(fundamental: number, { maxFrequency, xOf, minLabelGap }: Options): HarmonicMarker[] {
  if (!(fundamental > 0)) return [];
  const markers: HarmonicMarker[] = [];
  let lastLabelX = -Infinity;
  for (let n = 1; n * fundamental <= maxFrequency; n++) {
    const frequency = n * fundamental;
    const { name, cents } = nearestNote(frequency);
    const x = xOf(frequency);
    const labelled = x - lastLabelX >= minLabelGap;
    if (labelled) lastLabelX = x;
    markers.push({ n, frequency, note: cents ? `${name} ${cents > 0 ? '+' : '−'}${Math.abs(cents)}¢` : name, labelled });
  }
  return markers;
}
