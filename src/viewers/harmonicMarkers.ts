import { nearestNote } from '../music/pitch';

export interface HarmonicMarker {
  n: number;
  frequency: number;
  /** Nearest note, with the cents offset when it isn't in tune, e.g. "G5 −31¢". */
  note: string;
  /** Whether there is room to print the label without colliding with the previous one. */
  labelled: boolean;
  /** Where its label is centred: at its tick, or nudged clear of the label before it (`labelAll`). */
  labelX: number;
}

interface Options {
  maxFrequency: number;
  xOf(frequency: number): number;
  minLabelGap: number;
  /** No labels past this x (something else is printed there); every Harmonic still gets its tick. */
  labelsEndAt?: number;
  /** Label only the first this many Harmonics; the rest keep their ticks. */
  labelUpTo?: number;
  /** Label every one of those, a crowded label nudged clear of the one before it, rather than leaving it out. */
  labelAll?: boolean;
}

/** Harmonic Markers for a fundamental: one per Harmonic, labelled only where the axis has room. */
export function harmonicMarkers(
  fundamental: number,
  { maxFrequency, xOf, minLabelGap, labelsEndAt = Infinity, labelUpTo = Infinity, labelAll = false }: Options,
): HarmonicMarker[] {
  if (!(fundamental > 0)) return [];
  const markers: HarmonicMarker[] = [];
  let lastLabelX = -Infinity;
  for (let n = 1; n * fundamental <= maxFrequency; n++) {
    const frequency = n * fundamental;
    const { name, cents } = nearestNote(frequency);
    const x = xOf(frequency);
    const labelX = labelAll && n <= labelUpTo ? Math.max(x, lastLabelX + minLabelGap) : x;
    const labelled = n <= labelUpTo && labelX - lastLabelX >= minLabelGap && labelX <= labelsEndAt;
    if (labelled) lastLabelX = labelX;
    markers.push({ n, frequency, note: cents ? `${name} ${cents > 0 ? '+' : '−'}${Math.abs(cents)}¢` : name, labelled, labelX });
  }
  return markers;
}
