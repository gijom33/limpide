import { describeControl, describeTarget } from '../midi/describe';
import type { Mapping } from '../midi/mappings';
import { differsFromExpected, type QuickSetupState } from '../midi/quickSetup';

interface Props {
  state: QuickSetupState;
  /** The step learned last, to confirm it (and point out a control that is not the factory one). */
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
  const lastStep = last && steps[last.step];

  return (
    <section className="quick-setup" aria-label="Quick Setup">
      <header>
        <strong>Quick Setup · TempoPAD C16</strong>
        {phase === 'running' && (
          <span className="quick-setup-progress">
            {index + 1} of {steps.length}
          </span>
        )}
      </header>
      {phase === 'running' ? (
        <>
          <p className="quick-setup-prompt" role="status">
            <span>{step.prompt}</span> → <b>{describeTarget(step.target)}</b>
          </p>
          {last && lastStep && (
            <p className="quick-setup-last">
              {describeTarget(last.mapping.target)} ← {describeControl(last.mapping.control)}
              {differsFromExpected(lastStep, last.mapping) && (
                <span className="quick-setup-differs"> (usually CC {lastStep.expected.number} on a C16)</span>
              )}
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
