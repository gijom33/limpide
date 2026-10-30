import type { Waveform } from '../music/harmonics';
import { useLearnable } from './learn';
import { radioGroupKeys, radioTabIndex } from './radioGroup';

// One cycle of each Waveform, drawn in a 28×16 box.
const ICONS: Record<Waveform, string> = {
  sine: 'M2 8 C6 -1, 10 -1, 14 8 S22 17, 26 8',
  triangle: 'M2 8 L8 2 L20 14 L26 8',
  saw: 'M2 14 L14 2 L14 14 L26 2',
  square: 'M2 14 L2 2 L14 2 L14 14 L26 14 L26 2',
  pulse: 'M2 14 L2 2 L7 2 L7 14 L26 14 L26 2',
};

/** The Waveforms in on-screen order, so a Controller steps through them as they appear. */
export const WAVEFORM_ORDER = Object.keys(ICONS) as Waveform[];

const LABELS: Record<Waveform, string> = { sine: 'Sine', triangle: 'Triangle', saw: 'Saw', square: 'Square', pulse: 'Pulse' };

interface Props {
  /** Accessible name, e.g. "Osc 1 Waveform". */
  label: string;
  value: Waveform;
  onChange(waveform: Waveform): void;
  /** Which Oscillator's Waveform this is, for MIDI Learn. */
  choice: 'waveform' | 'osc2Waveform';
  /** Greyed out, as a knob is, while the Oscillator is not heard; it still works. */
  inactive?: boolean;
}

/** One cycle of a Waveform, drawn as the picker draws it (the Sub's square and sine too). */
export function WaveIcon({ waveform }: { waveform: Waveform }) {
  return (
    <svg viewBox="0 0 28 16" width="20" height="12" aria-hidden="true">
      <path d={ICONS[waveform]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/** The Waveforms as icons in one segmented track (their names are the radios' accessible labels). */
export function WaveformPicker({ label, value, onChange, choice, inactive }: Props) {
  const learnable = useLearnable({ kind: 'choice', id: choice });
  return (
    <div
      className="segmented icon-picker waveforms"
      role="radiogroup"
      aria-label={label}
      data-inactive={inactive || undefined}
      onKeyDown={radioGroupKeys}
      {...learnable}
    >
      {WAVEFORM_ORDER.map((w, i) => (
        <button
          key={w}
          type="button"
          role="radio"
          aria-checked={w === value}
          tabIndex={radioTabIndex(w === value, i, true)}
          aria-label={LABELS[w]}
          onClick={() => onChange(w)}
        >
          <svg viewBox="0 0 28 16" width="24" height="14" aria-hidden="true">
            <path d={ICONS[w]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        </button>
      ))}
    </div>
  );
}
