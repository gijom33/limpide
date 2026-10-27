import type { FilterMode, FilterSlope } from '../patch/patch';
import { useLearnable } from './learn';
import { Segmented } from './Segmented';
import { Tooltip } from './Tooltip';
import { TIPS } from './tips';

// Each Mode's response shape, drawn in a 24×14 box: what it keeps, at a glance.
const MODES: { mode: FilterMode; label: string; path: string }[] = [
  { mode: 'lowpass', label: 'Low-pass', path: 'M2 5 H11 C15 5 16 12 22 12' },
  { mode: 'highpass', label: 'High-pass', path: 'M2 12 C8 12 9 5 13 5 H22' },
  { mode: 'bandpass', label: 'Band-pass', path: 'M2 12 C8 12 9 4 12 4 C15 4 16 12 22 12' },
  { mode: 'notch', label: 'Notch', path: 'M2 5 H8 C10 5 11 12 12 12 C13 12 14 5 16 5 H22' },
];

interface Props {
  mode: FilterMode;
  slope: FilterSlope;
  onChange(change: { mode?: FilterMode; slope?: FilterSlope }): void;
}

/** Filter Mode (icon picker) and Slope, on the Filter heading line. */
export function FilterShape({ mode, slope, onChange }: Props) {
  const learnMode = useLearnable({ kind: 'choice', id: 'filterMode' });
  return (
    <div className="filter-shape">
      <Tooltip content={TIPS.filterMode}>
        <div className="segmented icon-picker filter-modes" role="radiogroup" aria-label="Filter Mode" {...learnMode}>
          {MODES.map((m) => (
            <button key={m.mode} type="button" role="radio" aria-checked={m.mode === mode} aria-label={m.label} onClick={() => onChange({ mode: m.mode })}>
              <svg viewBox="0 0 24 16" width="24" height="16" aria-hidden="true">
                <path d={m.path} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          ))}
        </div>
      </Tooltip>
      <Tooltip content={TIPS.slope}>
        <Segmented
          label="Slope"
          value={slope}
          options={[
            { value: 12, label: '12', name: '12 dB' },
            { value: 24, label: '24', name: '24 dB' },
          ]}
          onChange={(s) => onChange({ slope: s })}
          learn={{ kind: 'choice', id: 'filterSlope' }}
        />
      </Tooltip>
    </div>
  );
}
