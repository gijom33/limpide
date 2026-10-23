import type { LearnState } from '../midi/controlSurface';
import { describeControl, describeTarget } from '../midi/describe';

/**
 * Along the bottom while MIDI Learn is on: what to do next, what was just mapped, and where to finish. Learn is
 * ended where it was started (the MIDI button's panel) or with Escape; the bar only points there.
 */
export function LearnBar({ state }: { state: LearnState }) {
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
      <span className="learn-exit">
        <kbd>Esc</kbd> or MIDI › Done to finish
      </span>
    </div>
  );
}
