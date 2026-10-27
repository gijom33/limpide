import type { Dispatch } from 'react';
import type { ViewerAction, ViewerState } from '../viewers/viewerState';
import type { ViewSettings } from '../viewers/viewSettings';
import { CameraIcon, CloseIcon, PauseIcon } from './icons';
import { useLearnable } from './learn';
import { Segmented } from './Segmented';
import { Tooltip } from './Tooltip';
import { TIPS } from './tips';

interface Props {
  state: ViewerState;
  dispatch: Dispatch<ViewerAction>;
}

/** Freeze and Snapshot: actions on what the Viewers show. */
export function ViewActions({ state, dispatch }: Props) {
  const learnFreeze = useLearnable({ kind: 'action', id: 'freeze' });
  const learnSnapshot = useLearnable({ kind: 'action', id: 'snapshot' });
  return (
    <>
      <Tooltip content={TIPS.freeze}>
        <button
          type="button"
          className="tool tool-mode"
          aria-pressed={state.frozen}
          aria-keyshortcuts="Space"
          {...learnFreeze}
          onClick={() => dispatch({ type: 'toggleFreeze' })}
        >
          <PauseIcon />
          Freeze
          <kbd aria-hidden="true">Space</kbd>
        </button>
      </Tooltip>
      <div className="tool-split">
        <Tooltip content={TIPS.snapshot}>
          <button
            type="button"
            className="tool"
            aria-pressed={state.snapshot !== null}
            {...learnSnapshot}
            onClick={() => dispatch({ type: 'takeSnapshot' })}
          >
            <CameraIcon />
            Snapshot
          </button>
        </Tooltip>
        {state.snapshot !== null && (
          <Tooltip content={TIPS.clearSnapshot}>
            <button type="button" className="tool tool-icon" aria-label="Clear Snapshot" onClick={() => dispatch({ type: 'clearSnapshot' })}>
              <CloseIcon />
            </button>
          </Tooltip>
        )}
      </div>
      <Tooltip content={TIPS.tapSource}>
        <Segmented
          label="Viewers follow"
          caption="Voices"
          value={state.tapSource}
          options={[
            { value: 'all', label: 'All' },
            { value: 'newest', label: 'Newest' },
          ]}
          onChange={(source) => dispatch({ type: 'setTapSource', source })}
        />
      </Tooltip>
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
      <Tooltip content={TIPS.frequencyAxis}>
        <Segmented
          label="Frequency axis"
          caption="Freq"
          value={state.frequencyScale}
          options={[{ value: 'log', label: 'Log' }, { value: 'linear', label: 'Lin' }]}
          onChange={(scale) => dispatch({ type: 'setFrequencyScale', scale })}
        />
      </Tooltip>
      <Tooltip content={TIPS.levelAxis}>
        <Segmented
          label="Level axis"
          caption="Level"
          value={state.levelScale}
          options={[{ value: 'db', label: 'dB' }, { value: 'linear', label: 'Lin' }]}
          onChange={(scale) => dispatch({ type: 'setLevelScale', scale })}
        />
      </Tooltip>
      <Tooltip content={TIPS.cycles}>
        <Segmented label="Scope cycles" caption="Cycles" value={cycles} options={CYCLES} onChange={onCycles} />
      </Tooltip>
    </>
  );
}
