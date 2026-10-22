import type { Waveform } from '../music/harmonics';

// One cycle of each Waveform, drawn in a 28×16 box.
const ICONS: Record<Waveform, string> = {
  sine: 'M2 8 C6 -1, 10 -1, 14 8 S22 17, 26 8',
  triangle: 'M2 8 L8 2 L20 14 L26 8',
  saw: 'M2 14 L14 2 L14 14 L26 2',
  square: 'M2 14 L2 2 L14 2 L14 14 L26 14 L26 2',
  pulse: 'M2 14 L2 2 L7 2 L7 14 L26 14 L26 2',
};

const LABELS: Record<Waveform, string> = { sine: 'Sine', triangle: 'Triangle', saw: 'Saw', square: 'Square', pulse: 'Pulse' };

interface Props {
  /** Accessible name, e.g. "Osc 1 Waveform". */
  label: string;
  value: Waveform;
  onChange(waveform: Waveform): void;
  /** Icons only (names stay available to tooltips and screen readers). */
  compact?: boolean;
}

export function WaveformPicker({ label, value, onChange, compact }: Props) {
  return (
    <div className="waveforms" data-compact={compact || undefined} role="radiogroup" aria-label={label}>
      {(Object.keys(ICONS) as Waveform[]).map((w) => (
        <button
          key={w}
          type="button"
          role="radio"
          aria-checked={w === value}
          aria-label={LABELS[w]}
          className="waveform"
          onClick={() => onChange(w)}
        >
          <svg viewBox="0 0 28 16" width="28" height="16" aria-hidden="true">
            <path d={ICONS[w]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          {!compact && <span>{LABELS[w]}</span>}
        </button>
      ))}
    </div>
  );
}
