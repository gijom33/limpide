import type { Dispatch } from 'react';
import type { ViewerAction, ViewerState } from '../viewers/viewerState';

interface Props {
  state: ViewerState;
  dispatch: Dispatch<ViewerAction>;
}

function Segmented<T extends string>({ label, hint, value, options, onChange }: {
  label: string;
  hint: string;
  value: T;
  options: { value: T; label: string }[];
  onChange(value: T): void;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label} title={hint}>
      <span aria-hidden="true">{label}</span>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Freeze, Snapshot and the Spectrum axes. */
export function ViewerControls({ state, dispatch }: Props) {
  return (
    <>
      <button
        type="button"
        className="tool"
        aria-pressed={state.frozen}
        title="Freeze every Viewer on this frame while the sound keeps playing (Space)"
        onClick={() => dispatch({ type: 'toggleFreeze' })}
      >
        Freeze
      </button>
      <span className="tool-pair">
        <button
          type="button"
          className="tool"
          aria-pressed={state.snapshot !== null}
          title="Keep this frame of every Spectrum as a faint trace, to compare after you turn a knob"
          onClick={() => dispatch({ type: 'takeSnapshot' })}
        >
          Snapshot
        </button>
        {state.snapshot !== null && (
          <button type="button" className="tool" aria-label="Clear Snapshot" title="Clear Snapshot" onClick={() => dispatch({ type: 'clearSnapshot' })}>
            ×
          </button>
        )}
      </span>
      <Segmented
        label="Hz"
        hint="Frequency axis: log matches how we hear; linear (0–5 kHz) spaces Harmonics evenly, like a ladder"
        value={state.frequencyScale}
        options={[{ value: 'log', label: 'Log' }, { value: 'linear', label: 'Lin' }]}
        onChange={(scale) => dispatch({ type: 'setFrequencyScale', scale })}
      />
      <Segmented
        label="Level"
        hint="Level axis: dB shows quiet Harmonics too; linear shows amplitude as it really scales"
        value={state.levelScale}
        options={[{ value: 'db', label: 'dB' }, { value: 'linear', label: 'Lin' }]}
        onChange={(scale) => dispatch({ type: 'setLevelScale', scale })}
      />
    </>
  );
}
