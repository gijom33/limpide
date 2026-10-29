import type { ViewerState } from '../viewers/viewerState';
import type { ViewSettingsAction } from '../viewers/viewerStore';
import type { ViewSettings } from '../viewers/viewSettings';
import { CameraIcon, CloseIcon, PauseIcon } from './icons';
import { useLearnable } from './learn';
import { Segmented } from './Segmented';
import { Tooltip } from './Tooltip';
import { TIPS } from './tips';

interface Props {
  state: ViewerState;
  dispatch(action: ViewSettingsAction): void;
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
          {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: a kbd is not focusable; its Tooltip says the same */}
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

const TIMELINE_SECONDS = [
  { value: 1, label: '1s' },
  { value: 2, label: '2s' },
  { value: 3, label: '3s' },
  { value: 4, label: '4s' },
] as const;

/** How the Spectrum, Scope and Envelope Timeline axes are scaled. */
export function AxesControls({ settings, dispatch }: { settings: ViewSettings; dispatch: Props['dispatch'] }) {
  const state = settings.viewer;
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
        <Segmented label="Scope cycles" caption="Cycles" value={settings.cycles} options={CYCLES} onChange={(cycles) => dispatch({ type: 'setCycles', cycles })} />
      </Tooltip>
      <Tooltip content={TIPS.timelineSeconds}>
        <Segmented label="Env Timeline length" caption="Env Timeline" value={settings.timelineSeconds} options={TIMELINE_SECONDS} onChange={(seconds) => dispatch({ type: 'setTimelineSeconds', seconds })} />
      </Tooltip>
    </>
  );
}
