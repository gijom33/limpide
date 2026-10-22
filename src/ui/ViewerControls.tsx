import type { Dispatch } from 'react';
import type { ViewerAction, ViewerState } from '../viewers/viewerState';
import type { ViewSettings } from '../viewers/viewSettings';
import { CameraIcon, CloseIcon, PauseIcon } from './icons';
import { Segmented } from './Segmented';

interface Props {
  state: ViewerState;
  dispatch: Dispatch<ViewerAction>;
}

/** Freeze and Snapshot: actions on what the Viewers show. */
export function ViewActions({ state, dispatch }: Props) {
  return (
    <>
      <button
        type="button"
        className="tool tool-mode"
        aria-pressed={state.frozen}
        aria-keyshortcuts="Space"
        title="Freeze every Viewer on this frame while the sound keeps playing"
        onClick={() => dispatch({ type: 'toggleFreeze' })}
      >
        <PauseIcon />
        Freeze
        <kbd aria-hidden="true">Space</kbd>
      </button>
      <div className="tool-split">
        <button
          type="button"
          className="tool"
          aria-pressed={state.snapshot !== null}
          title="Keep this frame of every Spectrum as a faint trace, to compare after you turn a knob"
          onClick={() => dispatch({ type: 'takeSnapshot' })}
        >
          <CameraIcon />
          Snapshot
        </button>
        {state.snapshot !== null && (
          <button type="button" className="tool tool-icon" aria-label="Clear Snapshot" title="Clear Snapshot" onClick={() => dispatch({ type: 'clearSnapshot' })}>
            <CloseIcon />
          </button>
        )}
      </div>
    </>
  );
}

const CYCLES = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 4, label: '4' },
] as const;

/** How the Spectrum and Scope axes are scaled. */
export function AxesControls({ state, dispatch, cycles, onCycles }: Props & { cycles: ViewSettings['cycles']; onCycles(c: ViewSettings['cycles']): void }) {
  return (
    <>
      <Segmented
        label="Frequency axis"
        caption="Freq"
        hint="Frequency axis: log matches how we hear; linear (0–5 kHz) spaces Harmonics evenly, like a ladder"
        value={state.frequencyScale}
        options={[{ value: 'log', label: 'Log' }, { value: 'linear', label: 'Lin' }]}
        onChange={(scale) => dispatch({ type: 'setFrequencyScale', scale })}
      />
      <Segmented
        label="Level axis"
        caption="Level"
        hint="Level axis: dB shows quiet Harmonics too; linear shows amplitude as it really scales"
        value={state.levelScale}
        options={[{ value: 'db', label: 'dB' }, { value: 'linear', label: 'Lin' }]}
        onChange={(scale) => dispatch({ type: 'setLevelScale', scale })}
      />
      <Segmented
        label="Scope cycles"
        caption="Cycles"
        hint="How many cycles of the Note each Scope shows"
        value={cycles}
        options={CYCLES}
        onChange={onCycles}
      />
    </>
  );
}
