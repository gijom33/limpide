import type { LearnState } from '../midi/controlSurface';
import { describeControl, describeTarget } from '../midi/describe';

/** Across the top while MIDI Learn is on: what to do next, and what was just mapped. */
export function LearnBar({ state, onDone }: { state: LearnState; onDone(): void }) {
  if (state.phase === 'off') return null;
  const message =
    state.phase === 'listening'
      ? `${describeTarget(state.target)}: keep turning…`
      : state.target
        ? `${describeTarget(state.target)}: now move a knob, fader or pad on your Controller.`
        : 'Click a knob or button to map, then move a control on your Controller.';
  return (
    <div className="learn-bar" role="status" aria-label="MIDI Learn">
      <strong>MIDI Learn</strong>
      <span>{message}</span>
      {state.phase === 'armed' && state.learned && (
        <span className="learn-done">
          Mapped {describeTarget(state.learned.target)} ← {describeControl(state.learned.control)}
        </span>
      )}
      <button type="button" className="tool" onClick={onDone}>
        Done
      </button>
    </div>
  );
}
