interface Props<T extends string | number> {
  /** Accessible name of the choice, e.g. "Frequency axis". */
  label: string;
  /** Short visible caption, e.g. "Freq". */
  caption?: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange(value: T): void;
}

/** One either/or choice drawn as a single control with the selected segment filled. */
export function Segmented<T extends string | number>({ label, caption, value, options, onChange }: Props<T>) {
  return (
    <div className="segmented-field">
      {caption && <span className="field-caption" aria-hidden="true">{caption}</span>}
      <div className="segmented" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={String(o.value)} type="button" role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
