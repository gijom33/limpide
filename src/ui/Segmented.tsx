import type { ReactNode } from 'react';
import type { Target } from '../midi/mappings';
import { useInactive } from './inactive';
import { useLearnable } from './learn';
import { radioGroupKeys, radioTabIndex } from './radioGroup';

interface Props<T extends string | number> {
  /** Accessible name of the choice, e.g. "Frequency axis". */
  label: string;
  /** Short visible caption, e.g. "Freq". */
  caption?: string;
  value: T;
  /** `name` is the accessible name when the visible label is abbreviated (e.g. "12" for "12 dB") or a picture. */
  options: readonly { value: T; label: ReactNode; name?: string }[];
  onChange(value: T): void;
  /** What MIDI Learn maps when this choice is clicked in Learn, if it can be mapped. */
  learn?: Target;
  /** Cells as wide as the Waveform picker's, for short labels and pictures (the Sub's, the Noise's). */
  iconic?: boolean;
  /** Why it has no audible effect right now: greyed out, as a knob is, while what it sets is not heard; it still works. */
  inactive?: string | false;
}

/** One either/or choice drawn as a single control with the selected segment filled. */
export function Segmented<T extends string | number>({ label, caption, value, options, onChange, learn, iconic, inactive }: Props<T>) {
  const learnable = useLearnable(learn);
  const dimmed = useInactive(inactive);
  return (
    <div className="segmented-field" {...dimmed.props}>
      {caption && <span className="field-caption" aria-hidden="true">{caption}</span>}
      <div className={iconic ? 'segmented icon-picker' : 'segmented'} role="radiogroup" aria-label={label} onKeyDown={radioGroupKeys} {...learnable}>
        {options.map((o, i) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            tabIndex={radioTabIndex(o.value === value, i, options.some((x) => x.value === value))}
            aria-label={o.name}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {dimmed.note}
    </div>
  );
}
