import { useEffect, useRef } from 'react';
import { describeControl, describeTargetShort } from '../midi/describe';
import type { Learned } from '../midi/mappings';
import type { QuickSetupState } from '../midi/quickSetup';
import { describeTaken } from '../midi/taken';
import { useFocusBack } from './focusBack';

interface Props {
  state: QuickSetupState;
  /** The step learned last, to confirm it, and what it took (issue 255). */
  last: ({ step: number } & Learned) | null;
  onBack(): void;
  onSkip(): void;
  onFinish(): void;
  onCancel(): void;
  onClose(): void;
}

/**
 * Quick Setup, floating at the bottom centre: one step at a time, then a summary. Started from the MIDI panel, it
 * takes the focus on Skip; a button the focus was on that goes (Skip or Finish at the summary) hands it to Close; and
 * closing (Close, Cancel) gives it back to the MIDI button, never to the page (issue 189, decision 1).
 */
export function QuickSetupPanel({ state, last, onBack, onSkip, onFinish, onCancel, onClose }: Props) {
  const { steps, index, outcomes, phase } = state;
  const mappedCount = outcomes.filter((o) => o === 'mapped').length;
  const step = steps[index];
  const panel = useRef<HTMLElement>(null);
  // The way forward: Skip while running, Close at the summary.
  const forward = useRef<HTMLButtonElement>(null);
  // A run starts as the panel shows, or again from the MIDI panel over a summary.
  useEffect(() => {
    if (phase === 'running') forward.current?.focus();
  }, [phase]);
  const focusBack = useFocusBack(panel, () => forward.current ?? document.querySelector<HTMLElement>('button[aria-label="MIDI"]'));

  return (
    <section ref={panel} className="quick-setup" aria-label="Quick Setup" onFocus={focusBack.onFocus} onBlur={focusBack.onBlur}>
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
              {last.took.length ? `; ${describeTaken(last.took)}` : null}
            </p>
          )}
          <div className="quick-setup-actions">
            <button type="button" className="tool" onClick={onBack} disabled={index === 0}>
              Back
            </button>
            <button ref={forward} type="button" className="tool" onClick={onSkip}>
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
            <button ref={forward} type="button" className="tool" onClick={onClose}>
              Close
            </button>
          </div>
        </>
      )}
    </section>
  );
}
