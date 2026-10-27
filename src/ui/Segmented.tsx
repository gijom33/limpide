import type { Target } from '../midi/mappings';
import { useLearnable } from './learn';
import { radioGroupKeys, radioTabIndex } from './radioGroup';

interface Props<T extends string | number> {
  /** Accessible name of the choice, e.g. "Frequency axis". */
  label: string;
  /** Short visible caption, e.g. "Freq". */
  caption?: string;
  value: T;
  /** `name` is the accessible name when the visible label is abbreviated (e.g. "12" for "12 dB"). */
  options: readonly { value: T; label: string; name?: string }[];
  onChange(value: T): void;
  /** What MIDI Learn maps when this choice is clicked in Learn, if it can be mapped. */
  learn?: Target;
}

/** One either/or choice drawn as a single control with the selected segment filled. */
export function Segmented<T extends string | number>({ label, caption, value, options, onChange, learn }: Props<T>) {
  const learnable = useLearnable(learn);
  return (
    <div className="segmented-field">
      {caption && <span className="field-caption" aria-hidden="true">{caption}</span>}
      <div className="segmented" role="radiogroup" aria-label={label} onKeyDown={radioGroupKeys} {...learnable}>
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
    </div>
  );
}
