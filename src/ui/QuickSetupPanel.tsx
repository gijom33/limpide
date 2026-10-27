import { describeControl, describeTargetShort } from '../midi/describe';
import type { Mapping } from '../midi/mappings';
import type { QuickSetupState } from '../midi/quickSetup';

interface Props {
  state: QuickSetupState;
  /** The step learned last, to confirm it. */
  last: { step: number; mapping: Mapping } | null;
  onBack(): void;
  onSkip(): void;
  onFinish(): void;
  onCancel(): void;
  onClose(): void;
}

/** Quick Setup, floating at the bottom centre: one step at a time, then a summary. */
export function QuickSetupPanel({ state, last, onBack, onSkip, onFinish, onCancel, onClose }: Props) {
  const { steps, index, outcomes, phase } = state;
  const mappedCount = outcomes.filter((o) => o === 'mapped').length;
  const step = steps[index];

  return (
    <section className="quick-setup" aria-label="Quick Setup">
      <header>
        <strong>Quick Setup</strong>
        {phase === 'running' && (
          <span className="quick-setup-progress">
            {index + 1} of {steps.length}
          </span>
        )}
      </header>
      {phase === 'running' ? (
        <>
          <p className="quick-setup-prompt" role="status">
            <span>{step.prompt}</span> → <b>{[step.group, describeTargetShort(step.target)].filter(Boolean).join(' · ')}</b>
          </p>
          {last && (
            <p className="quick-setup-last">
              {[steps[last.step].group, describeTargetShort(last.mapping.target)].filter(Boolean).join(' · ')} ← {describeControl(last.mapping.control)}
            </p>
          )}
          <div className="quick-setup-actions">
            <button type="button" className="tool" onClick={onBack} disabled={index === 0}>
              Back
            </button>
            <button type="button" className="tool" onClick={onSkip}>
              Skip
            </button>
            <button type="button" className="tool" onClick={onFinish}>
              Finish
            </button>
            <button type="button" className="tool" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="quick-setup-prompt" role="status">
            {mappedCount} of {steps.length} mapped
            {mappedCount < steps.length && '. The rest can be mapped any time with MIDI Learn.'}
          </p>
          <div className="quick-setup-actions">
            <button type="button" className="tool" onClick={onClose}>
              Close
            </button>
          </div>
        </>
      )}
    </section>
  );
}
