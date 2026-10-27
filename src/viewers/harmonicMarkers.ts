import { nearestNote } from '../music/pitch';

export interface HarmonicMarker {
  n: number;
  frequency: number;
  /** Nearest note, with the cents offset when it isn't in tune, e.g. "G5 −31¢". */
  note: string;
  /** Whether there is room to print the label without colliding with the previous one. */
  labelled: boolean;
  /** Where its label is centred: at its tick, but for a fundamental under the Viewer's name, just past it. */
  labelX: number;
}

interface Options {
  maxFrequency: number;
  xOf(frequency: number): number;
  minLabelGap: number;
  /** No labels past this x (something else is printed there); every Harmonic still gets its tick. */
  labelsEndAt?: number;
  /** No labels before this x (the Viewer's name is printed there), but the fundamental's, moved to start here. */
  labelsStartAt?: number;
  /** Half a fundamental label's width, so a moved one starts past `labelsStartAt` rather than centred on it. */
  halfLabel?: number;
  /** Mark only the first this many Harmonics. */
  count?: number;
  /** Label every marker, a crowded label nudged clear of the one before it, rather than leaving it out. */
  labelAll?: boolean;
}

/** Harmonic Markers for a fundamental: one per Harmonic, labelled only where the axis has room. */
export function harmonicMarkers(
  fundamental: number,
  { maxFrequency, xOf, minLabelGap, labelsEndAt = Infinity, labelsStartAt = -Infinity, halfLabel = 0, count = Infinity, labelAll = false }: Options,
): HarmonicMarker[] {
  if (!(fundamental > 0)) return [];
  const markers: HarmonicMarker[] = [];
  let lastLabelX = -Infinity;
  for (let n = 1; n <= count && n * fundamental <= maxFrequency; n++) {
    const frequency = n * fundamental;
    const { name, cents } = nearestNote(frequency);
    const x = xOf(frequency);
    // The fundamental names the Note, so it keeps its label, moved clear of the name if it sits under it.
    let labelX = n === 1 && x - halfLabel < labelsStartAt ? labelsStartAt + halfLabel : x;
    if (labelAll) labelX = Math.max(labelX, lastLabelX + minLabelGap);
    const labelled = labelX - lastLabelX >= minLabelGap && labelX <= labelsEndAt && (n === 1 || x - halfLabel >= labelsStartAt);
    if (labelled) lastLabelX = labelX;
    markers.push({ n, frequency, note: cents ? `${name} ${cents > 0 ? '+' : '−'}${Math.abs(cents)}¢` : name, labelled, labelX });
  }
  return markers;
}
