import { useLayoutEffect, useRef } from 'react';
import type { LearnState } from '../midi/controlSurface';
import { describeControl, describeTarget } from '../midi/describe';
import { describeTaken } from '../midi/taken';

/**
 * Along the bottom while MIDI Learn is on: what to do next, what was just mapped and what it took, and where to finish. Learn is
 * ended where it was started (the MIDI button's panel) or with Escape; the bar only points there. Its height is
 * `--learn-h`, the room the page keeps below its last control while Learn is on, so every control can be scrolled clear
 * of it to be clicked (issue 252).
 */
export function LearnBar({ state }: { state: LearnState }) {
  const bar = useRef<HTMLDivElement>(null);
  const on = state.phase !== 'off';
  useLayoutEffect(() => {
    const element = bar.current;
    if (!on || !element) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => root.style.setProperty('--learn-h', `${element.offsetHeight}px`));
    observer.observe(element, { box: 'border-box' });
    return () => {
      observer.disconnect();
      root.style.removeProperty('--learn-h');
    };
  }, [on]);
  if (!on) return null;
  const message =
    state.phase === 'listening'
      ? `${describeTarget(state.target)}: ${state.target.kind === 'action' ? 'one moment…' : 'keep turning…'}`
      : state.target
        ? `${describeTarget(state.target)}: now move a knob, fader or pad on your Controller.`
        : 'Click a knob or button to map, then move a control on your Controller.';
  return (
    <div ref={bar} className="learn-bar" role="status" aria-label="MIDI Learn">
      <strong>MIDI Learn</strong>
      <span>{message}</span>
      {state.phase === 'armed' && state.learned && (
        <span className="learn-done">
          Mapped {describeTarget(state.learned.mapping.target)} ← {describeControl(state.learned.mapping.control)}
          {/* What it replaced, a C16 place it took among them (issue 255). */}
          {state.learned.took.length ? `; ${describeTaken(state.learned.took)}` : null}
        </span>
      )}
      <span className="learn-exit">
        <kbd>Esc</kbd> or MIDI › Done to finish
      </span>
    </div>
  );
}
